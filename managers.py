"""
Menejerlar bo'limi: har bir menejer uchun oylik savdo plani, shaxsiy
hisobot (mijozlar soni, summasi, planga nisbatan foizi), "Mijozlar bilan
ishlash" Kanban pipeline taxtasi va admin uchun barcha menejerlarning
umumiy ko'rinishi.

Ruxsatlar:
- managers.view   — o'z hisobotini ko'radi (menejer), yoki barchasini
                     ko'radi (admin, boss, xarajatchi/ish boshqaruvchi —
                     2026-08-29, foydalanuvchi qarori: pipeline taxtasini
                     kuzatib borishi kerak).
- managers.manage — plan qo'yadi/o'zgartiradi (faqat admin).

Mijozlar pipeline (ClientPipelineCard/ClientPipelineEvent) — kartani
faqat shu menejerning o'zi yoki admin qo'sha/tahrirlay oladi; boss va
xarajatchi faqat ko'radi.
"""

import os
import uuid
from datetime import date
from decimal import Decimal

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash,
    current_app, send_from_directory,
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from extensions import db
from models import (
    User, ManagerPlan, Order, Employee, EmployeeSalary, Client,
    ClientPipelineCard, ClientPipelineEvent,
    log_action, ZERO, STATUS_CANCELLED,
    PIPELINE_STAGES, PIPELINE_STAGE_NEW, PIPELINE_STAGE_WON, PIPELINE_STAGE_LOST,
    PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS,
)
from permissions import permission_required, has_perm
from queries import (
    eager_orders, manager_month_summary, all_managers_month_summary,
    all_managers_total_clients,
)
from utils import (
    ValidationError, parse_int, parse_money, parse_text, parse_date,
    today_local, now_local, month_bounds, to_money,
)

managers_bp = Blueprint("managers", __name__, url_prefix="/menejerlar")

PROPOSAL_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}

UZ_MONTHS = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
]


def shift_month(year, month, delta):
    """Berilgan oydan `delta` oy oldinga/orqaga siljiydi (manfiy — orqaga)."""
    index = (year * 12 + (month - 1)) + delta
    return index // 12, index % 12 + 1


def plan_progress(total_sum, plan_amount):
    """Qolgan summa va bajarilish foizini hisoblaydi."""
    remaining = plan_amount - total_sum
    remaining = remaining if remaining > ZERO else ZERO
    percent = None
    if plan_amount > ZERO:
        percent = round(float(total_sum / plan_amount * 100), 1)
    return remaining, percent


def manager_kpi(total_sum, percent):
    """KPI summasi (2026-08-29, foydalanuvchi qarori):

    Plan 50% dan yuqori bajarilsa — savdo summasining 5% i, aks holda
    (yoki plan umuman qo'yilmagan bo'lsa) 3% i KPI sifatida olinadi.
    """
    rate = Decimal("0.05") if (percent is not None and percent > 50) else Decimal("0.03")
    return to_money(total_sum * rate)


@managers_bp.route("/")
@login_required
@permission_required("managers.view")
def list_managers():
    # Oddiy menejer faqat o'zining hisobotini ko'radi — ro'yxat unga kerak emas.
    if current_user.role == "menejer":
        return redirect(url_for("managers.manager_detail", user_id=current_user.id))

    today = today_local()
    year = request.args.get("year", today.year, type=int)
    month = request.args.get("month", today.month, type=int)
    if month < 1 or month > 12:
        month = today.month

    start, end = month_bounds(year, month)

    managers = (
        User.query.filter_by(role="menejer")
        .order_by(User.is_active_user.desc(), User.username)
        .all()
    )
    month_stats = all_managers_month_summary(start, end)
    total_clients = all_managers_total_clients()
    plans = {
        p.user_id: p.amount
        for p in ManagerPlan.query.filter_by(year=year, month=month).all()
    }

    rows = []
    grand_total = ZERO
    for m in managers:
        stat = month_stats.get(m.id, {"clients_count": 0, "total_sum": ZERO})
        plan_amount = to_money(plans.get(m.id, ZERO))
        remaining, percent = plan_progress(stat["total_sum"], plan_amount)
        grand_total += stat["total_sum"]
        rows.append({
            "manager": m,
            "clients_count": stat["clients_count"],
            "total_clients": total_clients.get(m.id, 0),
            "total_sum": stat["total_sum"],
            "plan_amount": plan_amount,
            "remaining": remaining,
            "percent": percent,
        })

    return render_template(
        "managers/list.html",
        rows=rows, year=year, month=month, month_name=UZ_MONTHS[month - 1],
        grand_total=grand_total,
        can_manage=has_perm("managers.manage"),
    )


