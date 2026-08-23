"""Buyurtma turlari ma'lumotnomasi — narxlar avtomatik qo'yilishi uchun."""

from decimal import Decimal

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

from extensions import db
from models import OrderType, CompanySettings, TelegramSettings, log_action, ZERO
from permissions import permission_required
from utils import ValidationError, parse_text, parse_money

settings_bp = Blueprint("settings", __name__, url_prefix="/sozlamalar")


# ---------- Telegram ----------

@settings_bp.route("/telegram", methods=["GET", "POST"])
@login_required
@permission_required("settings.manage")
def telegram():
    s = TelegramSettings.get()

    if request.method == "POST":
        try:
            s.bot_token = parse_text(request.form.get("bot_token"), "Bot token",
                                     required=False, max_length=200)
            s.manager_chat_id = parse_text(request.form.get("manager_chat_id"), "Chat ID",
                                           required=False, max_length=50)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("settings/telegram.html", settings=s, form=request.form)

        s.is_enabled = bool(request.form.get("is_enabled"))
        s.notify_new_order = bool(request.form.get("notify_new_order"))
        s.notify_payment = bool(request.form.get("notify_payment"))
        s.notify_daily = bool(request.form.get("notify_daily"))

        if s.is_enabled and not (s.bot_token and s.manager_chat_id):
            flash("Yoqish uchun bot token va chat ID kiritilishi kerak.", "danger")
            s.is_enabled = False

        log_action(current_user, "update", "telegram", s.id,
                   "yoqildi" if s.is_enabled else "o'chirildi")
        db.session.commit()
        flash("Telegram sozlamalari saqlandi.", "success")
        return redirect(url_for("settings.telegram"))

    return render_template("settings/telegram.html", settings=s, form=None)


@settings_bp.route("/telegram/sinov", methods=["POST"])
@login_required
@permission_required("settings.manage")
def telegram_test():
    from telegram_bot import send_message, check_token

    s = TelegramSettings.get()
    if not s.bot_token:
        flash("Avval bot tokenini kiriting.", "danger")
        return redirect(url_for("settings.telegram"))

    ok, info = check_token(s.bot_token)
    if not ok:
        flash(f"Token noto'g'ri: {info}", "danger")
        return redirect(url_for("settings.telegram"))

    if not s.manager_chat_id:
        flash(f"Token to'g'ri (bot: @{info}), lekin chat ID kiritilmagan.", "warning")
        return redirect(url_for("settings.telegram"))

    sent, err = send_message(
        s.bot_token, s.manager_chat_id,
        "✅ <b>Sinov xabari</b>\n\nPoligrafiya tizimi Telegram bilan muvaffaqiyatli ulandi.",
    )
    if sent:
        flash(f"Sinov xabari yuborildi (bot: @{info}). Telegram'ni tekshiring.", "success")
    else:
        flash(f"Xabar yuborilmadi: {err}", "danger")

    return redirect(url_for("settings.telegram"))


# ---------- firma rekvizitlari ----------

@settings_bp.route("/firma", methods=["GET", "POST"])
@login_required
@permission_required("settings.manage")
def company():
    c = CompanySettings.get()

    if request.method == "POST":
        try:
            c.name = parse_text(request.form.get("name"), "Firma nomi", required=True, max_length=200)
            c.address = parse_text(request.form.get("address"), "Manzil", required=False, max_length=255)
            c.phone = parse_text(request.form.get("phone"), "Telefon", required=False, max_length=100)
            c.email = parse_text(request.form.get("email"), "Email", required=False, max_length=120)
            c.tax_id = parse_text(request.form.get("tax_id"), "STIR", required=False, max_length=50)
            c.bank_name = parse_text(request.form.get("bank_name"), "Bank", required=False, max_length=200)
            c.bank_account = parse_text(request.form.get("bank_account"), "Hisob raqam", required=False, max_length=50)
            c.bank_mfo = parse_text(request.form.get("bank_mfo"), "MFO", required=False, max_length=20)
            c.invoice_note = parse_text(request.form.get("invoice_note"), "Izoh", required=False, max_length=500)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("settings/company.html", company=c, form=request.form)

        log_action(current_user, "update", "company", c.id, c.name)
        db.session.commit()
        flash("Firma ma'lumotlari saqlandi.", "success")
        return redirect(url_for("settings.company"))

    return render_template("settings/company.html", company=c, form=None)


@settings_bp.route("/buyurtma-turlari")
@login_required
@permission_required("settings.manage")
def order_types():
    types = OrderType.query.order_by(OrderType.is_active.desc(), OrderType.name).all()
    return render_template("settings/order_types.html", types=types)


@settings_bp.route("/buyurtma-turlari/yangi", methods=["GET", "POST"])
@login_required
@permission_required("settings.manage")
def order_type_new():
    if request.method == "POST":
        try:
            name = parse_text(request.form.get("name"), "Nomi", required=True, max_length=100)
            unit = parse_text(request.form.get("unit"), "O'lchov birligi", required=False, max_length=20) or "dona"
            price = parse_money(request.form.get("default_price"), "Standart narx", required=False, min_value=ZERO)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("settings/order_type_form.html", order_type=None, form=request.form)

        if OrderType.query.filter(OrderType.name.ilike(name)).first():
            flash("Bu nomdagi tur allaqachon mavjud.", "warning")
            return render_template("settings/order_type_form.html", order_type=None, form=request.form)

        t = OrderType(name=name, unit=unit, default_price=price)
        db.session.add(t)
        db.session.flush()
        log_action(current_user, "create", "order_type", t.id, name)
        db.session.commit()
        flash("Buyurtma turi qo'shildi.", "success")
        return redirect(url_for("settings.order_types"))

    return render_template("settings/order_type_form.html", order_type=None, form=None)


@settings_bp.route("/buyurtma-turlari/<int:type_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("settings.manage")
def order_type_edit(type_id):
    t = OrderType.query.get_or_404(type_id)
    if request.method == "POST":
        try:
            t.name = parse_text(request.form.get("name"), "Nomi", required=True, max_length=100)
            t.unit = parse_text(request.form.get("unit"), "O'lchov birligi", required=False, max_length=20) or "dona"
            t.default_price = parse_money(request.form.get("default_price"), "Standart narx",
                                          required=False, min_value=ZERO)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("settings/order_type_form.html", order_type=t, form=request.form)

        log_action(current_user, "update", "order_type", t.id, t.name)
        db.session.commit()
        flash("Yangilandi.", "success")
        return redirect(url_for("settings.order_types"))

    return render_template("settings/order_type_form.html", order_type=t, form=None)


@settings_bp.route("/buyurtma-turlari/<int:type_id>/holat", methods=["POST"])
@login_required
@permission_required("settings.manage")
def order_type_toggle(type_id):
    t = OrderType.query.get_or_404(type_id)
    t.is_active = not t.is_active
    log_action(current_user, "toggle", "order_type", t.id, t.name)
    db.session.commit()
    flash("Holat o'zgartirildi.", "success")
    return redirect(url_for("settings.order_types"))
