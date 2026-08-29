"""
HR bo'limi (2026-08-29, foydalanuvchi qarori): xodimlar kartochkasi —
ism, telefon, manzil, oylik (oylar kesimida), KPI (agar menejer hisobiga
bog'langan bo'lsa), pasport nusxasi va avanslar.

Ruxsatlar:
- hr.view   — ro'yxat va kartochkalarni ko'radi (admin, xarajatchi, boss).
- hr.manage — xodim qo'shadi/tahrirlaydi, oylik belgilaydi, pasport
              yuklaydi (faqat admin).
- hr.pay    — "Ishchiga berilayotgan summa" (Oylik/Avans/KPI) kiritadi
              (admin, xarajatchi, boss — 2026-08-29, foydalanuvchi qarori).
"""

import os
import uuid
from decimal import Decimal

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash,
    current_app, send_from_directory,
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from extensions import db
from models import (
    Employee, EmployeeSalary, EmployeeAdvance, Expense, User, ManagerPlan,
    log_action, ZERO, SALARY_EXPENSE_CATEGORY,
    PAYMENT_KINDS, PAYMENT_KIND_LABELS, PAYMENT_KIND_OYLIK, PAYMENT_KIND_AVANS, PAYMENT_KIND_KPI,
)
from permissions import permission_required, has_perm
from queries import (
    employees_month_salary_totals, employees_month_advance_totals,
    employees_month_payment_totals, manager_month_summary,
)
from managers import UZ_MONTHS, plan_progress, manager_kpi
from utils import (
    ValidationError, parse_text, parse_int, parse_money, parse_date,
    today_local, month_bounds, to_money, money_str,
)

hr_bp = Blueprint("hr", __name__, url_prefix="/hr")

PASSPORT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def _employee_form_data(form):
    return {
        "full_name": parse_text(form.get("full_name"), "Ism familiya", required=True, max_length=150),
        "phone": parse_text(form.get("phone"), "Telefon", required=False, max_length=50),
        "address": parse_text(form.get("address"), "Manzil", required=False, max_length=255),
        "note": parse_text(form.get("note"), "Izoh", required=False, max_length=255),
    }


def _kpi_for_employee(employee, year, month):
    """Xodim menejer hisobiga bog'langan bo'lsa — shu oydagi KPI summasi."""
    if not employee.user_id:
        return None
    start, end = month_bounds(year, month)
    summary = manager_month_summary(employee.user_id, start, end)
    plan = ManagerPlan.query.filter_by(user_id=employee.user_id, year=year, month=month).first()
    plan_amount = to_money(plan.amount) if plan else ZERO
    _, percent = plan_progress(summary["total_sum"], plan_amount)
    return manager_kpi(summary["total_sum"], percent)


@hr_bp.route("/")
@login_required
@permission_required("hr.view")
def list_employees():
    today = today_local()
    year = request.args.get("year", today.year, type=int)
    month = request.args.get("month", today.month, type=int)
    if month < 1 or month > 12:
        month = today.month

    employees = (
        Employee.query.filter_by(is_active=True)
        .order_by(Employee.full_name)
        .all()
    )
    salary_totals = employees_month_salary_totals(year, month)
    start, end = month_bounds(year, month)
    payment_totals = employees_month_payment_totals(start, end)

    rows = []
    total_salary = ZERO
    total_given = ZERO
    for e in employees:
        salary = salary_totals.get(e.id, ZERO)
        paid = payment_totals.get(e.id, {"oylik": ZERO, "avans": ZERO, "kpi": ZERO, "jami": ZERO})
        total_salary += salary
        total_given += paid["jami"]
        rows.append({
            "employee": e,
            "salary": salary,
            "paid": paid,
            # Qoldiq — belgilangan oylikdan Oylik+Avans to'lovlari ayiriladi
            # (KPI alohida byudjet — bazaviy oylik qoldig'iga ta'sir qilmaydi).
            "remaining": salary - paid["oylik"] - paid["avans"],
        })

    return render_template(
        "hr/list.html",
        rows=rows, year=year, month=month, month_name=UZ_MONTHS[month - 1],
        total_salary=total_salary, total_given=total_given,
        can_manage=has_perm("hr.manage"),
    )


@hr_bp.route("/yangi", methods=["GET", "POST"])
@login_required
@permission_required("hr.manage")
def new_employee():
    managers = User.query.filter_by(role="menejer").order_by(User.username).all()
    if request.method == "POST":
        try:
            data = _employee_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("hr/form.html", employee=None, managers=managers, form=request.form)

        raw_user = (request.form.get("user_id") or "").strip()
        user_id = parse_int(raw_user, "Menejer hisobi", min_value=1) if raw_user else None

        emp = Employee(user_id=user_id, created_by=current_user.id, **data)
        db.session.add(emp)
        db.session.flush()
        log_action(current_user, "create", "employee", emp.id, emp.full_name)
        db.session.commit()
        flash(f"«{emp.full_name}» HR ro'yxatiga qo'shildi.", "success")
        return redirect(url_for("hr.employee_detail", employee_id=emp.id))

    return render_template("hr/form.html", employee=None, managers=managers, form=None)


