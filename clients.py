import re
from difflib import SequenceMatcher

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify,
)
from flask_login import login_required, current_user
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from extensions import db
from models import Client, Order, log_action, snap, changes_text, STATUS_CANCELLED, ZERO
from permissions import permission_required
from queries import clients_with_stats, client_totals, eager_orders
from utils import ValidationError, parse_text, now_local

clients_bp = Blueprint("clients", __name__, url_prefix="/mijozlar")

NAME_SIMILARITY = 0.86


def _norm_name(name):
    """Taqqoslash uchun nom: kichik harf, tutuq belgilari va MChJ kabi qo'shimchalarsiz."""
    s = (name or "").casefold()
    for ch in ("'", "\u0060", "\u02bb", "\u02bc", "\u2019", "\u2018"):
        s = s.replace(ch, "")
    s = re.sub(r"\b(mchj|ooo|yatt|ao|xk|llc)\b", " ", s)
    return re.sub(r"[^0-9a-z\u0430-\u044f\u0451\u045e\u049b\u0493\u04b3]+", "", s)


def _norm_phone(phone):
    """Telefonning oxirgi 9 raqami (998 va + belgisiz, bo'shliqlarsiz)."""
    digits = re.sub(r"\D", "", phone or "")
    return digits[-9:] if len(digits) >= 9 else ""


def find_similar_clients(name, phone, exclude_id=None, limit=5):
    """Shu ism yoki telefonga o'xshash mavjud mijozlar (dublikatdan saqlanish uchun).

    Moslik: telefonning oxirgi 9 raqami bir xil, yoki nomlar normallashtirilgach
    bir xil / juda o'xshash. [(mijoz, sabab)] qaytaradi.
    """
    n, p = _norm_name(name), _norm_phone(phone)
    if not n and not p:
        return []
    found = []
    q = Client.query.filter(Client.is_deleted.is_(False))
    if exclude_id:
        q = q.filter(Client.id != exclude_id)
    for c in q.all():
        reason = None
        if p and _norm_phone(c.phone) == p:
            reason = "telefon raqami bir xil"
        elif n:
            cn = _norm_name(c.name)
            if cn and (cn == n or (min(len(cn), len(n)) >= 5 and (cn in n or n in cn))
                       or SequenceMatcher(None, cn, n).ratio() >= NAME_SIMILARITY):
                reason = "nomi o'xshash"
        if reason:
            found.append((c, reason))
    # telefon mos kelganlar birinchi
    found.sort(key=lambda x: (x[1] != "telefon raqami bir xil", x[0].name))
    return found[:limit]


CLIENT_LABELS = {"name": "Ism", "phone": "Telefon", "company": "Korxona",
                 "address": "Manzil", "notes": "Izoh"}


def _client_form_data(form):
    return {
        "name": parse_text(form.get("name"), "Ism", required=True, max_length=150),
        "phone": parse_text(form.get("phone"), "Telefon", required=False, max_length=50),
        "company": parse_text(form.get("company"), "Korxona", required=False, max_length=150),
        "address": parse_text(form.get("address"), "Manzil", required=False, max_length=255),
        "notes": parse_text(form.get("notes"), "Izoh", required=False, max_length=2000),
    }


