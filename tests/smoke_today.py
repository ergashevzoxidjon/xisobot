"""
Bugungi (2026-08-29, to'rtinchi bosqich) o'zgarishlar uchun maxsus tekshiruv:
  1. Migratsiya (v12) ikki marta ishga tushirilsa ham xatosiz.
  2. HR: Oylik/Avans/KPI turkumlari to'g'ri yoziladi, Boss ham to'lov kirita oladi.
  3. Ombor: kirimda joylashuv kiritilsa, mahsulot kartochkasiga yoziladi.
  4. Mijozlar bilan ishlash — Kanban pipeline: karta ochish, erkin bosqich
     almashtirish, "Otkaz berdi" uchun sabab majburiyligi, buyurtma bilan
     bog'lanish, izoh qo'shish, o'chirish.
  5. Bosh sahifa (dashboard): "Diqqat talab qiladi" faqat adminda, moliyaviy
     kartalar reports.view bo'lganlarda (uchinchi so'rov, 2026-08-29).

Ishga tushirish:  python tests/smoke_today.py
"""
import os
import sys
import tempfile
from datetime import timedelta
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


# ---------------------------------------------------------------- 1. migratsiya
print("=== MIGRATSIYA (v12) IDEMPOTENTLIGI ===")
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
    ClientPipelineCard, ClientPipelineEvent, Order, OrderItem, Expense, Payment,
    PAYMENT_KIND_OYLIK, PAYMENT_KIND_AVANS, PAYMENT_KIND_KPI,
    PIPELINE_STAGE_NEW, PIPELINE_STAGE_CONTACTED, PIPELINE_STAGE_PROPOSAL,
    PIPELINE_STAGE_WON, PIPELINE_STAGE_LOST,
    ORDER_PAYMENT_METHODS, CashHandover, HANDOVER_PENDING, HANDOVER_CONFIRMED,
    CASH_SOURCE_OFFICE, CASH_SOURCE_OWNER,
)
from queries import (
    manager_month_summary, all_managers_month_summary, cash_balance,
    cash_received, cash_source_totals, total_order_cash_on_hand,
)
from utils import today_local, month_bounds

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

    # Telefon/tug'ilgan sanasiz xodim yaratilmasligi kerak (2026-08-30,
    # foydalanuvchi qarori — "Manzil" o'rniga "Tug'ilgan sana", barcha
    # shaxsiy ma'lumotlar majburiy).
    r0 = c.post("/hr/yangi", data={"full_name": "Toliqsiz Xodim", "phone": "",
                                    "birth_date": "", "user_id": "", "note": ""},
                follow_redirects=True)
    check("HR: telefon/tug'ilgan sanasiz xodim rad etiladi (200, flash)", r0.status_code == 200)

    r = c.post("/hr/yangi", data={"full_name": "Smoke Xodim", "phone": "+998901112233",
                                   "birth_date": "1995-05-20",
                                   "user_id": "", "note": ""}, follow_redirects=True)
    check("HR: yangi xodim yaratildi (200)", r.status_code == 200)

with app.app_context():
    check("HR: telefon/sanasiz xodim bazada yo'q",
          Employee.query.filter_by(full_name="Toliqsiz Xodim").first() is None)

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
        "payment_method": "naqd", "cash_source": "ofis",
    }, follow_redirects=True)
    check("Ombor: kirim qilindi (200)", r.status_code == 200)

with app.app_context():
    m = db.session.get(Material, material_id)
    check("Ombor: material.location='B-3 raf' bo'lib yozildi", m.location == "B-3 raf")

