"""Ombor kirimi: perechisleniyeda to'langan summani shu yerning o'zida kiritish
(2026-11-17, foydalanuvchi so'rovi).

  1. Summa kiritilmasa yoki jamiga teng bo'lsa — avvalgidek, butun summa to'langan.
  2. Jamidan kam bo'lsa — to'langan qismi perechisleniye (tashkilot bo'yicha),
     qolgani taminotchiga qarz; chegaradagi qator ikkiga bo'linadi.
  3. Noto'g'ri summa (jamidan ko'p, 0) rad etiladi, hech narsa yozilmaydi.
  4. Boshqa to'lov usullarida (naqd) summa maydoni e'tiborga olinmaydi.
  5. Tezkor kirim (xarajat formasidagi oyna) ham xuddi shunday ishlaydi.
  6. Formalarda maydon bor.
"""
import html
import os
import sys
import tempfile
from decimal import Decimal

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, APP)
os.environ["SECRET_KEY"] = "test-secret"

fails = []


def check(label, cond):
    print(f"  {'OK  ' if cond else 'FAIL'} {label}")
    if not cond:
        fails.append(label)


db_fd, db_path = tempfile.mkstemp(suffix=".sqlite")
os.close(db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from sqlalchemy import func
from app import create_app
from extensions import db
from models import User, Supplier, Material, Expense, StockMove, PAYMENT_TRANSFER

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()
    u = User(username="xar1", full_name="Xar", role="xarajatchi", is_active_user=True)
    u.set_password("parol123")
    db.session.add(u)
    db.session.commit()

MARVEL, MYPRINT = "Marvel Creative MChJ", "MyPrint MChJ"


def text(r):
    return html.unescape(r.data.decode()).replace("\xa0", " ")


def receive(c, supplier, rows, method="perechisleniye", via=MARVEL, paid=None, url="/ombor/kirim"):
    data = {"supplier_name": supplier, "payment_method": method, "row_material_name": [],
            "row_unit": [], "row_quantity": [], "row_price": []}
    for name, qty, price in rows:
        data["row_material_name"].append(name)
        data["row_unit"].append("dona")
        data["row_quantity"].append(str(qty))
        data["row_price"].append(str(price))
    if via:
        data["paid_via"] = via
    if paid is not None:
        data["paid_amount"] = str(paid)
    return c.post(url, data=data, follow_redirects=True)


def stats(supplier_name):
    with app.app_context():
        s = Supplier.query.filter_by(name=supplier_name).first()
        if s is None:
            return None
        exps = Expense.query.filter_by(supplier_id=s.id).all()
        return {
            "debt": s.debt,
            "n": len(exps),
            "paid": sum((e.amount for e in exps if e.is_paid), Decimal("0")),
            "unpaid": sum((e.amount for e in exps if not e.is_paid), Decimal("0")),
            "transfer_via": {e.paid_via for e in exps if e.is_paid and e.payment_method == PAYMENT_TRANSFER},
            "unpaid_have_via": any(e.paid_via or e.payment_method for e in exps if not e.is_paid),
        }


def moves_in():
    with app.app_context():
        return StockMove.query.count()


def qty(name):
    with app.app_context():
        return Material.query.filter_by(name=name).one().quantity


with app.test_client() as c:
    c.post("/login", data={"username": "xar1", "password": "parol123"})

    print("\n=== 1. Summa kiritilmasa / jamiga teng bo'lsa — to'liq to'langan ===")
    r = receive(c, "Taminotchi A", [("Qog'oz-A", 10, 5000)])
    st = stats("Taminotchi A")
    check("Summasiz: butun 50 000 to'langan, qarz yo'q",
          st["paid"] == Decimal("50000.00") and st["debt"] == Decimal("0") and st["n"] == 1)
    check("Xabar: perechisleniye qilindi", "perechisleniye qilindi" in text(r) and "qarzga yozildi" not in text(r))
    r = receive(c, "Taminotchi B", [("Qog'oz-B", 10, 5000)], paid=50000)
    st = stats("Taminotchi B")
    check("Jamiga teng summa: butun to'langan, qarz yo'q",
          st["paid"] == Decimal("50000.00") and st["debt"] == Decimal("0") and st["n"] == 1)

    print("\n=== 2. Qisman to'lov: qolgani qarz ===")
    # A qator 2 × 50 000 = 100 000, B qator 60 000; jami 160 000; to'landi 130 000
    r = receive(c, "Taminotchi C", [("Plyonka-C", 2, 50000), ("Bo'yoq-C", 3, 20000)], paid=130000)
    body = text(r)
    st = stats("Taminotchi C")
    check("To'langan 130 000, qarz 30 000", st["paid"] == Decimal("130000.00") and st["unpaid"] == Decimal("30000.00"))
    check("Taminotchi qarzi 30 000", st["debt"] == Decimal("30000.00"))
    check("Chegaradagi qator ikkiga bo'lindi (jami 3 ta xarajat yozuvi)", st["n"] == 3)
    check("To'langan qism tashkilot (Marvel) bo'yicha perechisleniye", st["transfer_via"] == {MARVEL})
    check("Qarz qismida tashkilot/usul yo'q", not st["unpaid_have_via"])
    check("Xabar: 130 000 perechisleniye, 30 000 qarzga yozildi",
          "130 000" in body and "30 000" in body and "qarzga yozildi" in body)
    check("Ombor to'liq kirim bo'ldi (2 va 3 dona)", qty("Plyonka-C") == Decimal("2") and qty("Bo'yoq-C") == Decimal("3"))
    with app.app_context():
        total_exp = db.session.query(func.sum(Expense.amount)).filter(
            Expense.supplier_id == Supplier.query.filter_by(name="Taminotchi C").one().id).scalar()
        check("Xarajatlar yig'indisi = kirim summasi (160 000)", total_exp == Decimal("160000.00"))
        in_moves = StockMove.query.join(Material).filter(Material.name.in_(["Plyonka-C", "Bo'yoq-C"])).count()
        check("Har mahsulotga bitta kirim yozuvi", in_moves == 2)

    r = receive(c, "Taminotchi D", [("Plyonka-D", 2, 50000), ("Bo'yoq-D", 3, 20000)], paid=40000)
    st = stats("Taminotchi D")
    check("Birinchi qatordan kam to'langan: to'langan 40 000, qarz 120 000",
          st["paid"] == Decimal("40000.00") and st["debt"] == Decimal("120000.00"))

    print("\n=== 3. Noto'g'ri summa rad etiladi ===")
    before = moves_in()
    r = receive(c, "Taminotchi E", [("Qog'oz-E", 1, 10000)], paid=10001)
    check("Jamidan ko'p summa rad etildi", "oshib ketdi" in text(r))
    r = receive(c, "Taminotchi E", [("Qog'oz-E", 1, 10000)], paid=0)
    check("0 so'm rad etildi (qarz uchun «Qarzga olindi» tanlanadi)", "kichik bo'lishi mumkin emas" in text(r))
    r = receive(c, "Taminotchi E", [("Qog'oz-E", 1, 10000)], paid="abc")
    check("Raqam bo'lmagan summa rad etildi", "faqat raqam" in text(r))
    check("Hech narsa yozilmadi", moves_in() == before and stats("Taminotchi E") is None)

    print("\n=== 4. Naqd to'lovda summa maydoni e'tiborga olinmaydi ===")
    r = receive(c, "Taminotchi F", [("Qog'oz-F", 1, 10000)], method="naqd", via=None, paid=3000)
    st = stats("Taminotchi F")
    check("Naqd: butun summa to'langan (10 000), qarz yo'q",
          st["paid"] == Decimal("10000.00") and st["debt"] == Decimal("0") and st["n"] == 1)

    print("\n=== 5. Tezkor kirim ===")
    r = receive(c, "Taminotchi G", [("Qog'oz-G", 4, 25000)], paid=60000, url="/ombor/kirim/tezkor")
    j = r.get_json() or {}
    st = stats("Taminotchi G")
    check("Tezkor kirim ok", j.get("ok") is True)
    check("Xabarda perechisleniye va qarz ko'rsatiladi", "60 000" in j.get("message", "") and "40 000" in j.get("message", ""))
    check("To'langan 60 000, qarz 40 000", st["paid"] == Decimal("60000.00") and st["debt"] == Decimal("40000.00"))
    r = receive(c, "Taminotchi G", [("Qog'oz-G", 1, 1000)], paid=5000, url="/ombor/kirim/tezkor")
    check("Tezkor kirimda ko'p summa rad etiladi (400)", r.status_code == 400)

    print("\n=== 6. Formalarda maydon bor ===")
    page = text(c.get("/ombor/kirim"))
    check("Kirim sahifasida «To'langan summa» maydoni", 'name="paid_amount"' in page and "To'langan summa" in page)
    check("«To'liq» tugmasi va qarz yozuvi bor", 'id="paidAmountFull"' in page and "Qarzga qoladi" in page)
    page = text(c.get("/moliya/xarajatlar/yangi"))
    check("Tezkor kirim oynasida maydon", 'id="qrPaidAmount"' in page)
    # xatodan keyin kiritilgan summa formada qoladi
    r = receive(c, "Taminotchi H", [("Qog'oz-H", 1, 10000)], paid=99999)
    check("Xatodan keyin kiritilgan summa formada saqlanadi", 'value="99999"' in text(r))

try:
    with app.app_context():
        db.session.remove()
        db.engine.dispose()
    os.unlink(db_path)
except OSError:
    pass  # Windows: vaqtinchalik fayl band bo'lishi mumkin

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA TEKSHIRUVLAR MUVAFFAQIYATLI")