@hr_bp.route("/<int:employee_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("hr.manage")
def edit_employee(employee_id):
    emp = Employee.query.get_or_404(employee_id)
    managers = User.query.filter_by(role="menejer").order_by(User.username).all()

    if request.method == "POST":
        try:
            data = _employee_form_data(request.form)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("hr/form.html", employee=emp, managers=managers, form=request.form)

        raw_user = (request.form.get("user_id") or "").strip()
        emp.user_id = parse_int(raw_user, "Menejer hisobi", min_value=1) if raw_user else None
        for key, value in data.items():
            setattr(emp, key, value)
        emp.is_active = request.form.get("is_active") == "1"
        log_action(current_user, "update", "employee", emp.id, emp.full_name)
        db.session.commit()
        flash("Xodim ma'lumotlari yangilandi.", "success")
        return redirect(url_for("hr.employee_detail", employee_id=emp.id))

    return render_template("hr/form.html", employee=emp, managers=managers, form=None)


@hr_bp.route("/<int:employee_id>")
@login_required
@permission_required("hr.view")
def employee_detail(employee_id):
    emp = Employee.query.get_or_404(employee_id)
    today = today_local()
    year = request.args.get("year", today.year, type=int)
    if year < 2000 or year > 2100:
        year = today.year

    months = []
    total_salary_year = ZERO
    total_given_year = ZERO
    for m in range(1, 13):
        salary_row = EmployeeSalary.query.filter_by(employee_id=emp.id, year=year, month=m).first()
        salary = to_money(salary_row.amount) if salary_row else ZERO

        start, end = month_bounds(year, m)
        payments = (
            EmployeeAdvance.query.filter(
                EmployeeAdvance.employee_id == emp.id,
                EmployeeAdvance.paid_on >= start, EmployeeAdvance.paid_on < end,
            )
            .order_by(EmployeeAdvance.paid_on.desc(), EmployeeAdvance.id.desc())
            .all()
        )
        paid_oylik = sum((to_money(p.amount) for p in payments if p.kind == PAYMENT_KIND_OYLIK), ZERO)
        paid_avans = sum((to_money(p.amount) for p in payments if p.kind == PAYMENT_KIND_AVANS), ZERO)
        paid_kpi = sum((to_money(p.amount) for p in payments if p.kind == PAYMENT_KIND_KPI), ZERO)
        paid_total = paid_oylik + paid_avans + paid_kpi
        kpi_calc = _kpi_for_employee(emp, year, m)

        total_salary_year += salary
        total_given_year += paid_total
        months.append({
            "month": m, "name": UZ_MONTHS[m - 1],
            "salary": salary, "payments": payments,
            "paid_oylik": paid_oylik, "paid_avans": paid_avans, "paid_kpi": paid_kpi,
            "paid_total": paid_total,
            # Qoldiq — faqat bazaviy oylik hisobidan (Oylik+Avans to'lovlari ayirilib).
            "remaining": salary - paid_oylik - paid_avans,
            "kpi_calc": kpi_calc,
            "kpi_remaining": (kpi_calc - paid_kpi) if kpi_calc is not None else None,
        })

    return render_template(
        "hr/detail.html",
        employee=emp, year=year, months=months, today=today,
        total_salary_year=total_salary_year, total_given_year=total_given_year,
        payment_kinds=PAYMENT_KINDS, payment_kind_labels=PAYMENT_KIND_LABELS,
        can_manage=has_perm("hr.manage"), can_pay=has_perm("hr.pay"),
    )


@hr_bp.route("/<int:employee_id>/oylik", methods=["POST"])
@login_required
@permission_required("hr.manage")
def set_salary(employee_id):
    emp = Employee.query.get_or_404(employee_id)

    try:
        year = parse_int(request.form.get("year"), "Yil", min_value=2000, max_value=2100)
        month = parse_int(request.form.get("month"), "Oy", min_value=1, max_value=12)
        amount = parse_money(request.form.get("amount"), "Oylik summasi", min_value=ZERO)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("hr.employee_detail", employee_id=employee_id))

    salary = EmployeeSalary.query.filter_by(employee_id=emp.id, year=year, month=month).first()
    if salary:
        salary.amount = amount
    else:
        salary = EmployeeSalary(employee_id=emp.id, year=year, month=month, amount=amount)
        db.session.add(salary)

    log_action(current_user, "update", "employee_salary", emp.id,
               f"{emp.full_name}: {year}-{month:02d} oylik {amount}")
    db.session.commit()
    flash(f"{emp.full_name} uchun {UZ_MONTHS[month - 1]} oyi oyligi saqlandi.", "success")
    return redirect(url_for("hr.employee_detail", employee_id=employee_id, year=year))


