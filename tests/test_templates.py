"""
Shablonlarni Flask'siz tekshirish:
  1. Har bir url_for() endpoint'i haqiqatan mavjudmi
  2. Har bir POST forma CSRF tokeniga egami
  3. 4 ta rolning har biri uchun barcha sahifalar xatosiz render bo'ladimi
  4. Rollar bo'yicha menyu va tugmalar to'g'ri yashiriladimi
"""
import re
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

import os
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, APP)

from jinja2 import Environment, FileSystemLoader, StrictUndefined
from template_helpers import (
    status_color, payment_color, status_icon, category_icon, uzs, date_uz, datetime_uz,
)
from utils import today_local

fails = []

# ---------------------------------------------------------------- 1. endpointlar
ROUTE_FILES = ["auth.py", "main.py", "clients.py", "orders.py", "finance.py", "settings.py"]
endpoints = set()
for fname in ROUTE_FILES:
    src = open(f"{APP}/{fname}").read()
    m = re.search(r'(\w+)\s*=\s*Blueprint\("(\w+)"', src)
    if not m:
        continue
    bp_var, bp_name = m.groups()
    for fm in re.finditer(
        r'@' + bp_var + r'\.route\([^)]*\)\s*\n(?:@[\w.]+(?:\([^)]*\))?\s*\n)*def (\w+)', src
    ):
        endpoints.add(f"{bp_name}.{fm.group(1)}")

print(f"Topilgan route'lar ({len(endpoints)}):")
for e in sorted(endpoints):
    print("   ", e)

# shablonlardagi url_for chaqiruvlari
import os
template_files = []
for root, _, files in os.walk(f"{APP}/templates"):
    for f in files:
        if f.endswith(".html"):
            template_files.append(os.path.join(root, f))

print("\n=== url_for() endpointlari tekshiruvi ===")
referenced = set()
for tf in template_files:
    content = open(tf).read()
    for m in re.finditer(r"url_for\(\s*'([\w.]+)'", content):
        referenced.add((m.group(1), os.path.relpath(tf, f"{APP}/templates")))

bad = [(ep, tf) for ep, tf in referenced if ep not in endpoints]
if bad:
    for ep, tf in sorted(bad):
        fails.append(f"MAVJUD BO'LMAGAN endpoint '{ep}' ({tf})")
        print(f"  FAIL {ep}  <- {tf}")
else:
    print(f"  OK   {len(set(e for e, _ in referenced))} ta noyob endpoint — barchasi mavjud")

# ---------------------------------------------------------------- 2. CSRF
print("\n=== CSRF tokeni tekshiruvi (har bir POST forma) ===")
for tf in template_files:
    content = open(tf).read()
    rel = os.path.relpath(tf, f"{APP}/templates")
    for m in re.finditer(r'<form[^>]*method=["\']post["\'][^>]*>(.*?)</form>', content, re.S | re.I):
        body = m.group(1)
        if "csrf()" not in body and "csrf_token" not in body:
            snippet = m.group(0)[:70].replace("\n", " ")
            fails.append(f"CSRF YO'Q: {rel} — {snippet}")
            print(f"  FAIL {rel}: {snippet}")
post_forms = sum(
    len(re.findall(r'<form[^>]*method=["\']post["\']', open(t).read(), re.I))
    for t in template_files
)
if not any("CSRF YO'Q" in f for f in fails):
    print(f"  OK   {post_forms} ta POST forma — barchasida CSRF tokeni bor")

# ---------------------------------------------------------------- 3. render
ROLE_PERMISSIONS = {
    "admin": {"orders.view", "orders.create", "orders.edit", "orders.manage", "orders.delete",
              "clients.view", "clients.create", "clients.delete",
              "expenses.view", "expenses.create", "expenses.analytics",
              "reports.view", "reports.export", "users.manage", "settings.manage"},
    "menejer": {"orders.view", "orders.create", "orders.edit", "orders.manage",
                "clients.view", "clients.create",
                "expenses.view", "expenses.create"},
    "xarajatchi": {"expenses.view", "expenses.create", "expenses.analytics", "orders.view"},
    "buxgalter": {"orders.view", "clients.view", "expenses.view", "expenses.analytics",
                  "reports.view", "reports.export"},
}
ROLE_LABELS = {"admin": "Administrator", "menejer": "Menejer",
               "xarajatchi": "Ish boshqaruvchi", "buxgalter": "Buxgalter"}


