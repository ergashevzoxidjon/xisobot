"""Pul formalarini takror yuborishdan himoya (2026-11-18, takliflar #7).

  1. Har bir pul formasi: bir kalit bilan ikkinchi yuborish hech narsa yozmaydi.
  2. Xato bilan qaytgan forma kalitni "yondirmaydi" — to'g'rilab qayta yuborsa bo'ladi.
  3. Kalitsiz yuborish avvalgidek ishlaydi (eski ochiq sahifa, tashqi mijoz).
  4. Parallel so'rov: tekshiruvdan o'tib ketgan ikkinchi so'rov commit'da to'xtaydi
     va uning HAMMA yozuvlari bekor bo'ladi (poyga holati).
  5. Tezkor kirim takrorida xato emas, birinchi natija qaytadi.
  6. Formalarda kalit bor va har ochilganda yangi.
"""
import html
import os
import re
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
from models import (User, Client, Order, OrderItem, Material, StockMove, Expense, Payment,
                    Supplier, SupplierPayment, CashDeposit, Employee, EmployeeAdvance,
                    SubmitToken, STOCK_IN, STOCK_OUT)
from utils import today_local
import idempotency
import orders as orders_mod
import suppliers as suppliers_mod
import stock as stock_mod
import finance as finance_mod
import money as money_mod
import hr as hr_mod

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()
    u = User(username="admin1", full_name="Admin", role="admin", is_active_user=True)
    u.set_password("parol123")
    db.session.add(u)
    client = Client(name="Test mijoz")
    db.session.add(client)
    db.session.flush()
    order = Order(order_number="B-2026-9001", client_id=client.id, created_by=u.id)
    order.items.append(OrderItem(order_type="Vizitka", quantity=1, unit_price=Decimal("100000.00"),
                                 total_price=Decimal("100000.00"), position=0))
    order.recalc_from_items()
    db.session.add(order)
    sup = Supplier(name="Taminotchi X")
    db.session.add(sup)
    emp = Employee(full_name="Ishchi Bir")
    db.session.add(emp)
    mat = Material(name="Qog'oz", unit="dona", last_price=Decimal("1000.00"))
    db.session.add(mat)
    db.session.flush()
    db.session.add(StockMove(material_id=mat.id, kind=STOCK_IN, quantity=Decimal("10"),
                             unit_price=Decimal("1000.00"), moved_on=today_local(), created_by=u.id))
    db.session.commit()
    order_id, sup_id, emp_id, mat_id = order.id, sup.id, emp.id, mat.id


def text(r):
    return html.unescape(r.data.decode()).replace("\xa0", " ")


def count(model, **flt):
    with app.app_context():
        return model.query.filter_by(**flt).count()


def qty():
    with app.app_context():
        return db.session.get(Material, mat_id).quantity


DUP = "allaqachon bajarilgan"
tok = iter(f"tok{i:028d}" for i in range(1000))

