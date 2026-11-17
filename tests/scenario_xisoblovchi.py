"""Xisoblovchi Xisobot ichida (2026-11-17): kirish, rejim, bazaga saqlash, admin tasdig'i, zaxira.

  1. Kirish: login'siz ochilmaydi; boss/menejer/admin/xarajatchi ochadi.
  2. Rejim: admin va ish boshqaruvchi — "admin", menejer va boss — "menejer";
     sahifaga window.XIS (rol, CSRF, bazadagi kalitlar) joylanadi, xizmat fayllari berilmaydi.
  3. Saqlash (/api/kv): admin yozadi, menejer faqat o'z savatchasi va arxivni; eski versiya — 409;
     arxiv/audit ro'yxati birlashtiriladi; PIN bazasi (erp_users_db) hech kimga berilmaydi.
  4. Admin tasdig'i: admin akkaunt paroli bilan; noto'g'ri — rad, ko'p urinish — 429.
  5. Rasm: faqat admin, faqat rasm formati; yuklangan rasmni hamma ko'radi.
  6. Zaxira: eksport/import (eski saytdan ko'chirish), faqat erp_* va PIN'siz.
"""
import json
import os
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
upload_dir = tempfile.mkdtemp()

from app import create_app
from extensions import db
from models import User, XisKV
from xisoblovchi import merge_lists, parse_backup

app = create_app()
app.config["WTF_CSRF_ENABLED"] = False
app.config["TESTING"] = True
app.config["XIS_UPLOAD_DIR"] = upload_dir

with app.app_context():
    db.create_all()
    for uname, role in [("admin1", "admin"), ("men1", "menejer"), ("men2", "menejer"),
                        ("xar1", "xarajatchi"), ("boss1", "boss")]:
        u = User(username=uname, full_name=uname.title(), role=role, is_active_user=True)
        u.set_password("parol123")
        db.session.add(u)
    db.session.commit()


def client_as(username):
    c = app.test_client()
    c.post("/login", data={"username": username, "password": "parol123"})
    return c


def boot(c):
    html = c.get("/xisoblovchi/").data.decode()
    start = html.index("window.XIS=") + len("window.XIS=")
    return json.loads(html[start:html.index(";</script>", start)])


def put(c, key, value, v=0):
    r = c.post("/xisoblovchi/api/kv", json={"items": [{"key": key, "value": value, "v": v}]})
    return r.status_code, (r.get_json() or {}).get("results", [{}])[0]


# ---------------------------------------------------------------- 1, 2
print("\n=== 1-2. Kirish va rejim ===")
anon = app.test_client()
r = anon.get("/xisoblovchi/")
check("Login'siz ochilmaydi (kirishga yo'naltiradi)", r.status_code == 302 and "/login" in r.headers["Location"])
check("Login'siz /api/kv ham ochiq emas", anon.post("/xisoblovchi/api/kv", json={"items": []}).status_code == 302)

admin, men, xar, boss = (client_as(u) for u in ("admin1", "men1", "xar1", "boss1"))
modes = {name: boot(c)["rol"] for name, c in [("admin", admin), ("menejer", men), ("xarajatchi", xar), ("boss", boss)]}
check("Admin — admin rejimi", modes["admin"] == "admin")
check("Ish boshqaruvchi — admin rejimi (avvalgi ?rol=admin havolasi kabi)", modes["xarajatchi"] == "admin")
check("Menejer — menejer rejimi", modes["menejer"] == "menejer")
check("Boss — menejer rejimi", modes["boss"] == "menejer")
b = boot(admin)
check("XIS ichida CSRF, foydalanuvchi va zaxira havolasi bor", b["csrf"] and b["user"]["name"] and b["zaxira"])
check("Menejerga zaxira havolasi berilmaydi", boot(men)["zaxira"] is None)
check("Sahifada server-xotira.js yuklanadi", b"server-xotira.js" in admin.get("/xisoblovchi/").data)
check("JS fayl beriladi", admin.get("/xisoblovchi/umumiy/core.js").status_code == 200)
check("CLAUDE.md berilmaydi", admin.get("/xisoblovchi/CLAUDE.md").status_code == 404)
check(".deploy/ berilmaydi", admin.get("/xisoblovchi/.deploy/yigish.py").status_code == 404)
check("testlar/ berilmaydi", admin.get("/xisoblovchi/testlar/index.html").status_code == 404)
check("Papkadan chiqish ('..') berilmaydi", admin.get("/xisoblovchi/umumiy/../../app.py").status_code == 404)
check("Yon menyuda Xisoblovchi ichki havola",
      b'href="/xisoblovchi/"' in admin.get("/").data and b"xisoblovchi.mylogo.uz" not in admin.get("/").data)