# ---------------------------------------------------------------- 4. Mijozlar bilan ishlash (Kanban pipeline)
print("\n=== MIJOZLAR BILAN ISHLASH — KANBAN PIPELINE (2026-08-29, to'rtinchi bosqich) ===")
with app.test_client() as c:
    login(c, "mgr_t")

    # Karta ochish — mavjud mijoz client_id orqali tanlanadi. Har doim
    # "yangi" bosqichida boshlanadi, avtomatik hech qayerga otkazmaydi.
    r = c.post("/menejerlar/pipeline/yangi", data={
        "client_id": str(client_id), "client_name": "Smoke MChJ", "note": "birinchi aloqa",
    })
    check("Pipeline: karta ochilgach karta detaliga redirect (302)", r.status_code == 302)
    check("Pipeline: redirect orders.new_order'ga EMAS, karta detaliga",
          "/menejerlar/pipeline/" in r.location and "buyurtmalar/yangi" not in r.location)

    # Ikkinchi karta — mijoz bazada yo'q, shu yerning o'zida ochiladi
    r2 = c.post("/menejerlar/pipeline/yangi", data={
        "client_name": "Yangi Prospekt", "client_company": "Prospekt MChJ",
        "client_phone": "+998907778899", "note": "",
    }, follow_redirects=True)
    check("Pipeline: ikkinchi karta (yangi mijoz bilan) ochildi (200)", r2.status_code == 200)

with app.app_context():
    cards = ClientPipelineCard.query.filter_by(manager_id=mgr_id).all()
    check("Pipeline: menejerda 2 ta karta bor", len(cards) == 2)
    check("Pipeline: barcha kartalar 'yangi' bosqichida boshlangan",
          all(cd.stage == PIPELINE_STAGE_NEW for cd in cards))
    card1 = next(cd for cd in cards if cd.client_id == client_id)
    card2 = next(cd for cd in cards if cd.client and cd.client.name == "Yangi Prospekt")
    check("Pipeline: 1-karta client_id ga bog'langan", card1.client_id == client_id)
    check("Pipeline: 2-karta uchun yangi mijoz avtomatik ochilgan",
          card2.client is not None and card2.client.name == "Yangi Prospekt")
    check("Pipeline: karta ochilganda 1 ta voqea yozildi", len(card1.events) == 1)

# Yangi mijoz telefon/korxonasiz kiritilsa karta ochilmasligi kerak
# (2026-08-30, foydalanuvchi qarori — "yangi mijoz yaratishda ham barcha
# bo'limlarni to'ldirish shart").
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post("/menejerlar/pipeline/yangi", data={
        "client_name": "Toliqsiz Mijoz", "client_company": "", "client_phone": "", "note": "",
    }, follow_redirects=True)
    check("Pipeline: telefon/korxonasiz yangi mijoz bilan karta rad etiladi (200, flash)",
          r.status_code == 200)

with app.app_context():
    check("Pipeline: 'Toliqsiz Mijoz' bazada yaratilmadi",
          Client.query.filter_by(name="Toliqsiz Mijoz").first() is None)

# Bir xil (menejer, mijoz) uchun ikkinchi karta ochilmasligi kerak —
# mavjud kartaga yo'naltiriladi.
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post("/menejerlar/pipeline/yangi", data={
        "client_id": str(client_id), "client_name": "Smoke MChJ", "note": "qayta urinish",
    }, follow_redirects=True)
    check("Pipeline: bir xil mijoz uchun ikkinchi urinish ham 200 qaytardi", r.status_code == 200)

with app.app_context():
    dup_count = ClientPipelineCard.query.filter_by(manager_id=mgr_id, client_id=client_id).count()
    check("Pipeline: takroriy urinishdan keyin ham faqat 1 ta karta bor (dublikat yo'q)", dup_count == 1)

# Boss va xarajatchi — umumiy (barcha menejerlar) taxtani ko'ra olishi
# kerak, lekin karta ocha olmasligi kerak
with app.test_client() as c:
    login(c, "boss_t")
    r = c.get("/menejerlar/pipeline")
    check("Pipeline: Boss umumiy taxtani (barcha menejerlar) ko'ra oladi", r.status_code == 200)
    check("Pipeline: Boss 'Yangi karta' tugmasini ko'rmaydi", b"Yangi karta" not in r.data)
    r2 = c.post("/menejerlar/pipeline/yangi", data={
        "client_name": "Boss urinishi",
    }, follow_redirects=True)
    check("Pipeline: Boss o'zi karta OCHA OLMAYDI (ruxsat yo'q)", r2.status_code == 200)