def fake_url_for(endpoint, **kw):
    if endpoint not in endpoints:
        raise AssertionError(f"NOMA'LUM ENDPOINT: {endpoint}")
    return f"/_/{endpoint}"


class FakePagination:
    def __init__(self, items, total=None, page=1, pages=3):
        self.items = items
        self.total = total if total is not None else len(items)
        self.page = page
        self.pages = pages
        self.has_prev = page > 1
        self.has_next = page < pages
        self.prev_num = page - 1
        self.next_num = page + 1

    def iter_pages(self, **kw):
        return [1, 2, None, self.pages]


TODAY = today_local()

user = SimpleNamespace(id=1, username="admin", full_name="Test Admin",
                       display_name="Test Admin", role="admin", is_active_user=True)
client = SimpleNamespace(
    id=1, name="Test MChJ", phone="+998901234567", address="Toshkent",
    notes="Izoh matni", total_debt=Decimal("15000.00"), orders_count=3,
)
payment = SimpleNamespace(id=1, amount=Decimal("20000.00"), paid_on=TODAY,
                          note="Naqd", creator=user)
order_file = SimpleNamespace(id=1, original_name="maket.pdf", size_human="1.2 MB",
                             created_at=datetime.now(), creator=user)
tg_settings = SimpleNamespace(id=1, is_enabled=True, bot_token="123:ABC",
                              manager_chat_id="999", notify_new_order=True,
                              notify_payment=False, notify_daily=True, is_ready=True)
company = SimpleNamespace(id=1, name="Test Poligrafiya MChJ", address="Toshkent sh.",
                          phone="+998901234567", email="info@test.uz", tax_id="123456789",
                          bank_name="Ipoteka Bank", bank_account="20208000900001234567",
                          bank_mfo="00443", invoice_note="To'lov 5 kun ichida")
item_a = SimpleNamespace(id=1, order_type="Vizitka", description="Yaltiroq laminat",
                         quantity=100, unit_price=Decimal("500.00"),
                         total_price=Decimal("50000.00"), position=0)
item_b = SimpleNamespace(id=2, order_type="Buklet", description="",
                         quantity=50, unit_price=Decimal("2000.00"),
                         total_price=Decimal("100000.00"), position=1)
order_expense = SimpleNamespace(id=2, date=TODAY, category="xomashyo",
                                amount=Decimal("12000.00"), description="Qog'oz",
                                creator=user, order_id=1)

order = SimpleNamespace(
    id=1, order_number="B-2026-0001", client=client, client_id=1, order_type="Vizitka",
    description="Test tavsif", quantity=100, unit_price=Decimal("500.00"),
    total_price=Decimal("50000.00"), status="jarayonda", payment_status="qisman",
    paid_amount_calc=Decimal("20000.00"), remaining=Decimal("30000.00"),
    deadline=TODAY + timedelta(days=5), created_at=datetime.now(),
    creator=user, payments=[payment], is_overdue=False, days_left=5,
    version=1, is_deleted=False, deleted_at=None, files=[order_file],
    items=[item_a, item_b], items_summary="Vizitka +1 ta",
    expenses=[order_expense], expenses_total=Decimal("12000.00"),
    profit=Decimal("38000.00"),
)
overdue_order = SimpleNamespace(
    id=2, order_number="B-2026-0002", client=client, client_id=1, order_type="Banner",
    description="", quantity=2, unit_price=Decimal("250000.00"),
    total_price=Decimal("500000.00"), status="yangi", payment_status="to'lanmagan",
    paid_amount_calc=Decimal("0.00"), remaining=Decimal("500000.00"),
    deadline=TODAY - timedelta(days=3), created_at=datetime.now(),
    creator=user, payments=[], is_overdue=True, days_left=-3,
    version=1, is_deleted=False, deleted_at=None, files=[],
    items=[], items_summary="Banner",
    expenses=[], expenses_total=Decimal("0.00"), profit=Decimal("500000.00"),
)
expense = SimpleNamespace(id=1, date=TODAY, category="ijara",
                          amount=Decimal("500000.00"), description="Ofis ijarasi",
                          creator=user, order=None, order_id=None)
