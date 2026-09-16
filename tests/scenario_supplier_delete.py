"""Maxsus tekshiruv (2026-09-16): taminotchini o'chirish/tiklash.

  1. Qarzi yo'q taminotchi bir bosqichda o'chadi (confirm_debt shart emas).
  2. Qarzdor taminotchi confirm_debt=1 siz o'CHMAYDI — ogohlantirish bilan
     qaytadi, qarz saqlanib qoladi.
  3. confirm_debt=1 bilan qarzdor taminotchi ham o'chadi, qarz o'zgarmaydi.
  4. O'chirilgan taminotchi ro'yxatda/qidiruvda/yangi xarajat formasida
     ko'rinmaydi, lekin detail sahifa orqali ochiladi va tiklanadi.
  5. Ruxsat: faqat admin o'chira oladi — xarajatchi (suppliers.manage bor,
     lekin suppliers.delete yo'q) va boss rad etiladi.
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
    status = "OK  " if cond else "FAIL"
    print(f"  {status} {label}")
    if not cond:
        fails.append(label)


db_fd, db_path = tempfile.mkstemp(suffix=".sqlite")
os.close(db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from app import create_app
from extensions import db
from models import User, Supplier, Expense, SupplierPayment
from utils import today_local

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()

    admin = User(username="admin1", full_name="Admin", role="admin", is_active_user=True)
    admin.set_password("parol123")
    xarajatchi = User(username="xar1", full_name="Xarajatchi", role="xarajatchi", is_active_user=True)
    xarajatchi.set_password("parol123")
    boss = User(username="boss1", full_name="Boss", role="boss", is_active_user=True)
    boss.set_password("parol123")
    db.session.add_all([admin, xarajatchi, boss])
    db.session.flush()

    s_no_debt = Supplier(name="Qarzsiz MChJ")
    s_debt = Supplier(name="Qarzdor MChJ")
    db.session.add_all([s_no_debt, s_debt])
    db.session.flush()

    # s_debt'ga 150000 qarzga xarid yoziladi (qarzdorlik hosil bo'ladi)
    db.session.add(Expense(
        category="xomashyo", amount=Decimal("150000.00"), description="Qog'oz",
        date=today_local(), created_by=admin.id, supplier_id=s_debt.id,
        is_paid=False, payment_method=None,
    ))
    db.session.commit()

    no_debt_id, debt_id = s_no_debt.id, s_debt.id
    admin_id, xarajatchi_id, boss_id = admin.id, xarajatchi.id, boss.id


def login(client, username):
    return client.post("/login", data={"username": username, "password": "parol123"},
                        follow_redirects=True)


print("=== TAMINOTCHINI O'CHIRISH / TIKLASH ===")

with app.test_client() as c:
    login(c, "admin1")

    # 1) qarzi yo'q taminotchi — bir bosqichda o'chadi
    r = c.post(f"/taminotchilar/{no_debt_id}/ochirish", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Qarzsiz taminotchi: 200 qaytdi", r.status_code == 200)
    check("Qarzsiz taminotchi: o'chirildi xabari bor", "o'chirildi" in body)
    with app.app_context():
        s = db.session.get(Supplier, no_debt_id)
        check("Qarzsiz taminotchi: is_deleted=True", s.is_deleted is True)
        check("Qarzsiz taminotchi: deleted_at yozildi", s.deleted_at is not None)

    # 2) qarzdor taminotchi — confirm_debt siz o'CHMAYDI
    r = c.post(f"/taminotchilar/{debt_id}/ochirish", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Qarzdor (tasdiqlashsiz): 200 qaytdi", r.status_code == 200)
    check("Qarzdor (tasdiqlashsiz): qarz summasi bilan ogohlantirdi",
          "150 000" in body and "qarz" in body.lower())
    with app.app_context():
        s = db.session.get(Supplier, debt_id)
        check("Qarzdor (tasdiqlashsiz): HALI o'chirilmagan", s.is_deleted is False)

    # 3) qarzdor taminotchi — confirm_debt=1 bilan o'chadi
    r = c.post(f"/taminotchilar/{debt_id}/ochirish", data={"confirm_debt": "1"},
               follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Qarzdor (tasdiqlab): 200 qaytdi", r.status_code == 200)
    check("Qarzdor (tasdiqlab): o'chirildi xabari bor", "o'chirildi" in body)
    with app.app_context():
        s = db.session.get(Supplier, debt_id)
        check("Qarzdor (tasdiqlab): is_deleted=True", s.is_deleted is True)
        check("Qarzdor (tasdiqlab): qarz o'zgarmadi (150000)", s.debt == Decimal("150000.00"))

    # 4) ro'yxatda/qidiruvda ko'rinmaydi
    r = c.get("/taminotchilar/", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Ro'yxatda 'Qarzsiz MChJ' YO'Q", "Qarzsiz MChJ" not in body)
    check("Ro'yxatda 'Qarzdor MChJ' YO'Q", "Qarzdor MChJ" not in body)

    r = c.get("/taminotchilar/qidiruv?q=Qarz")
    check("JSON qidiruvda o'chirilganlar yo'q", r.get_json() == [])

    # detail sahifa orqali hali ochiladi (tiklash uchun)
    r = c.get(f"/taminotchilar/{debt_id}", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Detail sahifa hali ochiladi", r.status_code == 200)
    check("Detail sahifada 'o'chirilgan' banneri bor", "o'chirilgan" in body.lower())

    # O'chirilganlar ro'yxati
    r = c.get("/taminotchilar/ochirilganlar", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("O'chirilganlar sahifasi ochildi", r.status_code == 200)
    check("O'chirilganlar sahifasida ikkalasi ham bor",
          "Qarzsiz MChJ" in body and "Qarzdor MChJ" in body)

    # 5) tiklash
    r = c.post(f"/taminotchilar/{debt_id}/tiklash", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Tiklash: 200 qaytdi", r.status_code == 200)
    check("Tiklash: tiklandi xabari bor", "tiklandi" in body)
    with app.app_context():
        s = db.session.get(Supplier, debt_id)
        check("Tiklash: is_deleted=False", s.is_deleted is False)
        check("Tiklash: deleted_at tozalandi", s.deleted_at is None)

    r = c.get("/taminotchilar/", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Tiklangandan keyin ro'yxatda ko'rinadi", "Qarzdor MChJ" in body)

print("\n=== RUXSATLAR ===")

with app.test_client() as c:
    login(c, "xar1")
    r = c.post(f"/taminotchilar/{no_debt_id}/ochirish", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Xarajatchi: o'chira olmaydi (ruxsat yo'q xabari)", "huquqingiz yo'q" in body)
    with app.app_context():
        s = db.session.get(Supplier, no_debt_id)
        check("Xarajatchi urinishidan keyin ham o'chirilgan holatda qoldi (avvalgi holat)",
              s.is_deleted is True)

with app.test_client() as c:
    login(c, "boss1")
    r = c.get("/taminotchilar/ochirilganlar", follow_redirects=True)
    body = html.unescape(r.data.decode())
    check("Boss: O'chirilganlar sahifasiga kira olmaydi", "huquqingiz yo'q" in body)

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA SSENARIY TEKSHIRUVLARI MUVAFFAQIYATLI")
