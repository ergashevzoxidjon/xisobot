import os
import uuid
from decimal import Decimal

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash,
    current_app, send_from_directory, jsonify,
)
from flask_login import login_required, current_user
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload
from werkzeug.utils import secure_filename

from extensions import db
from models import (
    Order, OrderItem, Client, Payment, OrderType, OrderFile, CompanySettings,
    ClientPipelineCard, log_action, can_transition,
    ORDER_STATUSES, ALLOWED_TRANSITIONS, STATUS_CANCELLED, ZERO,
    ORDER_PAYMENT_METHODS,
)
from notifications import notify_new_order, notify_payment
from permissions import permission_required, has_perm
from queries import eager_orders
from utils import (
    ValidationError, parse_money, parse_int, parse_date, parse_text, parse_choice,
    to_money, today_local, now_local, money_str,
)

orders_bp = Blueprint("orders", __name__, url_prefix="/buyurtmalar")


def next_order_number():
    """Yil + ketma-ket raqam. Mavjud eng katta raqamdan davom etadi,
    shuning uchun buyurtma o'chirilsa ham takrorlanmaydi."""
    year = today_local().year
    prefix = f"B-{year}-"
    last = (
        Order.query.filter(Order.order_number.like(f"{prefix}%"))
        .order_by(Order.order_number.desc())
        .first()
    )
    if last:
        try:
            seq = int(last.order_number.rsplit("-", 1)[1]) + 1
        except (ValueError, IndexError):
            seq = Order.query.count() + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


MAX_ITEMS = 50


def _at(values, index, default=""):
    return values[index] if index < len(values) else default


def _items_from_form(form):
    """Formadagi mahsulot qatorlarini o'qiydi va tekshiradi.

    Buyurtma turi bo'sh qolgan qatorlar e'tiborsiz qoldiriladi — foydalanuvchi
    ortiqcha qator qo'shib, uni to'ldirmasdan yuborishi mumkin.
    """
    types = form.getlist("item_type")
    descriptions = form.getlist("item_description")
    quantities = form.getlist("item_quantity")
    prices = form.getlist("item_unit_price")

    if len(types) > MAX_ITEMS:
        raise ValidationError(f"Bitta buyurtmada {MAX_ITEMS} tadan ko'p qator bo'lmasin.")

    items = []
    for index, raw_type in enumerate(types):
        name = (raw_type or "").strip()
        if not name:
            continue

        row = index + 1
        quantity = parse_int(
            _at(quantities, index), f"{row}-qator, miqdor",
            min_value=1, max_value=10_000_000,
        )
        unit_price = parse_money(
            _at(prices, index), f"{row}-qator, birlik narxi", min_value=ZERO,
        )
        items.append({
            "order_type": parse_text(
                name, f"{row}-qator, buyurtma turi", required=True, max_length=100
            ),
            "description": parse_text(
                _at(descriptions, index), f"{row}-qator, izoh",
                required=False, max_length=500,
            ),
            "quantity": quantity,
            "unit_price": unit_price,
            "total_price": to_money(Decimal(quantity) * unit_price),
            "position": len(items),
        })

    if not items:
        raise ValidationError("Kamida bitta mahsulot qatorini to'ldiring.")
    return items


def _client_from_form(form):
    """Formadagi mijozni topadi, kerak bo'lsa yangisini yaratadi.

    Ro'yxatdan tanlansa `client_id` keladi. Foydalanuvchi yangi nom yozgan
    bo'lsa — avval shu nomli mijoz bazada bor-yo'qligi tekshiriladi
    (katta-kichik harf farqsiz), topilmasa yangi mijoz ochiladi.

    (mijoz, yangi_yaratildimi) juftligini qaytaradi.
    """
    raw_id = (form.get("client_id") or "").strip()
    if raw_id:
        client = db.session.get(Client, parse_int(raw_id, "Mijoz", min_value=1))
        if client and not client.is_deleted:
            return client, False

    name = parse_text(form.get("client_name"), "Mijoz", required=True, max_length=150)

    existing = (
        Client.query.filter(Client.name.ilike(name), Client.is_deleted.is_(False))
        .first()
    )
    if existing:
        return existing, False

    if not has_perm("clients.create"):
        raise ValidationError(
            f"Mijoz: '{name}' bazada topilmadi, yangi mijoz qo'shish huquqingiz esa yo'q."
        )

    client = Client(
        name=name,
        phone=parse_text(form.get("client_phone"), "Telefon", required=False, max_length=50),
        company=parse_text(form.get("client_company"), "Korxona", required=False, max_length=150),
        created_by=current_user.id,
    )
    db.session.add(client)
    db.session.flush()
    return client, True