@managers_bp.route("/<int:user_id>")
@login_required
@permission_required("managers.view")
def manager_detail(user_id):
    manager = User.query.filter_by(id=user_id, role="menejer").first_or_404()

    if current_user.role == "menejer" and current_user.id != manager.id:
        flash("Faqat o'zingizning hisobotingizni ko'rishingiz mumkin.", "danger")
        return redirect(url_for("managers.manager_detail", user_id=current_user.id))

    today = today_local()
    year = request.args.get("year", today.year, type=int)
    month = request.args.get("month", today.month, type=int)
    if month < 1 or month > 12:
        month = today.month

    start, end = month_bounds(year, month)
    summary = manager_month_summary(manager.id, start, end)

    plan = ManagerPlan.query.filter_by(user_id=manager.id, year=year, month=month).first()
    plan_amount = to_money(plan.amount) if plan else ZERO
    remaining, percent = plan_progress(summary["total_sum"], plan_amount)
    kpi_amount = manager_kpi(summary["total_sum"], percent)

    # HR bo'limida shu menejerga bog'langan xodim kartochkasi bo'lsa —
    # KPI kartasining chetida oyligini ham ko'rsatamiz (2026-08-29).
    employee_salary = None
    employee = Employee.query.filter_by(user_id=manager.id).first()
    if employee:
        salary = EmployeeSalary.query.filter_by(
            employee_id=employee.id, year=year, month=month
        ).first()
        if salary:
            employee_salary = to_money(salary.amount)

    # oxirgi 6 oylik grafik uchun ma'lumot (joriy oy bilan tugaydi)
    trend = []
    for offset in range(5, -1, -1):
        y, m = shift_month(year, month, -offset)
        s, e = month_bounds(y, m)
        stat = manager_month_summary(manager.id, s, e)
        trend.append({"label": UZ_MONTHS[m - 1], "total": stat["total_sum"]})

    orders = eager_orders(
        Order.query.filter(
            Order.created_by == manager.id,
            Order.created_at >= start,
            Order.created_at < end,
            Order.is_deleted.is_(False),
        ).order_by(Order.created_at.desc())
    ).all()

    # "Mijozlar bilan ishlash" pipeline taxtasi endi alohida sahifada
    # (managers.pipeline_board) — bu yerda faqat qisqacha ko'rsatkich
    # ko'rinadi (2026-08-29, to'rtinchi so'rov: kunlik jurnal o'rniga
    # doimiy Kanban karta tizimiga o'tildi).
    active_card_count = ClientPipelineCard.query.filter(
        ClientPipelineCard.manager_id == manager.id,
        ClientPipelineCard.stage.notin_([PIPELINE_STAGE_WON, PIPELINE_STAGE_LOST]),
    ).count()
    today_event_count = ClientPipelineEvent.query.join(ClientPipelineCard).filter(
        ClientPipelineCard.manager_id == manager.id,
        db.func.date(ClientPipelineEvent.created_at) == today,
    ).count()

    return render_template(
        "managers/detail.html",
        manager=manager, year=year, month=month, month_name=UZ_MONTHS[month - 1],
        summary=summary, plan_amount=plan_amount, remaining=remaining, percent=percent,
        kpi_amount=kpi_amount, employee_salary=employee_salary,
        trend=trend, orders=orders,
        can_manage=has_perm("managers.manage"),
        today=today,
        active_card_count=active_card_count,
        today_event_count=today_event_count,
    )