@clients_bp.route("/")
@login_required
@permission_required("clients.view")
def list_clients():
    q = (request.args.get("q") or "").strip()
    page = request.args.get("page", 1, type=int)

    query = Client.query.filter(Client.is_deleted.is_(False))
    # Bir nechta menejer bo'lishi mumkin — har biri faqat o'zi qo'shgan
    # yoki o'zi buyurtma bergan mijozlarni ko'radi (2026-09-03, foydalanuvchi
    # qarori). Faqat "created_by" bo'yicha cheklash noto'g'ri bo'lardi —
    # bu ustun yangi qo'shilgani uchun eski mijozlarning barchasida bo'sh,
    # va ular boshqa menejer orqali ham buyurtma berishi mumkin edi;
    # shuning uchun "shu menejer bilan buyurtmasi bor" mijozlar ham qo'shiladi.
    if current_user.role == "menejer":
        query = query.filter(or_(
            Client.created_by == current_user.id,
            Client.orders.any(Order.created_by == current_user.id),
        ))
    if q:
        query = query.filter(Client.name.ilike(f"%{q}%"))

    pagination = query.order_by(Client.name).paginate(
        page=page, per_page=current_app.config["PER_PAGE"], error_out=False
    )

    # statistikani bitta agregat so'rovda hisoblaymiz (326 -> 1 so'rov)
    ids = [c.id for c in pagination.items]
    clients = []
    if ids:
        clients = clients_with_stats(Client.query.filter(Client.id.in_(ids)))
        # agregat so'rov tartibni saqlamaydi — sahifadagi tartibni tiklaymiz
        position = {client_id: index for index, client_id in enumerate(ids)}
        clients.sort(key=lambda c: position[c.id])

    return render_template(
        "clients/list.html", clients=clients, pagination=pagination, q=q,
    )


@clients_bp.route("/qidiruv")
@login_required
@permission_required("clients.view")
def search_clients():
    """Buyurtma formasidagi jonli qidiruv uchun — JSON qaytaradi.

    Foydalanuvchi mijoz nomini yozayotganda mos keladiganlari ko'rsatiladi,
    shu tufayli bir mijoz ikki marta kiritilib qolmaydi.
    """
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])

    rows = (
        Client.query.options(joinedload(Client.creator))
        .filter(
            Client.is_deleted.is_(False),
            Client.name.ilike(f"%{q}%"),
        )
        .order_by(Client.name)
        .limit(8)
        .all()
    )
    return jsonify([
        {
            "id": c.id, "name": c.name, "phone": c.phone or "",
            "creator": c.creator.display_name if c.creator else "",
        }
        for c in rows
    ])


@clients_bp.route("/oxshash")
@login_required
@permission_required("clients.view")
def similar_clients():
    """Forma to'ldirilayotganda o'xshash mijozlar bormi — JSON (jonli ogohlantirish)."""
    exclude = request.args.get("exclude", type=int)
    found = find_similar_clients(request.args.get("name"), request.args.get("phone"),
                                 exclude_id=exclude)
    return jsonify([
        {"id": c.id, "name": c.name, "phone": c.phone or "", "reason": r,
         "url": url_for("clients.client_detail", client_id=c.id)}
        for c, r in found
    ])


def client_card_stats(orders):
    """Mijoz kartochkasi uchun qo'shimcha ko'rsatkichlar.

    Birinchi/oxirgi buyurtma sanasi, o'rtacha chek, eng ko'p buyurtma qilingan
    mahsulotlar, qarzli buyurtmalar (necha kunlik) va oxirgi to'lovlar.
    """
    from collections import Counter
    from utils import today_local

    active = [o for o in orders if o.status != STATUS_CANCELLED]
    today = today_local()
    stats = {
        "first_date": min((o.created_at for o in active), default=None),
        "last_date": max((o.created_at for o in active), default=None),
        "avg_order": None, "top_types": [], "debts": [],
        "aging": {"0-30": ZERO, "31-60": ZERO, "60+": ZERO}, "payments": [],
    }
    if not active:
        return stats
    stats["avg_order"] = sum((o.total_price or ZERO for o in active), ZERO) / len(active)

    types = Counter()
    for o in active:
        for it in o.items:
            types[it.order_type] += 1
        if not o.items and o.order_type:
            types[o.order_type] += 1
    stats["top_types"] = types.most_common(3)

    for o in active:
        debt = o.debt
        if debt > ZERO:
            age = (today - o.created_at.date()).days
            stats["debts"].append({"order": o, "debt": debt, "age": age})
            bucket = "0-30" if age <= 30 else ("31-60" if age <= 60 else "60+")
            stats["aging"][bucket] += debt
    stats["debts"].sort(key=lambda d: d["age"], reverse=True)

    pays = [(p, o) for o in active for p in o.payments]
    pays.sort(key=lambda x: (x[0].paid_on, x[0].id), reverse=True)
    stats["payments"] = pays[:8]
    return stats