linked_expense = SimpleNamespace(id=2, date=TODAY, category="xomashyo",
                                 amount=Decimal("12000.00"), description="Qog'oz",
                                 creator=user, order=order, order_id=1)
order_type = SimpleNamespace(id=1, name="Vizitka", unit="dona",
                             default_price=Decimal("150.00"), is_active=True)
audit = SimpleNamespace(id=1, created_at=datetime.now(), user=user, action="create",
                        entity="order", entity_id=1, detail="B-2026-0001 yaratildi")

CONTEXTS = {
    "login.html": {},
    "dashboard.html": dict(
        total_orders=12, active_orders=4, total_clients=5,
        month_income=Decimal("15000000.00"), month_expenses=Decimal("8000000.00"),
        month_profit=Decimal("7000000.00"), profit_change=12.5,
        overdue_orders=[overdue_order], soon_orders=[order], old_debts=[overdue_order],
        alerts_count=3, recent_orders=[order], overdue_debt_days=30,
    ),
    "clients/list.html": dict(clients=[client], pagination=FakePagination([client], 42), q=""),
    "clients/detail.html": dict(
        client=client, orders=[order, overdue_order],
        total_ordered=Decimal("550000.00"), total_paid=Decimal("20000.00"),
        total_debt=Decimal("530000.00"),
    ),
    "clients/form.html": dict(client=None, form=None),
    "orders/list.html": dict(
        orders=[order, overdue_order], pagination=FakePagination([order], 120),
        statuses=["yangi", "jarayonda", "tayyor", "yetkazildi", "bekor qilindi"], status="", q="",
    ),
    "orders/form.html": dict(order_types=[order_type], order=None,
                             prefill=None, form=None),
    "orders/detail.html": dict(order=order, payments=[payment],
                               statuses=["yangi", "jarayonda", "tayyor"]),
    "orders/invoice.html": dict(order=order, today=TODAY, company=company),
    "orders/deleted.html": dict(orders=[order]),
    "finance/expenses.html": dict(
        expenses=[expense, linked_expense], pagination=FakePagination([expense], 33),
        categories=["ijara", "ish haqi", "boshqa"], category="",
        total_all=Decimal("25000000.00"),
    ),
    "finance/expense_form.html": dict(categories=["ijara", "boshqa"], orders=[order],
                                      expense=None, form=None),
    "finance/expense_analytics.html": dict(
        year=2026, total=Decimal("1200000.00"), linked=Decimal("800000.00"),
        general=Decimal("400000.00"),
        category_rows=[{"name": "xomashyo", "amount": Decimal("800000.00"), "count": 12}],
        order_rows=[{"order": order, "spent": Decimal("12000.00"),
                     "revenue": Decimal("150000.00"), "profit": Decimal("138000.00")}],
        product_rows=[{"name": "Vizitka", "spent": Decimal("4000.00"),
                       "revenue": Decimal("50000.00"), "profit": Decimal("46000.00"),
                       "count": 3}],
    ),
    "finance/report.html": dict(
        months=[{"name": "Yanvar", "month": 1, "income": Decimal("100.00"),
                 "expense": Decimal("10.00"), "profit": Decimal("90.00")}],
        year=2026, total_income=Decimal("1000.00"), total_expense=Decimal("400.00"),
        total_profit=Decimal("600.00"),
        category_rows=[{"name": "ijara", "amount": Decimal("300.00")}],
    ),
    "finance/analytics.html": dict(
        year=2026,
        top_clients=[{"name": "Test MChJ", "total": Decimal("5000000.00")}],
        top_types=[{"name": "Vizitka", "count": 12, "total": Decimal("3000000.00")}],
        total_orders=50, cancelled=3, cancel_rate=6.0,
        avg_order=Decimal("450000.00"), revenue_sum=Decimal("22500000.00"),
        debtors=[{"client": client, "debt": Decimal("530000.00")}],
    ),
    "users.html": dict(users=[user]),
    "user_form.html": dict(roles=list(ROLE_LABELS), user=None, form=None),
    "change_password.html": {},
    "audit_log.html": dict(entries=[audit], pagination=FakePagination([audit], 200)),
    "settings/order_types.html": dict(types=[order_type]),
    "settings/order_type_form.html": dict(order_type=None, form=None),
    "settings/company.html": dict(company=company, form=None),
    "settings/telegram.html": dict(settings=tg_settings, form=None),
    "errors/error.html": dict(code=404, title="Topilmadi", message="Sahifa yo'q"),
}

