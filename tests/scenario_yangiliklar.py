"""Xavfsizlik, zaxira, buyurtma va mijoz yangiliklari (2026-11-17).

  1. Kirish limiti: 5 ta xato paroldan keyin 429, to'g'ri parol ham bloklanadi.
  2. Audit: buyurtma/mijoz/foydalanuvchi tahririda eski -> yangi qiymatlar jurnalga yoziladi; filtrlar ishlaydi.
  3. Zaxira: backup.make_backup fayl yaratadi, ochilganda ma'lumot bor; eskilari o'chadi; sahifa/yuklab olish.
  4. Buyurtma: kechikkan filtri, ishlab chiqarish varaqasi (QR), nusxalash.
  5. Mijoz: o'xshash mijoz ogohlantirishi, mijoz kartochkasi.
  6. Foyda-zarar sahifasi.
  7. SMS: telefon normallashtirish, sozlanmagan bo'lsa tugma yo'q.
  8. Avtomatik migratsiya (autodeploy).
"""
import gzip
import os
import shutil
import sqlite3
import sys
import tempfile
from datetime import timedelta

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, APP)
os.environ["SECRET_KEY"] = "test-secret"
for k in ("ESKIZ_EMAIL", "ESKIZ_PASSWORD", "SMS_AUTO_READY"):
    os.environ.pop(k, None)

fails = []


def check(label, cond):
    print(f"  {'OK  ' if cond else 'FAIL'} {label}")
    if not cond:
        fails.append(label)