def _order_common_fields(form):
    return {
        "description": parse_text(
            form.get("description"), "Umumiy izoh", required=False, max_length=2000
        ),
        "deadline": parse_date(form.get("deadline"), "Muddat", required=False),
    }


def _own_orders_only():
    """Bir nechta menejer bo'lishi mumkin — har biri faqat o'zi yaratgan
    buyurtmalarni ko'rishi/boshqarishi kerak (2026-09-03, foydalanuvchi
    qarori). Admin va xarajatchi (ish boshqaruvchi) — hammasini ko'radi,
    chunki ularga umumiy nazorat kerak."""
    return current_user.role == "menejer"


def _guard_order_owner(o):
    """Menejer boshqa menejerning buyurtmasiga kira olmaydi (to'g'ridan-to'g'ri
    URL orqali ham) — ro'yxatdagi filtr bilan bir xil qoidani mustahkamlaydi."""
    if _own_orders_only() and o.created_by != current_user.id:
        flash("Bu buyurtma sizga tegishli emas.", "danger")
        return redirect(url_for("orders.list_orders"))
    return None


@orders_bp.route("/")
@login_required
@permission_required("orders.view")
def list_orders():
    status = request.args.get("status", "")
    q = (request.args.get("q") or "").strip()
    page = request.args.get("page", 1, type=int)

    query = Order.query.join(Client).filter(Order.is_deleted.is_(False))
    if _own_orders_only():
        query = query.filter(Order.created_by == current_user.id)
    if status and status in ORDER_STATUSES:
        query = query.filter(Order.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            Order.order_number.ilike(like),
            Order.order_type.ilike(like),
            Client.name.ilike(like),
        ))

    # eager yuklash: 51 ta so'rov o'rniga 3 ta
    query = eager_orders(query.order_by(Order.created_at.desc()))
    pagination = query.paginate(
        page=page, per_page=current_app.config["PER_PAGE"], error_out=False
    )
    return render_template(
        "orders/list.html",
        orders=pagination.items,
        pagination=pagination,
        statuses=ORDER_STATUSES,
        status=status,
        q=q,
    )


@orders_bp.route("/qidiruv")
@login_required
@permission_required("orders.view")
def search_orders():
    """Xarajat formasidagi buyurtma qidiruvi uchun — JSON qaytaradi.

    Raqam, mijoz nomi yoki mahsulot turi bo'yicha qidiradi.
    """
    q = (request.args.get("q") or "").strip()

    query = (
        Order.query.options(
            joinedload(Order.client), selectinload(Order.items), joinedload(Order.creator)
        )
        .join(Client)
        .filter(Order.is_deleted.is_(False))
    )
    if q:
        like = f"%{q}%"
        query = query.outerjoin(OrderItem, OrderItem.order_id == Order.id).filter(or_(
            Order.order_number.ilike(like),
            Client.name.ilike(like),
            OrderItem.order_type.ilike(like),
        )).distinct()

    rows = query.order_by(Order.created_at.desc()).limit(10).all()
    return jsonify([
        {
            "id": o.id,
            "number": o.order_number,
            "client": o.client.name if o.client else "",
            "summary": o.items_summary,
            "total": money_str(o.total_price),
            "creator": o.creator.display_name if o.creator else "",
        }
        for o in rows
    ])