with app.app_context():
    check("Pipeline: Boss urinishidan keyin ham kartalar soni 2 (o'zgarmagan)",
          ClientPipelineCard.query.filter_by(manager_id=mgr_id).count() == 2)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.get("/menejerlar/pipeline")
    check("Pipeline: Xarajatchi (ish boshqaruvchi) umumiy taxtani ko'ra oladi", r.status_code == 200)
    r2 = c.get(f"/menejerlar/{mgr_id}")
    check("Pipeline: Xarajatchi menejer sahifasini ko'ra oladi", r2.status_code == 200)
    check("Pipeline: Menejer sahifasida pipeline'ga qisqa havola bor",
          b"Mijozlar bilan ishlash" in r2.data)

# Izoh qo'shish — bosqichni o'zgartirmasdan faoliyat qayd etiladi
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/menejerlar/pipeline/{card1.id}/izoh", data={"note": "qo'ng'iroq qildim"},
               follow_redirects=True)
    check("Pipeline: izoh qo'shildi (200)", r.status_code == 200)

with app.app_context():
    refreshed1 = db.session.get(ClientPipelineCard, card1.id)
    check("Pipeline: izohdan keyin bosqich o'zgarmadi", refreshed1.stage == PIPELINE_STAGE_NEW)
    check("Pipeline: voqealar soni 2 ga yetdi", len(refreshed1.events) == 2)

# Erkin bosqich almashtirish: yangi -> aloqada -> taklif_yuborildi -> muvaffaqiyatli
with app.test_client() as c:
    login(c, "mgr_t")
    for target in [PIPELINE_STAGE_CONTACTED, PIPELINE_STAGE_PROPOSAL, PIPELINE_STAGE_WON]:
        r = c.post(f"/menejerlar/pipeline/{card1.id}/holat", data={"stage": target})
        check(f"Pipeline: bosqich '{target}'ga o'zgartirildi (302)", r.status_code == 302)
        check(f"Pipeline: '{target}'ga o'tish orders.new_order'ga OTKAZMAYDI",
              "buyurtmalar/yangi" not in r.location)
        with app.app_context():
            cd = db.session.get(ClientPipelineCard, card1.id)
            check(f"Pipeline: karta bazada '{target}' bosqichida", cd.stage == target)

# "Otkaz berdi" — sababsiz rad etilishi kerak (holat o'zgarmaydi)
with app.test_client() as c:
    login(c, "mgr_t")
    r_no_reason = c.post(f"/menejerlar/pipeline/{card1.id}/holat", data={"stage": "otkaz"},
                          follow_redirects=True)
    check("Pipeline: sababsiz otkazga o'tkazish rad etiladi (200, flash)", r_no_reason.status_code == 200)

with app.app_context():
    still_won = db.session.get(ClientPipelineCard, card1.id)
    check("Pipeline: sabab kiritilmagansa bosqich o'zgarmaydi (hali muvaffaqiyatli)",
          still_won.stage == PIPELINE_STAGE_WON)

# 2026-08-29 (to'rtinchi so'rov): "muvaffaqiyatli" bosqichidan ham istalgan
# bosqichga (shu jumladan otkazga) erkin o'tish mumkinligini tekshiramiz —
# eski tizimda bu mumkin emas edi.
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/menejerlar/pipeline/{card1.id}/holat",
               data={"stage": "otkaz", "note": "Xato bosilgan edi"})
    check("Pipeline: muvaffaqiyatlidan ham otkazga o'tkazish mumkin (302)", r.status_code == 302)

with app.app_context():
    reverted = db.session.get(ClientPipelineCard, card1.id)
    check("Pipeline: bosqich otkazga o'zgardi, sabab saqlandi",
          reverted.stage == PIPELINE_STAGE_LOST and reverted.events[-1].note == "Xato bosilgan edi")

