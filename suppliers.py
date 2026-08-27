"""
Taminotchilar (yetkazib beruvchilar): ombor mahsuloti kimdan olinganini
va unga qancha qarzimiz borligini yuritadi.

Qarz mantig'i mijoz qarzdorligiga o'xshaydi, faqat teskari yo'nalishda:
kirim (Expense) formasida "qarzga olindi" belgilansa, o'sha summa
taminotchi balansiga qo'shiladi. Bu yerdagi to'lov mijoz to'lovi kabi
alohida yoziladi va umumiy balansni kamaytiradi — aniq bir kirimga
"yopiladi" deb bog'lanmaydi (oddiy joriy hisob, mijoz balansi kabi).
"""

from decimal import Decimal

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash, jsonify,
)
from flask_login import login_required, current_user

from extensions import db
from models import Supplier, SupplierPayment, Expense, log_action
from permissions import permission_required
from queries import suppliers_with_stats, top_suppliers
from utils import (
    ValidationError, parse_text, parse_money, parse_date, today_local, money_str, ZERO,
)

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/taminotchilar")


def _supplier_form_data(form):
    return {
        "name": parse_text(form.get("name"), "Nomi", required=True, max_length=150),
        "phone": parse_text(form.get("phone"), "Telefon", required=False, max_length=50),
        "address": parse_text(form.get("address"), "Lokatsiya", required=False, max_length=255),
    }


def supplier_from_form(form):
    """Ombor kirimi formasidagi taminotchini topadi, kerak bo'lsa yaratadi.

    Mijoz uchun ishlatilgan naqshning aynan o'zi (`orders._client_from_form`):
    ro'yxatdan tanlansa `supplier_id` keladi, bo'lmasa nom bo'yicha
    qidiriladi va topilmasa yangisi ochiladi.
    """
    raw_id = (form.get("supplier_id") or "").strip()
    if raw_id.isdigit():
        supplier = db.session.get(Supplier, int(raw_id))
        if supplier and supplier.is_active:
            return supplier

    name = parse_text(form.get("supplier_name"), "Taminotchi", required=True, max_length=150)

    existing = Supplier.query.filter(Supplier.name.ilike(name)).first()
    if existing:
        return existing

    supplier = Supplier(name=name)
    db.session.add(supplier)
    db.session.flush()
    log_action(current_user, "create", "supplier", supplier.id, supplier.name)
    return supplier


@suppliers_bp.route("/")
@login_required
@permission_required("suppliers.view")
def list_suppliers():
    q = (request.args.get("q") or "").strip()
    show_all = request.args.get("all") == "1"

    suppliers = suppliers_with_stats(q=q, only_active=not show_all)
    total_debt = ZERO
    for s in suppliers:
        total_debt += s.debt

    top = top_suppliers(limit=5)

    return render_template(
        "suppliers/list.html",
        suppliers=suppliers, q=q, show_all=show_all,
        total_debt=total_debt, top=top,
    )


@suppliers_bp.route("/qidiruv")
@login_required
@permission_required("suppliers.view")
def search_suppliers():
    """Ombor kirimi formasidagi jonli qidiruv uchun — JSON qaytaradi."""
    q = (request.args.get("q") or "").strip()
    query = Supplier.query.filter(Supplier.is_active.is_(True))
    if q:
        query = query.filter(Supplier.name.ilike(f"%{q}%"))
    rows = query.order_by(Supplier.name).limit(8).all()
    return jsonify([{"id": s.id, "name": s.name, "phone": s.phone or ""} for s in rows])


@suppliers_bp.route("/<int:supplier_id>")
@login_required
@permission_required("suppliers.view")
def supplier_detail(supplier_id):
    s = Supplier.query.get_or_404(supplier_id)
    purchases = (
        Expense.query.filter_by(supplier_id=s.id)
        .order_by(Expense.date.desc(), Expense.id.desc())
        .limit(200)
        .all()
    )
    payments = (
        SupplierPayment.query.filter_by(supplier_id=s.id)
        .order_by(SupplierPayment.paid_on.desc(), SupplierPayment.id.desc())
        .all()
    )
    return render_template(
        "suppliers/detail.html",
        supplier=s, purchases=purchases, payments=payments,
    )


