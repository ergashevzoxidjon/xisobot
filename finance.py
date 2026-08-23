import io
from decimal import Decimal

from flask import (
    Blueprint, render_template, request, redirect, url_for, flash,
    current_app, send_file,
)
from flask_login import login_required, current_user
from sqlalchemy import func

from extensions import db
from models import (
    Expense, Order, Payment, Client, log_action,
    EXPENSE_CATEGORIES, STATUS_CANCELLED, ZERO,
)
from permissions import permission_required
from queries import top_debtors, eager_orders
from utils import (
    ValidationError, parse_money, parse_date, parse_text, parse_choice,
    to_money, today_local, month_bounds, money_str,
)

finance_bp = Blueprint("finance", __name__, url_prefix="/moliya")

UZ_MONTHS = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
]


# ---------- umumiy hisob-kitob funksiyalari ----------

def income_between(start, end):
    """Tushum — AYNAN to'lov sanasi bo'yicha (buyurtma sanasi bo'yicha emas).
    Bekor qilingan buyurtmalar hisobga olinmaydi."""
    total = (
        db.session.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Order, Payment.order_id == Order.id)
        .filter(
            Payment.paid_on >= start,
            Payment.paid_on < end,
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
        )
        .scalar()
    )
    return to_money(total)


def expenses_between(start, end):
    total = (
        db.session.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.date >= start, Expense.date < end)
        .scalar()
    )
    return to_money(total)


def year_rows(year):
    rows = []
    for m in range(1, 13):
        start, end = month_bounds(year, m)
        income = income_between(start, end)
        expense = expenses_between(start, end)
        rows.append({
            "name": UZ_MONTHS[m - 1],
            "month": m,
            "income": income,
            "expense": expense,
            "profit": income - expense,
        })
    return rows


# ---------- xarajatlar ----------

@finance_bp.route("/xarajatlar")
@login_required
@permission_required("expenses.view")
def expenses_list():
    page = request.args.get("page", 1, type=int)
    category = request.args.get("category", "")

    query = Expense.query
    if category and category in EXPENSE_CATEGORIES:
        query = query.filter(Expense.category == category)

    pagination = query.order_by(Expense.date.desc(), Expense.id.desc()).paginate(
        page=page, per_page=current_app.config["PER_PAGE"], error_out=False
    )

    total_query = db.session.query(func.coalesce(func.sum(Expense.amount), 0))
    if category and category in EXPENSE_CATEGORIES:
        total_query = total_query.filter(Expense.category == category)
    total_all = to_money(total_query.scalar())

    return render_template(
        "finance/expenses.html",
        expenses=pagination.items,
        pagination=pagination,
        categories=EXPENSE_CATEGORIES,
        category=category,
        total_all=total_all,
    )


@finance_bp.route("/xarajatlar/yangi", methods=["GET", "POST"])
@login_required
@permission_required("expenses.create")
def new_expense():
    if request.method == "POST":
        try:
            category = parse_choice(request.form.get("category"), "Turkum", EXPENSE_CATEGORIES)
            amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
            exp_date = parse_date(request.form.get("date"), "Sana", required=False) or today_local()
            description = parse_text(request.form.get("description"), "Izoh", required=False, max_length=255)
        except ValidationError as e:
            flash(str(e), "danger")
            return render_template("finance/expense_form.html", categories=EXPENSE_CATEGORIES,
                                   expense=None, form=request.form)

        if exp_date > today_local():
            flash("Xarajat sanasi kelajakda bo'lishi mumkin emas.", "danger")
            return render_template("finance/expense_form.html", categories=EXPENSE_CATEGORIES,
                                   expense=None, form=request.form)

        e = Expense(category=category, amount=amount, description=description,
                    date=exp_date, created_by=current_user.id)
        db.session.add(e)
        db.session.flush()
        log_action(current_user, "create", "expense", e.id, f"{category} — {amount}")
        db.session.commit()
        flash("Xarajat qo'shildi.", "success")
        return redirect(url_for("finance.expenses_list"))

    return render_template("finance/expense_form.html", categories=EXPENSE_CATEGORIES,
                           expense=None, form=None)


