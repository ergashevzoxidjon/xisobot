"""
Moliyaviy hisob-kitob mantig'ini isbotlash.

Ssenariy: YANVARDA buyurtma olindi, pul MARTDA to'landi.
  - Eski mantiq (buyurtma sanasi bo'yicha) -> pulni YANVARGA yozadi  [XATO]
  - Yangi mantiq (to'lov sanasi bo'yicha)  -> pulni MARTGA yozadi    [TO'G'RI]

Shuningdek bekor qilingan buyurtma hisobga olinmasligini tekshiramiz.
"""
import sqlite3
import sys
from decimal import Decimal

con = sqlite3.connect(":memory:")
cur = con.cursor()

cur.executescript("""
CREATE TABLE "order" (
    id INTEGER PRIMARY KEY,
    order_number TEXT,
    status TEXT,
    total_price NUMERIC,
    paid_amount NUMERIC,          -- ESKI usul
    created_at TEXT
);
CREATE TABLE payment (
    id INTEGER PRIMARY KEY,
    order_id INTEGER,
    amount NUMERIC,
    paid_on TEXT                  -- YANGI usul
);
""")

# Buyurtma 1: 15-yanvarda olindi, 10-martda to'liq to'landi
cur.execute("INSERT INTO \"order\" VALUES (1,'B-2026-0001','yetkazildi',10000000,10000000,'2026-01-15 10:00:00')")
cur.execute("INSERT INTO payment VALUES (1,1,10000000,'2026-03-10')")

# Buyurtma 2: 5-martda olindi, o'sha kuni to'landi
cur.execute("INSERT INTO \"order\" VALUES (2,'B-2026-0002','yetkazildi',5000000,5000000,'2026-03-05 10:00:00')")
cur.execute("INSERT INTO payment VALUES (2,2,5000000,'2026-03-05')")

# Buyurtma 3: 20-yanvarda olindi, BEKOR QILINDI (to'lov yo'q)
cur.execute("INSERT INTO \"order\" VALUES (3,'B-2026-0003','bekor qilindi',8000000,0,'2026-01-20 10:00:00')")

# Buyurtma 4: 25-yanvarda olindi, qisman to'lov 3-fevralda
cur.execute("INSERT INTO \"order\" VALUES (4,'B-2026-0004','jarayonda',4000000,1000000,'2026-01-25 10:00:00')")
cur.execute("INSERT INTO payment VALUES (3,4,1000000,'2026-02-03')")

con.commit()


def old_income(start, end):
    """ESKI: order.paid_amount, order.created_at bo'yicha filtr"""
    r = cur.execute(
        'SELECT COALESCE(SUM(paid_amount),0) FROM "order" WHERE created_at >= ? AND created_at < ?',
        (start, end),
    ).fetchone()[0]
    return Decimal(str(r))


def new_income(start, end):
    """YANGI: payment.amount, payment.paid_on bo'yicha filtr, bekor qilinganlarsiz"""
    r = cur.execute("""
        SELECT COALESCE(SUM(p.amount),0) FROM payment p
        JOIN "order" o ON p.order_id = o.id
        WHERE p.paid_on >= ? AND p.paid_on < ? AND o.status != 'bekor qilindi'
    """, (start, end)).fetchone()[0]
    return Decimal(str(r))


months = [
    ("Yanvar", "2026-01-01", "2026-02-01"),
    ("Fevral", "2026-02-01", "2026-03-01"),
    ("Mart",   "2026-03-01", "2026-04-01"),
]

print("Ssenariy:")
print("  · B-0001: yanvarda olingan, 10 mln MARTDA to'langan")
print("  · B-0002: martda olingan, 5 mln martda to'langan")
print("  · B-0003: yanvarda olingan, BEKOR QILINDI")
print("  · B-0004: yanvarda olingan, 1 mln FEVRALDA to'langan")
print()
print(f"{'Oy':<10} {'ESKI mantiq':>18} {'YANGI mantiq':>18}   Izoh")
print("-" * 76)

expected = {
    "Yanvar": Decimal("0"),
    "Fevral": Decimal("1000000"),
    "Mart": Decimal("15000000"),
}

fails = []
for name, start, end in months:
    old = old_income(start, end)
    new = new_income(start, end)
    mark = ""
    if old != new:
        mark = "  <- farq bor"
    print(f"{name:<10} {old:>18,} {new:>18,}{mark}")
    if new != expected[name]:
        fails.append(f"{name}: kutilgan {expected[name]}, olingan {new}")

print("-" * 76)
total_old = sum(old_income(s, e) for _, s, e in months)
total_new = sum(new_income(s, e) for _, s, e in months)
print(f"{'JAMI':<10} {total_old:>18,} {total_new:>18,}")

print()
print("Tekshiruv:")
print(f"  Yanvar tushumi 0 bo'lishi kerak (pul yanvarda kelmagan)  -> {new_income('2026-01-01','2026-02-01'):,}")
print(f"  Mart tushumi 15 mln bo'lishi kerak (10 + 5)              -> {new_income('2026-03-01','2026-04-01'):,}")
print(f"  Bekor qilingan B-0003 hech qayerda hisoblanmasligi kerak -> jami {total_new:,} (8 mln kirmagan)")

print()
if fails:
    print("XATOLAR:")
    for f in fails:
        print("  -", f)
    sys.exit(1)

if old_income("2026-01-01", "2026-02-01") == Decimal("11000000"):
    print("Eski mantiq yanvarga 11 mln yozgan bo'lardi — bu XATO edi, endi tuzatildi.")

print("MOLIYAVIY MANTIQ TESTI MUVAFFAQIYATLI")