# ...va yana orqaga, muvaffaqiyatliga qaytarish (keyingi bo'limda shu karta
# orqali buyurtma yaratiladi)
with app.test_client() as c:
    login(c, "mgr_t")
    c.post(f"/menejerlar/pipeline/{card1.id}/holat", data={"stage": "muvaffaqiyatli"})

with app.app_context():
    updated = db.session.get(ClientPipelineCard, card1.id)
    check("Pipeline: bosqich yana 'muvaffaqiyatli'ga qaytarildi", updated.stage == PIPELINE_STAGE_WON)
    check("Pipeline: karta tarixida jami 6 ta voqea (1+1+3+1+1... hech bo'lmasa >=6)",
          len(updated.events) >= 6)

# Buyurtma bilan bog'lanish: pipeline_card_id orqali order.id yoziladi
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post("/buyurtmalar/yangi", data={
        "client_id": str(client_id), "client_name": "Smoke MChJ",
        "pipeline_card_id": str(card1.id),
        "item_type": ["Vizitka"], "item_description": [""],
        "item_quantity": ["10"], "item_unit_price": ["1000"],
        "deadline": today_local().isoformat(),
    }, follow_redirects=True)
    check("Pipeline: pipeline_card_id bilan buyurtma yaratildi (200)", r.status_code == 200)

with app.app_context():
    linked = db.session.get(ClientPipelineCard, card1.id)
    check("Pipeline: kartaga order_id yozildi", linked.order_id is not None)

# O'chirish — voqealar ham kaskad o'chishi kerak
with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/menejerlar/pipeline/{card2.id}/ochirish", follow_redirects=True)
    check("Pipeline: karta o'chirildi (200)", r.status_code == 200)

with app.app_context():
    remaining = ClientPipelineCard.query.filter_by(manager_id=mgr_id).count()
    check("Pipeline: o'chirishdan keyin 1 ta karta qoldi", remaining == 1)
    orphan_events = ClientPipelineEvent.query.filter_by(card_id=card2.id).count()
    check("Pipeline: o'chirilgan kartaning voqealari ham kaskad o'chdi", orphan_events == 0)

# ---------------------------------------------------------------- 4b. To'lov usuli majburiy
# (2026-08-30, foydalanuvchi qarori): mijoz to'lovni qaysi usul yoki
# shartnoma (korxona) orqali qilgani har bir to'lovda majburiy tanlanadi.
print("\n=== BUYURTMA TO'LOVI: TO'LOV USULI MAJBURIY ===")
with app.app_context():
    paid_order_id = db.session.get(ClientPipelineCard, card1.id).order_id

with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/buyurtmalar/{paid_order_id}/tolov", data={
        "amount": "5000", "paid_on": today_local().isoformat(),
    }, follow_redirects=True)
    check("To'lov usulisiz to'lov rad etiladi (200, flash)", r.status_code == 200)

with app.app_context():
    check("To'lov usulisiz to'lov yozuvi yaratilmadi",
          Payment.query.filter_by(order_id=paid_order_id).count() == 0)

with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/buyurtmalar/{paid_order_id}/tolov", data={
        "amount": "5000", "paid_on": today_local().isoformat(),
        "payment_method": "Notogri usul",
    }, follow_redirects=True)
    check("Noto'g'ri to'lov usuli rad etiladi (200, flash)", r.status_code == 200)

with app.app_context():
    check("Noto'g'ri to'lov usulida ham yozuv yaratilmadi",
          Payment.query.filter_by(order_id=paid_order_id).count() == 0)

with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/buyurtmalar/{paid_order_id}/tolov", data={
        "amount": "5000", "paid_on": today_local().isoformat(),
        "payment_method": "Dogovor Marvel", "note": "Smoke test",
    }, follow_redirects=True)
    check("To'g'ri to'lov usuli bilan to'lov qabul qilindi (200)", r.status_code == 200)