@orders_bp.route("/yangi", methods=["GET", "POST"])
@login_required
@permission_required("orders.create")
def new_order():
    order_types = OrderType.query.filter_by(is_active=True).order_by(OrderType.name).all()

    # "Nusxalash" — mavjud buyurtma asosida formani to'ldirish
    prefill = None
    copy_from = request.args.get("copy", type=int)
    if request.method == "GET" and copy_from:
        src = db.session.get(Order, copy_from)
        if src and not (_own_orders_only() and src.created_by != current_user.id):
            prefill = src

    # Mijoz oldindan tanlangan holda kelish (masalan, Manager xisobotidagi
    # "Mijozlar bilan ishlash" pipeline kartasi "Muvaffaqiyatli" bosqichiga
    # o'tkazilgach, "Buyurtma yaratish" havolasi orqali — 2026-08-29,
    # to'rtinchi so'rov).
    prefill_client_id = ""
    prefill_client_name = ""
    if request.method == "GET" and not prefill:
        pid = request.args.get("client_id", type=int)
        if pid:
            pc = db.session.get(Client, pid)
            if pc:
                prefill_client_id = pc.id
                prefill_client_name = pc.name
        elif request.args.get("client_name"):
            # Nomi bor, lekin hali bazadagi mijozga bog'lanmagan (masalan,
            # menejer jurnalida qo'lda kiritilgan mijoz) — matn to'ldiriladi,
            # forma o'zi mavjud mijozni topadi yoki yangisini yaratadi.
            prefill_client_name = request.args.get("client_name")

    # Pipeline kartasi shu buyurtma orqali "yopiladi" — buyurtma saqlangach
    # shu kartaga order_id yoziladi (2026-08-29, to'rtinchi so'rov).
    pipeline_card_id = request.args.get("pipeline_card_id", type=int) if request.method == "GET" else None

    def back_to_form():
        return render_template(
            "orders/form.html", order_types=order_types,
            order=None, prefill=None, form=request.form,
        )

    if request.method == "POST":
        try:
            # Avval qatorlarni tekshiramiz — xato bo'lsa bekorga
            # yangi mijoz yaratilib qolmasligi uchun.
            items = _items_from_form(request.form)
            common = _order_common_fields(request.form)
            client, client_created = _client_from_form(request.form)
        except ValidationError as e:
            db.session.rollback()
            flash(str(e), "danger")
            return back_to_form()

        if client_created:
            log_action(current_user, "create", "client", client.id,
                       f"{client.name} (buyurtma orqali)")
            db.session.commit()

        # Ikki xodim bir vaqtda buyurtma yaratsa raqam to'qnashishi mumkin —
        # bunda qayta urinamiz (500 xato o'rniga).
        o = None
        for attempt in range(5):
            o = Order(
                order_number=next_order_number(),
                client_id=client.id,
                created_by=current_user.id,
                **common,
            )
            for data in items:
                o.items.append(OrderItem(**data))
            o.recalc_from_items()
            db.session.add(o)
            try:
                db.session.flush()
                break
            except IntegrityError:
                db.session.rollback()
                o = None
                if attempt == 4:
                    flash("Buyurtma raqamini yaratib bo'lmadi. Qayta urinib ko'ring.", "danger")
                    return back_to_form()

        log_action(current_user, "create", "order", o.id,
                   f"{o.order_number} yaratildi ({len(items)} qator)")

        # Pipeline kartasidan kelgan bo'lsa — shu karta shu buyurtma bilan
        # "yopiladi" (2026-08-29, to'rtinchi so'rov).
        posted_card_id = request.form.get("pipeline_card_id", type=int)
        if posted_card_id:
            card = db.session.get(ClientPipelineCard, posted_card_id)
            if card:
                card.order_id = o.id

        db.session.commit()
        notify_new_order(o)
        if client_created:
            flash(f"Yangi mijoz qo'shildi: {client.name}", "info")
        flash(f"Buyurtma {o.order_number} yaratildi.", "success")
        return redirect(url_for("orders.order_detail", order_id=o.id))

    return render_template(
        "orders/form.html", order_types=order_types,
        order=None, prefill=prefill, form=None,
        prefill_client_id=prefill_client_id, prefill_client_name=prefill_client_name,
        pipeline_card_id=pipeline_card_id,
    )


