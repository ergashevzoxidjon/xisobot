"""
"Pullar" — naqd va karta pul nazorati (2026-09-07, kengaytirildi 2026-09-08).

Muammo: pul qayerdaligini bilish qiyin edi — menejer naqd to'lov qabul
qilgach, u jismonan ish boshqaruvchiga (xarajatchi) topshiriladi, mijoz
karta orqali to'lasa esa boshliqning shaxsiy kartasiga tushadi — lekin
tizimda bu "topshiriq"lar hech qayerda ko'rinmasdi.

Yechim: har bir naqd/karta to'lov uchun `CashHandover` yozuvi avtomatik
yaratiladi (`orders.add_payment`), "kutilmoqda" holatida. Naqd bo'lsa —
ish boshqaruvchi, karta bo'lsa — boshliq shu yerda "Qabul qildim" deb
tasdiqlaydi — shundan keyin tegishli balansga qo'shiladi. Bu — SOF
QO'SHIMCHA kuzatuv qatlami: moliyaviy hisob-kitob (`Order.remaining`,
hisobotlar) to'lov kiritilgan zahoti — hozirgidek — o'zgaradi, shu modul
unga umuman ta'sir qilmaydi.

Shuningdek boshliq OFIS zaxirasiga pul kiritishi (to'ldirishi) mumkin —
ish boshqaruvchi ombor kirimida "Naqd to'landi -> OFIS xisobidan"
tanlaganda shu zaxiradan sarflanadi.

Ruxsatlar:
- money.view    — menejer (o'zi topshirganlari), xarajatchi (o'ziga
                   tegishli naqd + balansi), boss (o'ziga tegishli karta +
                   balansi, OFIS/Zoxidjon manba hisobotlari), admin (hammasi).
- money.confirm — faqat o'ziga tegishli topshiriqni tasdiqlaydi
                   (admin — istalganini). Naqd — xarajatchi, karta — boss.
- money.fund    — OFIS zaxirasiga pul kiritadi (boss/admin).
- money.adjust  — OFIS zaxirasiga xato kiritilgan summani/izohni tuzatadi
                   (faqat admin) — boshliq xato summa kiritib qo'ysa shu
                   yerdan to'g'irlanadi (2026-09-16, foydalanuvchi so'rovi).
"""

from decimal import Decimal

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

from extensions import db
from models import (
    CashHandover, HANDOVER_PENDING, HANDOVER_CONFIRMED, User, ZERO, log_action,
    CASH_SOURCE_LABELS, CASH_SOURCE_OFFICE,
    HANDOVER_CHANNEL_CASH, HANDOVER_CHANNEL_CARD,
    CashDeposit,
)
from permissions import permission_required
from queries import (
    cash_balances, cash_received, cash_source_totals, total_order_cash_on_hand,
    card_balances, total_confirmed_handover_amount,
    office_deposited_total,
)
from utils import now_local, money_str, parse_money, parse_text, ValidationError

money_bp = Blueprint("money", __name__, url_prefix="/pullar")