with app.app_context():
    saved = Payment.query.filter_by(order_id=paid_order_id).first()
    check("To'lov yozildi va payment_method saqlandi",
          saved is not None and saved.payment_method == "Dogovor Marvel")
    check("ORDER_PAYMENT_METHODS ro'yxatida 8 ta variant bor", len(ORDER_PAYMENT_METHODS) == 8)

# Buyurtmalar ro'yxatida "Kim yaratdi" ustuni va hisobotda "Korxonalar
# bo'yicha tushum" bloki xatosiz chiqishi kerak.
with app.test_client() as c:
    login(c, "admin_t")
    r = c.get("/buyurtmalar/")
    check("Buyurtmalar ro'yxati ochildi (200)", r.status_code == 200)
    check("Ro'yxatda 'Kim yaratdi' ustuni bor", "Kim yaratdi" in r.get_data(as_text=True))

    r2 = c.get("/moliya/hisobot")
    check("Moliyaviy hisobot ochildi (200)", r2.status_code == 200)
    body2 = r2.get_data(as_text=True)
    check("Hisobotda 'Korxonalar bo'yicha tushum' bloki bor",
          "Korxonalar bo'yicha tushum" in body2)
    check("Hisobotda 'Dogovor Marvel' ko'rinadi", "Dogovor Marvel" in body2)

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

# ---------------------------------------------------------------- 5b. Xodimlar tug'ilgan kuni
# (2026-08-30, foydalanuvchi qarori): bugun/ertaga tug'ilgan kuni bo'lgan
# xodimlar haqida eslatma — FAQAT Boss ko'radi.
print("\n=== BOSH SAHIFA: XODIMLAR TUG'ILGAN KUNI (FAQAT BOSS) ===")
with app.app_context():
    today = today_local()
    tomorrow = today + timedelta(days=1)
    bday_today = Employee(full_name="Bugun Tugilgan", phone="+998900000001",
                           birth_date=today.replace(year=1988), is_active=True,
                           created_by=admin_id)
    bday_tomorrow = Employee(full_name="Ertaga Tugilgan", phone="+998900000002",
                              birth_date=tomorrow.replace(year=1990), is_active=True,
                              created_by=admin_id)
    db.session.add_all([bday_today, bday_tomorrow])
    db.session.commit()

for role, uname in [("boss", "boss_t"), ("admin", "admin_t"),
                     ("xarajatchi", "xar_t"), ("menejer", "mgr_t")]:
    with app.test_client() as c:
        login(c, uname)
        r = c.get("/")
        body = r.get_data(as_text=True)
        has_today = "Bugun Tugilgan" in body
        has_tomorrow = "Ertaga Tugilgan" in body
        expected = (role == "boss")
        check(f"Dashboard: {role} uchun tug'ilgan kun eslatmasi (bugun) {'korinadi' if expected else 'yashirilgan'}",
              has_today == expected)
        check(f"Dashboard: {role} uchun tug'ilgan kun eslatmasi (ertaga) {'korinadi' if expected else 'yashirilgan'}",
              has_tomorrow == expected)

# ---------------------------------------------------------------- 6. Pullar
print("\n=== PULLAR: NAQD PUL TOPSHIRISH (2026-09-07) ===")
with app.app_context():
    handover_order = Order(order_number="B-2026-9001", client_id=client_id, created_by=mgr_id)
    handover_order.items.append(OrderItem(
        order_type="Smoke naqd", quantity=1, unit_price=Decimal("80000.00"),
        total_price=Decimal("80000.00"), position=0,
    ))
    handover_order.recalc_from_items()
    db.session.add(handover_order)
    db.session.commit()
    handover_order_id = handover_order.id

with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/buyurtmalar/{handover_order_id}/tolov", data={
        "amount": "80000", "paid_on": today_local().isoformat(),
        "payment_method": "Naqd",
    }, follow_redirects=True)
    check("Pullar: naqd to'lov qabul qilindi (200)", r.status_code == 200)