@suppliers_bp.route("/yangi", methods=["GET", "POST"])
@login_required
@permission_required("suppliers.manage")
def new_supplier():
    if request.method == "POST":
        try:
            data = _supplier_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("suppliers/form.html", supplier=None, form=request.form)

        if Supplier.query.filter(Supplier.name.ilike(data["name"])).first():
            flash("Bu nomdagi taminotchi allaqachon bor.", "warning")
            return render_template("suppliers/form.html", supplier=None, form=request.form)

        s = Supplier(**data)
        db.session.add(s)
        db.session.flush()
        log_action(current_user, "create", "supplier", s.id, s.name)
        db.session.commit()
        flash(f"«{s.name}» taminotchi sifatida qo'shildi.", "success")
        return redirect(url_for("suppliers.supplier_detail", supplier_id=s.id))

    return render_template("suppliers/form.html", supplier=None, form=None)


@suppliers_bp.route("/<int:supplier_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("suppliers.manage")
def edit_supplier(supplier_id):
    s = Supplier.query.get_or_404(supplier_id)

    if request.method == "POST":
        try:
            data = _supplier_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("suppliers/form.html", supplier=s, form=request.form)

        clash = Supplier.query.filter(
            Supplier.name.ilike(data["name"]), Supplier.id != s.id
        ).first()
        if clash:
            flash("Bu nomdagi taminotchi allaqachon bor.", "warning")
            return render_template("suppliers/form.html", supplier=s, form=request.form)

        for key, value in data.items():
            setattr(s, key, value)
        s.is_active = request.form.get("is_active") == "1"
        log_action(current_user, "update", "supplier", s.id, s.name)
        db.session.commit()
        flash("Taminotchi ma'lumotlari yangilandi.", "success")
        return redirect(url_for("suppliers.supplier_detail", supplier_id=s.id))

    return render_template("suppliers/form.html", supplier=s, form=None)


@suppliers_bp.route("/<int:supplier_id>/tolov", methods=["POST"])
@login_required
@permission_required("suppliers.manage")
def pay_supplier(supplier_id):
    s = Supplier.query.get_or_404(supplier_id)
    try:
        amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
        paid_on = parse_date(request.form.get("paid_on"), "Sana", required=False) or today_local()
        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("suppliers.supplier_detail", supplier_id=s.id))

    if paid_on > today_local():
        flash("To'lov sanasi kelajakda bo'lishi mumkin emas.", "danger")
        return redirect(url_for("suppliers.supplier_detail", supplier_id=s.id))

    db.session.add(SupplierPayment(
        supplier_id=s.id, amount=amount, paid_on=paid_on, note=note,
        created_by=current_user.id,
    ))
    log_action(current_user, "create", "supplier_payment", s.id,
               f"{s.name}: {money_str(amount)} so'm")
    db.session.commit()
    flash(f"{money_str(amount)} so'm to'lov yozildi.", "success")
    return redirect(url_for("suppliers.supplier_detail", supplier_id=s.id))


@suppliers_bp.route("/<int:payment_id>/tolov/ochirish", methods=["POST"])
@login_required
@permission_required("suppliers.manage")
def delete_payment(payment_id):
    p = SupplierPayment.query.get_or_404(payment_id)
    supplier_id = p.supplier_id
    log_action(current_user, "delete", "supplier_payment", p.id,
               f"{p.supplier.name}: {money_str(p.amount)} so'm")
    db.session.delete(p)
    db.session.commit()
    flash("To'lov yozuvi o'chirildi.", "success")
    return redirect(url_for("suppliers.supplier_detail", supplier_id=supplier_id))
