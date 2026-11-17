"""Maxsus tekshiruv (2026-11-17): ombor va buyurtma xarajati bo'yicha 4 so'rov.

  1. Mahsulotni butunlay o'chirish — faqat admin. Tarixi bor mahsulot
     `confirm_moves=1`siz o'chmaydi; tasdiqlansa kirim/chiqim yozuvlari bilan
     o'chadi, kirimda yozilgan pul (Expense) esa qoladi.
  2. Tezkor kirim (`/ombor/kirim/tezkor`) — xarajat formasidan chiqmasdan
     mahsulot qabul qilinadi: xuddi oddiy kirim kabi Expense + StockMove,
     naqd manbasi majburiy, javob JSON.
  3. Xarajat formasi o'ng tomonda ombor ustuni va tezkor kirim oynasi bilan
     ochiladi.
  4. Taksi qatori — omborsiz, "transport" turkumida, pul OFIS kassasidan,
     buyurtma tannarxiga ham kiradi.
"""
import html
import json
import os
import sys
import tempfile
from decimal import Decimal

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, APP)

os.environ["SECRET_KEY"] = "test-secret"

fails = []


def check(label, cond):
    status = "OK  " if cond else "FAIL"
    print(f"  {status} {label}")
    if not cond:
        fails.append(label)