@orders_bp.route("/<int:order_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("orders.edit")
def edit_order(order_id):
    o = Order.query.get_or_404(order_id)
    guard = _guard_order_owner(o)
    if guard:
        return guard
    order_types = OrderType.query.filter_by(is_active=True).order_by(OrderType.name).all()

    def back_to_form(keep_form=True):
        return render_template(
            "orders/form.html", order_types=order_types,
            order=o, prefill=None, form=request.form if keep_form else None,
        )

    if request.method == "POST":
        try:
            items = _items_from_form(request.form)
            common = _order_common_fields(request.form)
            client, client_created = _client_from_form(request.form)
        except ValidationError as e:
            db.session.rollback()
            flash(str(e), "danger")
            return back_to_form()

        # boshqa xodim shu orada o'zgartirmaganini tekshiramiz
        form_version = parse_int(
            request.form.get("version"), "Versiya",
            required=False, min_value=0, default=0,
        )
        if form_version and form_version != o.version:
            db.session.rollback()
            flash(
                "Bu buyurtmani shu orada boshqa xodim o'zgartirdi. "
                "Sahifa yangilandi — o'zgarishlaringizni qayta kiriting.", "warning",
            )
            return back_to_form(keep_form=False)

        # yangi summa to'langan puldan kam bo'lib qolmasligini tekshiramiz
        new_total = sum((data["total_price"] for data in items), ZERO)
        if new_total < o.paid_amount_calc:
            db.session.rollback()
            flash(
                "Yangi summa allaqachon to'langan puldan kam bo'lishi mumkin emas "
                f"(to'langan: {o.paid_amount_calc}).", "danger",
            )
            return back_to_form()

        if client_created:
            log_action(current_user, "create", "client", client.id,
                       f"{client.name} (buyurtma orqali)")

        o.client_id = client.id
        for key, value in common.items():
            setattr(o, key, value)

        # eski qatorlarni yangilari bilan almashtiramiz
        o.items.clear()
        for data in items:
            o.items.append(OrderItem(**data))
        o.recalc_from_items()

        o.version = (o.version or 1) + 1
        log_action(current_user, "update", "order", o.id,
                   f"{o.order_number} tahrirlandi ({len(items)} qator)")
        db.session.commit()
        flash("Buyurtma yangilandi.", "success")
        return redirect(url_for("orders.order_detail", order_id=o.id))

    return render_template(
        "orders/form.html", order_types=order_types,
        order=o, prefill=None, form=None,
    )


@orders_bp.route("/<int:order_id>")
@login_required
@permission_required("orders.view")
def order_detail(order_id):
    o = Order.query.options(joinedload(Order.client)).get_or_404(order_id)
    guard = _guard_order_owner(o)
    if guard:
        return guard
    payments = sorted(o.payments, key=lambda p: (p.paid_on, p.id), reverse=True)
    # faqat shu holatdan o'tish mumkin bo'lganlarini ko'rsatamiz
    allowed = [o.status] + [s for s in ALLOWED_TRANSITIONS.get(o.status, []) if s != o.status]
    return render_template(
        "orders/detail.html", order=o, payments=payments, statuses=allowed,
        order_payment_methods=ORDER_PAYMENT_METHODS,
    )


@orders_bp.route("/<int:order_id>/hisob-faktura")
@login_required
@permission_required("orders.view")
def invoice(order_id):
    o = Order.query.options(joinedload(Order.client)).get_or_404(order_id)
    guard = _guard_order_owner(o)
    if guard:
        return guard
    return render_template(
        "orders/invoice.html", order=o, today=today_local(),
        company=CompanySettings.get(),
    )


@orders_bp.route("/<int:order_id>/holat", methods=["POST"])
@login_required
@permission_required("orders.manage")
def update_status(order_id):
    o = Order.query.get_or_404(order_id)
    guard = _guard_order_owner(o)
    if guard:
        return guard
    try:
        new_status = parse_choice(request.form.get("status"), "Holat", ORDER_STATUSES)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("orders.order_detail", order_id=order_id))

    if not can_transition(o.status, new_status):
        allowed = ", ".join(ALLOWED_TRANSITIONS.get(o.status, [])) or "yo'q"
        flash(
            f"'{o.status}' holatidan '{new_status}' holatiga o'tib bo'lmaydi. "
            f"Ruxsat etilgan: {allowed}.", "danger",
        )
        return redirect(url_for("orders.order_detail", order_id=order_id))

    if new_status == STATUS_CANCELLED and o.paid_amount_calc > ZERO:
        flash(
            "To'lov qilingan buyurtmani bekor qilib bo'lmaydi. "
            "Avval to'lovlarni qaytarib, yozuvlarni o'chiring.", "danger",
        )
        return redirect(url_for("orders.order_detail", order_id=order_id))

    old = o.status
    o.status = new_status
    log_action(current_user, "status", "order", o.id, f"{old} -> {new_status}")
    db.session.commit()
    flash("Holat yangilandi.", "success")
    return redirect(url_for("orders.order_detail", order_id=order_id))


