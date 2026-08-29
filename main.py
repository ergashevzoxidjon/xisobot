from datetime import timedelta

from flask import Blueprint, render_template
from flask_login import login_required, current_user
from sqlalchemy import func

from extensions import db
from models import Order, Client, Expense, Payment, ACTIVE_STATUSES, STATUS_CANCELLED, ZERO
from permissions import has_perm
from queries import (
    eager_orders, overdue_orders, deadline_orders, old_debt_orders, total_supplier_debt,
)
from utils import today_local, month_bounds, to_money

main_bp = Blueprint("main", __name__)

OVERDUE_DEBT_DAYS = 30
DEADLINE_SOON_DAYS = 3


@main_bp.route("/")
@login_required
def dashboard():
    # Endi barcha rollar shu sahifaga tushadi (2026-08-29, foydalanuvchi
    # qarori) — moliyaviy va "diqqat talab qiladi" qismlari shablonda
    # has_perm/rol bo'yicha yashiriladi, ruxsat bo'lmagan foydalanuvchi
    # bu yerdan chetlatilmaydi.
    today = today_local()
    month_start, month_end = month_bounds(today.year, today.month)

    # o'tgan oy — taqqoslash uchun
    if today.month == 1:
        prev_start, prev_end = month_bounds(today.year - 1, 12)
    else:
        prev_start, prev_end = month_bounds(today.year, today.month - 1)

    def income(start, end):
        return to_money(
            db.session.query(func.coalesce(func.sum(Payment.amount), 0))
            .join(Order, Payment.order_id == Order.id)
            .filter(Payment.paid_on >= start, Payment.paid_on < end,
                    Order.status != STATUS_CANCELLED, Order.is_deleted.is_(False))
            .scalar()
        )

    def expenses(start, end):
        return to_money(
            db.session.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(Expense.date >= start, Expense.date < end).scalar()
        )

    # Moliyaviy figuralar — faqat reports.view bo'lganlarga (shablonda ham
    # yashiriladi, lekin bekorga so'rov yubormaslik uchun shu yerda ham
    # o'tkazib yuboriladi). Menejer bu qismni ko'rmaydi (2026-08-29).
    month_income = month_expenses = month_profit = ZERO
    profit_change = None
    supplier_debt = ZERO
    if has_perm("reports.view"):
        month_income = income(month_start, month_end)
        month_expenses = expenses(month_start, month_end)
        month_profit = month_income - month_expenses

        prev_profit = income(prev_start, prev_end) - expenses(prev_start, prev_end)
        if prev_profit != ZERO:
            profit_change = round(float((month_profit - prev_profit) / abs(prev_profit) * 100), 1)

        supplier_debt = total_supplier_debt()

    total_orders = Order.query.filter(
        Order.status != STATUS_CANCELLED, Order.is_deleted.is_(False)
    ).count()
    active_orders = Order.query.filter(
        Order.status.in_(ACTIVE_STATUSES), Order.is_deleted.is_(False)
    ).count()
    total_clients = Client.query.filter(Client.is_deleted.is_(False)).count()

    # ---- diqqat talab qiladigan holatlar (faqat admin ko'radi) ----
    overdue_list, soon_list, old_debts = [], [], []
    alerts_count = 0
    if current_user.role == "admin":
        overdue_list = overdue_orders(today)
        soon_list = deadline_orders(today, today + timedelta(days=DEADLINE_SOON_DAYS))
        old_debts = old_debt_orders(today - timedelta(days=OVERDUE_DEBT_DAYS))
        alerts_count = len(overdue_list) + len(soon_list) + len(old_debts)

    recent_orders = eager_orders(
        Order.query.filter(Order.is_deleted.is_(False))
        .order_by(Order.created_at.desc()).limit(8)
    ).all()

    return render_template(
        "dashboard.html",
        total_orders=total_orders,
        active_orders=active_orders,
        total_clients=total_clients,
        month_income=month_income,
        month_expenses=month_expenses,
        month_profit=month_profit,
        profit_change=profit_change,
        overdue_orders=overdue_list,
        soon_orders=soon_list,
        old_debts=old_debts,
        alerts_count=alerts_count,
        recent_orders=recent_orders,
        overdue_debt_days=OVERDUE_DEBT_DAYS,
        supplier_debt=supplier_debt,
    )
