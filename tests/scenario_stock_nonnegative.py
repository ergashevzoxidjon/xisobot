"""Ombor qoldig'i minusga tushmasligi (2026-11-17, foydalanuvchi so'rovi).

Avval qoldiq yetmasa faqat ogohlantirish chiqar edi va qoldiq minusga o'tardi
(omborda "DTF -11 dona", "Forma -16 dona" kabi). Endi:
  1. Yangi xarajat: qoldiqdan ko'p sarflash rad etiladi, HECH NARSA yozilmaydi.
  2. Bir mahsulot bir necha qatorda kelsa, miqdorlar qo'shib tekshiriladi.
  3. Aniq qoldiqqa teng miqdor ruxsat etiladi (qoldiq 0 bo'ladi, minus emas).
  4. Chiqim qatorini tahrirlash: qoldiqdan oshirib bo'lmaydi; o'zining eski
     miqdorigacha (yoki kamaytirish) mumkin.
  5. Qoldiqni tuzatish (admin) minus qiymat qabul qilmaydi.
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

from app import create_app
from extensions import db
from models import (User, Client, Order, OrderItem, Material, StockMove, Expense, STOCK_IN, STOCK_OUT)
from utils import today_local

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()
    for uname, role in [("admin1", "admin"), ("xar1", "xarajatchi")]:
        u = User(username=uname, full_name=uname, role=role, is_active_user=True)
        u.set_password("parol123")
        db.session.add(u)
    client = Client(name="Test mijoz")
    db.session.add(client)
    db.session.flush()
    admin_id = User.query.filter_by(username="admin1").one().id
    order = Order(order_number="B-2026-8001", client_id=client.id, created_by=admin_id)
    order.items.append(OrderItem(order_type="Vizitka", quantity=1, unit_price=Decimal("1000.00"),
                                 total_price=Decimal("1000.00"), position=0))
    order.recalc_from_items()
    db.session.add(order)
    dtf = Material(name="DTF", unit="dona", last_price=Decimal("30000.00"))
    forma = Material(name="Forma", unit="dona", last_price=Decimal("22000.00"))
    db.session.add_all([dtf, forma])
    db.session.flush()
    for m, q in ((dtf, "10"), (forma, "4")):
        db.session.add(StockMove(material_id=m.id, kind=STOCK_IN, quantity=Decimal(q),
                                 unit_price=m.last_price, moved_on=today_local(), created_by=admin_id))
    db.session.commit()
    order_id, dtf_id, forma_id = order.id, dtf.id, forma.id


def login(c, username):
    c.post("/login", data={"username": username, "password": "parol123"})


def text(r):
    return html.unescape(r.data.decode()).replace("\xa0", " ")


def qty(mid):
    with app.app_context():
        return db.session.get(Material, mid).quantity


def moves_count():
    with app.app_context():
        return StockMove.query.count()


def post_expense(c, rows):
    data = {"order_id": str(order_id), "expense_material": [], "expense_description": [],
            "expense_quantity": [], "expense_unit_price": []}
    for mid, q in rows:
        data["expense_material"].append(str(mid))
        data["expense_description"].append("")
        data["expense_quantity"].append(str(q))
        data["expense_unit_price"].append("1000")
    return c.post("/moliya/xarajatlar/yangi", data=data, follow_redirects=True)


with app.test_client() as c:
    login(c, "xar1")

    print("\n=== 1. Qoldiqdan ko'p sarflash rad etiladi ===")
    before = moves_count()
    r = post_expense(c, [(dtf_id, 11)])
    body = text(r)
    check("Xato xabari: «DTF»: omborda 10 dona bor, 1 dona yetishmaydi", "«DTF»: omborda 10 dona bor, 1 dona yetishmaydi" in body)
    check("Xabarda minusga tushishi mumkin emasligi aytiladi", "minusga tushishi mumkin emas" in body)
    check("Forma qayta ochildi (kiritilgan ma'lumot yo'qolmadi)", "expense_quantity" in body)
    check("Qoldiq o'zgarmadi (10)", qty(dtf_id) == Decimal("10"))
    check("Hech qanday chiqim yozilmadi", moves_count() == before)

    print("\n=== 2. Bir mahsulot ikki qatorda — yig'indi tekshiriladi ===")
    r = post_expense(c, [(dtf_id, 6), (dtf_id, 5)])
    check("6 + 5 = 11 > 10: rad etildi", "yetishmaydi" in text(r))
    check("Qoldiq o'zgarmadi", qty(dtf_id) == Decimal("10") and moves_count() == before)
    r = post_expense(c, [(dtf_id, 3), (forma_id, 5)])
    check("Bitta qator yetmasa butun forma rad etiladi (Forma: 4 bor, 5 so'raldi)",
          "«Forma»" in text(r) and "yetishmaydi" in text(r))
    check("Boshqa to'g'ri qator ham yozilmadi (DTF 10, Forma 4)",
          qty(dtf_id) == Decimal("10") and qty(forma_id) == Decimal("4") and moves_count() == before)

    print("\n=== 3. Aniq qoldiqqa teng miqdor ruxsat etiladi ===")
    r = post_expense(c, [(forma_id, 4)])
    check("Qoldiqning hammasini sarflash o'tdi", "ombordan sarflandi" in text(r))
    check("Qoldiq 0 (minus emas)", qty(forma_id) == Decimal("0"))
    r = post_expense(c, [(forma_id, 1)])
    check("Qoldiq 0 bo'lganda 1 dona ham rad etiladi", "yetishmaydi" in text(r) and qty(forma_id) == Decimal("0"))

    print("\n=== 4. Chiqim qatorini tahrirlash ===")
    post_expense(c, [(dtf_id, 4)])       # DTF: 10 -> 6
    with app.app_context():
        move_id = StockMove.query.filter_by(material_id=dtf_id, kind=STOCK_OUT).one().id
    check("Tahrirlashdan oldin DTF qoldig'i 6", qty(dtf_id) == Decimal("6"))
    form = {"material_id": str(dtf_id), "unit_price": "1000"}
    r = c.post(f"/moliya/xarajatlar/ombor/{move_id}/tahrirlash", data={**form, "quantity": "11"}, follow_redirects=True)
    check("4 dan 11 ga oshirish (jami 10 bor) rad etildi", "yetishmaydi" in text(r))
    with app.app_context():
        check("Chiqim miqdori o'zgarmadi (4)", db.session.get(StockMove, move_id).quantity == Decimal("4"))
    r = c.post(f"/moliya/xarajatlar/ombor/{move_id}/tahrirlash", data={**form, "quantity": "10"}, follow_redirects=True)
    check("4 dan 10 ga (aynan sig'adi) ruxsat etildi", "yangilandi" in text(r) and qty(dtf_id) == Decimal("0"))
    r = c.post(f"/moliya/xarajatlar/ombor/{move_id}/tahrirlash", data={**form, "quantity": "2"}, follow_redirects=True)
    check("Kamaytirish har doim mumkin", qty(dtf_id) == Decimal("8"))

with app.test_client() as c:
    login(c, "admin1")
    print("\n=== 5. Qoldiqni tuzatish minus qabul qilmaydi ===")
    r = c.post(f"/ombor/mahsulot/{dtf_id}/tuzatish", data={"target_quantity": "-5"}, follow_redirects=True)
    check("Minus qoldiq kiritish rad etildi (sabab ko'rsatiladi)",
          "kichik bo'lishi mumkin emas" in text(r) and qty(dtf_id) == Decimal("8"))

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