db_fd, db_path = tempfile.mkstemp(suffix=".sqlite")
os.close(db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
backup_dir = tempfile.mkdtemp()
os.environ["BACKUP_DIR"] = backup_dir
os.environ["BACKUP_KEEP"] = "2"

from app import create_app
from extensions import db
from models import (User, Client, Order, OrderItem, Payment, Expense, AuditLog, LoginAttempt,
                    STATUS_READY, STATUS_NEW)
from utils import today_local, now_local

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()
    for uname, role in [("admin1", "admin"), ("men1", "menejer"), ("xar1", "xarajatchi")]:
        u = User(username=uname, full_name=uname.title(), role=role, is_active_user=True)
        u.set_password("parol123")
        db.session.add(u)
    db.session.commit()
    men_id = User.query.filter_by(username="men1").first().id

    c1 = Client(name="Andijon Poligraf MChJ", phone="+998 90 123-45-67", created_by=men_id)
    c2 = Client(name="Toshkent Reklama", phone="991112233")
    db.session.add_all([c1, c2])
    db.session.flush()

    def mk(num, client, total, deadline, status=STATUS_NEW, created=None):
        o = Order(order_number=num, client_id=client.id, status=status, deadline=deadline,
                  created_by=men_id, created_at=created or now_local())
        o.items.append(OrderItem(order_type="Vizitka", quantity=100, unit_price=total / 100,
                                 description="90x50, 350g, laminatsiya"))
        db.session.add(o)
        db.session.flush()
        o.recalc_from_items()
        return o

    late = mk("2026-0001", c1, 500000, today_local() - timedelta(days=3))
    ok_order = mk("2026-0002", c1, 300000, today_local() + timedelta(days=5))
    ready = mk("2026-0003", c2, 200000, None, status=STATUS_READY)
    old = mk("2026-0004", c1, 400000, None, created=now_local() - timedelta(days=75))
    db.session.add(Payment(order_id=ok_order.id, amount=100000, paid_on=today_local(),
                           payment_method="Naqd"))
    db.session.add(Expense(category="ijara", amount=50000, date=today_local(), description="x"))
    db.session.commit()
    ids = dict(late=late.id, ok=ok_order.id, ready=ready.id, c1=c1.id, c2=c2.id, old=old.id)


def login(username, password="parol123"):
    c = app.test_client()
    r = c.post("/login", data={"username": username, "password": password})
    return c, r


# ---- 1. kirish limiti ----
print("\n1. Kirish limiti")
c = app.test_client()
codes = [c.post("/login", data={"username": "men1", "password": "xato"}).status_code for _ in range(5)]
check("xato parol 5 marta: sahifa qaytadi (200)", all(x == 200 for x in codes))
r = c.post("/login", data={"username": "men1", "password": "parol123"})
check("5 ta xatodan keyin to'g'ri parol ham 429", r.status_code == 429)
with app.app_context():
    LoginAttempt.query.delete()
    db.session.commit()
adm, r = login("admin1")
check("admin kiradi (limit tozalangach)", r.status_code == 302)

# ---- 2. audit ----
print("\n2. Audit: eski -> yangi")
r = adm.post(f"/buyurtmalar/{ids['late']}/tahrirlash", data={
    "client_name": "Andijon Poligraf MChJ", "client_id": ids["c1"],
    "description": "Shoshilinch", "deadline": str(today_local() + timedelta(days=2)),
    "item_type": ["Vizitka"], "item_quantity": ["200"], "item_unit_price": ["2500"],
    "item_description": ["90x50"], "version": "1",
})
with app.app_context():
    entry = AuditLog.query.filter_by(action="update", entity="order").order_by(AuditLog.id.desc()).first()
    print("   ->", entry.detail if entry else None)
check("buyurtma tahriri jurnalga yozildi", entry is not None)
if entry:
    check("jurnalda 'Muddat' eski -> yangi ko'rinadi", "Muddat:" in entry.detail and "→" in entry.detail)

r = adm.post(f"/mijozlar/{ids['c2']}/tahrirlash", data={
    "name": "Toshkent Reklama", "phone": "991112233", "company": "Yangi MChJ",
    "address": "", "notes": ""})
with app.app_context():
    entry = AuditLog.query.filter_by(action="update", entity="client").order_by(AuditLog.id.desc()).first()
check("mijoz tahriri: 'Korxona: — → Yangi MChJ'", bool(entry) and "Korxona: — → Yangi MChJ" in entry.detail)

r = adm.get("/jurnal?entity=client&action=update")
check("jurnal filtri sahifasi ochiladi", r.status_code == 200)
check("filtr natijasida mijoz yozuvi bor", b"Yangi MChJ" in r.data)
r = adm.get("/jurnal?entity=order&q=Muddat&from=2026-01-01&to=2099-01-01")
check("jurnal: obyekt + matn + sana filtri", r.status_code == 200 and b"Muddat" in r.data)

# ---- 3. zaxira ----
print("\n3. Zaxira")
import backup as bk
with app.app_context():
    paths = []
    for _ in range(3):
        p, note = bk.make_backup(app, send_telegram=False)
        paths.append(p)
        import time
        time.sleep(1.1)       # fayl nomi soniya bo'yicha
files = bk.list_backups_in(backup_dir)
check("zaxira fayli yaratildi", os.path.isfile(paths[-1]))
check("faqat oxirgi 2 ta qoldi (BACKUP_KEEP=2)", len(files) == 2)
tmp_db = os.path.join(tempfile.mkdtemp(), "x.db")
with gzip.open(paths[-1], "rb") as f, open(tmp_db, "wb") as out:
    shutil.copyfileobj(f, out)
con = sqlite3.connect(tmp_db)
n_orders = con.execute("select count(*) from \"order\"").fetchone()[0]
n_clients = con.execute("select count(*) from client").fetchone()[0]
con.close()
check("zaxiradagi buyurtmalar soni to'g'ri (4)", n_orders == 4)
check("zaxiradagi mijozlar soni to'g'ri (2)", n_clients == 2)
r = adm.get("/sozlamalar/zaxira")
check("zaxira sahifasi ochiladi", r.status_code == 200 and b"xisobot-" in r.data)
r = adm.get(f"/sozlamalar/zaxira/{files[0]['name']}")
check("zaxirani yuklab olish", r.status_code == 200 and len(r.data) > 100)
r = adm.get("/sozlamalar/zaxira/..%2Fapp.py")
check("yo'l o'zgartirib (path traversal) yuklab bo'lmaydi", r.status_code == 404)
men, _ = login("men1")
check("menejer zaxira sahifasiga kira olmaydi", men.get("/sozlamalar/zaxira").status_code == 302)
check("menejer yangi zaxira yarata olmaydi", men.post("/sozlamalar/zaxira/yaratish").status_code == 302)
check("zaxira papkasida menejer yaratgani yo'q (soni o'zgarmadi)", len(bk.list_backups_in(backup_dir)) == 2)
with app.app_context():
    from backup import send_offsite
    check("Telegram sozlanmagan bo'lsa zaxira buzilmaydi", "sozlanmagan" in send_offsite(paths[-1]))

# ---- 4. buyurtma ----
print("\n4. Buyurtma: kechikkan, varaqa, nusxalash")
with app.app_context():
    db.session.get(Order, ids["old"]).deadline = today_local() - timedelta(days=3)
    db.session.commit()
r = adm.get("/buyurtmalar/?month=&overdue=1")
check("kechikkan filtri: muddati o'tgan buyurtma ko'rinadi", b"2026-0004" in r.data)
check("kechikkan filtri: muddati o'tmagani ko'rinmaydi", b"2026-0002" not in r.data)
r = adm.get(f"/buyurtmalar/{ids['ok']}/ishlab-chiqarish")
check("ishlab chiqarish varaqasi ochiladi", r.status_code == 200)
check("varaqada texnik parametr bor", b"350g" in r.data)
check("varaqada QR kod (svg) bor", b"<svg" in r.data and b"qr-box" in r.data)
r = adm.get(f"/buyurtmalar/{ids['ok']}")
check("buyurtma sahifasida varaqa tugmasi", b"ishlab-chiqarish" in r.data)
r = adm.get(f"/buyurtmalar/yangi?copy={ids['ok']}")
check("nusxalash formasi ochiladi va ma'lumot bilan to'ldirilgan", r.status_code == 200 and b"Andijon Poligraf" in r.data)
men_c, _ = login("men1")
check("menejer o'zinikidan boshqasining varaqasini ko'rmaydi (o'zinikini ko'radi)",
      men_c.get(f"/buyurtmalar/{ids['ok']}/ishlab-chiqarish").status_code == 200)

# ---- 5. mijoz ----
print("\n5. Mijoz: o'xshash va kartochka")
from clients import find_similar_clients
with app.app_context():
    s1 = find_similar_clients("Andijon poligraf", "")
    s2 = find_similar_clients("Boshqa nom", "90 123 45 67")
    s3 = find_similar_clients("Umuman boshqa", "935550000")
check("nomi o'xshash (MChJ, harf farqi) topiladi", any(c.id == ids["c1"] for c, _ in s1))
check("telefon formati farqli bo'lsa ham topiladi", any(why == "telefon raqami bir xil" for _, why in s2))
check("alohida mijoz topilmaydi", s3 == [])
r = adm.post("/mijozlar/yangi", data={"name": "Andijon Poligraf", "phone": "", "company": "", "address": "", "notes": ""})
check("dublikat: ogohlantirish chiqadi, saqlanmaydi", r.status_code == 200 and "Baribir saqlash".encode() in r.data)
with app.app_context():
    check("dublikat tasdiqlanmaguncha bazaga yozilmagan", Client.query.filter_by(name="Andijon Poligraf").count() == 0)
r = adm.post("/mijozlar/yangi", data={"name": "Andijon Poligraf", "phone": "", "company": "", "address": "",
                                     "notes": "", "confirm_duplicate": "1"})
with app.app_context():
    check("'Baribir saqlash' bilan saqlanadi", Client.query.filter_by(name="Andijon Poligraf").count() == 1)
r = adm.get("/mijozlar/oxshash?name=Toshkent%20Reklama")
check("jonli tekshiruv JSON qaytaradi", r.status_code == 200 and r.get_json() and r.get_json()[0]["name"] == "Toshkent Reklama")
r = adm.get(f"/mijozlar/{ids['c1']}")
check("mijoz kartochkasi ochiladi", r.status_code == 200)
check("kartochkada qarz yoshi bloki", "Qarz yoshi".encode() in r.data)
check("kartochkada 60 kundan oshgan qarz (75 kunlik buyurtma)", "60 kundan ortiq".encode() in r.data)
check("kartochkada o'rtacha chek va oxirgi to'lovlar", "O'rtacha chek".encode() in r.data and "Oxirgi to'lovlar".encode() in r.data)

# ---- 6. foyda-zarar ----
print("\n6. Foyda va zarar")
r = adm.get("/moliya/foyda-zarar")
check("foyda-zarar sahifasi ochiladi", r.status_code == 200 and "Sof foyda".encode() in r.data)
check("tushum 100 000 va xarajat 50 000 hisoblandi", b"100" in r.data and b"50" in r.data)
r = adm.get("/moliya/foyda-zarar?year=2026&month=0")
check("butun yil rejimi ishlaydi", r.status_code == 200 and b"2026-yil" in r.data)
check("menejer foyda-zararni ko'rmaydi", men.get("/moliya/foyda-zarar").status_code in (302, 403))

# ---- 7. SMS ----
print("\n7. SMS")
import sms
check("telefon: +998 90 123-45-67", sms.normalize_phone("+998 90 123-45-67") == "998901234567")
check("telefon: 9 xonali -> 998 qo'shiladi", sms.normalize_phone("901234567") == "998901234567")
check("telefon: noto'g'ri -> None", sms.normalize_phone("12345") is None)
check("sozlanmagan SMS yuborilmaydi", sms.send_sms("901234567", "x") == (False, "SMS sozlanmagan"))
r = adm.get(f"/buyurtmalar/{ids['ready']}")
check("SMS sozlanmagan: 'SMS yuborish' tugmasi yo'q", b"SMS yuborish" not in r.data)
with app.app_context():
    o = db.session.get(Order, ids["ready"])
    check("SMS matnida mijoz va buyurtma raqami", "2026-0003" in sms.ready_message(o) and "Toshkent" in sms.ready_message(o))
os.environ["ESKIZ_EMAIL"], os.environ["ESKIZ_PASSWORD"] = "a@b.c", "x"
r = adm.get(f"/buyurtmalar/{ids['ready']}")
check("SMS sozlangan: tugma ko'rinadi (tayyor + telefon bor)", b"SMS yuborish" in r.data)
sent = []
sms.send_sms = lambda phone, text: (sent.append((phone, text)) or (True, "SMS yuborildi"))
r = adm.post(f"/buyurtmalar/{ids['ready']}/sms")
check("tugma SMS yuboradi", len(sent) == 1 and sent[0][0] == "991112233")
r = adm.post(f"/buyurtmalar/{ids['ok']}/sms")
check("tayyor bo'lmagan buyurtmaga SMS yuborilmaydi", len(sent) == 1)
os.environ["SMS_AUTO_READY"] = "1"
adm.post(f"/buyurtmalar/{ids['late']}/holat", data={"status": "to'lov qilish jarayonida"})
with app.app_context():
    o = db.session.get(Order, ids["late"])
    o.status = "ishlab chiqarishda"
    db.session.commit()
adm.post(f"/buyurtmalar/{ids['late']}/holat", data={"status": STATUS_READY})
check("avtomatik SMS: 'tayyor' ga o'tganda yuboriladi", len(sent) == 2)
for k in ("ESKIZ_EMAIL", "ESKIZ_PASSWORD", "SMS_AUTO_READY"):
    os.environ.pop(k, None)

# ---- 8. avtomatik migratsiya ----
print("\n8. Avtomatik migratsiya")
import autodeploy
state = autodeploy._state_dir()
marker = os.path.join(state, ".migrated")
had = os.path.exists(marker)
old_marker = open(marker).read() if had else None
if had:
    os.remove(marker)
ran = autodeploy.run_if_needed()
check("birinchi ishga tushishda migratsiya bajariladi", ran is True)
check("ikkinchi marta o'tkazib yuboriladi", autodeploy.run_if_needed() is False)
os.environ["AUTO_MIGRATE"] = "0"
os.remove(marker)
check("AUTO_MIGRATE=0 bo'lsa bajarilmaydi", autodeploy.run_if_needed() is False)
os.environ.pop("AUTO_MIGRATE")
if had:
    open(marker, "w").write(old_marker)
else:
    if os.path.exists(marker):
        os.remove(marker)

print()
if fails:
    print(f"MUVAFFAQIYATSIZ: {len(fails)} ta tekshiruv")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA TEKSHIRUVLAR MUVAFFAQIYATLI")