@clients_bp.route("/<int:client_id>")
@login_required
@permission_required("clients.view")
def client_detail(client_id):
    c = Client.query.get_or_404(client_id)
    orders = eager_orders(
        Order.query.filter_by(client_id=c.id).order_by(Order.created_at.desc())
    ).all()
    total_ordered, total_paid, total_debt = client_totals(c.id)

    return render_template(
        "clients/detail.html",
        client=c, orders=orders,
        total_ordered=total_ordered, total_paid=total_paid,
        total_debt=total_debt,
        card=client_card_stats(orders),
    )


@clients_bp.route("/yangi", methods=["GET", "POST"])
@login_required
@permission_required("clients.create")
def new_client():
    if request.method == "POST":
        try:
            data = _client_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("clients/form.html", client=None, form=request.form)

        if Client.query.filter(Client.name.ilike(data["name"])).first():
            flash("Bu nomdagi mijoz allaqachon mavjud.", "warning")
            return render_template("clients/form.html", client=None, form=request.form)

        if not request.form.get("confirm_duplicate"):
            similar = find_similar_clients(data["name"], data["phone"])
            if similar:
                return render_template("clients/form.html", client=None, form=request.form,
                                       similar=similar)

        c = Client(created_by=current_user.id, **data)
        db.session.add(c)
        db.session.flush()
        log_action(current_user, "create", "client", c.id, c.name)
        db.session.commit()
        flash("Mijoz qo'shildi.", "success")
        return redirect(url_for("clients.client_detail", client_id=c.id))

    return render_template("clients/form.html", client=None, form=None)


@clients_bp.route("/<int:client_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("clients.create")
def edit_client(client_id):
    c = Client.query.get_or_404(client_id)
    if request.method == "POST":
        try:
            data = _client_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("clients/form.html", client=c, form=request.form)

        before = snap(c, list(data))
        for key, value in data.items():
            setattr(c, key, value)
        diff = changes_text(before, data, CLIENT_LABELS)
        log_action(current_user, "update", "client", c.id,
                   c.name + (f" — {diff}" if diff else ""))
        db.session.commit()
        flash("Mijoz ma'lumotlari yangilandi.", "success")
        return redirect(url_for("clients.client_detail", client_id=c.id))

    return render_template("clients/form.html", client=c, form=None)


# ---------- mijozni o'chirish (yumshoq) ----------

@clients_bp.route("/<int:client_id>/ochirish", methods=["POST"])
@login_required
@permission_required("clients.delete")
def delete_client(client_id):
    c = Client.query.get_or_404(client_id)

    if c.total_debt > ZERO:
        flash(
            "Qarzdor mijozni o'chirib bo'lmaydi. Avval qarzni yopib "
            "(to'lov qabul qilib) yoki tegishli buyurtmalarni bekor qilib qo'ying.",
            "danger",
        )
        return redirect(url_for("clients.client_detail", client_id=client_id))

    c.is_deleted = True
    c.deleted_at = now_local()
    log_action(current_user, "delete", "client", c.id, c.name)
    db.session.commit()
    flash(f"{c.name} o'chirildi. Kerak bo'lsa tiklash mumkin.", "success")
    return redirect(url_for("clients.list_clients"))


@clients_bp.route("/<int:client_id>/tiklash", methods=["POST"])
@login_required
@permission_required("clients.delete")
def restore_client(client_id):
    c = Client.query.get_or_404(client_id)
    c.is_deleted = False
    c.deleted_at = None
    log_action(current_user, "restore", "client", c.id, c.name)
    db.session.commit()
    flash(f"{c.name} tiklandi.", "success")
    return redirect(url_for("clients.client_detail", client_id=c.id))


@clients_bp.route("/ochirilganlar")
@login_required
@permission_required("clients.delete")
def deleted_clients():
    clients = (
        Client.query.filter(Client.is_deleted.is_(True))
        .order_by(Client.deleted_at.desc())
        .all()
    )
    return render_template("clients/deleted.html", clients=clients)
