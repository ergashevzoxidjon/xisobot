"""
"Pullar" — naqd pul nazorati (2026-09-07, foydalanuvchi qarori).

Muammo: pul qayerdaligini bilish qiyin edi — menejer naqd to'lov qabul
qilgach, u jismonan ish boshqaruvchiga (xarajatchi) topshiriladi, lekin
tizimda bu "topshiriq" hech qayerda ko'rinmasdi.

Yechim: har bir naqd to'lov uchun `CashHandover` yozuvi avtomatik
yaratiladi (`orders.add_payment`), "kutilmoqda" holatida. Ish boshqaruvchi
shu yerda "Qabul qildim" deb tasdiqlaydi — shundan keyin naqd balansiga
qo'shiladi. Bu — SOF QO'SHIMCHA kuzatuv qatlami: moliyaviy hisob-kitob
(`Order.remaining`, hisobotlar) to'lov kiritilgan zahoti — hozirgidek —
o'zgaradi, shu modul unga umuman ta'sir qilmaydi.

Ruxsatlar:
- money.view    — menejer (o'zi topshirganlari), xarajatchi (o'ziga
                   tegishlilari + balansi), admin/boss (hammasi).
- money.confirm — faqat o'ziga tegishli topshiriqni tasdiqlaydi
                   (admin — istalganini).
"""

from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user

from extensions import db
from models import (
    CashHandover, HANDOVER_PENDING, HANDOVER_CONFIRMED, User, ZERO, log_action,
    CASH_SOURCE_LABELS,
)
from permissions import permission_required
from queries import cash_balances, cash_received, cash_source_totals
from utils import now_local, money_str

money_bp = Blueprint("money", __name__, url_prefix="/pullar")


@money_bp.route("/")
@login_required
@permission_required("money.view")
def list_handovers():
    query = CashHandover.query.order_by(CashHandover.created_at.desc())

    if current_user.role == "menejer":
        # Menejer — faqat o'zi topshirgan pullarni ko'radi.
        handovers = query.filter(CashHandover.from_user_id == current_user.id).all()
    elif current_user.role == "xarajatchi":
        # Ish boshqaruvchi — o'ziga topshirilganlarni ko'radi va tasdiqlaydi.
        handovers = query.filter(CashHandover.to_user_id == current_user.id).all()
    else:
        # Admin/Boss — hammasini ko'radi.
        handovers = query.limit(300).all()

    pending = [h for h in handovers if h.status == HANDOVER_PENDING]
    confirmed = [h for h in handovers if h.status == HANDOVER_CONFIRMED]

    balances = cash_balances()
    my_balance = balances.get(current_user.id, ZERO) if current_user.role == "xarajatchi" else None
    my_received = cash_received(current_user.id) if current_user.role == "xarajatchi" else None

    # Admin/Boss — har bir ish boshqaruvchi qo'lida hozir qancha naqd
    # borligini bitta jadvalda ko'radi.
    balance_rows = []
    if current_user.role in ("admin", "boss"):
        xarajatchi_users = User.query.filter_by(role="xarajatchi").order_by(User.username).all()
        balance_rows = [
            {"user": u, "balance": balances.get(u.id, ZERO)} for u in xarajatchi_users
        ]

    # OFIS/Zoxidjon zaxirasidan qancha sarflangani (2026-09-07, foydalanuvchi
    # qarori) — admin/boss/xarajatchi ko'radi (menejer moliya bilan
    # ishlamaydi, faqat o'z topshirgan pulini kuzatadi).
    source_totals = None
    if current_user.role in ("admin", "boss", "xarajatchi"):
        totals = cash_source_totals()
        source_totals = {
            CASH_SOURCE_LABELS[key]: amount for key, amount in totals.items()
        }

    return render_template(
        "money/list.html",
        pending=pending, confirmed=confirmed,
        my_balance=my_balance, my_received=my_received, balance_rows=balance_rows,
        source_totals=source_totals,
        can_confirm=current_user.role in ("admin", "xarajatchi"),
    )


@money_bp.route("/<int:handover_id>/tasdiqlash", methods=["POST"])
@login_required
@permission_required("money.confirm")
def confirm_handover(handover_id):
    h = CashHandover.query.get_or_404(handover_id)

    if current_user.role != "admin" and h.to_user_id != current_user.id:
        flash("Bu pul topshirig'i sizga tegishli emas.", "danger")
        return redirect(url_for("money.list_handovers"))

    if h.status == HANDOVER_CONFIRMED:
        flash("Bu topshiriq allaqachon tasdiqlangan.", "info")
        return redirect(url_for("money.list_handovers"))

    h.status = HANDOVER_CONFIRMED
    h.confirmed_by = current_user.id
    h.confirmed_at = now_local()
    log_action(current_user, "confirm", "cash_handover", h.id,
               f"{money_str(h.amount)} so'm qabul qilindi "
               f"({h.order.order_number if h.order else '-'})")
    db.session.commit()
    flash(f"{money_str(h.amount)} so'm qabul qilingani tasdiqlandi.", "success")
    return redirect(url_for("money.list_handovers"))
