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
    CashHandover, HANDOVER_CONFIRMED, HANDOVER_CHANNEL_CASH, HANDOVER_CHANNEL_CARD,
    CashDeposit,
    CASH_SOURCE_OFFICE, CASH_SOURCE_OWNER,
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
    buyurtmalar soni va — KPI uchun — TO'LANGAN summa (bitta so'rovda).

    `total_sum` endi buyurtma summasi emas, `Payment.amount` yig'indisi,
    `Payment.paid_on` shu oy ichida bo'lganlar bo'yicha (2026-09-07,
    foydalanuvchi qarori — "KPI faqat aplata bo'lgan summani hisoblashi
    kerak", hozirgi to'lov qilinmagan buyurtmalar ham hisoblanib ketardi).
    Bu — loyihaning umumiy qoidasiga mos: tushum to'lov sanasi bo'yicha
    hisoblanadi, buyurtma sanasi bo'yicha emas.
    """
    clients_count, order_count = (
        db.session.query(
            func.count(func.distinct(Order.client_id)),
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
    paid_sum = (
        db.session.query(func.coalesce(func.sum(Payment.amount), 0))
        .select_from(Payment)
        .join(Order, Order.id == Payment.order_id)
        .filter(
            Order.created_by == user_id,
            Payment.paid_on >= start,
            Payment.paid_on < end,
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
        )
        .scalar()
    )
    return {
        "clients_count": clients_count or 0,
        "total_sum": to_money(paid_sum),
        "order_count": order_count or 0,
    }


def all_managers_month_summary(start, end):
    """Har bir menejer (created_by) uchun shu oydagi statistika — bitta so'rov.

    `total_sum` — shu oyda TO'LANGAN summa (`Payment.paid_on` bo'yicha),
    buyurtma summasi emas (2026-09-07, foydalanuvchi qarori — KPI faqat
    aplata bo'lgan summadan hisoblansin). `clients_count` — shu oyda
    yaratilgan buyurtmalar bo'yicha (faoliyat ko'rsatkichi, pulga bog'liq
    emas — o'zgarmadi).

    user_id -> {clients_count, total_sum} lug'atini qaytaradi.
    """
    client_rows = (
        db.session.query(
            Order.created_by,
            func.count(func.distinct(Order.client_id)),
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
    paid_rows = (
        db.session.query(
            Order.created_by,
            func.coalesce(func.sum(Payment.amount), 0),
        )
        .select_from(Payment)
        .join(Order, Order.id == Payment.order_id)
        .filter(
            Payment.paid_on >= start,
            Payment.paid_on < end,
            Order.status != STATUS_CANCELLED,
            Order.is_deleted.is_(False),
            Order.created_by.isnot(None),
        )
        .group_by(Order.created_by)
        .all()
    )

    result = {
        user_id: {"clients_count": count or 0, "total_sum": ZERO}
        for user_id, count in client_rows
    }
    for user_id, total in paid_rows:
        result.setdefault(user_id, {"clients_count": 0, "total_sum": ZERO})
        result[user_id]["total_sum"] = to_money(total)
    return result


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


# ---------- "Pullar" — naqd/karta pul topshirish (2026-09-07/08) ----------

def cash_spent_subq():
    """to_user_id (xarajatchi) -> shu foydalanuvchi O'Z qo'lidagi (o'ziga
    topshirilgan) naqd puldan qilgan xarajatlari jami.

    cash_source to'ldirilgan (OFIS/Zoxidjon zaxirasidan qoplangan) xarajatlar
    bu yerga kirmaydi — chunki u pul xarajatchining o'z qo'lidan emas,
    umumiy zaxiradan chiqqan va uning shaxsiy naqd qoldig'iga ta'sir
    qilmasligi kerak (2026-09-07, foydalanuvchi qarori)."""
    return (
        db.session.query(
            Expense.created_by.label("user_id"),
            func.coalesce(func.sum(Expense.amount), 0).label("spent"),
        )
        .filter(Expense.payment_method == "naqd", Expense.is_paid.is_(True),
                Expense.cash_source.is_(None))
        .group_by(Expense.created_by)
        .subquery()
    )


def handover_received_subq(channel):
    """to_user_id -> shu foydalanuvchiga tasdiqlangan (qabul qilingan)
    topshiriqlar jami, faqat shu KANAL (naqd/karta) bo'yicha."""
    return (
        db.session.query(
            CashHandover.to_user_id.label("user_id"),
            func.coalesce(func.sum(CashHandover.amount), 0).label("received"),
        )
        .filter(CashHandover.status == HANDOVER_CONFIRMED, CashHandover.channel == channel)
        .group_by(CashHandover.to_user_id)
        .subquery()
    )


def cash_received_subq():
    return handover_received_subq(HANDOVER_CHANNEL_CASH)


def cash_balances():
    """Har bir ish boshqaruvchi (xarajatchi) uchun joriy naqd qoldiq:
    qabul qilingan topshiriqlar jami minus naqd xarajatlar jami.

    user_id -> Decimal balans lug'atini qaytaradi (faqat kamida bitta
    tasdiqlangan topshirig'i bo'lgan foydalanuvchilar uchun).
    """
    received = cash_received_subq()
    spent = cash_spent_subq()
    rows = (
        db.session.query(
            received.c.user_id,
            received.c.received,
            func.coalesce(spent.c.spent, 0),
        )
        .select_from(received)
        .outerjoin(spent, spent.c.user_id == received.c.user_id)
        .all()
    )
    return {
        user_id: to_money(received_amt) - to_money(spent_amt)
        for user_id, received_amt, spent_amt in rows
    }


def cash_balance(user_id):
    """Bitta xarajatchi uchun joriy naqd qoldiq (qabul qilingan minus
    sarflangan — hozir qo'lida qolgan summa)."""
    return cash_balances().get(user_id, ZERO)


def cash_received(user_id):
    """Bitta xarajatchiga BUTUN TARIX bo'yicha jami qabul qilingan naqd pul
    (bruto — hali sarflanganini ayirmasdan). "Jami qabul qilingan naqd
    pul" kartochkasi uchun (2026-09-07)."""
    received = cash_received_subq()
    row = (
        db.session.query(received.c.received)
        .filter(received.c.user_id == user_id)
        .first()
    )
    return to_money(row[0]) if row else ZERO


def total_order_cash_on_hand():
    """Barcha ish boshqaruvchilar qo'lidagi jami naqd qoldiq (kompaniya
    bo'yicha)."""
    return sum(cash_balances().values(), ZERO)


# ---- karta (boshliqning shaxsiy kartasi) — 2026-09-08, foydalanuvchi qarori ----
# Hozircha kartadan sarflash mexanizmi yo'q (boshliq ombor kirimiga
# kirmaydi), shuning uchun "qoldiq" = "jami qabul qilingan". Struktura
# naqddagi bilan bir xil — kelajakda kartadan sarflash qo'shilsa,
# card_balances() shunga moslab kengaytiriladi.

def card_received_subq():
    return handover_received_subq(HANDOVER_CHANNEL_CARD)


def card_received(user_id):
    """Bitta boshliqqa BUTUN TARIX bo'yicha jami qabul qilingan karta puli."""
    received = card_received_subq()
    row = (
        db.session.query(received.c.received)
        .filter(received.c.user_id == user_id)
        .first()
    )
    return to_money(row[0]) if row else ZERO


def card_balances():
    """Har bir boshliq uchun joriy karta qoldig'i (hozircha = qabul
    qilingan jami, sarflash mexanizmi qo'shilmagan)."""
    received = card_received_subq()
    rows = db.session.query(received.c.user_id, received.c.received).all()
    return {user_id: to_money(amount) for user_id, amount in rows}


def card_balance(user_id):
    return card_balances().get(user_id, ZERO)


def total_confirmed_handover_amount(channel):
    """Kompaniya bo'yicha jami tasdiqlangan topshiriq summasi (kimga
    tayinlanganidan qat'i nazar — tayinlanmagan, lekin admin tasdiqlagan
    topshiriqlar ham hisobga kiradi). "Jami kartaga tushgan pul" kabi
    umumiy kartochkalar uchun (2026-09-08)."""
    return to_money(
        db.session.query(func.coalesce(func.sum(CashHandover.amount), 0))
        .filter(CashHandover.status == HANDOVER_CONFIRMED, CashHandover.channel == channel)
        .scalar()
    )


def cash_source_totals():
    """CASH_SOURCE_OFFICE/CASH_SOURCE_OWNER dan har biriga qancha naqd
    xarajat qilinganini qaytaradi (jami, butun tarix bo'yicha).

    Bu — faqat xarajatni qoplash uchun sarflangan summa (balans emas).
    OFIS uchun balansni `office_balance()` bilan hisoblang — u shu
    summani `office_deposited_total()`dan ayiradi (2026-09-08)."""
    rows = (
        db.session.query(
            Expense.cash_source,
            func.coalesce(func.sum(Expense.amount), 0),
        )
        .filter(Expense.cash_source.in_([CASH_SOURCE_OFFICE, CASH_SOURCE_OWNER]),
                Expense.is_paid.is_(True))
        .group_by(Expense.cash_source)
        .all()
    )
    totals = {CASH_SOURCE_OFFICE: ZERO, CASH_SOURCE_OWNER: ZERO}
    for source, amount in rows:
        totals[source] = to_money(amount)
    return totals


# ---- OFIS zaxirasini to'ldirish — 2026-09-08, foydalanuvchi qarori ----

def office_deposited_total():
    """Boshliq tomonidan OFIS zaxirasiga BUTUN TARIX bo'yicha kiritilgan
    jami summa."""
    return to_money(
        db.session.query(func.coalesce(func.sum(CashDeposit.amount), 0)).scalar()
    )


def office_balance():
    """OFIS zaxirasining joriy qoldig'i: kiritilgan jami minus shu
    manbadan qilingan xarajatlar jami. Manfiy bo'lishi mumkin — bu holda
    OFIS "qarzga" ishlagan (xarajat kiritilganidan ko'proq sarflangan)."""
    return office_deposited_total() - cash_source_totals()[CASH_SOURCE_OFFICE]