db_fd, db_path = tempfile.mkstemp(suffix=".sqlite")
os.close(db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from app import create_app
from extensions import db
from models import (
    User, Client, Order, OrderItem, Material, StockMove, Expense, CashDeposit,
    STOCK_IN, STOCK_OUT,
)
from queries import office_balance
from utils import today_local

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()

    admin = User(username="admin1", full_name="Admin", role="admin", is_active_user=True)
    admin.set_password("parol123")
    xar = User(username="xar1", full_name="Xarajatchi", role="xarajatchi", is_active_user=True)
    xar.set_password("parol123")
    db.session.add_all([admin, xar])
    db.session.flush()

    client = Client(name="Test mijoz")
    db.session.add(client)
    db.session.flush()

    order = Order(order_number="B-2026-7001", client_id=client.id, created_by=admin.id)
    order.items.append(OrderItem(order_type="Vizitka", quantity=1,
                                 unit_price=Decimal("500000.00"),
                                 total_price=Decimal("500000.00"), position=0))
    order.recalc_from_items()
    db.session.add(order)

    # OFIS kassasiga 1 000 000 so'm kiritilgan
    db.session.add(CashDeposit(amount=Decimal("1000000.00"), note="test", created_by=admin.id))

    # tarixsiz mahsulot
    bare = Material(name="Bo'sh mahsulot", unit="dona")
    # tarixi bor mahsulot: kirim (Expense bilan) + buyurtmaga chiqim
    used = Material(name="Qog'oz A4", unit="list", last_price=Decimal("100.00"))
    db.session.add_all([bare, used])
    db.session.flush()

    kirim_exp = Expense(category="xomashyo", amount=Decimal("10000.00"),
                        description="Ombor kirimi: Qog'oz A4", date=today_local(),
                        created_by=admin.id, is_paid=True, payment_method="naqd",
                        cash_source="zoxidjon")
    db.session.add(kirim_exp)
    db.session.flush()
    db.session.add(StockMove(material_id=used.id, kind=STOCK_IN, quantity=Decimal("100"),
                             unit_price=Decimal("100.00"), moved_on=today_local(),
                             expense_id=kirim_exp.id, created_by=admin.id))
    db.session.add(StockMove(material_id=used.id, kind=STOCK_OUT, quantity=Decimal("20"),
                             unit_price=Decimal("100.00"), moved_on=today_local(),
                             order_id=order.id, created_by=admin.id))
    db.session.commit()

    order_id, bare_id, used_id, kirim_exp_id = order.id, bare.id, used.id, kirim_exp.id


def login(c, username):
    return c.post("/login", data={"username": username, "password": "parol123"},
                  follow_redirects=True)


def text(r):
    return html.unescape(r.data.decode())


# ---------------------------------------------------------------- 1
print("=== 1. MAHSULOTNI BUTUNLAY O'CHIRISH (faqat admin) ===")

with app.test_client() as c:
    login(c, "xar1")
    r = c.post(f"/ombor/mahsulot/{bare_id}/ochirish", follow_redirects=True)
    with app.app_context():
        check("Xarajatchi o'chira olmaydi", db.session.get(Material, bare_id) is not None)

with app.test_client() as c:
    login(c, "admin1")

    r = c.get(f"/ombor/{used_id}")
    body = text(r)
    check("Detail sahifada O'chirish tugmasi bor", "deleteMaterialModal" in body)
    check("Tarixi bor — qayta tasdiqlash checkbox'i chiqadi", 'name="confirm_moves"' in body)

    r = c.post(f"/ombor/mahsulot/{bare_id}/ochirish", follow_redirects=True)
    with app.app_context():
        check("Tarixsiz mahsulot bir bosqichda o'chdi", db.session.get(Material, bare_id) is None)
    check("O'chirildi xabari", "butunlay o'chirildi" in text(r))

    r = c.post(f"/ombor/mahsulot/{used_id}/ochirish", follow_redirects=True)
    with app.app_context():
        check("Tarixi bor: tasdiqsiz O'CHMADI", db.session.get(Material, used_id) is not None)
    check("Tarixi bor: ogohlantirish (1 kirim, 1 chiqim)",
          "1 ta kirim, 1 ta chiqim" in text(r))

    r = c.post(f"/ombor/mahsulot/{used_id}/ochirish", data={"confirm_moves": "1"},
               follow_redirects=True)
    with app.app_context():
        check("Tarixi bor: tasdiqlangach o'chdi", db.session.get(Material, used_id) is None)
        check("Kirim/chiqim yozuvlari ham o'chdi",
              StockMove.query.filter_by(material_id=used_id).count() == 0)
        check("Kirimda yozilgan pul (Expense) QOLDI",
              db.session.get(Expense, kirim_exp_id) is not None)
        o = db.session.get(Order, order_id)
        check("Buyurtma tannarxidan ombor sarfi chiqdi", o.stock_cost == Decimal("0"))

# ---------------------------------------------------------------- 2
print("\n=== 2. TEZKOR KIRIM (xarajat formasidan) ===")

with app.test_client() as c:
    login(c, "xar1")

    base = {
        "row_material_name": "Laminatsiya plyonka", "row_unit": "metr",
        "row_quantity": "50", "row_price": "1200",
        "supplier_name": "Plyonka MChJ", "payment_method": "naqd",
    }

    r = c.post("/ombor/kirim/tezkor", data=base)
    res = r.get_json()
    check("Naqd manbasisiz — 400 va xato matni",
          r.status_code == 400 and res and not res["ok"] and "manba" in res["error"])
    with app.app_context():
        check("Xato bo'lganda hech narsa yozilmadi",
              Material.query.filter_by(name="Laminatsiya plyonka").first() is None)

    r = c.post("/ombor/kirim/tezkor", data={**base, "cash_source": "ofis"})
    res = r.get_json()
    check("Yangi mahsulot qabul qilindi (200, ok)", r.status_code == 200 and res["ok"])
    check("Javobda mahsulot va qoldiq", res["material"]["name"] == "Laminatsiya plyonka"
          and res["material"]["qty"].startswith("50") and res["material"]["unit"] == "metr")
    with app.app_context():
        m = Material.query.filter_by(name="Laminatsiya plyonka").first()
        check("Mahsulot omborda ochildi", m is not None and m.quantity == Decimal("50"))
        e = Expense.query.filter(Expense.description.like("Ombor kirimi: Laminatsiya%")).first()
        check("Kirim xarajati yozildi (60 000, OFIS)",
              e is not None and e.amount == Decimal("60000.00") and e.cash_source == "ofis")
        check("Taminotchiga bog'landi", e.supplier is not None and e.supplier.name == "Plyonka MChJ")
        lam_id = m.id

    # mavjud mahsulotga qayta kirim — qoldiq oshadi, yangi mahsulot ochilmaydi
    r = c.post("/ombor/kirim/tezkor", data={**base, "row_material_id": str(lam_id),
                                            "row_quantity": "10", "row_price": "1300",
                                            "payment_method": "qarzga"})
    res = r.get_json()
    with app.app_context():
        check("Mavjud mahsulotga kirim: qoldiq 60",
              res["ok"] and db.session.get(Material, lam_id).quantity == Decimal("60"))
        check("Dublikat mahsulot ochilmadi",
              Material.query.filter(Material.name.ilike("Laminatsiya plyonka")).count() == 1)
        check("Oxirgi narx yangilandi (1300)",
              db.session.get(Material, lam_id).last_price == Decimal("1300.00"))

# ---------------------------------------------------------------- 3
print("\n=== 3. XARAJAT FORMASI: O'NG USTUN VA TEZKOR KIRIM OYNASI ===")

with app.test_client() as c:
    login(c, "xar1")
    r = c.get(f"/moliya/xarajatlar/yangi?order_id={order_id}")
    body = text(r)
    check("Forma ochildi (200)", r.status_code == 200)
    check("O'ng ustunda ombor ro'yxati", 'id="stockPanelCol"' in body and "stock-pick" in body)
    check("Ustunda kirim qilingan mahsulot bor", 'data-name="Laminatsiya plyonka"' in body)
    check("Tezkor kirim oynasi bor", 'id="quickReceiveModal"' in body)
    check("Taksi qatori bor", 'name="taxi_enabled"' in body)

# ---------------------------------------------------------------- 4
print("\n=== 4. TAKSI XARAJATI (OFIS kassasidan, transport turkumi) ===")

with app.app_context():
    office_before = office_balance()

with app.test_client() as c:
    login(c, "xar1")

    # narxsiz taksi — rad etiladi, hech narsa yozilmaydi
    r = c.post("/moliya/xarajatlar/yangi", data={
        "order_id": str(order_id), "taxi_enabled": "1", "taxi_count": "2", "taxi_price": "",
        "expense_material": "", "expense_description": "", "expense_quantity": "1",
        "expense_unit_price": "",
    }, follow_redirects=True)
    with app.app_context():
        check("Narxsiz taksi rad etildi",
              Expense.query.filter_by(category="transport").count() == 0)

    # faqat taksi (mahsulot qatori bo'sh) — bo'sh qator xato bermasligi kerak
    r = c.post("/moliya/xarajatlar/yangi", data={
        "order_id": str(order_id), "taxi_enabled": "1", "taxi_count": "3",
        "taxi_price": "25000",
        "expense_material": "", "expense_description": "", "expense_quantity": "1",
        "expense_unit_price": "",
    }, follow_redirects=True)
    body = text(r)
    check("Faqat taksi: muvaffaqiyat xabari", "taksi 75 000" in body.replace("\xa0", " "))
    with app.app_context():
        t = Expense.query.filter_by(category="transport").all()
        check("Bitta transport xarajati yozildi", len(t) == 1)
        t = t[0]
        check("Summasi 3 × 25 000 = 75 000", t.amount == Decimal("75000.00"))
        check("Buyurtmaga bog'langan", t.order_id == order_id)
        check("Pul OFIS kassasidan (naqd)",
              t.cash_source == "ofis" and t.payment_method == "naqd" and t.is_paid)
        check("OFIS balansi 75 000 ga kamaydi",
              office_balance() == office_before - Decimal("75000.00"))
        o = db.session.get(Order, order_id)
        check("Buyurtma tannarxiga kirdi", o.direct_expenses == Decimal("75000.00"))
        check("Omborga tegmadi (taksi mahsuloti yo'q)",
              Material.query.filter(Material.name.ilike("%taks%")).count() == 0)

    # taksi + ombordan mahsulot birga
    r = c.post("/moliya/xarajatlar/yangi", data={
        "order_id": str(order_id), "taxi_enabled": "1", "taxi_count": "1",
        "taxi_price": "30000",
        "expense_material": str(lam_id), "expense_description": "Laminatsiya plyonka",
        "expense_quantity": "5", "expense_unit_price": "1300",
    }, follow_redirects=True)
    with app.app_context():
        check("Taksi + mahsulot: ikkinchi taksi yozildi",
              Expense.query.filter_by(category="transport").count() == 2)
        check("Taksi + mahsulot: ombordan 5 metr chiqdi",
              db.session.get(Material, lam_id).quantity == Decimal("55"))
        o = db.session.get(Order, order_id)
        check("Buyurtma tannarxi = 105 000 taksi + 6 500 ombor",
              o.expenses_total == Decimal("111500.00"))

    # taksi belgilanmagan bo'lsa yozilmaydi, hatto narx yuborilsa ham
    r = c.post("/moliya/xarajatlar/yangi", data={
        "order_id": str(order_id), "taxi_count": "1", "taxi_price": "99999",
        "expense_material": str(lam_id), "expense_description": "Laminatsiya plyonka",
        "expense_quantity": "1", "expense_unit_price": "1300",
    }, follow_redirects=True)
    with app.app_context():
        check("Belgisiz taksi yozilmadi",
              Expense.query.filter_by(category="transport").count() == 2)

    # hisobotda transport turkumida ko'rinadi
    from finance import expense_breakdown
    from datetime import timedelta
    with app.app_context():
        today = today_local()
        rows = expense_breakdown(today, today + timedelta(days=1))["category_rows"]
        transport = next((row for row in rows if row["name"] == "transport"), None)
        check("Hisobotda 'transport' turkumi 105 000",
              transport is not None and transport["amount"] == Decimal("105000.00"))

# ---------------------------------------------------------------- 5
print("\n=== 5. TIYIN VA KASR MIQDOR YO'Q (2026-11-17) ===")

with app.test_client() as c:
    login(c, "xar1")
    common = {"supplier_name": "Plyonka MChJ", "payment_method": "naqd", "cash_source": "ofis"}

    r = c.post("/ombor/kirim/tezkor", data={**common, "row_material_name": "Bakal-oq",
                                            "row_unit": "dona", "row_quantity": "0.004",
                                            "row_price": "100"})
    res = r.get_json()
    check("dona: 0.004 rad etildi (butun son)",
          r.status_code == 400 and "butun son" in res["error"])

    r = c.post("/ombor/kirim/tezkor", data={**common, "row_material_name": "Bakal-oq",
                                            "row_unit": "dona", "row_quantity": "10",
                                            "row_price": "1999.99"})
    res = r.get_json()
    with app.app_context():
        m = Material.query.filter_by(name="Bakal-oq").first()
        check("Narx 1999.99 -> 2000 so'mga yaxlitlandi",
              res["ok"] and m.last_price == Decimal("2000.00"))
        e = Expense.query.filter(Expense.description.like("Ombor kirimi: Bakal-oq%")).first()
        check("Xarajat summasi tiyinsiz (20 000)", e.amount == Decimal("20000.00"))

    r = c.post("/ombor/kirim/tezkor", data={**common, "row_material_name": "Bakal-oq",
                                            "row_unit": "dona", "row_quantity": "1",
                                            "row_price": "0,05"})
    check("0,05 so'm narx rad etildi", r.status_code == 400)

    r = c.post("/ombor/kirim/tezkor", data={**common, "row_material_name": "Plyonka kg",
                                            "row_unit": "kg", "row_quantity": "2.5",
                                            "row_price": "40000"})
    with app.app_context():
        m = Material.query.filter_by(name="Plyonka kg").first()
        check("kg: 2.5 kasr miqdor qabul qilindi",
              r.get_json()["ok"] and m.quantity == Decimal("2.5"))

    # buyurtma xarajatida ham dona kasr bo'lmaydi
    with app.app_context():
        bakal_id = Material.query.filter_by(name="Bakal-oq").first().id
    r = c.post("/moliya/xarajatlar/yangi", data={
        "order_id": str(order_id), "expense_material": str(bakal_id),
        "expense_description": "Bakal-oq", "expense_quantity": "1.5",
        "expense_unit_price": "2000",
    }, follow_redirects=True)
    check("Xarajatda 1.5 dona rad etildi", "butun son" in text(r))

    r = c.get(f"/moliya/xarajatlar/yangi?order_id={order_id}")
    body = text(r)
    check("Narx maydonlari butun so'm (step=1)",
          'class="form-control text-end exp-price"' not in body
          or 'step="1" min="1" class="form-control text-end exp-price"' in body)

os.unlink(db_path)

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA TEKSHIRUVLAR MUVAFFAQIYATLI")