# ---------------------------------------------------------------- 3
print("\n=== 3. Bazaga saqlash ===")
code, res = put(admin, "erp_taxi_narxi", "15000")
check("Admin narx yozadi (v=1)", code == 200 and res.get("v") == 1)
check("Yozilgan qiymat keyingi sahifada (boshqa qurilmada ham) chiqadi",
      boot(men)["kv"].get("erp_taxi_narxi") == "15000" and boot(boss)["v"].get("erp_taxi_narxi") == 1)
code, res = put(admin, "erp_taxi_narxi", "16000", v=1)
check("To'g'ri versiya bilan yangilanadi (v=2)", res.get("v") == 2)
code, res = put(xar, "erp_taxi_narxi", "17000", v=1)
check("Eskirgan nusxa jimgina ustidan yozmaydi (409)", res.get("code") == 409)
with app.app_context():
    check("Baza qiymati buzilmagan", XisKV.query.filter_by(scope="shared", key="erp_taxi_narxi").one().value == "16000")

code, res = put(men, "erp_taxi_narxi", "1")
check("Menejer narxni o'zgartira olmaydi (403)", res.get("code") == 403)
code, res = put(men, "erp_quote_cart", '[{"a":1}]')
check("Menejer o'z savatchasini yozadi", res.get("v") == 1)
check("Savatcha boshqa menejerga ko'rinmaydi", "erp_quote_cart" not in boot(men_b := client_as("men2"))["kv"])
check("Savatcha egasiga qaytadi", boot(men)["kv"].get("erp_quote_cart") == '[{"a":1}]')
check("Savatcha adminning umumiy bazasiga aralashmaydi", "erp_quote_cart" not in boot(admin)["kv"])

code, res = put(men, "erp_users_db", "[]")
check("PIN bazasiga (erp_users_db) hech kim yoza olmaydi — menejer", res.get("code") == 403)
code, res = put(admin, "erp_users_db", "[]")
check("PIN bazasiga hech kim yoza olmaydi — admin", res.get("code") == 403)
code, res = put(admin, "../hack", "x")
check("Noto'g'ri kalit nomi rad etiladi", res.get("code") == 400)
code, res = put(admin, "erp_katta", "x" * (13 * 1024 * 1024))
check("Juda katta qiymat rad etiladi (413)", res.get("code") == 413)

put(men, "erp_quote_archive", '[{"id":"q1","n":1}]')
code, res = put(client_as("men2"), "erp_quote_archive", '[{"id":"q2","n":2}]', v=0)
with app.app_context():
    arch = json.loads(XisKV.query.filter_by(key="erp_quote_archive").one().value)
check("Arxivga ikki menejer yozsa ham ikkalasining takliflari saqlanadi (birlashtiriladi)",
      {x["id"] for x in arch} == {"q1", "q2"})
check("merge_lists: takror yozuv qo'shilmaydi",
      len(json.loads(merge_lists('[{"id":1},{"id":2}]', '[{"id":2},{"id":3}]'))) == 3)
check("merge_lists: buzuq JSON bo'lsa yangisi qoladi", merge_lists("xx", "[1]") == "[1]")

code, res = put(admin, "erp_taxi_narxi", None, v=2)
code2 = admin.post("/xisoblovchi/api/kv", json={"items": [{"key": "erp_taxi_narxi", "value": None, "v": 2}]})
with app.app_context():
    check("removeItem (value=null) kalitni o'chiradi", XisKV.query.filter_by(key="erp_taxi_narxi").count() == 0)

# ---------------------------------------------------------------- 4
print("\n=== 4. Admin tasdig'i (eski PIN o'rniga) ===")
r = men.post("/xisoblovchi/api/admin-tasdiq", json={"parol": "parol123"})
check("Admin akkaunt paroli bilan tasdiqlanadi", r.status_code == 200 and r.get_json()["ok"] and r.get_json()["nom"])
r = men.post("/xisoblovchi/api/admin-tasdiq", json={"parol": "xato"})
check("Noto'g'ri parol rad etiladi", r.status_code == 403 and not r.get_json()["ok"])
check("Menejerning O'Z paroli admin tasdig'i bo'lmaydi",
      client_as("men2").post("/xisoblovchi/api/admin-tasdiq", json={"parol": "men2-parol"}).status_code == 403)