with app.app_context():
    handover = CashHandover.query.filter_by(order_id=handover_order_id).first()
    check("Pullar: naqd to'lovda CashHandover avtomatik yaratildi", handover is not None)
    check("Pullar: yangi topshiriq 'kutilmoqda' holatida",
          bool(handover) and handover.status == HANDOVER_PENDING)
    check("Pullar: topshiriq summasi to'g'ri", bool(handover) and handover.amount == 80000)
    check("Pullar: bitta faol xarajatchi bo'lgani uchun avtomatik unga tayinlangan",
          bool(handover) and handover.to_user_id == xar_id)
    handover_id = handover.id if handover else None

with app.test_client() as c:
    login(c, "mgr_t")
    r = c.get("/pullar/")
    check("Pullar: menejer 'Pullar' sahifasini ko'ra oladi (money.view)", r.status_code == 200)
    r2 = c.post(f"/pullar/{handover_id}/tasdiqlash", follow_redirects=True)
    check("Pullar: menejerda money.confirm yo'q — tasdiqlay olmaydi (200, ruxsat yo'q)",
          r2.status_code == 200)

with app.app_context():
    still_pending = db.session.get(CashHandover, handover_id)
    check("Pullar: menejer urinishidan keyin ham hali 'kutilmoqda'",
          still_pending.status == HANDOVER_PENDING)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.post(f"/pullar/{handover_id}/tasdiqlash", follow_redirects=True)
    check("Pullar: ish boshqaruvchi qabul qilganini tasdiqladi (200)", r.status_code == 200)

with app.app_context():
    confirmed_h = db.session.get(CashHandover, handover_id)
    check("Pullar: holat 'qabul qilindi'ga o'zgardi", confirmed_h.status == HANDOVER_CONFIRMED)
    check("Pullar: confirmed_by yozildi", confirmed_h.confirmed_by == xar_id)
    check("Pullar: ish boshqaruvchi balansi 80 000 (hali xarajat qilinmagan)",
          cash_balance(xar_id) == 80000)

# ---------------------------------------------------------------- 7. Atkaz sababi majburiy
print("\n=== BUYURTMANI BEKOR QILISHDA MAJBURIY SABAB (2026-09-07) ===")
with app.app_context():
    cancel_order = Order(order_number="B-2026-9002", client_id=client_id, created_by=admin_id)
    cancel_order.items.append(OrderItem(
        order_type="Smoke atkaz", quantity=1, unit_price=Decimal("10000.00"),
        total_price=Decimal("10000.00"), position=0,
    ))
    cancel_order.recalc_from_items()
    db.session.add(cancel_order)
    db.session.commit()
    cancel_order_id = cancel_order.id

with app.test_client() as c:
    login(c, "admin_t")
    r = c.post(f"/buyurtmalar/{cancel_order_id}/holat", data={"status": "bekor qilindi"},
               follow_redirects=True)
    check("Atkaz: sababsiz bekor qilish rad etiladi (200, flash)", r.status_code == 200)

with app.app_context():
    still_new = db.session.get(Order, cancel_order_id)
    check("Atkaz: sababsiz urinishdan keyin holat o'zgarmadi",
          still_new.status == "buyurtma yaratildi")
    check("Atkaz: cancel_reason ham bo'sh qoldi", not still_new.cancel_reason)

with app.test_client() as c:
    login(c, "admin_t")
    r = c.post(f"/buyurtmalar/{cancel_order_id}/holat", data={
        "status": "bekor qilindi", "cancel_reason": "Mijoz voz kechdi, aplata bo'lmadi",
    }, follow_redirects=True)
    check("Atkaz: sabab bilan bekor qilindi (200)", r.status_code == 200)

with app.app_context():
    cancelled = db.session.get(Order, cancel_order_id)
    check("Atkaz: holat 'bekor qilindi'ga o'zgardi", cancelled.status == "bekor qilindi")
    check("Atkaz: sabab saqlandi",
          cancelled.cancel_reason == "Mijoz voz kechdi, aplata bo'lmadi")

