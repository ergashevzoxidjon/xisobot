"""
Menejerlar bo'limi: har bir menejer uchun oylik savdo plani, shaxsiy
hisobot (mijozlar soni, summasi, planga nisbatan foizi), kunlik mijozlar
bilan ishlash jurnali va admin uchun barcha menejerlarning umumiy ko'rinishi.

Ruxsatlar:
- managers.view   — o'z hisobotini ko'radi (menejer), yoki barchasini
                     ko'radi (admin, boss, xarajatchi/ish boshqaruvchi —
                     2026-08-29, foydalanuvchi qarori: kunlik jurnalni
                     kuzatib borishi kerak).
- managers.manage — plan qo'yadi/o'zgartiradi (faqat admin).

Kunlik mijozlar jurnali (ManagerClientLog) — yozuvni faqat shu menejerning
o'zi yoki admin qo'sha/tahrirlay oladi; boss va xarajatchi faqat ko'radi.
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
    User, ManagerPlan, Order, Employee, EmployeeSalary, Client, ManagerClientLog,
    log_action, ZERO, STATUS_CANCELLED,
    LOG_STATUSES, LOG_STATUS_SUCCESS, LOG_STATUS_PENDING, LOG_STATUS_DECLINED,
)
from permissions import permission_required, has_perm
from queries import (
    eager_orders, manager_month_summary, all_managers_month_summary,
    all_managers_total_clients,
)
from utils import (
    ValidationError, parse_int, parse_money, parse_text, parse_date,
    today_local, month_bounds, to_money,
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

    # Kunlik mijozlar bilan ishlash jurnali endi alohida sahifada
    # (managers.client_log_board) — bu yerda faqat bugungi soni ko'rsatiladi,
    # takrorlanmasin deb to'liq jurnal shu sahifadan olib tashlandi
    # (2026-08-29, uchinchi so'rov).
    today_log_count = ManagerClientLog.query.filter_by(
        manager_id=manager.id, log_date=today
    ).count()

    return render_template(
        "managers/detail.html",
        manager=manager, year=year, month=month, month_name=UZ_MONTHS[month - 1],
        summary=summary, plan_amount=plan_amount, remaining=remaining, percent=percent,
        kpi_amount=kpi_amount, employee_salary=employee_salary,
        trend=trend, orders=orders,
        can_manage=has_perm("managers.manage"),
        today=today,
        today_log_count=today_log_count,
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


# ---------- kunlik mijozlar bilan ishlash jurnali ----------
#
# 2026-08-29 (uchinchi so'rov): jurnal endi alohida sahifa (/menejerlar/jurnal)
# — Boss va ish boshqaruvchi BARCHA menejerlarning yozuvlarini bitta joyda
# kuzatadi, menejer esa shu yerdan o'zining yozuvlarini boshqaradi. Mijoz
# HAR QANDAY holatda ham avval kiritiladi/bazadan topiladi (orders.py'dagi
# _client_from_form bilan bir xil naqsh), keyin holat tanlanadi — status
# bo'yicha alohida forma tarmoqlanishi yo'q. "Otkaz berdi" tanlansa sabab
# (note) majburiy.

def _can_manage_log(manager):
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

    client = Client(
        name=name,
        phone=parse_text(form.get("client_phone"), "Telefon", required=False, max_length=50),
        company=parse_text(form.get("client_company"), "Korxona", required=False, max_length=150),
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


@managers_bp.route("/jurnal")
@login_required
@permission_required("managers.view")
def client_log_board():
    """Kunlik mijozlar bilan ishlash — alohida sahifa (2026-08-29).

    Menejer — faqat o'zining yozuvlarini ko'radi/boshqaradi. Admin, Boss va
    ish boshqaruvchi — tanlangan kundagi BARCHA menejerlarning yozuvlarini
    bitta jadvalda (menejer nomi ustuni bilan) ko'radi, kerak bo'lsa bitta
    menejer bo'yicha filtrlaydi. Admin xohlagan menejer nomidan yozuv ham
    qo'sha oladi.
    """
    today = today_local()
    log_date_raw = (request.args.get("log_date") or "").strip()
    try:
        log_date = date.fromisoformat(log_date_raw) if log_date_raw else today
    except ValueError:
        log_date = today

    all_managers = User.query.filter_by(role="menejer").order_by(User.username).all()

    if current_user.role == "menejer":
        manager_filter_id = current_user.id
    else:
        manager_filter_id = request.args.get("manager_id", type=int)

    query = ManagerClientLog.query.filter_by(log_date=log_date)
    if manager_filter_id:
        query = query.filter_by(manager_id=manager_filter_id)
    logs = query.order_by(ManagerClientLog.created_at.desc()).all()

    can_add = current_user.role in ("menejer", "admin")

    return render_template(
        "managers/jurnal.html",
        log_date=log_date, logs=logs, today=today,
        all_managers=all_managers, manager_filter_id=manager_filter_id,
        can_add=can_add, log_statuses=LOG_STATUSES,
        show_manager_column=current_user.role != "menejer",
    )


@managers_bp.route("/jurnal/qoshish", methods=["POST"])
@login_required
@permission_required("managers.view")
def add_client_log():
    """Jurnalga yangi yozuv. Menejer — faqat o'zi uchun; admin — tanlagan
    menejeri uchun. Boss va ish boshqaruvchi qo'sha olmaydi (faqat ko'radi)."""
    log_date_raw = request.form.get("log_date") or ""

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
            return redirect(url_for("managers.client_log_board", log_date=log_date_raw))
    else:
        flash("Faqat menejerning o'zi yoki admin jurnalga yozuv qo'sha oladi.", "danger")
        return redirect(url_for("managers.client_log_board", log_date=log_date_raw))

    try:
        status = request.form.get("status") or LOG_STATUS_PENDING
        if status not in LOG_STATUSES:
            raise ValidationError("Holat noto'g'ri tanlandi.")
        log_date = parse_date(request.form.get("log_date"), "Sana", required=False) or today_local()
        if log_date > today_local():
            raise ValidationError("Sana kelajakda bo'lishi mumkin emas.")

        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
        if status == LOG_STATUS_DECLINED and not note:
            raise ValidationError("Rad etish sababini kiriting.")

        # Mijoz HAR QANDAY holatda ham avval kiritiladi/topiladi (2026-08-29,
        # foydalanuvchi qarori) — status bo'yicha alohida tarmoqlanish yo'q.
        client, client_created = _resolve_client_from_form(request.form)
    except ValidationError as e:
        db.session.rollback()
        flash(str(e), "danger")
        return redirect(url_for("managers.client_log_board",
                                 log_date=log_date_raw, manager_id=manager.id))

    if client_created:
        log_action(current_user, "create", "client", client.id,
                   f"{client.name} (kunlik jurnal orqali)")

    entry = ManagerClientLog(
        manager_id=manager.id, log_date=log_date, status=status,
        client_id=client.id, note=note, created_by=current_user.id,
    )

    uploaded = request.files.get("proposal")
    if uploaded and uploaded.filename:
        try:
            _save_proposal_file(entry, uploaded)
        except ValidationError as e:
            db.session.rollback()
            flash(str(e), "danger")
            return redirect(url_for("managers.client_log_board",
                                     log_date=log_date.isoformat(), manager_id=manager.id))

    db.session.add(entry)
    db.session.flush()
    log_action(current_user, "create", "manager_client_log", entry.id,
               f"{manager.display_name}: {entry.display_name} ({entry.status_label})")
    db.session.commit()

    if status == LOG_STATUS_SUCCESS:
        flash(f"{entry.display_name} — muvaffaqiyatli belgilandi. Endi buyurtma yarating.", "success")
        return redirect(url_for("orders.new_order", client_id=client.id, manager_log_id=entry.id))

    flash(f"{entry.display_name} — jurnalga yozildi ({entry.status_label}).", "success")
    return redirect(url_for("managers.client_log_board",
                             log_date=log_date.isoformat(), manager_id=manager.id))


@managers_bp.route("/jurnal/<int:log_id>/holat", methods=["POST"])
@login_required
@permission_required("managers.view")
def set_log_status(log_id):
    """Kutilayotgan (tasdiqlash jarayonida) yozuvni Muvaffaqiyatli yoki
    Otkaz berdi holatiga o'tkazish. Otkaz uchun sabab majburiy."""
    entry = ManagerClientLog.query.get_or_404(log_id)
    manager = entry.manager

    if not _can_manage_log(manager):
        flash("Ruxsat yo'q.", "danger")
        return redirect(url_for("managers.client_log_board"))

    new_status = request.form.get("status")
    if entry.status != LOG_STATUS_PENDING or new_status not in (LOG_STATUS_SUCCESS, LOG_STATUS_DECLINED):
        flash("Holatni o'zgartirib bo'lmadi.", "danger")
        return redirect(url_for("managers.client_log_board",
                                 log_date=entry.log_date.isoformat(), manager_id=manager.id))

    if new_status == LOG_STATUS_DECLINED:
        try:
            reason = parse_text(request.form.get("note"), "Rad etish sababi",
                                required=True, max_length=255)
        except ValidationError as e:
            flash(str(e), "danger")
            return redirect(url_for("managers.client_log_board",
                                     log_date=entry.log_date.isoformat(), manager_id=manager.id))
        entry.note = reason

    entry.status = new_status
    log_action(current_user, "update", "manager_client_log", entry.id,
               f"{manager.display_name}: {entry.display_name} -> {entry.status_label}")
    db.session.commit()

    if new_status == LOG_STATUS_SUCCESS:
        flash(f"{entry.display_name} — muvaffaqiyatli belgilandi. Endi buyurtma yarating.", "success")
        if entry.client_id:
            return redirect(url_for("orders.new_order", client_id=entry.client_id, manager_log_id=entry.id))
        return redirect(url_for("orders.new_order", client_name=entry.client_name or "", manager_log_id=entry.id))

    flash(f"{entry.display_name} — Otkaz berdi deb belgilandi.", "info")
    return redirect(url_for("managers.client_log_board",
                             log_date=entry.log_date.isoformat(), manager_id=manager.id))


