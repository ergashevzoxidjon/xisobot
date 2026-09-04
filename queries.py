"""
Agregat so'rovlar — N+1 muammosini oldini olish uchun.

Model xossalari (`total_debt`, `paid_amount_calc`) bitta yozuv sahifasida
qulay, lekin ro'yxatlarda har bir qator uchun alohida SQL so'rov yuboradi.
Bu yerdagi funksiyalar hammasini BITTA so'rovda hisoblab beradi.
"""

from sqlalchemy import func, case
from sqlalchemy.orm import joinedload, selectinload

from extensions import db
from models import (
    Order, Client, Payment, Material, StockMove,
    Supplier, SupplierPayment, Expense, EmployeeSalary, EmployeeAdvance,
    STATUS_CANCELLED, STATUS_DELIVERED, STOCK_IN,
)
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
    `o.creator` ham shu yerda — ro'yxatda kim yaratganini ko'rsatish uchun
    (2026-08-30, foydalanuvchi qarori).
    `expenses`/`stock_moves` — `o.expenses_total` (xarajat kiritilganmi
    belgisi, ro'yxatda) N+1 qilmasligi uchun (2026-09-05).
    """
    return query.options(
        joinedload(Order.client),
        joinedload(Order.creator),
        selectinload(Order.payments),
        selectinload(Order.items),
        selectinload(Order.expenses),
        selectinload(Order.stock_moves),
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


# ---------- ombor ----------

def stock_per_material_subq():
    """material_id -> joriy qoldiq (kirim minus chiqim)."""
    signed = func.sum(
        case((StockMove.kind == STOCK_IN, StockMove.quantity), else_=-StockMove.quantity)
    )
    return (
        db.session.query(
            StockMove.material_id.label("material_id"),
            func.coalesce(signed, 0).label("qty"),
        )
        .group_by(StockMove.material_id)
        .subquery()
    )


def materials_with_stock(only_active=True, q=""):
    """Mahsulotlar va ularning qoldig'i — bitta so'rovda."""
    stock = stock_per_material_subq()
    query = (
        db.session.query(Material, func.coalesce(stock.c.qty, 0))
        .select_from(Material)
        .outerjoin(stock, stock.c.material_id == Material.id)
    )
    if only_active:
        query = query.filter(Material.is_active.is_(True))
    if q:
        query = query.filter(Material.name.ilike(f"%{q}%"))

    rows = query.order_by(Material.name).all()
    materials = []
    for material, qty in rows:
        material.attach_quantity(qty)
        materials.append(material)
    return materials


# ---------- taminotchilar ----------

def supplier_purchase_subq():
    """supplier_id -> xarid soni, jami summa, qarzga olingan (to'lanmagan) summa."""
    unpaid_amount = case((Expense.is_paid.is_(False), Expense.amount), else_=0)
    return (
        db.session.query(
            Expense.supplier_id.label("supplier_id"),
            func.count(Expense.id).label("purchase_count"),
            func.coalesce(func.sum(Expense.amount), 0).label("purchased"),
            func.coalesce(func.sum(unpaid_amount), 0).label("unpaid"),
        )
        .filter(Expense.supplier_id.isnot(None))
        .group_by(Expense.supplier_id)
        .subquery()
    )


def supplier_paid_subq():
    """supplier_id -> taminotchiga qilingan to'lovlar jami."""
    return (
        db.session.query(
            SupplierPayment.supplier_id.label("supplier_id"),
            func.coalesce(func.sum(SupplierPayment.amount), 0).label("paid"),
        )
        .group_by(SupplierPayment.supplier_id)
        .subquery()
    )


def suppliers_with_stats(q="", only_active=True):
    """Taminotchilar ro'yxati: xarid va qarz — bitta so'rovda."""
    purchases = supplier_purchase_subq()
    paid = supplier_paid_subq()

    query = Supplier.query
    if only_active:
        query = query.filter(Supplier.is_active.is_(True))
    if q:
        query = query.filter(Supplier.name.ilike(f"%{q}%"))

    rows = (
        query.outerjoin(purchases, purchases.c.supplier_id == Supplier.id)
        .outerjoin(paid, paid.c.supplier_id == Supplier.id)
        .add_columns(
            func.coalesce(purchases.c.purchase_count, 0),
            func.coalesce(purchases.c.purchased, 0),
            func.coalesce(purchases.c.unpaid, 0),
            func.coalesce(paid.c.paid, 0),
        )
        .order_by(Supplier.name)
        .all()
    )

    suppliers = []
    for supplier, purchase_count, purchased, unpaid, paid_sum in rows:
        supplier.attach_stats(
            purchase_count=purchase_count or 0,
            purchased=to_money(purchased),
            unpaid=to_money(unpaid),
            paid=to_money(paid_sum),
        )
        suppliers.append(supplier)
    return suppliers


def top_suppliers(limit=5):
    """Eng ko'p savdo qilingan taminotchilar — xarid summasi bo'yicha."""
    purchases = supplier_purchase_subq()
    rows = (
        db.session.query(Supplier, purchases.c.purchased, purchases.c.purchase_count)
        .join(purchases, purchases.c.supplier_id == Supplier.id)
        .filter(Supplier.is_active.is_(True))
        .order_by(purchases.c.purchased.desc())
        .limit(limit)
        .all()
    )
    return [
        {"supplier": s, "purchased": to_money(purchased), "count": count}
        for s, purchased, count in rows
    ]


def total_supplier_debt():
    """Barcha (faol) taminotchilarga jami qarzimiz.

    Har bir taminotchining balansi ALOHIDA nolga qisqartiriladi (avans
    bergan taminotchimiz boshqasiga qarzimizni "yopib" yubormasligi
    uchun) — xuddi suppliers.list_suppliers/finance.supplier_debts dagi
    kabi bir xil mantiq.
    """
    total = ZERO
    for s in suppliers_with_stats(only_active=True):
        total += s.debt
    return total


# ---------- menejerlar ----------

def manager_month_summary(user_id, start, end):
    """Bitta menejer uchun: shu oy davomida ishlagan mijozlari soni,
    buyurtmalar summasi va soni — bitta so'rovda."""
    row = (
        db.session.query(
            func.count(func.distinct(Order.client_id)),
            func.coalesce(func.sum(Order.total_price), 0),
            func.count(Order.id),
        )
        .filter(
            Order.created_by == user_id,
            Order.created_at >= start,
            Order.created_at < end,
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
        )
        .one()
    )
    clients_count, total_sum, order_count = row
    return {
        "clients_count": clients_count or 0,
        "total_sum": to_money(total_sum),
        "order_count": order_count or 0,
    }


def all_managers_month_summary(start, end):
    """Har bir menejer (created_by) uchun shu oydagi statistika — bitta so'rov.

    user_id -> {clients_count, total_sum} lug'atini qaytaradi.
    """
    rows = (
        db.session.query(
            Order.created_by,
            func.count(func.distinct(Order.client_id)),
            func.coalesce(func.sum(Order.total_price), 0),
        )
        .filter(
            Order.created_at >= start,
            Order.created_at < end,
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
            Order.created_by.isnot(None),
        )
        .group_by(Order.created_by)
        .all()
    )
    return {
        user_id: {"clients_count": count or 0, "total_sum": to_money(total)}
        for user_id, count, total in rows
    }


def all_managers_total_clients():
    """Har bir menejer bugungi kungacha jami nechta mijoz bilan ishlaganini
    (bekor qilinmagan buyurtmalar bo'yicha, hamma vaqt kesimida) qaytaradi."""
    rows = (
        db.session.query(Order.created_by, func.count(func.distinct(Order.client_id)))
        .filter(
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
            Order.created_by.isnot(None),
        )
        .group_by(Order.created_by)
        .all()
    )
    return {user_id: count or 0 for user_id, count in rows}


# ---------- HR ----------

def employees_month_salary_totals(year, month):
    """Har bir xodim uchun shu oy uchun belgilangan oylik — bitta so'rov."""
    rows = (
        db.session.query(EmployeeSalary.employee_id, EmployeeSalary.amount)
        .filter(EmployeeSalary.year == year, EmployeeSalary.month == month)
        .all()
    )
    return {employee_id: to_money(amount) for employee_id, amount in rows}


def employees_month_advance_totals(start, end):
    """Har bir xodim uchun shu oy davomida berilgan JAMI summa (barcha turkumlar) — bitta so'rov."""
    rows = (
        db.session.query(
            EmployeeAdvance.employee_id,
            func.coalesce(func.sum(EmployeeAdvance.amount), 0),
        )
        .filter(EmployeeAdvance.paid_on >= start, EmployeeAdvance.paid_on < end)
        .group_by(EmployeeAdvance.employee_id)
        .all()
    )
    return {employee_id: to_money(total) for employee_id, total in rows}


def employees_month_payment_totals(start, end):
    """Har bir xodim uchun shu oy davomida TURKUM bo'yicha (oylik/avans/kpi)
    berilgan summalar — bitta so'rov. Natija:
    {employee_id: {"oylik": Decimal, "avans": Decimal, "kpi": Decimal, "jami": Decimal}}
    """
    rows = (
        db.session.query(
            EmployeeAdvance.employee_id,
            EmployeeAdvance.kind,
            func.coalesce(func.sum(EmployeeAdvance.amount), 0),
        )
        .filter(EmployeeAdvance.paid_on >= start, EmployeeAdvance.paid_on < end)
        .group_by(EmployeeAdvance.employee_id, EmployeeAdvance.kind)
        .all()
    )
    out = {}
    for employee_id, kind, total in rows:
        entry = out.setdefault(employee_id, {"oylik": ZERO, "avans": ZERO, "kpi": ZERO})
        if kind in entry:
            entry[kind] = to_money(total)
    for entry in out.values():
        entry["jami"] = entry["oylik"] + entry["avans"] + entry["kpi"]
    return out
