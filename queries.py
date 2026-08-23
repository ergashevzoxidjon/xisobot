"""
Agregat so'rovlar — N+1 muammosini oldini olish uchun.

Model xossalari (`total_debt`, `paid_amount_calc`) bitta yozuv sahifasida
qulay, lekin ro'yxatlarda har bir qator uchun alohida SQL so'rov yuboradi.
Bu yerdagi funksiyalar hammasini BITTA so'rovda hisoblab beradi.
"""

from sqlalchemy import func, case
from sqlalchemy.orm import joinedload, selectinload

from extensions import db
from models import Order, Client, Payment, STATUS_CANCELLED, STATUS_DELIVERED
from utils import to_money, ZERO


def paid_per_order_subq():
    """order_id -> to'langan jami summa."""
    return (
        db.session.query(
            Payment.order_id.label("order_id"),
            func.coalesce(func.sum(Payment.amount), 0).label("paid"),
        )
        .group_by(Payment.order_id)
        .subquery()
    )


def eager_orders(query):
    """Buyurtmalar ro'yxati uchun: mijoz va to'lovlarni oldindan yuklaydi.

    51 ta so'rov o'rniga 3 ta (buyurtmalar + mijozlar + to'lovlar).
    Shablondagi `o.client.name`, `o.paid_amount_calc` o'zgarishsiz ishlaydi.
    """
    return query.options(
        joinedload(Order.client),
        selectinload(Order.payments),
    )


def clients_with_stats(query):
    """Mijozlar ro'yxati uchun statistikani BITTA so'rovda hisoblaydi.

    326 ta so'rov o'rniga 1 ta.
    Natija: Client obyektlariga statistika biriktirib qaytariladi.
    """
    paid = paid_per_order_subq()

    rows = (
        query.outerjoin(
            Order,
            db.and_(Order.client_id == Client.id,
                    Order.status != STATUS_CANCELLED,
                    Order.is_deleted.is_(False)),
        )
        .outerjoin(paid, paid.c.order_id == Order.id)
        .add_columns(
            func.count(func.distinct(Order.id)).label("orders_count"),
            func.coalesce(func.sum(Order.total_price), 0).label("ordered"),
            func.coalesce(func.sum(paid.c.paid), 0).label("paid"),
        )
        .group_by(Client.id)
        .all()
    )

    clients = []
    for client, orders_count, ordered, paid_sum in rows:
        client.attach_stats(
            orders_count=orders_count or 0,
            total_ordered=to_money(ordered),
            total_paid=to_money(paid_sum),
        )
        clients.append(client)
    return clients


def top_debtors(limit=10):
    """Eng katta qarzdorlar — bitta agregat so'rov."""
    paid = paid_per_order_subq()
    debt = func.coalesce(func.sum(Order.total_price), 0) - func.coalesce(func.sum(paid.c.paid), 0)

    rows = (
        db.session.query(Client, debt.label("debt"))
        .join(Order, db.and_(Order.client_id == Client.id,
                             Order.status != STATUS_CANCELLED,
                             Order.is_deleted.is_(False)))
        .outerjoin(paid, paid.c.order_id == Order.id)
        .group_by(Client.id)
        .having(debt > 0)
        .order_by(debt.desc())
        .limit(limit)
        .all()
    )
    return [{"client": c, "debt": to_money(d)} for c, d in rows]


def old_debt_orders(cutoff_date, limit=10):
    """Belgilangan sanadan eski, hali to'liq to'lanmagan buyurtmalar."""
    paid = paid_per_order_subq()
    remaining = Order.total_price - func.coalesce(paid.c.paid, 0)

    rows = (
        db.session.query(Order, remaining.label("remaining"))
        .options(joinedload(Order.client))
        .select_from(Order)
        .outerjoin(paid, paid.c.order_id == Order.id)
        .filter(
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
            Order.created_at < cutoff_date,
            remaining > 0,
        )
        .order_by(Order.created_at)
        .limit(limit)
        .all()
    )

    orders = []
    for order, rem in rows:
        order.attach_paid(to_money(order.total_price) - to_money(rem))
        orders.append(order)
    return orders


def deadline_orders(start, end, limit=10):
    """Muddati berilgan oraliqda tugaydigan, yakunlanmagan buyurtmalar."""
    return (
        Order.query.options(joinedload(Order.client))
        .filter(
            Order.deadline >= start,
            Order.deadline <= end,
            Order.is_deleted.is_(False),
            Order.status.notin_([STATUS_DELIVERED, STATUS_CANCELLED]),
        )
        .order_by(Order.deadline)
        .limit(limit)
        .all()
    )


def overdue_orders(today, limit=10):
    return (
        Order.query.options(joinedload(Order.client))
        .filter(
            Order.deadline < today,
            Order.is_deleted.is_(False),
            Order.status.notin_([STATUS_DELIVERED, STATUS_CANCELLED]),
        )
        .order_by(Order.deadline)
        .limit(limit)
        .all()
    )


def client_totals(client_id):
    """Bitta mijozning jami ko'rsatkichlari — bitta so'rov."""
    paid = paid_per_order_subq()
    row = (
        db.session.query(
            func.coalesce(func.sum(Order.total_price), 0),
            func.coalesce(func.sum(paid.c.paid), 0),
        )
        .select_from(Order)
        .outerjoin(paid, paid.c.order_id == Order.id)
        .filter(Order.client_id == client_id, Order.status != STATUS_CANCELLED,
                Order.is_deleted.is_(False))
        .one()
    )
    ordered, paid_sum = to_money(row[0]), to_money(row[1])
    return ordered, paid_sum, ordered - paid_sum