with app.test_client() as c:
    c.post("/login", data={"username": "admin1", "password": "parol123"})

    print("\n=== 1. Takror yuborish: ikkinchisi hech narsa yozmaydi ===")
    t = next(tok)
    pay = {"amount": "50000", "payment_method": "Terminal", "form_token": t}
    r = c.post(f"/buyurtmalar/{order_id}/tolov", data=pay, follow_redirects=True)
    check("To'lov birinchi marta yozildi", count(Payment, order_id=order_id) == 1)
    r = c.post(f"/buyurtmalar/{order_id}/tolov", data=pay, follow_redirects=True)
    check("To'lov ikkinchi marta yozilmadi", count(Payment, order_id=order_id) == 1)
    check("Foydalanuvchiga «allaqachon bajarilgan» deyiladi", DUP in text(r))

    t = next(tok)
    sp = {"amount": "20000", "form_token": t}
    c.post(f"/taminotchilar/{sup_id}/tolov", data=sp, follow_redirects=True)
    r = c.post(f"/taminotchilar/{sup_id}/tolov", data=sp, follow_redirects=True)
    check("Taminotchiga to'lov bir marta yozildi", count(SupplierPayment, supplier_id=sup_id) == 1 and DUP in text(r))

    t = next(tok)
    dep = {"amount": "30000", "source": "Zoxidjon", "channel": "naqd", "form_token": t}
    c.post("/pullar/ofis-toldirish", data=dep, follow_redirects=True)
    r = c.post("/pullar/ofis-toldirish", data=dep, follow_redirects=True)
    check("OFIS to'ldirish bir marta yozildi", count(CashDeposit) == 1 and DUP in text(r))

    t = next(tok)
    adv = {"kind": "avans", "amount": "100000", "form_token": t}
    c.post(f"/hr/{emp_id}/avans", data=adv, follow_redirects=True)
    r = c.post(f"/hr/{emp_id}/avans", data=adv, follow_redirects=True)
    check("Avans bir marta yozildi (avans va xarajat)",
          count(EmployeeAdvance, employee_id=emp_id) == 1
          and count(Expense, category="ish haqi") == 1 and DUP in text(r))

    t = next(tok)
    rc = {"supplier_name": "Taminotchi X", "payment_method": "naqd", "row_material_name": ["Plyonka"],
          "row_unit": ["dona"], "row_quantity": ["5"], "row_price": ["2000"], "form_token": t}
    c.post("/ombor/kirim", data=rc, follow_redirects=True)
    r = c.post("/ombor/kirim", data=rc, follow_redirects=True)
    with app.app_context():
        plyonka = Material.query.filter_by(name="Plyonka").one()
        pq = plyonka.quantity
    check("Ombor kirimi bir marta (qoldiq 5, 10 emas)", pq == Decimal("5") and DUP in text(r))

    t = next(tok)
    ex = {"order_id": str(order_id), "expense_material": [str(mat_id)], "expense_description": [""],
          "expense_quantity": ["3"], "expense_unit_price": ["1000"], "form_token": t}
    c.post("/moliya/xarajatlar/yangi", data=ex, follow_redirects=True)
    r = c.post("/moliya/xarajatlar/yangi", data=ex, follow_redirects=True)
    check("Xarajat (ombordan sarf) bir marta: qoldiq 7, 4 emas", qty() == Decimal("7") and DUP in text(r))

    print("\n=== 2. Xato bilan qaytgan forma kalitni yondirmaydi ===")
    t = next(tok)
    bad = {"amount": "0", "form_token": t}
    r = c.post(f"/taminotchilar/{sup_id}/tolov", data=bad, follow_redirects=True)
    check("Noto'g'ri summa rad etildi", count(SupplierPayment, supplier_id=sup_id) == 1)
    r = c.post(f"/taminotchilar/{sup_id}/tolov", data={"amount": "7000", "form_token": t}, follow_redirects=True)
    check("Shu kalit bilan to'g'rilangan forma saqlandi", count(SupplierPayment, supplier_id=sup_id) == 2 and DUP not in text(r))
    with app.app_context():
        check("Kalit faqat saqlangandan keyin band bo'ldi", SubmitToken.query.filter_by(token=t).count() == 1)

    t = next(tok)
    r = c.post("/moliya/xarajatlar/yangi", data={**ex, "expense_quantity": ["99"], "form_token": t},
               follow_redirects=True)
    check("Qoldiq yetmagan xarajat rad etildi, kalit yonmadi",
          qty() == Decimal("7") and count(SubmitToken, token=t) == 0)
    r = c.post("/moliya/xarajatlar/yangi", data={**ex, "expense_quantity": ["2"], "form_token": t},
               follow_redirects=True)
    check("Miqdori to'g'rilangan forma shu kalit bilan o'tdi (qoldiq 5)", qty() == Decimal("5"))

    print("\n=== 3. Kalitsiz yuborish avvalgidek ishlaydi ===")
    n = count(SupplierPayment, supplier_id=sup_id)
    c.post(f"/taminotchilar/{sup_id}/tolov", data={"amount": "1000"}, follow_redirects=True)
    c.post(f"/taminotchilar/{sup_id}/tolov", data={"amount": "1000"}, follow_redirects=True)
    check("Kalitsiz ikki yuborish — ikkalasi yoziladi (eski xatti-harakat)",
          count(SupplierPayment, supplier_id=sup_id) == n + 2)

    print("\n=== 4. Parallel so'rov (poyga): commit'da to'xtaydi ===")
    # Ikkinchi so'rov tekshiruvdan o'tib ketgan holatni modellashtiramiz:
    # marshrutdagi find_submission() ni o'chirib qo'yamiz — himoya faqat commit_once'da qoladi.
    real = {m: m.find_submission for m in (suppliers_mod, orders_mod, stock_mod, finance_mod, money_mod, hr_mod)}
    try:
        for m in real:
            m.find_submission = lambda *a, **k: None

        t = next(tok)
        sp = {"amount": "11000", "form_token": t}
        n = count(SupplierPayment, supplier_id=sup_id)
        c.post(f"/taminotchilar/{sup_id}/tolov", data=sp, follow_redirects=True)
        r = c.post(f"/taminotchilar/{sup_id}/tolov", data=sp, follow_redirects=True)
        check("Taminotchi to'lovi: parallel nusxa yozilmadi", count(SupplierPayment, supplier_id=sup_id) == n + 1)
        check("Parallel nusxaga ham «allaqachon bajarilgan» deyiladi", DUP in text(r))

        t = next(tok)
        rc2 = {"supplier_name": "Taminotchi X", "payment_method": "naqd", "row_material_name": ["Bo'yoq"],
               "row_unit": ["dona"], "row_quantity": ["4"], "row_price": ["500"], "form_token": t}
        n_exp = count(Expense)
        c.post("/ombor/kirim", data=rc2, follow_redirects=True)
        n_exp_one = count(Expense)
        c.post("/ombor/kirim", data=rc2, follow_redirects=True)
        with app.app_context():
            boyoq = Material.query.filter_by(name="Bo'yoq").one().quantity
        check("Ombor kirimi: parallel nusxa qoldiq va xarajatni ikkilantirmadi",
              boyoq == Decimal("4") and count(Expense) == n_exp_one and n_exp_one == n_exp + 1)

        t = next(tok)
        ex2 = {**ex, "expense_quantity": ["1"], "form_token": t}
        before = qty()
        c.post("/moliya/xarajatlar/yangi", data=ex2, follow_redirects=True)
        c.post("/moliya/xarajatlar/yangi", data=ex2, follow_redirects=True)
        check("Xarajat: parallel nusxa qoldiqni ikki marta kamaytirmadi", qty() == before - 1)
    finally:
        for m, f in real.items():
            m.find_submission = f

    print("\n=== 5. Tezkor kirim takrori ===")
    t = next(tok)
    q = {"supplier_name": "Taminotchi X", "payment_method": "naqd", "row_material_name": ["Karton"],
         "row_unit": ["dona"], "row_quantity": ["6"], "row_price": ["800"], "form_token": t}
    j1 = c.post("/ombor/kirim/tezkor", data=q).get_json()
    j2 = c.post("/ombor/kirim/tezkor", data=q).get_json()
    with app.app_context():
        karton_moves = StockMove.query.join(Material).filter(Material.name == "Karton").count()
    check("Birinchi tezkor kirim ok", j1.get("ok") is True)
    check("Takror: xato emas, birinchi natija (ok + mahsulot) qaytdi",
          j2.get("ok") is True and j2["material"]["id"] == j1["material"]["id"] and "allaqachon" in j2["message"])
    check("Faqat bitta kirim yozuvi", karton_moves == 1)
    check("Takrorda qoldiq ikki baravar bo'lmadi", j2["material"]["qty"] == j1["material"]["qty"])

    print("\n=== 6. Formalarda kalit bor va har safar yangi ===")
    pages = {
        "ombor kirimi": "/ombor/kirim",
        "xarajat formasi (+tezkor kirim)": "/moliya/xarajatlar/yangi",
        "buyurtma (to'lov)": f"/buyurtmalar/{order_id}",
        "taminotchi (to'lov)": f"/taminotchilar/{sup_id}",
        "pullar (OFIS)": "/pullar/",
        "xodim (avans)": f"/hr/{emp_id}",
    }
    for label, url in pages.items():
        a = re.findall(r'name="form_token" value="([0-9a-f]{32})"', text(c.get(url)))
        b = re.findall(r'name="form_token" value="([0-9a-f]{32})"', text(c.get(url)))
        check(f"{label}: kalit bor, har ochilishda yangi", bool(a) and bool(b) and set(a).isdisjoint(b))
    page = text(c.get("/moliya/xarajatlar/yangi"))
    check("Tezkor kirim oynasida kalit va yangilanish kodi",
          page.count('name="form_token"') >= 2 and "newFormToken()" in page)

    print("\n=== 7. Eski kalitlar tozalanadi ===")
    from datetime import timedelta
    from utils import now_local
    with app.app_context():
        db.session.add(SubmitToken(token="old" + "0" * 29, kind="payment",
                                   created_at=now_local() - timedelta(days=idempotency.KEEP_DAYS + 1)))
        db.session.commit()
        import random
        old_random = random.random
        random.random = lambda: 0.0
        try:
            idempotency._purge_old()
        finally:
            random.random = old_random
        check("30 kundan eski kalit o'chirildi, yangilari qoldi",
              SubmitToken.query.filter_by(token="old" + "0" * 29).count() == 0
              and SubmitToken.query.count() > 5)

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