@finance_bp.route("/xarajatlar/<int:expense_id>/tahrirlash", methods=["GET", "POST"])
@login_required
@permission_required("expenses.create")
def edit_expense(expense_id):
    e = Expense.query.get_or_404(expense_id)
    if request.method == "POST":
        try:
            e.category = parse_choice(request.form.get("category"), "Turkum", EXPENSE_CATEGORIES)
            e.amount = parse_money(request.form.get("amount"), "Summa", min_value=Decimal("0.01"))
            e.date = parse_date(request.form.get("date"), "Sana", required=False) or e.date
            e.description = parse_text(request.form.get("description"), "Izoh", required=False, max_length=255)
        except ValidationError as err:
            flash(str(err), "danger")
            return render_template("finance/expense_form.html", categories=EXPENSE_CATEGORIES,
                                   expense=e, form=request.form)
        log_action(current_user, "update", "expense", e.id, f"{e.category} — {e.amount}")
        db.session.commit()
        flash("Xarajat yangilandi.", "success")
        return redirect(url_for("finance.expenses_list"))

    return render_template("finance/expense_form.html", categories=EXPENSE_CATEGORIES,
                           expense=e, form=None)


# ---------- moliyaviy hisobot ----------

@finance_bp.route("/hisobot")
@login_required
@permission_required("reports.view")
def report():
    year = request.args.get("year", today_local().year, type=int)
    if year < 2000 or year > 2100:
        year = today_local().year

    months = year_rows(year)
    total_income = sum((m["income"] for m in months), ZERO)
    total_expense = sum((m["expense"] for m in months), ZERO)
    total_profit = total_income - total_expense

    # turkum bo'yicha xarajat taqsimoti
    start, end = date_range_for_year(year)
    by_category = (
        db.session.query(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.date >= start, Expense.date < end)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )
    category_rows = [{"name": c, "amount": to_money(a)} for c, a in by_category]

    return render_template(
        "finance/report.html",
        months=months, year=year,
        total_income=total_income, total_expense=total_expense, total_profit=total_profit,
        category_rows=category_rows,
    )


def date_range_for_year(year):
    from datetime import date
    return date(year, 1, 1), date(year + 1, 1, 1)


# ---------- tahlil ----------

@finance_bp.route("/tahlil")
@login_required
@permission_required("reports.view")
def analytics():
    year = request.args.get("year", today_local().year, type=int)
    start, end = date_range_for_year(year)

    # eng ko'p tushum keltirgan mijozlar
    top_clients = (
        db.session.query(Client.id, Client.name, func.coalesce(func.sum(Payment.amount), 0).label("total"))
        .join(Order, Order.client_id == Client.id)
        .join(Payment, Payment.order_id == Order.id)
        .filter(Payment.paid_on >= start, Payment.paid_on < end,
                Order.status != STATUS_CANCELLED, Order.is_deleted.is_(False))
        .group_by(Client.id, Client.name)
        .order_by(func.sum(Payment.amount).desc())
        .limit(10)
        .all()
    )

    # mahsulot turlari bo'yicha
    top_types = (
        db.session.query(
            Order.order_type,
            func.count(Order.id).label("cnt"),
            func.coalesce(func.sum(Order.total_price), 0).label("total"),
        )
        .filter(Order.created_at >= start, Order.created_at < end,
                Order.status != STATUS_CANCELLED, Order.is_deleted.is_(False))
        .group_by(Order.order_type)
        .order_by(func.sum(Order.total_price).desc())
        .limit(10)
        .all()
    )

    total_orders = Order.query.filter(
        Order.created_at >= start, Order.created_at < end, Order.is_deleted.is_(False)
    ).count()
    cancelled = Order.query.filter(
        Order.created_at >= start, Order.created_at < end,
        Order.status == STATUS_CANCELLED, Order.is_deleted.is_(False)
    ).count()
    countable = total_orders - cancelled

    revenue_sum = to_money(
        db.session.query(func.coalesce(func.sum(Order.total_price), 0))
        .filter(Order.created_at >= start, Order.created_at < end,
                Order.status != STATUS_CANCELLED, Order.is_deleted.is_(False))
        .scalar()
    )
    avg_order = to_money(revenue_sum / countable) if countable else ZERO
    cancel_rate = round(cancelled * 100 / total_orders, 1) if total_orders else 0

    # qarzdor mijozlar — bitta agregat so'rov (avval 5201 ta edi)
    debtors = top_debtors(limit=10)

    return render_template(
        "finance/analytics.html",
        year=year,
        top_clients=[{"name": n, "total": to_money(t)} for _, n, t in top_clients],
        top_types=[{"name": t or "-", "count": c, "total": to_money(s)} for t, c, s in top_types],
        total_orders=total_orders, cancelled=cancelled, cancel_rate=cancel_rate,
        avg_order=avg_order, revenue_sum=revenue_sum,
        debtors=debtors,
    )


