"""
Ombor: mahsulotlar, kirim (qabul) va chiqim (buyurtmaga sarflash).

Muhim qoida — pul IKKI MARTA sanalmaydi:
  * KIRIM  — mahsulot sotib olindi. Shu payt `Expense` yoziladi (pul chiqdi)
             va ombor qoldig'i oshadi.
  * CHIQIM — mahsulot buyurtmaga sarflandi. Yangi xarajat yozilmaydi,
             faqat qoldiq kamayadi va buyurtma tannarxiga qo'shiladi
             (`Order.stock_cost`).

Chiqim `finance.new_expense` ichida yoziladi — foydalanuvchi uchun bu
"xarajat kiritish" bo'lib ko'rinadi.
"""

from decimal import Decimal

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash, jsonify,
)
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload

from extensions import db
from models import (
    Material, StockMove, Expense, Order, Supplier, log_action,
    STOCK_IN, STOCK_OUT, STOCK_UNITS, STOCK_EXPENSE_CATEGORY, ZERO,
    PAYMENT_CASH, PAYMENT_TRANSFER, PAYER_COMPANIES,
)
from permissions import permission_required
from queries import materials_with_stock
from suppliers import supplier_from_form
from utils import (
    ValidationError, parse_text, parse_money, parse_qty, parse_date, parse_choice,
    to_money, to_qty, money_str, qty_str, today_local, QTY_ZERO,
)

stock_bp = Blueprint("stock", __name__, url_prefix="/ombor")

# Bir marta qabul qilinadigan qatorlar soni
MAX_RECEIPT_ROWS = 30


# ---------- mahsulot kartochkasi ----------

def _material_form_data(form):
    return {
        "name": parse_text(form.get("name"), "Nomi", required=True, max_length=120),
        "unit": parse_choice(form.get("unit"), "Birligi", STOCK_UNITS),
        "min_qty": parse_qty(form.get("min_qty"), "Eng kam qoldiq", required=False),
        "note": parse_text(form.get("note"), "Izoh", required=False, max_length=255),
    }


@stock_bp.route("/")
@login_required
@permission_required("stock.view")
def list_materials():
    q = (request.args.get("q") or "").strip()
    show_all = request.args.get("all") == "1"

    materials = materials_with_stock(only_active=not show_all, q=q)
    total_value = sum((m.stock_value for m in materials), ZERO)
    low_count = sum(1 for m in materials if m.is_low)

    return render_template(
        "stock/list.html",
        materials=materials, q=q, show_all=show_all,
        total_value=total_value, low_count=low_count,
    )


@stock_bp.route("/qidiruv")
@login_required
@permission_required("stock.view")
def search_materials():
    """Xarajat formasidagi mahsulot tanlash uchun — JSON.

    Har bir mahsulot bilan birga qoldiq va oxirgi narx qaytadi, shuning
    uchun forma narxni o'zi to'ldira oladi.
    """
    q = (request.args.get("q") or "").strip()
    materials = materials_with_stock(only_active=True, q=q)[:10]
    return jsonify([
        {
            "id": m.id,
            "name": m.name,
            "unit": m.unit,
            "quantity": qty_str(m.quantity),
            "price": str(to_money(m.last_price)),
        }
        for m in materials
    ])


@stock_bp.route("/mahsulot/yangi", methods=["GET", "POST"])
@login_required
@permission_required("stock.manage")
def new_material():
    if request.method == "POST":
        try:
            data = _material_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("stock/material_form.html", material=None,
                                   units=STOCK_UNITS, form=request.form)

        if Material.query.filter(Material.name.ilike(data["name"])).first():
            flash("Bu nomdagi mahsulot allaqachon bor.", "warning")
            return render_template("stock/material_form.html", material=None,
                                   units=STOCK_UNITS, form=request.form)

        m = Material(**data)
        db.session.add(m)
        db.session.flush()
        log_action(current_user, "create", "material", m.id, m.name)
        db.session.commit()
        flash(f"«{m.name}» omborga qo'shildi. Endi kirim qiling.", "success")
        return redirect(url_for("stock.receive", material_id=m.id))

    return render_template("stock/material_form.html", material=None,
                           units=STOCK_UNITS, form=None)


