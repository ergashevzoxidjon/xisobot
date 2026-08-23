from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import login_required, current_user

from extensions import db
from models import Client, Order, log_action, STATUS_CANCELLED, ZERO
from permissions import permission_required
from queries import clients_with_stats, client_totals, eager_orders
from utils import ValidationError, parse_text

clients_bp = Blueprint("clients", __name__, url_prefix="/mijozlar")


def _client_form_data(form):
    return {
        "name": parse_text(form.get("name"), "Ism", required=True, max_length=150),
        "phone": parse_text(form.get("phone"), "Telefon", required=False, max_length=50),
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

        c = Client(**data)
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
