"""
Telegram bildirishnomalarini yuborish qatlami.

Barcha funksiyalar "xavfsiz" — Telegram ishlamasa ham asosiy amal
(buyurtma yaratish, to'lov qabul qilish) buzilmaydi.
"""

import logging
from datetime import timedelta

from models import TelegramSettings
import telegram_bot as tg

logger = logging.getLogger(__name__)


def _settings():
    try:
        s = TelegramSettings.get()
        return s if s.is_ready else None
    except Exception:
        return None


def _safe_send(text, silent=False):
    s = _settings()
    if not s:
        return False
    try:
        ok, _ = tg.send_message(s.bot_token, s.manager_chat_id, text, silent=silent)
        return ok
    except Exception as e:
        logger.warning("Telegram xabar yuborishda xato: %s", e)
        return False


def notify_new_order(order):
    s = _settings()
    if not s or not s.notify_new_order:
        return False
    return _safe_send(tg.new_order_message(order))


def notify_payment(order, amount):
    s = _settings()
    if not s or not s.notify_payment:
        return False
    return _safe_send(tg.payment_message(order, amount), silent=True)


def send_daily_summary(force=False):
    """Kunlik xulosa. Kuniga bir marta yuboriladi (takroriy chaqiruvda o'tkazib yuboriladi)."""
    from extensions import db
    from sqlalchemy import func
    from models import Order, Payment, Expense, STATUS_CANCELLED
    from queries import overdue_orders, deadline_orders, top_debtors
    from utils import today_local, to_money

    s = _settings()
    if not s or not s.notify_daily:
        return False, "Telegram sozlanmagan yoki kunlik xulosa o'chirilgan"

    today = today_local()
    if not force and s.last_daily_sent == today:
        return False, "Bugun allaqachon yuborilgan"

    new_orders = Order.query.filter(
        Order.created_at >= today,
        Order.created_at < today + timedelta(days=1),
        Order.is_deleted.is_(False),
    ).count()

    income = to_money(
        db.session.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Order, Payment.order_id == Order.id)
        .filter(Payment.paid_on == today, Order.status != STATUS_CANCELLED,
                Order.is_deleted.is_(False))
        .scalar()
    )
    expenses = to_money(
        db.session.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.date == today).scalar()
    )

    stats = {
        "date": today,
        "new_orders": new_orders,
        "income": income,
        "expenses": expenses,
        "overdue": overdue_orders(today),
        "soon": deadline_orders(today, today + timedelta(days=3)),
        "debtors": top_debtors(limit=5),
    }

    ok = _safe_send(tg.daily_summary_message(stats))
    if ok:
        s.last_daily_sent = today
        db.session.commit()
        return True, "Kunlik xulosa yuborildi"
    return False, "Xabar yuborilmadi"


def send_deadline_reminders():
    """Muddati bugun yoki ertaga tugaydigan buyurtmalar bo'yicha eslatma."""
    from queries import deadline_orders
    from utils import today_local

    s = _settings()
    if not s:
        return False, "Telegram sozlanmagan"

    today = today_local()
    orders = deadline_orders(today, today + timedelta(days=1))
    if not orders:
        return False, "Eslatiladigan buyurtma yo'q"

    ok = _safe_send(tg.deadline_reminder_message(orders))
    return ok, "Eslatma yuborildi" if ok else "Xabar yuborilmadi"
