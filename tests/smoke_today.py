"""
Bugungi (2026-08-29, ikkinchi bosqich) o'zgarishlar uchun maxsus tekshiruv:
  1. Migratsiya (v11) ikki marta ishga tushirilsa ham xatosiz.
  2. HR: Oylik/Avans/KPI turkumlari to'g'ri yoziladi, Boss ham to'lov kirita oladi.
  3. Ombor: kirimda joylashuv kiritilsa, mahsulot kartochkasiga yoziladi.
  4. Manager kunlik mijozlar jurnali: muvaffaqiyatli/tasdiqlash/otkaz oqimlari,
     holat o'zgartirish, buyurtma bilan bog'lanish, o'chirish.
  5. Bosh sahifa (dashboard): "Diqqat talab qiladi" faqat adminda, moliyaviy
     kartalar reports.view bo'lganlarda (uchinchi so'rov, 2026-08-29).

Ishga tushirish:  python tests/smoke_today.py
"""
import os
import sys
import tempfile
from datetime import timedelta

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, APP)

os.environ["SECRET_KEY"] = "test-secret"

fails = []


def check(label, cond):
    status = "OK  " if cond else "FAIL"
    print(f"  {status} {label}")
    if not cond:
        fails.append(label)


# ---------------------------------------------------------------- 1. migratsiya
print("=== MIGRATSIYA (v11) IDEMPOTENTLIGI ===")
db_fd, db_path = tempfile.mkstemp(suffix=".sqlite")
os.close(db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

import migrate_db
migrate_db.main()
migrate_db.main()  # ikkinchi marta — xato bermasligi kerak
check("migrate_db.main() ikki marta xatosiz ishladi", True)

# ---------------------------------------------------------------- test app
from app import create_app
from extensions import db
from models import (
    User, Client, Employee, EmployeeSalary, EmployeeAdvance, Material,
    ManagerClientLog, Order, Expense,
    PAYMENT_KIND_OYLIK, PAYMENT_KIND_AVANS, PAYMENT_KIND_KPI,
    LOG_STATUS_SUCCESS, LOG_STATUS_PENDING, LOG_STATUS_DECLINED,
)
from utils import today_local

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.session.query(User).delete()
    db.session.commit()

    admin = User(username="admin_t", full_name="Admin Test", role="admin", is_active_user=True)
    admin.set_password("parol123")
    mgr = User(username="mgr_t", full_name="Manager Test", role="menejer", is_active_user=True)
    mgr.set_password("parol123")
    xar = User(username="xar_t", full_name="Xarajatchi Test", role="xarajatchi", is_active_user=True)
    xar.set_password("parol123")
    boss = User(username="boss_t", full_name="Boss Test", role="boss", is_active_user=True)
    boss.set_password("parol123")
    db.session.add_all([admin, mgr, xar, boss])
    db.session.flush()

    cl = Client(name="Smoke MChJ", phone="+998900000000", company="Smoke Korxona")
    db.session.add(cl)

    mat = Material(name="Smoke Qog'oz", unit="list")
    db.session.add(mat)

    db.session.commit()
    admin_id, mgr_id, xar_id, boss_id = admin.id, mgr.id, xar.id, boss.id
    client_id = cl.id
    material_id = mat.id


def login(c, username):
    return c.post("/login", data={"username": username, "password": "parol123"},
                  follow_redirects=True)


# ---------------------------------------------------------------- 2. HR to'lov turkumlari
print("\n=== HR: OYLIK / AVANS / KPI TURKUMLARI ===")
with app.test_client() as c:
    login(c, "admin_t")

    r = c.post("/hr/yangi", data={"full_name": "Smoke Xodim", "phone": "", "address": "",
                                   "user_id": "", "note": ""}, follow_redirects=True)
    check("HR: yangi xodim yaratildi (200)", r.status_code == 200)

with app.app_context():
    emp = Employee.query.filter_by(full_name="Smoke Xodim").first()
    check("HR: xodim bazada topildi", emp is not None)
    emp_id = emp.id if emp else None

with app.test_client() as c:
    login(c, "admin_t")
    today_iso = today_local().isoformat()

    r1 = c.post(f"/hr/{emp_id}/avans",
                data={"kind": "oylik", "amount": "2000000", "paid_on": today_iso, "note": ""},
                follow_redirects=True)
    r2 = c.post(f"/hr/{emp_id}/avans",
                data={"kind": "avans", "amount": "500000", "paid_on": today_iso, "note": "shoshilinch"},
                follow_redirects=True)
    r3 = c.post(f"/hr/{emp_id}/avans",
                data={"kind": "kpi", "amount": "300000", "paid_on": today_iso, "note": ""},
                follow_redirects=True)
    check("HR: oylik to'lovi yozildi (200)", r1.status_code == 200)
    check("HR: avans yozildi (200)", r2.status_code == 200)
    check("HR: KPI to'lovi yozildi (200)", r3.status_code == 200)

with app.app_context():
    payments = EmployeeAdvance.query.filter_by(employee_id=emp_id).all()
    kinds = sorted(p.kind for p in payments)
    check("HR: 3 ta to'lov yozildi, turkumlar to'g'ri",
          kinds == [PAYMENT_KIND_AVANS, PAYMENT_KIND_KPI, PAYMENT_KIND_OYLIK])
    total = sum((p.amount for p in payments), 0)
    check("HR: jami summa 2 800 000", total == 2800000)
    expenses = Expense.query.filter_by(category="ish haqi").all()
    check("HR: har bir to'lov uchun Expense(ish haqi) yozildi (3 ta)", len(expenses) == 3)
    descs = sorted(e.description.split(":")[0] for e in expenses)
    check("HR: Expense tavsifida turkum nomi bor (Avans/KPI/Oylik)",
          descs == ["Avans", "KPI", "Oylik"])

# Boss ham to'lov kirita olishi kerak (2026-08-29, foydalanuvchi qarori)
with app.test_client() as c:
    login(c, "boss_t")
    r = c.post(f"/hr/{emp_id}/avans",
               data={"kind": "avans", "amount": "100000", "paid_on": today_local().isoformat(), "note": "boss"},
               follow_redirects=True)
    check("HR: Boss ham avans kirita oldi (200, hr.pay)", r.status_code == 200)
    r2 = c.get(f"/hr/{emp_id}")
    check("HR: Boss xodim kartochkasini ko'ra oladi", r2.status_code == 200)

# Menejer HR'ga umuman kira olmasligi kerak
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.get("/hr/", follow_redirects=True)
    check("HR: oddiy menejer HR ro'yxatiga kira olmaydi", b"HR" not in r.data or r.request.path != "/hr/")

# ---------------------------------------------------------------- 3. Ombor joylashuvi
print("\n=== OMBOR: KIRIMDA JOYLASHUV ===")
with app.test_client() as c:
    login(c, "admin_t")
    r = c.post("/ombor/kirim", data={
        "row_material_id": [str(material_id)], "row_material_name": ["Smoke Qog'oz"],
        "row_unit": ["list"], "row_quantity": ["100"], "row_price": ["500"],
        "row_location": ["B-3 raf"],
        "moved_on": today_local().isoformat(), "note": "",
        "supplier_name": "Smoke Taminotchi", "supplier_id": "",
        "payment_method": "naqd",
    }, follow_redirects=True)
    check("Ombor: kirim qilindi (200)", r.status_code == 200)

with app.app_context():
    m = db.session.get(Material, material_id)
    check("Ombor: material.location='B-3 raf' bo'lib yozildi", m.location == "B-3 raf")

# ---------------------------------------------------------------- 4. Manager kunlik jurnal
print("\n=== MANAGER KUNLIK MIJOZLAR JURNALI (alohida sahifa, mijoz-avval oqimi) ===")
with app.test_client() as c:
    login(c, "mgr_t")

    # Muvaffaqiyatli — mavjud mijoz client_id orqali tanlanadi
    r = c.post("/menejerlar/jurnal/qoshish", data={
        "status": "muvaffaqiyatli", "client_id": str(client_id),
        "client_name": "Smoke MChJ",
        "log_date": today_local().isoformat(), "note": "",
    })
    check("Jurnal: muvaffaqiyatli yozuv -> orders.new_order ga redirect (302)", r.status_code == 302)
    check("Jurnal: redirect manzilida client_id va manager_log_id bor",
          "client_id=" in r.location and "manager_log_id=" in r.location)

    # Tasdiqlash jarayonida — mijoz bazada yo'q, shu yerning o'zida ochiladi
    r2 = c.post("/menejerlar/jurnal/qoshish", data={
        "status": "tasdiqlash_jarayonida", "client_name": "Yangi Prospekt",
        "client_company": "Prospekt MChJ", "client_phone": "+998907778899",
        "log_date": today_local().isoformat(), "note": "",
    }, follow_redirects=True)
    check("Jurnal: tasdiqlash jarayonida yozuv yaratildi (200)", r2.status_code == 200)

    # Otkaz — sababsiz rad etilishi kerak (mijoz ham ochilmaydi)
    r3_no_reason = c.post("/menejerlar/jurnal/qoshish", data={
        "status": "otkaz", "client_name": "Sababsiz Otkaz",
        "log_date": today_local().isoformat(), "note": "",
    }, follow_redirects=True)
    check("Jurnal: otkaz sababisiz -> rad etiladi (200, yozuv yaratilmaydi)",
          r3_no_reason.status_code == 200)

    # Otkaz — sabab bilan (majburiy maydon to'ldirilgan)
    r3 = c.post("/menejerlar/jurnal/qoshish", data={
        "status": "otkaz", "client_name": "Voz Kechgan",
        "log_date": today_local().isoformat(), "note": "Narx mos kelmadi",
    }, follow_redirects=True)
    check("Jurnal: otkaz yozuvi sabab bilan yaratildi (200)", r3.status_code == 200)

with app.app_context():
    logs = ManagerClientLog.query.filter_by(manager_id=mgr_id).all()
    check("Jurnal: bugun 3 ta yozuv bor (sababsiz otkaz urinishi hisobga kirmagan)", len(logs) == 3)
    statuses = sorted(l.status for l in logs)
    check("Jurnal: statuslar to'g'ri (muvaffaqiyatli/otkaz/tasdiqlash_jarayonida)",
          statuses == sorted([LOG_STATUS_SUCCESS, LOG_STATUS_DECLINED, LOG_STATUS_PENDING]))
    pending_entry = next(l for l in logs if l.status == LOG_STATUS_PENDING)
    pending_id = pending_entry.id
    success_entry = next(l for l in logs if l.status == LOG_STATUS_SUCCESS)
    declined_entry = next(l for l in logs if l.status == LOG_STATUS_DECLINED)
    check("Jurnal: muvaffaqiyatli yozuv client_id ga bog'langan", success_entry.client_id == client_id)
    check("Jurnal: otkaz yozuvida sabab saqlangan", declined_entry.note == "Narx mos kelmadi")
    check("Jurnal: tasdiqlash jarayonidagi yozuv uchun yangi mijoz avtomatik ochilgan",
          pending_entry.client is not None and pending_entry.client.name == "Yangi Prospekt")

# Boss va xarajatchi — umumiy (barcha menejerlar) jurnal sahifasini ko'ra
# olishi kerak, lekin qo'sha olmasligi kerak
with app.test_client() as c:
    login(c, "boss_t")
    r = c.get("/menejerlar/jurnal")
    check("Jurnal: Boss umumiy jurnal sahifasini (barcha menejerlar) ko'ra oladi", r.status_code == 200)
    check("Jurnal: Boss sahifada menejer ustunini ko'radi", b"Menejer" in r.data)
    r2 = c.post("/menejerlar/jurnal/qoshish", data={
        "status": "otkaz", "client_name": "Boss urinishi", "note": "sabab",
        "log_date": today_local().isoformat(),
    }, follow_redirects=True)
    check("Jurnal: Boss o'zi yozuv QO'SHA OLMAYDI (ruxsat yo'q)", r2.status_code == 200)

with app.app_context():
    logs_after = ManagerClientLog.query.filter_by(manager_id=mgr_id).count()
    check("Jurnal: Boss urinishidan keyin ham yozuvlar soni 3 (o'zgarmagan)", logs_after == 3)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.get("/menejerlar/jurnal")
    check("Jurnal: Xarajatchi (ish boshqaruvchi) umumiy jurnal sahifasini ko'ra oladi", r.status_code == 200)
    r2 = c.get(f"/menejerlar/{mgr_id}")
    check("Jurnal: Xarajatchi menejer sahifasini ko'ra oladi", r2.status_code == 200)
    check("Jurnal: Menejer sahifasida jurnalga qisqa havola bor",
          b"Kunlik mijozlar bilan ishlash" in r2.data)

# Holatni o'zgartirish: tasdiqlash_jarayonida -> otkaz, sababsiz rad etiladi
with app.test_client() as c:
    login(c, "mgr_t")
    r_no_reason = c.post(f"/menejerlar/jurnal/{pending_id}/holat", data={"status": "otkaz"},
                          follow_redirects=True)
    check("Jurnal: sababsiz otkazga o'tkazish rad etiladi (200, flash)", r_no_reason.status_code == 200)

with app.app_context():
    still_pending = db.session.get(ManagerClientLog, pending_id)
    check("Jurnal: sabab kiritilmagansa holat o'zgarmaydi",
          still_pending.status == LOG_STATUS_PENDING)

# Holatni o'zgartirish: tasdiqlash_jarayonida -> muvaffaqiyatli
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/menejerlar/jurnal/{pending_id}/holat", data={"status": "muvaffaqiyatli"})
    check("Jurnal: holat o'zgartirish -> orders.new_order ga redirect", r.status_code == 302)

with app.app_context():
    updated = db.session.get(ManagerClientLog, pending_id)
    check("Jurnal: holat 'muvaffaqiyatli' ga o'zgardi", updated.status == LOG_STATUS_SUCCESS)

# Buyurtma bilan bog'lanish: manager_log_id orqali order.id yoziladi
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post("/buyurtmalar/yangi", data={
        "client_id": str(client_id), "client_name": "Smoke MChJ",
        "manager_log_id": str(success_entry.id),
        "item_type": ["Vizitka"], "item_description": [""],
        "item_quantity": ["10"], "item_unit_price": ["1000"],
        "deadline": today_local().isoformat(),
    }, follow_redirects=True)
    check("Jurnal: manager_log_id bilan buyurtma yaratildi (200)", r.status_code == 200)

with app.app_context():
    linked = db.session.get(ManagerClientLog, success_entry.id)
    check("Jurnal: yozuvga order_id yozildi", linked.order_id is not None)

# O'chirish
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/menejerlar/jurnal/{declined_entry.id}/ochirish", follow_redirects=True)
    check("Jurnal: yozuv o'chirildi (200)", r.status_code == 200)

with app.app_context():
    remaining = ManagerClientLog.query.filter_by(manager_id=mgr_id).count()
    check("Jurnal: o'chirishdan keyin 2 ta yozuv qoldi", remaining == 2)

# ---------------------------------------------------------------- 5. Bosh sahifa rol bo'yicha
print("\n=== BOSH SAHIFA: ALERTS VA MOLIYAVIY KARTALAR ROL BO'YICHA ===")
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post("/buyurtmalar/yangi", data={
        "client_id": str(client_id), "client_name": "Smoke MChJ",
        "item_type": ["Banner"], "item_description": [""],
        "item_quantity": ["1"], "item_unit_price": ["100000"],
        "deadline": (today_local() - timedelta(days=5)).isoformat(),
    }, follow_redirects=True)
    check("Dashboard: muddati o'tgan test buyurtma yaratildi (200)", r.status_code == 200)

for role, uname in [("admin", "admin_t"), ("boss", "boss_t"),
                     ("xarajatchi", "xar_t"), ("menejer", "mgr_t")]:
    with app.test_client() as c:
        login(c, uname)
        r = c.get("/")
        check(f"Dashboard: {role} Bosh sahifaga kira oladi (200)", r.status_code == 200)

        has_alerts = "Diqqat talab qiladi".encode() in r.data
        expected_alerts = (role == "admin")
        check(f"Dashboard: {role} uchun 'Diqqat talab qiladi' {'korinadi' if expected_alerts else 'yashirilgan'}",
              has_alerts == expected_alerts)

        has_finance = "Shu oy tushum".encode() in r.data
        expected_finance = role in ("admin", "boss", "xarajatchi")
        check(f"Dashboard: {role} uchun moliyaviy kartalar {'korinadi' if expected_finance else 'yashirilgan'}",
              has_finance == expected_finance)

# ---------------------------------------------------------------- yakun
os.remove(db_path)
print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA SMOKE TEKSHIRUVLAR MUVAFFAQIYATLI")
