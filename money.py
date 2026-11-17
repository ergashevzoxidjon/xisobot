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

Ish boshqaruvchi "qabul qildim" deganidan keyin naqd pul qayerga
sarflanganini ham shu sahifada kuzatish mumkin (2026-09-16, foydalanuvchi
so'rovi) — o'zining qo'lidagi naqddan (OFIS/Zoxidjon zaxirasidan emas)
qilingan xarajatlar ro'yxati (`cash_spent_subq()` bilan bir xil filtr).
Xarajatchi faqat o'zinikini, admin/boss — hammasini ko'radi. Tuzatish
havolasi (mavjud `finance.edit_expense`ga) faqat adminga ko'rinadi — boss
faqat ko'radi (xarajatchi ham bu yerdan tahrirlamaydi, o'zining odatdagi
Xarajatlar sahifasidan qiladi).

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
from sqlalchemy.orm import joinedload

from extensions import db
from models import (
    CashHandover, HANDOVER_PENDING, HANDOVER_CONFIRMED, User, ZERO, log_action,
    HANDOVER_CHANNEL_CASH, HANDOVER_CHANNEL_CARD,
    CashDeposit, Expense,
    OFFICE_CHANNELS, OFFICE_CHANNEL_CASH, OFFICE_CHANNEL_CARD,
)
from permissions import permission_required
from queries import (
    office_summary, office_deposit_sources,
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

    # OFIS kassasi (2026-11-17, foydalanuvchi qarori): buyurtmalardan
    # tushgan naqd + qo'lda to'ldirishlar − barcha naqd xarajatlar. Ish
    # boshqaruvchining "shaxsiy" naqd qoldig'i endi alohida yuritilmaydi.
    sees_office = current_user.role in ("admin", "boss", "xarajatchi")
    office = office_summary() if sees_office else None
    office_deposits = (
        CashDeposit.query.options(joinedload(CashDeposit.creator))
        .order_by(CashDeposit.created_at.desc()).limit(100).all()
        if sees_office else None
    )

    cash_expenses = None
    if sees_office:
        cash_expenses = (
            Expense.query.options(
                joinedload(Expense.creator), joinedload(Expense.order),
                joinedload(Expense.supplier),
            )
            .filter(Expense.payment_method.in_(OFFICE_CHANNELS), Expense.is_paid.is_(True))
            .order_by(Expense.date.desc(), Expense.id.desc())
            .limit(100).all()
        )

    return render_template(
        "money/list.html",
        pending=pending, confirmed=confirmed,
        office=office, office_deposits=office_deposits,
        deposit_sources=office_deposit_sources() if sees_office else [],
        cash_expenses=cash_expenses,
        can_confirm=current_user.role in ("admin", "xarajatchi", "boss"),
        now=now_local(),
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
    """OFIS hisobini to'ldirish (2026-11-17, foydalanuvchi so'rovi):
    buyurtmalardan tushgan naqd yetmay qolganda qo'shimcha pul kiritiladi.
    Sana-vaqt avtomatik yoziladi, manba (Zoxidjon, Karta, Bank...) majburiy.
    Boss, admin va ish boshqaruvchi kirita oladi (money.fund)."""
    try:
        amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("1"))
        source = parse_text(request.form.get("source"), "Manba", required=True, max_length=100)
        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("money.list_handovers"))

    channel = request.form.get("channel") or OFFICE_CHANNEL_CASH
    if channel not in OFFICE_CHANNELS:
        flash("Pul naqd yoki kartaga tushganini tanlang.", "danger")
        return redirect(url_for("money.list_handovers"))

    d = CashDeposit(amount=amount, source=source, note=note, channel=channel,
                    created_by=current_user.id)
    db.session.add(d)
    db.session.flush()
    log_action(
        current_user, "create", "cash_deposit", d.id,
        f"OFIS hisobi ({channel}) to'ldirildi: {money_str(amount)} so'm, manba: {source}"
        + (f" — {note}" if note else ""),
    )
    db.session.commit()
    part = "kartasiga" if channel == OFFICE_CHANNEL_CARD else "kassasiga (naqd)"
    flash(f"OFIS {part} {money_str(amount)} so'm qo'shildi (manba: {source}).", "success")
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
        new_source = parse_text(request.form.get("source"), "Manba", required=False, max_length=100)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("money.list_handovers"))

    changes = []
    new_channel = request.form.get("channel") or d.channel
    if new_channel in OFFICE_CHANNELS and new_channel != d.channel:
        changes.append(f"qism {d.channel} -> {new_channel}")
        d.channel = new_channel
    if (new_source or "") != (d.source or ""):
        changes.append(f"manba «{d.source or '-'}» -> «{new_source or '-'}»")
        d.source = new_source
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