@managers_bp.route("/jurnal/<int:log_id>/ochirish", methods=["POST"])
@login_required
@permission_required("managers.view")
def delete_client_log(log_id):
    entry = ManagerClientLog.query.get_or_404(log_id)
    manager = entry.manager
    if not _can_manage_log(manager):
        flash("Ruxsat yo'q.", "danger")
        return redirect(url_for("managers.client_log_board"))

    log_date = entry.log_date
    if entry.proposal_filename:
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        old_path = os.path.join(upload_dir, entry.proposal_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    log_action(current_user, "delete", "manager_client_log", entry.id,
               f"{manager.display_name}: {entry.display_name} yozuvi o'chirildi")
    db.session.delete(entry)
    db.session.commit()
    flash("Yozuv o'chirildi.", "success")
    return redirect(url_for("managers.client_log_board",
                             log_date=log_date.isoformat(), manager_id=manager.id))


@managers_bp.route("/jurnal/<int:log_id>/fayl")
@login_required
@permission_required("managers.view")
def download_proposal(log_id):
    entry = ManagerClientLog.query.get_or_404(log_id)
    if not entry.proposal_filename:
        flash("Fayl yuklanmagan.", "warning")
        return redirect(url_for("managers.client_log_board"))
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        entry.proposal_filename,
        as_attachment=True,
        download_name=entry.proposal_original_name or entry.proposal_filename,
    )