@orders_bp.route("/<int:order_id>/tolov", methods=["POST"])
@login_required
@permission_required("orders.manage")
def add_payment(order_id):
    o = Order.query.get_or_404(order_id)
    guard = _guard_order_owner(o)
    if guard:
        return guard

    if o.status == STATUS_CANCELLED:
        flash("Bekor qilingan buyurtmaga to'lov qo'shib bo'lmaydi.", "danger")
        return redirect(url_for("orders.order_detail", order_id=order_id))

    try:
        amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
        paid_on = parse_date(request.form.get("paid_on"), "To'lov sanasi", required=False) or today_local()
        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
        payment_method = parse_choice(
            request.form.get("payment_method"), "To'lov usuli", ORDER_PAYMENT_METHODS
        )
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("orders.order_detail", order_id=order_id))

    if paid_on > today_local():
        flash("To'lov sanasi kelajakda bo'lishi mumkin emas.", "danger")
        return redirect(url_for("orders.order_detail", order_id=order_id))

    # Qarzdan ko'p to'lash mumkin — ortiqchasi mijozning avansi (zapas puli)
    # bo'lib qoladi. Faqat ogohlantiramiz, bloklamaymiz.
    p = Payment(
        order_id=o.id, amount=amount, paid_on=paid_on, note=note,
        payment_method=payment_method, created_by=current_user.id,
    )
    db.session.add(p)
    log_action(current_user, "payment", "order", o.id, f"{amount} so'm to'lov")
    db.session.commit()
    notify_payment(o, amount)

    overpaid = o.overpaid
    if overpaid > ZERO:
        flash(
            f"To'lov qayd etildi. Ortiqcha {money_str(overpaid)} so'm "
            f"mijozning avansi sifatida qoldi.", "warning",
        )
    else:
        flash("To'lov qayd etildi.", "success")
    return redirect(url_for("orders.order_detail", order_id=order_id))


@orders_bp.route("/tolov/<int:payment_id>/ochirish", methods=["POST"])
@login_required
@permission_required("orders.delete")
def delete_payment(payment_id):
    p = Payment.query.get_or_404(payment_id)
    guard = _guard_order_owner(p.order)
    if guard:
        return guard
    order_id = p.order_id
    log_action(current_user, "payment_delete", "order", order_id, f"{p.amount} so'm to'lov o'chirildi")
    db.session.delete(p)
    db.session.commit()
    flash("To'lov yozuvi o'chirildi.", "success")
    return redirect(url_for("orders.order_detail", order_id=order_id))


# ---------- buyurtmani o'chirish (yumshoq) ----------

