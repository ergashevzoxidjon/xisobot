from flask import (
    Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify,
)
from flask_login import login_required, current_user
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from extensions import db
from models import Client, Order, log_action, STATUS_CANCELLED, ZERO
from permissions import permission_required
from queries import clients_with_stats, client_totals, eager_orders
from utils import ValidationError, parse_text, now_local

clients_bp = Blueprint("clients", __name__, url_prefix="/mijozlar")


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

        for key, value in data.items():
            setattr(c, key, value)
        log_action(current_user, "update", "client", c.id, c.name)
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