# barcha shablonlar qamrab olinganini tekshiramiz
all_templates = {os.path.relpath(t, f"{APP}/templates").replace("\\", "/") for t in template_files}
uncovered = all_templates - set(CONTEXTS) - {"base.html"}
if uncovered:
    for u in uncovered:
        fails.append(f"TEST QILINMAGAN shablon: {u}")
        print(f"\n  FAIL test qilinmagan shablon: {u}")

print(f"\n=== RENDER: {len(CONTEXTS)} shablon × 4 rol ===")
for role, perms in ROLE_PERMISSIONS.items():
    env = Environment(loader=FileSystemLoader(f"{APP}/templates"), undefined=StrictUndefined)
    env.globals["url_for"] = fake_url_for
    env.globals["get_flashed_messages"] = lambda with_categories=False: (
        [("success", "test xabar")] if with_categories else []
    )
    env.globals["current_user"] = SimpleNamespace(
        is_authenticated=True, id=1, username="test", full_name="Test User",
        display_name="Test User", role=role,
    )
    env.globals["request"] = SimpleNamespace(endpoint="main.dashboard", args={})
    env.globals["csrf_token"] = lambda: "TEST-CSRF-TOKEN"
    env.globals["has_perm"] = lambda p, _p=perms: p in _p
    env.globals["role_label"] = lambda r: ROLE_LABELS.get(r, r)
    env.globals["role_description"] = lambda r: "tavsif"
    env.globals["today"] = today_local
    env.filters["status_color"] = status_color
    env.filters["payment_color"] = payment_color
    env.filters["status_icon"] = status_icon
    env.filters["category_icon"] = category_icon
    env.filters["uzs"] = uzs
    env.filters["date_uz"] = date_uz
    env.filters["datetime_uz"] = datetime_uz

    errors = 0
    for tpl, ctx in CONTEXTS.items():
        try:
            env.get_template(tpl).render(**ctx)
        except Exception as e:
            errors += 1
            fails.append(f"[{role}] {tpl}: {type(e).__name__}: {e}")
            print(f"  FAIL [{role}] {tpl}: {type(e).__name__}: {e}")
    if errors == 0:
        print(f"  OK   {role:<12} — {len(CONTEXTS)} shablon xatosiz")

