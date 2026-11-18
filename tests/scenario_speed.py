"""Tezlik o'zgarishlari (2026-11-18): sovuq start, o'lchash, statik kesh.

  1. Ilova import qilinganda og'ir `openpyxl` yuklanmaydi (faqat Excel kerak bo'lganda).
  2. Jadvallar bor bo'lsa `create_all()` chaqirilmaydi; jadval yetishmasa yaratiladi.
  3. `Server-Timing` sarlavhasi: kirgan foydalanuvchiga bor, kirmaganga yo'q.
  4. Juda sekin so'rov jurnalga yoziladi.
  5. Statik fayllar (logo) brauzer keshiga ruxsat oladi.
  6. Excel eksport/import (lazy import'dan keyin) ishlaydi.
"""
import logging
import os
import re
import subprocess
import sys
import tempfile

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

print("\n=== 1. Ilova ishga tushganda openpyxl yuklanmaydi ===")
probe = subprocess.run(
    [sys.executable, "-c",
     "import sys; import app; print('openpyxl' in sys.modules)"],
    cwd=APP, capture_output=True, text=True,
    env={**os.environ, "DATABASE_URL": f"sqlite:///{db_path}"},
)
check("import app: openpyxl yuklanmagan", probe.stdout.strip().endswith("False"))

import app as app_module
from app import create_app, _create_missing_tables
from extensions import db
from models import User

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True

with app.app_context():
    db.create_all()
    u = User(username="admin1", full_name="Admin", role="admin", is_active_user=True)
    u.set_password("parol123")
    db.session.add(u)
    db.session.commit()

print("\n=== 2. create_all faqat jadval yetishmasa ===")
with app.app_context():
    calls = []
    real = db.create_all
    db.create_all = lambda *a, **k: (calls.append(1), real(*a, **k))[1]
    try:
        _create_missing_tables()
        check("Hamma jadval bor: create_all chaqirilmadi", calls == [])
        db.session.execute(db.text("DROP TABLE submit_token"))
        db.session.commit()
        _create_missing_tables()
        check("Jadval yetishmasa create_all chaqirildi", calls == [1])
        from sqlalchemy import inspect
        check("Yetishmagan jadval qayta yaratildi", "submit_token" in inspect(db.engine).get_table_names())
    finally:
        db.create_all = real

with app.test_client() as c:
    print("\n=== 3. Server-Timing ===")
    r = c.get("/login")
    check("Kirmagan foydalanuvchiga Server-Timing berilmaydi", "Server-Timing" not in r.headers)
    c.post("/login", data={"username": "admin1", "password": "parol123"})
    r = c.get("/buyurtmalar/")
    st = r.headers.get("Server-Timing", "")
    check("Kirgan foydalanuvchiga Server-Timing beriladi", bool(st))
    m = re.match(r'app;dur=(\d+), db;dur=(\d+);desc="(\d+) queries"$', st)
    check("Format: app;dur=…, db;dur=…;desc=\"N queries\"", bool(m))
    check("SQL so'rovlari sanaladi (kamida bitta) va db vaqti app vaqtidan oshmaydi",
          bool(m) and int(m.group(3)) >= 1 and int(m.group(2)) <= int(m.group(1)))

    print("\n=== 4. Sekin so'rov jurnalga yoziladi ===")
    records = []

    class Catch(logging.Handler):
        def emit(self, record):
            records.append(record.getMessage())

    h = Catch()
    app.logger.addHandler(h)
    old = app_module.SLOW_REQUEST_MS
    app_module.SLOW_REQUEST_MS = -1
    try:
        c.get("/buyurtmalar/")
    finally:
        app_module.SLOW_REQUEST_MS = old
        app.logger.removeHandler(h)
    check("«Sekin so'rov: GET /buyurtmalar/» yozildi", any("Sekin so'rov: GET /buyurtmalar/" in x for x in records))
    records.clear()
    app.logger.addHandler(h)
    try:
        c.get("/buyurtmalar/")
    finally:
        app.logger.removeHandler(h)
    check("Tez so'rov jurnalga yozilmaydi", records == [])

    print("\n=== 5. Statik fayllar keshi ===")
    r = c.get("/static/img/logo.png")
    cc = r.headers.get("Cache-Control", "")
    check("logo.png: 200 va max-age=604800", r.status_code == 200 and "max-age=604800" in cc)

print("\n=== 6. Excel (lazy openpyxl) ishlaydi ===")
import xisoblovchi_excel as xe
data = xe.build_workbook([{"kalit": "erp_narx", "nom": "Qog'oz", "qiymat": [{"a": 1, "b": "x"}, {"a": 2, "b": "y"}]}])
check("Eksport: xlsx baytlari qaytdi (PK zip)", data[:2] == b"PK")
parsed = xe.parse_workbook(data)
check("Import: eksport qilingan fayl qayta o'qiladi", "erp_narx" in parsed and len(parsed["erp_narx"]["qatorlar"]) == 2)
try:
    xe.parse_workbook(b"bu excel emas")
    check("Yaroqsiz fayl rad etiladi", False)
except ValueError:
    check("Yaroqsiz fayl rad etiladi", True)

try:
    with app.app_context():
        db.session.remove()
        db.engine.dispose()
    os.unlink(db_path)
except OSError:
    pass

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA TEKSHIRUVLAR MUVAFFAQIYATLI")