@orders_bp.route("/<int:order_id>/ochirish", methods=["POST"])
@login_required
@permission_required("orders.delete")
def delete_order(order_id):
    o = Order.query.get_or_404(order_id)

    if o.paid_amount_calc > ZERO:
        flash(
            "To'lov qilingan buyurtmani o'chirib bo'lmaydi. "
            "Avval to'lov yozuvlarini o'chiring.", "danger",
        )
        return redirect(url_for("orders.order_detail", order_id=order_id))

    o.is_deleted = True
    o.deleted_at = now_local()
    o.deleted_by = current_user.id
    log_action(current_user, "delete", "order", o.id, f"{o.order_number} o'chirildi")
    db.session.commit()
    flash(f"Buyurtma {o.order_number} o'chirildi. Kerak bo'lsa tiklash mumkin.", "success")
    return redirect(url_for("orders.list_orders"))


@orders_bp.route("/<int:order_id>/tiklash", methods=["POST"])
@login_required
@permission_required("orders.delete")
def restore_order(order_id):
    o = Order.query.get_or_404(order_id)
    o.is_deleted = False
    o.deleted_at = None
    o.deleted_by = None
    log_action(current_user, "restore", "order", o.id, f"{o.order_number} tiklandi")
    db.session.commit()
    flash(f"Buyurtma {o.order_number} tiklandi.", "success")
    return redirect(url_for("orders.order_detail", order_id=order_id))


@orders_bp.route("/ochirilganlar")
@login_required
@permission_required("orders.delete")
def deleted_orders():
    orders = eager_orders(
        Order.query.filter(Order.is_deleted.is_(True)).order_by(Order.deleted_at.desc())
    ).all()
    return render_template("orders/deleted.html", orders=orders)


# ---------- fayl biriktirish ----------

@orders_bp.route("/<int:order_id>/fayl", methods=["POST"])
@login_required
@permission_required("orders.edit")
def upload_file(order_id):
    o = Order.query.get_or_404(order_id)
    guard = _guard_order_owner(o)
    if guard:
        return guard
    uploaded = request.files.get("file")

    if not uploaded or not uploaded.filename:
        flash("Fayl tanlanmagan.", "danger")
        return redirect(url_for("orders.order_detail", order_id=order_id))

    original = uploaded.filename
    ext = os.path.splitext(original)[1].lower()
    if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        allowed = ", ".join(sorted(current_app.config["ALLOWED_EXTENSIONS"]))
        flash(f"Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: {allowed}", "danger")
        return redirect(url_for("orders.order_detail", order_id=order_id))

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(upload_dir, stored_name)
    uploaded.save(path)
    size = os.path.getsize(path)

    f = OrderFile(
        order_id=o.id,
        filename=stored_name,
        original_name=secure_filename(original)[:255] or f"fayl{ext}",
        size_bytes=size,
        created_by=current_user.id,
    )
    db.session.add(f)
    log_action(current_user, "file_upload", "order", o.id, original[:100])
    db.session.commit()
    flash("Fayl biriktirildi.", "success")
    return redirect(url_for("orders.order_detail", order_id=order_id))


@orders_bp.route("/fayl/<int:file_id>/yuklab-olish")
@login_required
@permission_required("orders.view")
def download_file(file_id):
    f = OrderFile.query.get_or_404(file_id)
    guard = _guard_order_owner(f.order)
    if guard:
        return guard
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        f.filename,
        as_attachment=True,
        download_name=f.original_name,
    )


@orders_bp.route("/fayl/<int:file_id>/ochirish", methods=["POST"])
@login_required
@permission_required("orders.delete")
def delete_file(file_id):
    f = OrderFile.query.get_or_404(file_id)
    order_id = f.order_id
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], f.filename)
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass
    log_action(current_user, "file_delete", "order", order_id, f.original_name[:100])
    db.session.delete(f)
    db.session.commit()
    flash("Fayl o'chirildi.", "success")
    return redirect(url_for("orders.order_detail", order_id=order_id))