# ---------- Excel eksport ----------

@finance_bp.route("/hisobot/excel")
@login_required
@permission_required("reports.export")
def export_report():
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill

    year = request.args.get("year", today_local().year, type=int)
    months = year_rows(year)

    wb = Workbook()
    ws = wb.active
    ws.title = f"{year} moliyaviy hisobot"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="2563EB")

    ws.append([f"{year}-yil moliyaviy hisoboti"])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([])

    headers = ["Oy", "Tushum", "Xarajat", "Foyda"]
    ws.append(headers)
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=3, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    for m in months:
        ws.append([m["name"], float(m["income"]), float(m["expense"]), float(m["profit"])])

    total_income = sum((m["income"] for m in months), ZERO)
    total_expense = sum((m["expense"] for m in months), ZERO)
    ws.append([])
    ws.append(["JAMI", float(total_income), float(total_expense), float(total_income - total_expense)])
    ws.cell(row=ws.max_row, column=1).font = Font(bold=True)

    for col, width in zip("ABCD", (18, 18, 18, 18)):
        ws.column_dimensions[col].width = width
    for row in ws.iter_rows(min_row=4, min_col=2, max_col=4):
        for cell in row:
            cell.number_format = "#,##0.00"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    log_action(current_user, "export", "report", None, f"{year} Excel")
    db.session.commit()
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"moliyaviy_hisobot_{year}.xlsx",
    )


@finance_bp.route("/xarajatlar/excel")
@login_required
@permission_required("reports.export")
def export_expenses():
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill

    expenses = Expense.query.order_by(Expense.date.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Xarajatlar"
    ws.append(["Sana", "Turkum", "Summa", "Izoh", "Kiritgan"])
    for col in range(1, 6):
        cell = ws.cell(row=1, column=col)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="2563EB")

    for e in expenses:
        ws.append([
            e.date.strftime("%d.%m.%Y"),
            e.category,
            float(to_money(e.amount)),
            e.description or "",
            e.creator.display_name if e.creator else "",
        ])

    for col, width in zip("ABCDE", (14, 16, 16, 40, 20)):
        ws.column_dimensions[col].width = width
    for row in ws.iter_rows(min_row=2, min_col=3, max_col=3):
        for cell in row:
            cell.number_format = "#,##0.00"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="xarajatlar.xlsx",
    )


@finance_bp.route("/buyurtmalar/excel")
@login_required
@permission_required("reports.export")
def export_orders():
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill

    # sana oralig'i bo'yicha cheklash (katta bazada xotirani himoya qiladi)
    try:
        date_from = parse_date(request.args.get("from"), "Boshlanish", required=False)
        date_to = parse_date(request.args.get("to"), "Tugash", required=False)
    except ValidationError as e:
        flash(str(e), "danger")
        return redirect(url_for("orders.list_orders"))

    q = Order.query.filter(Order.is_deleted.is_(False))
    if date_from:
        q = q.filter(Order.created_at >= date_from)
    if date_to:
        q = q.filter(Order.created_at < date_to)

    orders = eager_orders(q.order_by(Order.created_at.desc()).limit(20000)).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Buyurtmalar"
    ws.append(["№", "Sana", "Mijoz", "Turi", "Miqdor", "Summa", "To'langan", "Qolgan", "Holat", "Muddat"])
    for col in range(1, 11):
        cell = ws.cell(row=1, column=col)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="2563EB")

    for o in orders:
        ws.append([
            o.order_number,
            o.created_at.strftime("%d.%m.%Y") if o.created_at else "",
            o.client.name if o.client else "",
            o.order_type or "",
            o.quantity,
            float(to_money(o.total_price)),
            float(o.paid_amount_calc),
            float(o.remaining),
            o.status,
            o.deadline.strftime("%d.%m.%Y") if o.deadline else "",
        ])

    for col, width in zip("ABCDEFGHIJ", (14, 12, 26, 18, 10, 16, 16, 16, 14, 12)):
        ws.column_dimensions[col].width = width
    for row in ws.iter_rows(min_row=2, min_col=6, max_col=8):
        for cell in row:
            cell.number_format = "#,##0.00"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="buyurtmalar.xlsx",
    )