@managers_bp.route("/<int:user_id>/reja", methods=["POST"])
@login_required
@permission_required("managers.manage")
def set_plan(user_id):
    manager = User.query.filter_by(id=user_id, role="menejer").first_or_404()

    try:
        year = parse_int(request.form.get("year"), "Yil", min_value=2000, max_value=2100)
        month = parse_int(request.form.get("month"), "Oy", min_value=1, max_value=12)
        amount = parse_money(request.form.get("amount"), "Plan summasi", min_value=ZERO)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("managers.manager_detail", user_id=user_id))

    plan = ManagerPlan.query.filter_by(user_id=manager.id, year=year, month=month).first()
    if plan:
        plan.amount = amount
    else:
        plan = ManagerPlan(user_id=manager.id, year=year, month=month, amount=amount)
        db.session.add(plan)

    log_action(
        current_user, "update", "manager_plan", manager.id,
        f"{manager.display_name}: {year}-{month:02d} plan {amount}",
    )
    db.session.commit()
    flash(f"{manager.display_name} uchun {UZ_MONTHS[month - 1]} oyi plani saqlandi.", "success")
    return redirect(url_for("managers.manager_detail", user_id=user_id, year=year, month=month))


# ---------- "Mijozlar bilan ishlash" Kanban pipeline ----------
#
# 2026-08-29 (to'rtinchi so'rov, foydalanuvchi qarori — tubdan yangi
# yondashuv): eski "kunlik jurnal" (har kun uchun alohida, sana bilan
# bog'langan yozuv, 3 holat) butunlay almashtirildi. Endi har (menejer,
# mijoz) juftligi uchun BITTA doimiy karta ochiladi — u kunlar osha davom
# etadi, faqat bosqichi o'zgaradi: Yangi -> Taklif yuborish kutilmoqda ->
# Taklifni qabul qilish kutilmoqda -> Muvaffaqiyatli / Bekor qilindi.
# (2026-08-30, beshinchi so'rov: bosqich nomlari aniqroq qilindi — DB
# kalitlari o'zgarmadi, faqat PIPELINE_STAGE_LABELS matnlari yangilandi.)
# Har bir aloqa (qo'ng'iroq, uchrashuv, izoh,
# bosqich o'zgarishi) kartaning ichida xronologik "voqea" sifatida
# saqlanadi — bitta holat bayrog'i emas, faoliyat tarixi.
#
# "Muvaffaqiyatli" bosqichiga o'tkazish avtomatik buyurtma sahifasiga
# OTKAZMAYDI (bu eski, kutilmagan xatti-harakat edi) — buyurtma karta
# detalidagi "Buyurtma yaratish" havolasi orqali qo'lda ochiladi. "Otkaz
# berdi" bosqichiga o'tishda sabab (note) majburiy, boshqa har qanday
# bosqichdan istalgan bosqichga erkin o'tish mumkin.

def _can_manage_card(manager):
    return current_user.role == "admin" or (
        current_user.role == "menejer" and current_user.id == manager.id
    )