@hr_bp.route("/<int:employee_id>/avans", methods=["POST"])
@login_required
@permission_required("hr.pay")
def add_advance(employee_id):
    """Ishchiga berilayotgan summa — Oylik / Avans / KPI turkumlaridan biri
    tanlanadi (2026-08-29, foydalanuvchi qarori)."""
    emp = Employee.query.get_or_404(employee_id)

    try:
        kind = request.form.get("kind") or PAYMENT_KIND_AVANS
        if kind not in PAYMENT_KINDS:
            raise ValidationError("Turkum noto'g'ri tanlandi.")
        amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
        paid_on = parse_date(request.form.get("paid_on"), "Sana", required=False) or today_local()
        note = parse_text(request.form.get("note"), "Izoh", required=False, max_length=255)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("hr.employee_detail", employee_id=employee_id))

    if paid_on > today_local():
        flash("Sana kelajakda bo'lishi mumkin emas.", "danger")
        return redirect(url_for("hr.employee_detail", employee_id=employee_id))

    kind_label = PAYMENT_KIND_LABELS[kind]

    # pul chiqdi — umumiy xarajat hisobotida ham ko'rinishi uchun "ish haqi"
    # turkumida Expense yoziladi (ombor kirimi bilan bir xil mantiq)
    expense = Expense(
        category=SALARY_EXPENSE_CATEGORY, amount=amount,
        description=f"{kind_label}: {emp.full_name}" + (f" — {note}" if note else ""),
        date=paid_on, is_paid=True, created_by=current_user.id,
    )
    db.session.add(expense)
    db.session.flush()

    advance = EmployeeAdvance(
        employee_id=emp.id, kind=kind, amount=amount, paid_on=paid_on, note=note,
        expense_id=expense.id, created_by=current_user.id,
    )
    db.session.add(advance)
    log_action(current_user, "create", "employee_advance", emp.id,
               f"{emp.full_name}: {money_str(amount)} so'm ({kind_label})")
    db.session.commit()
    flash(f"{emp.full_name}ga {money_str(amount)} so'm ({kind_label}) yozildi.", "success")
    return redirect(url_for("hr.employee_detail", employee_id=employee_id, year=paid_on.year))


@hr_bp.route("/avans/<int:advance_id>/ochirish", methods=["POST"])
@login_required
@permission_required("hr.pay")
def delete_advance(advance_id):
    advance = EmployeeAdvance.query.get_or_404(advance_id)
    employee_id = advance.employee_id
    year = advance.paid_on.year

    if advance.expense_id:
        expense = db.session.get(Expense, advance.expense_id)
        if expense:
            db.session.delete(expense)

    log_action(current_user, "delete", "employee_advance", employee_id,
               f"{money_str(advance.amount)} so'm ({advance.kind_label}) o'chirildi")
    db.session.delete(advance)
    db.session.commit()
    flash(f"{advance.kind_label} yozuvi o'chirildi.", "success")
    return redirect(url_for("hr.employee_detail", employee_id=employee_id, year=year))


# ---------- pasport nusxasi ----------

@hr_bp.route("/<int:employee_id>/pasport", methods=["POST"])
@login_required
@permission_required("hr.manage")
def upload_passport(employee_id):
    emp = Employee.query.get_or_404(employee_id)
    uploaded = request.files.get("passport")

    if not uploaded or not uploaded.filename:
        flash("Fayl tanlanmagan.", "danger")
        return redirect(url_for("hr.employee_detail", employee_id=employee_id))

    original = uploaded.filename
    ext = os.path.splitext(original)[1].lower()
    if ext not in PASSPORT_EXTENSIONS:
        allowed = ", ".join(sorted(PASSPORT_EXTENSIONS))
        flash(f"Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: {allowed}", "danger")
        return redirect(url_for("hr.employee_detail", employee_id=employee_id))

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)

    # eski pasport nusxasi bo'lsa — yangisi bilan almashtiriladi
    if emp.passport_filename:
        old_path = os.path.join(upload_dir, emp.passport_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    stored_name = f"passport_{uuid.uuid4().hex}{ext}"
    uploaded.save(os.path.join(upload_dir, stored_name))

    emp.passport_filename = stored_name
    emp.passport_original_name = secure_filename(original)[:255] or f"pasport{ext}"
    log_action(current_user, "file_upload", "employee_passport", emp.id, emp.full_name)
    db.session.commit()
    flash("Pasport nusxasi yuklandi.", "success")
    return redirect(url_for("hr.employee_detail", employee_id=employee_id))


@hr_bp.route("/<int:employee_id>/pasport/yuklab-olish")
@login_required
@permission_required("hr.view")
def download_passport(employee_id):
    emp = Employee.query.get_or_404(employee_id)
    if not emp.passport_filename:
        flash("Pasport nusxasi yuklanmagan.", "warning")
        return redirect(url_for("hr.employee_detail", employee_id=employee_id))
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        emp.passport_filename,
        as_attachment=True,
        download_name=emp.passport_original_name or emp.passport_filename,
    )