# ---------------------------------------------------------------- 8. KPI faqat to'langan summa
print("\n=== KPI: FAQAT TO'LANGAN SUMMA HISOBLANADI (2026-09-07) ===")
with app.app_context():
    # Bu oyda mgr_t allaqachon boshqa to'lovlar qilgan (masalan, 4b-bo'limdagi
    # 5000 va 6-bo'limdagi 80000 naqd) — shuning uchun aniq son emas, balki
    # "shu ikki buyurtmadan oldingi/keyingi farq"ni tekshiramiz.
    start0, end0 = month_bounds(today_local().year, today_local().month)
    baseline_summary = manager_month_summary(mgr_id, start0, end0)
    baseline_total = baseline_summary["total_sum"]

    unpaid_order = Order(order_number="B-2026-9003", client_id=client_id, created_by=mgr_id)
    unpaid_order.items.append(OrderItem(
        order_type="KPI to'lanmagan", quantity=1, unit_price=Decimal("200000.00"),
        total_price=Decimal("200000.00"), position=0,
    ))
    unpaid_order.recalc_from_items()
    paid_order2 = Order(order_number="B-2026-9004", client_id=client_id, created_by=mgr_id)
    paid_order2.items.append(OrderItem(
        order_type="KPI to'langan", quantity=1, unit_price=Decimal("100000.00"),
        total_price=Decimal("100000.00"), position=0,
    ))
    paid_order2.recalc_from_items()
    db.session.add_all([unpaid_order, paid_order2])
    db.session.commit()
    unpaid_order_id = unpaid_order.id
    paid_order2_id = paid_order2.id

with app.test_client() as c:
    login(c, "mgr_t")
    r = c.post(f"/buyurtmalar/{paid_order2_id}/tolov", data={
        "amount": "100000", "paid_on": today_local().isoformat(),
        "payment_method": "Karta",
    }, follow_redirects=True)
    check("KPI: bitta buyurtmaga to'lov kiritildi (200)", r.status_code == 200)

with app.app_context():
    start, end = month_bounds(today_local().year, today_local().month)
    summary = manager_month_summary(mgr_id, start, end)
    check("KPI: to'langan buyurtma (100 000) summaga qo'shildi, to'lanmagan (200 000) kirmadi",
          summary["total_sum"] == baseline_total + 100000)
    check("KPI: order_count hamon shu oydagi barcha (bekor qilinmagan) buyurtmalarni sanaydi",
          summary["order_count"] >= 2)

    all_stats = all_managers_month_summary(start, end)
    check("KPI: all_managers_month_summary ham faqat to'langan summani beradi",
          all_stats.get(mgr_id, {}).get("total_sum") == summary["total_sum"])

# ---------------------------------------------------------------- 9. OFIS/Zoxidjon naqd manba
print("\n=== OMBOR: NAQD XARAJAT MANBAI MAJBURIY — OFIS/ZOXIDJON (2026-09-07) ===")

with app.app_context():
    expense_count_before = Expense.query.count()
    # Boshqa (masalan 3-bo'lim, admin_t) testlarda ham OFIS/Zoxidjon manbasi
    # ishlatilgan bo'lishi mumkin — mutlaq son emas, FARQ tekshiriladi.
    source_totals_before = cash_source_totals()

def _kirim_data(qty, price, extra=None):
    data = {
        "row_material_id": [str(material_id)], "row_material_name": ["Smoke Qog'oz"],
        "row_unit": ["list"], "row_quantity": [qty], "row_price": [price],
        "row_location": [""],
        "moved_on": today_local().isoformat(), "note": "",
        "supplier_name": "Smoke OFIS Taminotchi", "supplier_id": "",
    }
    data.update(extra or {})
    return data

with app.test_client() as c:
    login(c, "xar_t")
    r = c.post("/ombor/kirim", data=_kirim_data("5", "1000", {"payment_method": "naqd"}),
               follow_redirects=True)
    check("Manba: naqd to'lovda manba tanlanmasa rad etiladi (200, flash)", r.status_code == 200)