def _resolve_client_from_form(form):
    """Mijozni bazadan topadi yoki (ruxsat bo'lsa) shu yerning o'zida ochadi.

    `orders._client_from_form` bilan bir xil naqsh — jonli qidiruv orqali
    ro'yxatdan tanlansa `client_id` keladi, aks holda nom bo'yicha qidirib,
    topilmasa yangi mijoz ochiladi. (mijoz, yangi_yaratildimi) qaytaradi.
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

    # Yangi mijoz shu yerning o'zida ochilayotganda barcha maydonlar
    # majburiy — to'ldirilmasa karta ham ochilmaydi (2026-08-30,
    # foydalanuvchi qarori). Mavjud mijoz tanlangan bo'lsa, bu yerga
    # umuman kelinmaydi (yuqorida allaqachon return bo'ladi).
    client = Client(
        name=name,
        phone=parse_text(form.get("client_phone"), "Telefon", required=True, max_length=50),
        company=parse_text(form.get("client_company"), "Korxona", required=True, max_length=150),
        created_by=current_user.id,
    )
    db.session.add(client)
    db.session.flush()
    return client, True


def _save_proposal_file(entry, uploaded):
    ext = os.path.splitext(uploaded.filename)[1].lower()
    if ext not in PROPOSAL_EXTENSIONS:
        allowed = ", ".join(sorted(PROPOSAL_EXTENSIONS))
        raise ValidationError(f"Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: {allowed}")

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)

    if entry.proposal_filename:
        old_path = os.path.join(upload_dir, entry.proposal_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    stored_name = f"taklif_{uuid.uuid4().hex}{ext}"
    uploaded.save(os.path.join(upload_dir, stored_name))
    entry.proposal_filename = stored_name
    entry.proposal_original_name = secure_filename(uploaded.filename)[:255] or f"taklif{ext}"


def _pipeline_redirect(card, board_manager_id, to="detail"):
    """Amaldan keyin qayerga qaytish — karta detali (odatiy) yoki taxta
    (board'dagi tezkor "Holat" menyusi shu yerga qaytaradi)."""
    if to == "board":
        return redirect(url_for("managers.pipeline_board", manager_id=board_manager_id))
    return redirect(url_for("managers.pipeline_card_detail", card_id=card.id))


@managers_bp.route("/pipeline")
@login_required
@permission_required("managers.view")
def pipeline_board():
    """"Mijozlar bilan ishlash" Kanban taxtasi (2026-08-29, to'rtinchi so'rov).

    Menejer — faqat o'zining kartalarini ko'radi/boshqaradi. Admin, Boss va
    ish boshqaruvchi — BARCHA menejerlarning kartalarini bitta taxtada
    ko'radi, kerak bo'lsa bitta menejer bo'yicha filtrlaydi. Admin xohlagan
    menejer nomidan karta ham ocha oladi. Har bir ustun — bitta bosqich.
    """
    all_managers = User.query.filter_by(role="menejer").order_by(User.username).all()

    if current_user.role == "menejer":
        manager_filter_id = current_user.id
    else:
        manager_filter_id = request.args.get("manager_id", type=int)

    q = (request.args.get("q") or "").strip()

    query = ClientPipelineCard.query.join(Client)
    if manager_filter_id:
        query = query.filter(ClientPipelineCard.manager_id == manager_filter_id)
    if q:
        query = query.filter(Client.name.ilike(f"%{q}%"))
    cards = query.order_by(ClientPipelineCard.updated_at.desc()).all()

    columns = {stage: [] for stage in PIPELINE_STAGES}
    for card in cards:
        columns[card.stage].append(card)

    can_add = current_user.role in ("menejer", "admin")

    return render_template(
        "managers/pipeline.html",
        columns=columns, stages=PIPELINE_STAGES,
        stage_labels=PIPELINE_STAGE_LABELS, stage_colors=PIPELINE_STAGE_COLORS,
        all_managers=all_managers, manager_filter_id=manager_filter_id, q=q,
        can_add=can_add, show_manager_column=current_user.role != "menejer",
    )


@managers_bp.route("/pipeline/yangi", methods=["POST"])
@login_required
@permission_required("managers.view")
def add_pipeline_card():
    """Yangi karta ochish. Menejer — faqat o'zi uchun; admin — tanlagan
    menejeri uchun. Boss va ish boshqaruvchi ocha olmaydi (faqat ko'radi).
    Bir xil (menejer, mijoz) juftligi uchun ikkinchi karta ochilmaydi —
    mavjud karta bo'lsa o'shanga yo'naltiriladi."""
    if current_user.role == "menejer":
        manager = current_user
    elif current_user.role == "admin":
        manager_id = request.form.get("manager_id", type=int)
        manager = (
            User.query.filter_by(id=manager_id, role="menejer").first()
            if manager_id else None
        )
        if not manager:
            flash("Menejer tanlanmagan yoki topilmadi.", "danger")
            return redirect(url_for("managers.pipeline_board"))
    else:
        flash("Faqat menejerning o'zi yoki admin karta ocha oladi.", "danger")
        return redirect(url_for("managers.pipeline_board"))

    try:
        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
        client, client_created = _resolve_client_from_form(request.form)
    except ValidationError as e:
        db.session.rollback()
        flash(str(e), "danger")
        return redirect(url_for("managers.pipeline_board", manager_id=manager.id))

    existing = ClientPipelineCard.query.filter_by(
        manager_id=manager.id, client_id=client.id
    ).first()
    if existing:
        flash(f"{client.name} uchun karta allaqachon ochilgan — shu yerga qo'shildingiz.", "info")
        return redirect(url_for("managers.pipeline_card_detail", card_id=existing.id))

    if client_created:
        log_action(current_user, "create", "client", client.id,
                   f"{client.name} (pipeline orqali)")

    card = ClientPipelineCard(
        manager_id=manager.id, client_id=client.id, stage=PIPELINE_STAGE_NEW,
        created_by=current_user.id,
    )

    uploaded = request.files.get("proposal")
    if uploaded and uploaded.filename:
        try:
            _save_proposal_file(card, uploaded)
        except ValidationError as e:
            db.session.rollback()
            flash(str(e), "danger")
            return redirect(url_for("managers.pipeline_board", manager_id=manager.id))

    db.session.add(card)
    db.session.flush()
    db.session.add(ClientPipelineEvent(
        card_id=card.id, note=note, from_stage=None, to_stage=PIPELINE_STAGE_NEW,
        created_by=current_user.id,
    ))
    log_action(current_user, "create", "client_pipeline_card", card.id,
               f"{manager.display_name}: {card.display_name} kartasi ochildi")
    db.session.commit()

    flash(f"{card.display_name} uchun karta ochildi.", "success")
    return redirect(url_for("managers.pipeline_card_detail", card_id=card.id))


@managers_bp.route("/pipeline/<int:card_id>")
@login_required
@permission_required("managers.view")
def pipeline_card_detail(card_id):
    """Bitta kartaning tafsiloti — voqealar tarixi (xronologik) va uni
    boshqarish (izoh qo'shish, bosqich o'zgartirish, o'chirish)."""
    card = ClientPipelineCard.query.get_or_404(card_id)
    if current_user.role == "menejer" and card.manager_id != current_user.id:
        flash("Ruxsat yo'q.", "danger")
        return redirect(url_for("managers.pipeline_board"))

    return render_template(
        "managers/pipeline_card.html",
        card=card, events=card.events, stages=PIPELINE_STAGES,
        stage_labels=PIPELINE_STAGE_LABELS, stage_colors=PIPELINE_STAGE_COLORS,
        can_manage=_can_manage_card(card.manager),
    )


@managers_bp.route("/pipeline/<int:card_id>/izoh", methods=["POST"])
@login_required
@permission_required("managers.view")
def add_pipeline_event(card_id):
    """Bosqichni o'zgartirmasdan, faqat faoliyat qayd etish (qo'ng'iroq,
    uchrashuv, izoh) — kartaning tarixiga xronologik qo'shiladi."""
    card = ClientPipelineCard.query.get_or_404(card_id)
    if not _can_manage_card(card.manager):
        flash("Ruxsat yo'q.", "danger")
        return redirect(url_for("managers.pipeline_board"))

    try:
        note = parse_text(request.form.get("note"), "Izoh", required=True, max_length=255)
    except ValidationError as e:
        flash(str(e), "danger")
        return _pipeline_redirect(card, card.manager_id, request.form.get("redirect_to"))

    uploaded = request.files.get("proposal")
    if uploaded and uploaded.filename:
        try:
            _save_proposal_file(card, uploaded)
        except ValidationError as e:
            flash(str(e), "danger")
            return _pipeline_redirect(card, card.manager_id, request.form.get("redirect_to"))

    db.session.add(ClientPipelineEvent(
        card_id=card.id, note=note, from_stage=card.stage, to_stage=card.stage,
        created_by=current_user.id,
    ))
    card.updated_at = now_local()
    log_action(current_user, "update", "client_pipeline_card", card.id,
               f"{card.manager.display_name}: {card.display_name} — izoh qo'shildi")
    db.session.commit()

    flash("Izoh qo'shildi.", "success")
    return _pipeline_redirect(card, card.manager_id, request.form.get("redirect_to"))


@managers_bp.route("/pipeline/<int:card_id>/holat", methods=["POST"])
@login_required
@permission_required("managers.view")
def set_card_stage(card_id):
    """Karta bosqichini o'zgartirish — istalgan bosqichdan istalgan
    bosqichga erkin o'tish mumkin. "Bekor qilindi" uchun sabab majburiy.
    "Muvaffaqiyatli"ga o'tish avtomatik buyurtma sahifasiga OTKAZMAYDI —
    buni karta detalidagi "Buyurtma yaratish" havolasi orqali o'zi qiladi.
    """
    card = ClientPipelineCard.query.get_or_404(card_id)
    if not _can_manage_card(card.manager):
        flash("Ruxsat yo'q.", "danger")
        return redirect(url_for("managers.pipeline_board"))

    new_stage = request.form.get("stage")
    if new_stage not in PIPELINE_STAGES or new_stage == card.stage:
        flash("Bosqichni o'zgartirib bo'lmadi.", "danger")
        return _pipeline_redirect(card, card.manager_id, request.form.get("redirect_to"))

    note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
    if new_stage == PIPELINE_STAGE_LOST and not note:
        flash("Otkaz berish sababini kiriting.", "danger")
        return _pipeline_redirect(card, card.manager_id, request.form.get("redirect_to"))

    old_stage = card.stage
    card.stage = new_stage
    db.session.add(ClientPipelineEvent(
        card_id=card.id, note=note, from_stage=old_stage, to_stage=new_stage,
        created_by=current_user.id,
    ))
    log_action(current_user, "update", "client_pipeline_card", card.id,
               f"{card.manager.display_name}: {card.display_name} -> {card.stage_label}")
    db.session.commit()

    flash(f"{card.display_name} — {card.stage_label} deb belgilandi.",
          "info" if new_stage == PIPELINE_STAGE_LOST else "success")
    return _pipeline_redirect(card, card.manager_id, request.form.get("redirect_to"))


@managers_bp.route("/pipeline/<int:card_id>/ochirish", methods=["POST"])
@login_required
@permission_required("managers.view")
def delete_pipeline_card(card_id):
    card = ClientPipelineCard.query.get_or_404(card_id)
    if not _can_manage_card(card.manager):
        flash("Ruxsat yo'q.", "danger")
        return redirect(url_for("managers.pipeline_board"))

    manager_id = card.manager_id
    if card.proposal_filename:
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        old_path = os.path.join(upload_dir, card.proposal_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    log_action(current_user, "delete", "client_pipeline_card", card.id,
               f"{card.manager.display_name}: {card.display_name} kartasi o'chirildi")
    db.session.delete(card)
    db.session.commit()
    flash("Karta o'chirildi.", "success")
    return redirect(url_for("managers.pipeline_board", manager_id=manager_id))


@managers_bp.route("/pipeline/<int:card_id>/fayl")
@login_required
@permission_required("managers.view")
def download_pipeline_proposal(card_id):
    card = ClientPipelineCard.query.get_or_404(card_id)
    if not card.proposal_filename:
        flash("Fayl yuklanmagan.", "warning")
        return redirect(url_for("managers.pipeline_card_detail", card_id=card.id))
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        card.proposal_filename,
        as_attachment=True,
        download_name=card.proposal_original_name or card.proposal_filename,
    )