# ---------------------------------------------------------------- 4. rol ajratish
print("\n=== ROLLAR BO'YICHA MENYU AJRATILISHI ===")
EXPECTED_MENU = {
    "admin": ["Bosh sahifa", "Buyurtmalar", "Mijozlar", "Xarajatlar", "Xarajat tahlili",
              "Moliyaviy hisobot", "Tahlil", "Firma ma'lumotlari",
              "Buyurtma turlari", "Telegram", "O'chirilganlar",
              "Foydalanuvchilar", "Harakatlar jurnali"],
    "menejer": ["Buyurtmalar", "Mijozlar", "Xarajatlar"],
    "xarajatchi": ["Buyurtmalar", "Xarajatlar", "Xarajat tahlili"],
    "buxgalter": ["Bosh sahifa", "Buyurtmalar", "Mijozlar", "Xarajatlar", "Xarajat tahlili",
                  "Moliyaviy hisobot", "Tahlil"],
}
for role, perms in ROLE_PERMISSIONS.items():
    env = Environment(loader=FileSystemLoader(f"{APP}/templates"), undefined=StrictUndefined)
    env.globals.update({
        "url_for": fake_url_for,
        "get_flashed_messages": lambda with_categories=False: [],
        "current_user": SimpleNamespace(is_authenticated=True, id=1, username="t",
                                        full_name="T", display_name="T", role=role),
        "request": SimpleNamespace(endpoint="main.dashboard", args={}),
        "csrf_token": lambda: "T",
        "has_perm": lambda p, _p=perms: p in _p,
        "role_label": lambda r: r, "role_description": lambda r: "",
        "today": today_local,
    })
    for n, f in [("status_color", status_color), ("payment_color", payment_color),
                 ("status_icon", status_icon), ("category_icon", category_icon),
                 ("uzs", uzs), ("date_uz", date_uz), ("datetime_uz", datetime_uz)]:
        env.filters[n] = f

    out = env.get_template("dashboard.html").render(**CONTEXTS["dashboard.html"])
    nav = out[out.find("<nav"):out.find("</nav>")]
    links = [l.strip() for l in re.findall(r'bi-[\w-]+"></i>\s*([^<\n]+)', nav)]
    if links == EXPECTED_MENU[role]:
        print(f"  OK   {role:<12} -> {links}")
    else:
        fails.append(f"{role} menyusi: kutilgan {EXPECTED_MENU[role]}, olingan {links}")
        print(f"  FAIL {role:<12} -> {links}")
        print(f"       kutilgan: {EXPECTED_MENU[role]}")

# menejer buyurtma sahifasida "Excel" tugmasini ko'rmasligi kerak (reports.export yo'q)
print("\n=== TUGMALARNI YASHIRISH ===")
def render_for(role, tpl):
    perms = ROLE_PERMISSIONS[role]
    env = Environment(loader=FileSystemLoader(f"{APP}/templates"), undefined=StrictUndefined)
    env.globals.update({
        "url_for": fake_url_for,
        "get_flashed_messages": lambda with_categories=False: [],
        "current_user": SimpleNamespace(is_authenticated=True, id=1, username="t",
                                        full_name="T", display_name="T", role=role),
        "request": SimpleNamespace(endpoint="orders.list_orders", args={}),
        "csrf_token": lambda: "T",
        "has_perm": lambda p, _p=perms: p in _p,
        "role_label": lambda r: r, "role_description": lambda r: "",
        "today": today_local,
    })
    for n, f in [("status_color", status_color), ("payment_color", payment_color),
                 ("status_icon", status_icon), ("category_icon", category_icon),
                 ("uzs", uzs), ("date_uz", date_uz), ("datetime_uz", datetime_uz)]:
        env.filters[n] = f
    return env.get_template(tpl).render(**CONTEXTS[tpl])

checks = [
    ("buxgalter", "orders/list.html", "Yangi buyurtma", False, "buxgalter buyurtma yarata olmaydi"),
    ("buxgalter", "orders/list.html", "Excel", True, "buxgalter Excel eksport qila oladi"),
    ("menejer", "orders/list.html", "Yangi buyurtma", True, "menejer buyurtma yarata oladi"),
    ("menejer", "orders/list.html", "Excel", False, "menejerda eksport huquqi yo'q"),
    ("buxgalter", "orders/detail.html", "To'lov qo'shish", False, "buxgalter to'lov qo'sha olmaydi"),
    ("menejer", "orders/detail.html", "To'lov qo'shish", True, "menejer to'lov qo'sha oladi"),
    ("buxgalter", "clients/list.html", "Yangi mijoz", False, "buxgalter mijoz qo'sha olmaydi"),
    ("buxgalter", "finance/expenses.html", "Yangi xarajat", False, "buxgalter xarajat kirita olmaydi"),
    ("xarajatchi", "finance/expenses.html", "Yangi xarajat", True, "xarajatchi xarajat kirita oladi"),
]
for role, tpl, needle, should_exist, desc in checks:
    out = render_for(role, tpl)
    found = needle in out
    if found == should_exist:
        print(f"  OK   {desc}")
    else:
        fails.append(f"{desc}: '{needle}' {'topilmadi' if should_exist else 'topildi (yashirilishi kerak edi)'}")
        print(f"  FAIL {desc}")

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA SHABLON VA ROL TESTLARI MUVAFFAQIYATLI")