with app.app_context():
    check("Manba: manbasiz urinishda Expense yozilmadi",
          Expense.query.count() == expense_count_before)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.post("/ombor/kirim", data=_kirim_data(
        "5", "1000", {"payment_method": "naqd", "cash_source": "ofis"}
    ), follow_redirects=True)
    check("Manba: OFIS manbasi bilan xarajat qabul qilindi (200)", r.status_code == 200)

with app.app_context():
    ofis_expense = (Expense.query.filter_by(cash_source=CASH_SOURCE_OFFICE)
                     .order_by(Expense.id.desc()).first())
    check("Manba: OFIS xarajati yozildi, cash_source='ofis'",
          ofis_expense is not None and ofis_expense.cash_source == CASH_SOURCE_OFFICE)
    check("Manba: OFIS xarajatida source_order_id bo'sh",
          ofis_expense is not None and ofis_expense.source_order_id is None)
    check("Manba: OFIS xarajati summasi to'g'ri (5000)",
          ofis_expense is not None and ofis_expense.amount == 5000)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.post("/ombor/kirim", data=_kirim_data(
        "3", "1000", {"payment_method": "naqd", "cash_source": "zoxidjon"}
    ), follow_redirects=True)
    check("Manba: Zoxidjon manbasi bilan xarajat qabul qilindi (200)", r.status_code == 200)

with app.app_context():
    zox_expense = (Expense.query.filter_by(cash_source=CASH_SOURCE_OWNER)
                    .order_by(Expense.id.desc()).first())
    check("Manba: Zoxidjon xarajati yozildi (3000)",
          zox_expense is not None and zox_expense.amount == 3000)

    totals = cash_source_totals()
    check("Manba: cash_source_totals OFIS +5000 ni to'g'ri hisoblaydi",
          totals[CASH_SOURCE_OFFICE] - source_totals_before[CASH_SOURCE_OFFICE] == 5000)
    check("Manba: cash_source_totals Zoxidjon +3000 ni to'g'ri hisoblaydi",
          totals[CASH_SOURCE_OWNER] - source_totals_before[CASH_SOURCE_OWNER] == 3000)

    check("Manba: OFIS/Zoxidjon xarajati xarajatchining shaxsiy naqd balansiga ta'sir qilmaydi",
          cash_balance(xar_id) == 80000)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.post("/ombor/kirim", data=_kirim_data(
        "10", "1000", {"payment_method": "naqd", "cash_source": f"order:{handover_order_id}"}
    ), follow_redirects=True)
    check("Manba: buyurtma puli hisobidan xarajat qabul qilindi (200)", r.status_code == 200)

with app.app_context():
    order_expense = Expense.query.filter_by(source_order_id=handover_order_id).first()
    check("Manba: buyurtma-bog'langan xarajat yozildi, cash_source bo'sh",
          order_expense is not None and order_expense.cash_source is None)
    check("Manba: bu xarajat xarajatchining shaxsiy naqd balansini kamaytiradi (80000-10000=70000)",
          cash_balance(xar_id) == 70000)
    check("Manba: total_order_cash_on_hand() barcha xarajatchilar balansi yig'indisi bilan mos",
          total_order_cash_on_hand() == cash_balance(xar_id))
    check("Manba: cash_received() bruto qabul qilingan (80000) — sarflashdan ta'sirlanmaydi",
          cash_received(xar_id) == 80000)

with app.test_client() as c:
    login(c, "xar_t")
    r = c.post("/ombor/kirim", data=_kirim_data("2", "1000", {"payment_method": "qarzga"}),
               follow_redirects=True)
    check("Manba: 'qarzga' to'lov holatida manba talab qilinmaydi (200)", r.status_code == 200)

# ---------------------------------------------------------------- yakun
os.remove(db_path)
print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA SMOKE TEKSHIRUVLAR MUVAFFAQIYATLI")