@stock_bp.route("/mahsulot/<int:material_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("stock.manage")
def edit_material(material_id):
    m = Material.query.get_or_404(material_id)

    if request.method == "POST":
        try:
            data = _material_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("stock/material_form.html", material=m,
                                   units=STOCK_UNITS, form=request.form)

        clash = Material.query.filter(
            Material.name.ilike(data["name"]), Material.id != m.id
        ).first()
        if clash:
            flash("Bu nomdagi mahsulot allaqachon bor.", "warning")
            return render_template("stock/material_form.html", material=m,
                                   units=STOCK_UNITS, form=request.form)

        for key, value in data.items():
            setattr(m, key, value)
        m.is_active = request.form.get("is_active") == "1"
        log_action(current_user, "update", "material", m.id, m.name)
        db.session.commit()
        flash("Mahsulot yangilandi.", "success")
        return redirect(url_for("stock.material_detail", material_id=m.id))

    return render_template("stock/material_form.html", material=m,
                           units=STOCK_UNITS, form=None)


@stock_bp.route("/<int:material_id>")
@login_required
@permission_required("stock.view")
def material_detail(material_id):
    m = Material.query.get_or_404(material_id)
    moves = (
        StockMove.query.options(joinedload(StockMove.order).joinedload(Order.client))
        .filter(StockMove.material_id == m.id)
        .order_by(StockMove.moved_on.desc(), StockMove.id.desc())
        .limit(200)
        .all()
    )
    received = sum((mv.total for mv in moves if mv.kind == STOCK_IN), ZERO)
    used = sum((mv.total for mv in moves if mv.kind == STOCK_OUT), ZERO)

    return render_template(
        "stock/detail.html",
        material=m, moves=moves, received=received, used=used,
    )


# ---------- kirim (qabul) ----------

def _material_from_row(raw_id, name, unit_raw, row_num):
    """Qator uchun mahsulotni topadi — bazadan tanlangan yoki yangi ochiladi.

    Taminotchi bilan bir xil naqsh (`suppliers.supplier_from_form`):
    ro'yxatdan tanlansa `row_material_id` keladi, bo'lmasa nom bo'yicha
    qidiriladi, u ham topilmasa — birligi bilan yangisi shu yerda ochiladi
    (kirim sahifasidan chiqmasdan).
    """
    raw_id = (raw_id or "").strip()
    if raw_id.isdigit():
        material = db.session.get(Material, int(raw_id))
        if material and material.is_active and material.name.lower() == name.lower():
            return material

    existing = Material.query.filter(Material.name.ilike(name)).first()
    if existing:
        return existing

    unit = parse_choice(unit_raw, f"{row_num}-qator, birligi", STOCK_UNITS)
    material = Material(name=name, unit=unit)
    db.session.add(material)
    db.session.flush()
    log_action(current_user, "create", "material", material.id, material.name)
    return material


def receipt_rows_from_form(form):
    """Kirim formasidagi qatorlarni o'qiydi.

    Bir yo'la bir necha mahsulot qabul qilinadi: qog'oz, bo'yaq, plyonka.
    Nomi ombordagi bilan mos kelmasa — birligi so'ralib, shu yerda yangi
    mahsulot kartochkasi ochiladi. Butunlay bo'sh qatorlar e'tiborsiz
    qoldiriladi.
    """
    ids = form.getlist("row_material_id")
    names = form.getlist("row_material_name")
    units = form.getlist("row_unit")
    quantities = form.getlist("row_quantity")
    prices = form.getlist("row_price")

    if len(names) > MAX_RECEIPT_ROWS:
        raise ValidationError(f"Bir marta {MAX_RECEIPT_ROWS} tadan ko'p qator bo'lmaydi.")

    rows = []
    for index, raw_name in enumerate(names):
        name_text = (raw_name or "").strip()
        raw_id = ids[index] if index < len(ids) else ""
        unit_raw = units[index] if index < len(units) else ""
        qty_text = (quantities[index] if index < len(quantities) else "").strip()
        price_text = (prices[index] if index < len(prices) else "").strip()
        if not name_text and not qty_text and not price_text:
            continue

        row = index + 1
        if not name_text:
            raise ValidationError(f"{row}-qator: mahsulot tanlanmagan.")

        material = _material_from_row(raw_id, name_text, unit_raw, row)

        rows.append({
            "material": material,
            "quantity": parse_qty(qty_text, f"{row}-qator, soni",
                                  min_value=Decimal("0.001")),
            "unit_price": parse_money(price_text, f"{row}-qator, narxi",
                                      min_value=Decimal("0.01")),
        })

    if not rows:
        raise ValidationError("Kamida bitta qatorni to'ldiring.")
    return rows


@stock_bp.route("/kirim", methods=["GET", "POST"])
@login_required
@permission_required("stock.manage")
def receive():
    """Omborga mahsulot qabul qilish. Har bir qator xarajat sifatida yoziladi."""
    if request.method == "POST":
        try:
            rows = receipt_rows_from_form(request.form)
            moved_on = parse_date(request.form.get("moved_on"), "Sana",
                                  required=False) or today_local()
            note = parse_text(request.form.get("note"), "Izoh",
                              required=False, max_length=255)
            supplier = supplier_from_form(request.form)
            payment_choice = parse_choice(
                request.form.get("payment_method"), "To'lov holati",
                [PAYMENT_CASH, PAYMENT_TRANSFER, "qarzga"], required=False,
                default=PAYMENT_CASH,
            )
            paid_via = None
            if payment_choice == PAYMENT_TRANSFER:
                paid_via = parse_choice(request.form.get("paid_via"), "Tashkilot",
                                        PAYER_COMPANIES)
        except ValidationError as e:
            flash(str(e), "danger")
            return _receive_page(form=request.form)

        if moved_on > today_local():
            flash("Kirim sanasi kelajakda bo'lishi mumkin emas.", "danger")
            return _receive_page(form=request.form)

        # butun kirim (barcha qatorlar) bitta taminotchidan va bitta
        # to'lov holati bilan yoziladi — mahsulotlar kabi bo'lakma-bo'lak emas
        is_paid = payment_choice != "qarzga"
        payment_method = payment_choice if is_paid else None

        total = ZERO
        for data in rows:
            material = data["material"]
            amount = to_money(data["quantity"] * data["unit_price"])

            # pul chiqdi (yoki qarzga olindi) — xarajat sifatida yoziladi
            expense = Expense(
                category=STOCK_EXPENSE_CATEGORY,
                amount=amount,
                description=f"Ombor kirimi: {material.name} — "
                            f"{qty_str(data['quantity'])} {material.unit}",
                date=moved_on,
                order_id=None,
                supplier_id=supplier.id,
                is_paid=is_paid,
                payment_method=payment_method,
                paid_via=paid_via,
                created_by=current_user.id,
            )
            db.session.add(expense)
            db.session.flush()

            db.session.add(StockMove(
                material_id=material.id, kind=STOCK_IN,
                quantity=data["quantity"], unit_price=data["unit_price"],
                moved_on=moved_on, expense_id=expense.id, note=note,
                created_by=current_user.id,
            ))
            material.last_price = data["unit_price"]
            log_action(current_user, "create", "stock_in", material.id,
                       f"{material.name} +{qty_str(data['quantity'])} {material.unit}"
                       f" ({supplier.name})")
            total += amount

        db.session.commit()
        if not is_paid:
            flash(f"{len(rows)} ta mahsulot omborga qabul qilindi — "
                  f"{money_str(total)} so'm «{supplier.name}»ga qarzga yozildi.", "warning")
        elif payment_method == PAYMENT_TRANSFER:
            flash(f"{len(rows)} ta mahsulot omborga qabul qilindi — "
                  f"jami {money_str(total)} so'm «{paid_via}» orqali perechisleniye qilindi.",
                  "success")
        else:
            flash(f"{len(rows)} ta mahsulot omborga qabul qilindi — "
                  f"jami {money_str(total)} so'm xarajat yozildi.", "success")
        return redirect(url_for("stock.list_materials"))

    return _receive_page(form=None)


def _receive_page(form):
    preselected = request.args.get("material_id", type=int)
    return render_template(
        "stock/receive.html",
        materials=materials_with_stock(only_active=True),
        suppliers=Supplier.query.filter_by(is_active=True).order_by(Supplier.name).all(),
        preselected_id=preselected,
        today_date=today_local(),
        units=STOCK_UNITS,
        payer_companies=PAYER_COMPANIES,
        form=form,
    )


# ---------- chiqim (finance.py dan chaqiriladi) ----------

def consume(material, quantity, unit_price, order, moved_on, note=None):
    """Ombordan mahsulot chiqarish. Yangi xarajat YOZILMAYDI.

    Qoldiq yetmasa ish to'xtamaydi — chaqiruvchi ogohlantirish ko'rsatadi.
    """
    move = StockMove(
        material_id=material.id, kind=STOCK_OUT,
        quantity=to_qty(quantity), unit_price=to_money(unit_price),
        moved_on=moved_on, order_id=order.id if order else None,
        note=note, created_by=current_user.id,
    )
    db.session.add(move)
    log_action(current_user, "create", "stock_out", material.id,
               f"{material.name} -{qty_str(quantity)} {material.unit}"
               + (f" ({order.order_number})" if order else ""))
    return move


def shortage(material, quantity):
    """Qoldiq yetarlimi — yetmasa qancha yetishmasligini qaytaradi."""
    missing = to_qty(quantity) - material.quantity
    return missing if missing > QTY_ZERO else QTY_ZERO