t = client_as("boss1")
codes = [t.post("/xisoblovchi/api/admin-tasdiq", json={"parol": "xato%d" % i}).status_code for i in range(7)]
check("Ko'p noto'g'ri urinishdan keyin bloklanadi (429)", codes[-1] == 429)

# ---------------------------------------------------------------- 5
print("\n=== 5. Rasmlar ===")
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64
r = admin.post("/xisoblovchi/api/rasm", data=PNG, content_type="image/png")
url = (r.get_json() or {}).get("url", "")
check("Admin rasm yuklaydi (uploads/<xesh>.png)", r.status_code == 200 and url.startswith("uploads/") and url.endswith(".png"))
check("Rasm serverdagi papkaga yozildi", os.path.isfile(os.path.join(upload_dir, url.split("/")[1])))
check("Bir xil rasm ikkinchi marta bir xil manzil beradi",
      admin.post("/xisoblovchi/api/rasm", data=PNG, content_type="image/png").get_json()["url"] == url)
check("Menejer rasm yuklay olmaydi", men.post("/xisoblovchi/api/rasm", data=PNG).status_code in (302, 403))
check("Rasm bo'lmagan fayl rad etiladi (415)",
      admin.post("/xisoblovchi/api/rasm", data=b"<?php echo 1; ?>").status_code == 415)
check("Yuklangan rasmni menejer ko'radi", men.get("/xisoblovchi/" + url).status_code == 200)
check("Login'siz rasm ko'rinmaydi", anon.get("/xisoblovchi/" + url).status_code == 302)
check("Noto'g'ri nomli rasm so'rovi 404", men.get("/xisoblovchi/uploads/../app.py").status_code == 404)

# ---------------------------------------------------------------- 6
print("\n=== 6. Zaxira (eksport / import) ===")
put(admin, "erp_default_prices", '{"flayer":1}')
exp = admin.get("/xisoblovchi/zaxira/eksport")
data = json.loads(exp.data)
check("Eksport umumiy sozlamalarni beradi", exp.status_code == 200 and data.get("erp_default_prices") == '{"flayer":1}')
check("Eksportda shaxsiy savatcha va PIN yo'q", "erp_quote_cart" not in data and "erp_users_db" not in data)
check("Menejer eksport/zaxira sahifasini ocholmaydi",
      men.get("/xisoblovchi/zaxira/eksport").status_code == 302 and men.get("/xisoblovchi/zaxira").status_code == 302)

old_site = json.dumps({"erp_taxi_narxi": "20000", "erp_users_db": '[{"pin":"1234"}]',
                       "erp_quote_cart": "[1]", "boshqa": "x", "erp_katalog_config": {"a": 1}})
import io
r = admin.post("/xisoblovchi/zaxira/import", data={"fayl": (io.BytesIO(old_site.encode()), "z.json")},
               content_type="multipart/form-data")
check("Import qabul qilindi", r.status_code == 302)
with app.app_context():
    keys = {x.key: x.value for x in XisKV.query.filter_by(scope="shared")}
check("Eski saytdan narxlar yuklandi", keys.get("erp_taxi_narxi") == "20000")
check("Obyekt qiymat matnga aylantirildi", keys.get("erp_katalog_config") == '{"a": 1}')
check("PIN bazasi, savatcha va erp_ bo'lmagan kalitlar import qilinmadi",
      "erp_users_db" not in keys and "erp_quote_cart" not in keys and "boshqa" not in keys)
check("Import qilingan narx hamma ko'rgan sahifada chiqadi", boot(men)["kv"].get("erp_taxi_narxi") == "20000")
for bad, label in [("bu json emas", "JSON bo'lmagan fayl"), ("[1,2]", "ro'yxat ko'rinishidagi fayl"),
                   ('{"x":"y"}', "erp_* kaliti yo'q fayl")]:
    try:
        parse_backup(bad)
        check(label + " rad etiladi", False)
    except ValueError:
        check(label + " rad etiladi", True)
check("Menejer import qila olmaydi",
      men.post("/xisoblovchi/zaxira/import", data={"fayl": (io.BytesIO(old_site.encode()), "z.json")},
               content_type="multipart/form-data").status_code == 302)

try:
    with app.app_context():
        db.session.remove()
        db.engine.dispose()
    os.unlink(db_path)
except OSError:
    pass  # Windows: fayl hali band bo'lishi mumkin — vaqtinchalik fayl, muhim emas
print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA TEKSHIRUVLAR MUVAFFAQIYATLI")