@money_bp.route("/")
@login_required
@permission_required("money.view")
def list_handovers():
    query = CashHandover.query.order_by(CashHandover.created_at.desc())

    if current_user.role == "menejer":
        # Menejer — faqat o'zi topshirgan pullarni ko'radi.
        handovers = query.filter(CashHandover.from_user_id == current_user.id).all()
    elif current_user.role in ("xarajatchi", "boss"):
        # Ish boshqaruvchi/boshliq — o'ziga topshirilgan/tushgan pullarni
        # ko'radi va tasdiqlaydi (xarajatchi — naqd, boss — karta).
        handovers = query.filter(CashHandover.to_user_id == current_user.id).all()
    else:
        # Admin — hammasini ko'radi.
        handovers = query.limit(300).all()

    pending = [h for h in handovers if h.status == HANDOVER_PENDING]
    confirmed = [h for h in handovers if h.status == HANDOVER_CONFIRMED]

    balances = cash_balances()
    # Xarajatchi — o'zining shaxsiy naqd qo'lidagi puli (aynan qabul
    # qilganlari). Admin/boss — kompaniya bo'yicha jami naqd (barcha
    # xarajatchilar yig'indisi) — ular naqdni shaxsan qabul qilmaydi, lekin
    # umumiy holatni ko'rishlari kerak (2026-09-08, foydalanuvchi qarori:
    # "bossga naxt pul xisobi ham alohida kartochkada ko'rinishi kerak").
    if current_user.role == "xarajatchi":
        my_balance = balances.get(current_user.id, ZERO)
        my_received = cash_received(current_user.id)
    elif current_user.role in ("admin", "boss"):
        my_balance = total_order_cash_on_hand()
        my_received = total_confirmed_handover_amount(HANDOVER_CHANNEL_CASH)
    else:
        my_balance = None
        my_received = None

    # Admin/Boss — har bir ish boshqaruvchi/boshliq qo'lida hozir qancha
    # pul borligini bitta jadvalda ko'radi (bir nechta boshliq bo'lsa foydali).
    balance_rows = []
    card_balance_rows = []
    if current_user.role in ("admin", "boss"):
        xarajatchi_users = User.query.filter_by(role="xarajatchi").order_by(User.username).all()
        balance_rows = [
            {"user": u, "balance": balances.get(u.id, ZERO)} for u in xarajatchi_users
        ]
        boss_users = User.query.filter_by(role="boss").order_by(User.username).all()
        cbalances = card_balances()
        card_balance_rows = [
            {"user": u, "balance": cbalances.get(u.id, ZERO)} for u in boss_users
        ]

    # Kompaniya bo'yicha jami tasdiqlangan karta tushumi va joriy qoldiq —
    # sahifa yuqorisidagi umumiy kartochkalar uchun (2026-09-08, foydalanuvchi
    # qarori). Endi xarajatchi ham ko'radi ("ishboshqaruvchida ... karta
    # xisobi yo'q ... ko'rsatadigan qilishimiz darkor") — u kartani shaxsan
    # ushlamaydi, lekin umumiy holatni bilishi kerak. Hozircha kartadan
    # sarflash mexanizmi yo'q, shuning uchun ikkalasi bir xil — struktura
    # kelajakda ajralishga tayyor.
    card_total_received = None
    card_total_balance = None
    if current_user.role in ("admin", "boss", "xarajatchi"):
        card_total_received = total_confirmed_handover_amount(HANDOVER_CHANNEL_CARD)
        card_total_balance = card_total_received

    # OFIS/Zoxidjon zaxirasidan qancha sarflangani (2026-09-07, foydalanuvchi
    # qarori) — admin/boss/xarajatchi ko'radi (menejer moliya bilan
    # ishlamaydi, faqat o'z topshirgan pulini kuzatadi). OFIS endi balans
    # sifatida ko'rsatiladi (kiritilgan - sarflangan) — Zoxidjon shaxsiy
    # mablag'i cheklanmagan deb hisoblangani uchun faqat "sarflangan" bo'lib
    # qoladi (2026-09-08).
    source_totals = None
    office_info = None
    office_deposits = None
    if current_user.role in ("admin", "boss", "xarajatchi"):
        totals = cash_source_totals()
        source_totals = {
            CASH_SOURCE_LABELS[key]: amount
            for key, amount in totals.items() if key != CASH_SOURCE_OFFICE
        }
        deposited = office_deposited_total()
        office_info = {
            "deposited": deposited,
            "spent": totals[CASH_SOURCE_OFFICE],
            "balance": deposited - totals[CASH_SOURCE_OFFICE],
        }
        # Xato kiritilgan summani admin tuzata olishi uchun har bir
        # kiritmani alohida ko'rsatamiz (2026-09-16, foydalanuvchi so'rovi).
        office_deposits = (
            CashDeposit.query.order_by(CashDeposit.created_at.desc()).limit(100).all()
        )

    return render_template(
        "money/list.html",
        pending=pending, confirmed=confirmed,
        my_balance=my_balance, my_received=my_received,
        balance_rows=balance_rows, card_balance_rows=card_balance_rows,
        card_total_received=card_total_received, card_total_balance=card_total_balance,
        source_totals=source_totals, office_info=office_info,
        office_deposits=office_deposits,
        can_confirm=current_user.role in ("admin", "xarajatchi", "boss"),
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


@money_bp.route("/ofis-toldirish", methods=["POST"])
@login_required
@permission_required("money.fund")
def fund_office():
    """Boshliq OFIS zaxirasiga pul kiritadi (2026-09-08, foydalanuvchi
    qarori) — ish boshqaruvchi ombor kirimida "Naqd to'landi -> OFIS
    xisobidan" tanlaganda shu zaxiradan sarflanadi."""
    try:
        amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("money.list_handovers"))

    db.session.add(CashDeposit(amount=amount, note=note, created_by=current_user.id))
    log_action(
        current_user, "create", "cash_deposit", None,
        f"OFIS zaxirasiga {money_str(amount)} so'm qo'shildi" + (f" — {note}" if note else ""),
    )
    db.session.commit()
    flash(f"OFIS zaxirasiga {money_str(amount)} so'm qo'shildi.", "success")
    return redirect(url_for("money.list_handovers"))


@money_bp.route("/ofis/<int:deposit_id>/tuzatish", methods=["POST"])
@login_required
@permission_required("money.adjust")
def adjust_deposit(deposit_id):
    """OFIS zaxirasiga xato summa/izoh kiritilgan bo'lsa, admin to'g'irlaydi
    (2026-09-16, foydalanuvchi so'rovi) — masalan, boshliq OFISga pul
    qo'shayotganda xato summa kiritib qo'ysa, u o'zi o'zgartira olmaydi
    (money.fund — faqat qo'shadi), shu yerdan admin tuzatadi. stock.adjust
    kabi — to'g'ridan-to'g'ri tuzatish, eski/yangi qiymat log qilinadi."""
    d = CashDeposit.query.get_or_404(deposit_id)

    try:
        new_amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
        new_note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("money.list_handovers"))

    changes = []
    if new_amount != d.amount:
        changes.append(f"summa {money_str(d.amount)} -> {money_str(new_amount)}")
        d.amount = new_amount
    if (new_note or "") != (d.note or ""):
        changes.append(f"izoh «{d.note or '-'}» -> «{new_note or '-'}»")
        d.note = new_note

    if not changes:
        flash("O'zgarish yo'q — qiymatlar allaqachon shunday.", "info")
        return redirect(url_for("money.list_handovers"))

    log_action(current_user, "adjust", "cash_deposit", d.id, ", ".join(changes))
    db.session.commit()
    flash("OFIS zaxirasi yozuvi tuzatildi: " + ", ".join(changes) + ".", "success")
    return redirect(url_for("money.list_handovers"))
