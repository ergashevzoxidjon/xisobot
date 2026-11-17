"""
Xisoblovchi — bosmaxona narx hisoblagichi (2026-11-17: Xisobot ichiga ko'chirildi).

Avval alohida sayt edi (xisoblovchi.mylogo.uz): sof brauzer ilovasi, narxlar har
brauzerning localStorage'ida, kirish — havoladagi ?rol=admin. Endi:

  * ilova fayllari `xisoblovchi_app/` da, Xisobot login'i orqali ochiladi
    (rol: admin va ish boshqaruvchi — "admin rejimi", menejer va boss — "menejer rejimi");
  * `erp_*` sozlamalari localStorage o'rniga `xis_kv` jadvalida (hamma qurilmada bir xil).
    Brauzer tomonida `umumiy/server-xotira.js` localStorage'ni almashtiradi, shuning
    uchun hisob-kitob kodi o'zgarmagan;
  * rasmlar — serverdagi papkada (avval maxfiy kalit bilan, endi sessiya bilan);
  * "admin PIN" tasdig'i (past marja, to'liq hisob-kitob) — admin akkauntining paroli bilan.

index.html `xisoblovchi_app/.deploy/yigish.py` bilan yig'iladi (qarang: xisoblovchi_app/CLAUDE.md).
"""

import hashlib
import json
import os
import re

from flask import (Blueprint, Response, abort, current_app, flash, jsonify,
                   redirect, render_template, request, send_from_directory, url_for)
from flask_login import current_user, login_required
from flask_wtf.csrf import generate_csrf

import xisoblovchi_excel
from auth import MAX_ATTEMPTS, clear_failures, recent_failures, record_failure
from extensions import db
from models import User, XisKV, log_action
from permissions import has_perm, permission_required

xisoblovchi_bp = Blueprint("xisoblovchi", __name__, url_prefix="/xisoblovchi")

APP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xisoblovchi_app")

# Brauzerga beriladigan papkalar/kengaytmalar (testlar/, .deploy/, CLAUDE.md berilmaydi).
STATIC_DIRS = ("umumiy", "bolimlar")
STATIC_EXT = {".js", ".css", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico",
              ".json", ".woff", ".woff2", ".ttf"}

KEY_RE = re.compile(r"^[A-Za-z0-9_.\-]{1,120}$")
MAX_VALUE_BYTES = 12 * 1024 * 1024  # bitta kalit (rasmli mahsulotlar bazasi) uchun

# Serverga umuman yozilmaydigan va brauzerga berilmaydigan kalitlar: eski PIN bazasi
# va eski rasm-ombori kaliti (endi sessiya orqali).
BLOCKED_KEYS = {"erp_users_db", "erp_server_token"}
# Shaxsiy kalitlar — har foydalanuvchiga alohida (savatcha, oxirgi tanlovlar).
USER_KEYS = {"erp_quote_cart", "erp_bosh_oxirgilar"}
# Hamma rol yozadigan umumiy ro'yxatlar: eskirgan nusxa kelsa, yozuvlar birlashtiriladi.
MERGE_KEYS = {"erp_quote_archive", "erp_audit_log"}

IMAGE_MAX_BYTES = 4 * 1024 * 1024
IMAGE_NAME_RE = re.compile(r"^[0-9a-f]{32}\.(webp|png|jpg|gif)$")


# ---------------------------------------------------------------- yordamchilar

def xis_mode(user=None):
    """'admin' (narx va sozlamalarni o'zgartira oladi) yoki 'menejer' (faqat hisoblaydi)."""
    user = user or current_user
    return "admin" if has_perm("calc.edit") else "menejer"


def _scope_for(key):
    return "u%d" % current_user.id if key in USER_KEYS else "shared"


def _can_write(key):
    if key in BLOCKED_KEYS or not KEY_RE.match(key):
        return False
    if has_perm("calc.edit"):
        return True
    return key in USER_KEYS or key in MERGE_KEYS


def _ident(item):
    if isinstance(item, dict) and "id" in item:
        return "id:%s" % item["id"]
    return "j:" + json.dumps(item, sort_keys=True, ensure_ascii=False)


def merge_lists(old_json, new_json):
    """Ikki JSON ro'yxatni birlashtiradi: yangi nusxa oldin, unda yo'q eski yozuvlar oxirida."""
    try:
        old, new = json.loads(old_json), json.loads(new_json)
    except ValueError:
        return new_json
    if not isinstance(old, list) or not isinstance(new, list):
        return new_json
    seen = {_ident(x) for x in new}
    merged = new + [x for x in old if _ident(x) not in seen]
    return json.dumps(merged, ensure_ascii=False, separators=(",", ":"))


def _script_json(obj):
    """Obyektni <script> ichiga xavfsiz joylash uchun JSON (</script>, U+2028/9 dan himoya)."""
    s = json.dumps(obj, ensure_ascii=False)
    return (s.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
             .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))


def load_state():
    """Joriy foydalanuvchiga ko'rinadigan barcha kalitlar: ({kalit: qiymat}, {kalit: versiya})."""
    scopes = ["shared", "u%d" % current_user.id]
    rows = XisKV.query.filter(XisKV.scope.in_(scopes)).all()
    data, versions = {}, {}
    for r in rows:
        if r.key in BLOCKED_KEYS:
            continue
        if r.scope == "shared" and r.key in USER_KEYS:
            continue
        data[r.key] = r.value
        versions[r.key] = r.version
    return data, versions


def _build_index():
    path = os.path.join(APP_DIR, "index.html")
    if not os.path.isfile(path):
        abort(404)
    with open(path, encoding="utf-8") as f:
        html = f.read()
    data, versions = load_state()
    boot = {
        "rol": xis_mode(),
        "user": {"id": "u%d" % current_user.id, "name": current_user.display_name},
        "csrf": generate_csrf(),
        "yozish": sorted(USER_KEYS | MERGE_KEYS),
        "userKeys": sorted(USER_KEYS),
        "mergeKeys": sorted(MERGE_KEYS),
        "blocked": sorted(BLOCKED_KEYS),
        "kv": data,
        "v": versions,
        "chiqish": url_for("main.dashboard"),
        "zaxira": url_for("xisoblovchi.backup_page") if has_perm("calc.edit") else None,
    }
    tag = "<script>window.XIS=%s;</script>" % _script_json(boot)
    # Boshqa skriptlardan OLDIN (server-xotira.js ham shundan keyin yuklanadi)
    if "<head>" in html:
        return html.replace("<head>", "<head>" + tag, 1)
    return tag + html


# ---------------------------------------------------------------- sahifa va fayllar

@xisoblovchi_bp.route("")
@login_required
@permission_required("calc.view")
def index_redirect():
    return redirect(url_for("xisoblovchi.index"))


@xisoblovchi_bp.route("/")
@login_required
@permission_required("calc.view")
def index():
    resp = Response(_build_index(), mimetype="text/html")
    resp.headers["Cache-Control"] = "no-store"
    return resp


@xisoblovchi_bp.route("/<path:fayl>")
@login_required
@permission_required("calc.view")
def static_file(fayl):
    parts = fayl.split("/")
    if parts[0] not in STATIC_DIRS or os.path.splitext(fayl)[1].lower() not in STATIC_EXT:
        abort(404)
    resp = send_from_directory(APP_DIR, fayl, max_age=0)
    # JS/CSS havolasida ?v=<xesh> bor — URL o'zgarsa yangisi yuklanadi, shuning uchun keshlash xavfsiz
    resp.headers["Cache-Control"] = "private, max-age=3600" if request.args.get("v") else "no-cache"
    return resp


# ---------------------------------------------------------------- saqlash API

@xisoblovchi_bp.route("/api/kv", methods=["POST"])
@login_required
@permission_required("calc.view")
def api_kv():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items")
    if not isinstance(items, list) or len(items) > 200:
        return jsonify({"xato": "Noto'g'ri so'rov"}), 400

    results = []
    for it in items:
        key = it.get("key") if isinstance(it, dict) else None
        if not isinstance(key, str) or not KEY_RE.match(key):
            results.append({"key": str(key)[:60], "error": "Noto'g'ri kalit", "code": 400})
            continue
        if not _can_write(key):
            results.append({"key": key, "error": "Bu sozlamani o'zgartirishga ruxsat yo'q", "code": 403})
            continue
        value = it.get("value")
        base_v = it.get("v") if isinstance(it.get("v"), int) else 0
        if value is not None and (not isinstance(value, str) or len(value.encode("utf-8")) > MAX_VALUE_BYTES):
            results.append({"key": key, "error": "Qiymat juda katta", "code": 413})
            continue

        scope = _scope_for(key)
        row = XisKV.query.filter_by(scope=scope, key=key).first()
        current = row.version if row else 0

        if value is None:  # removeItem
            if row:
                db.session.delete(row)
            results.append({"key": key, "v": 0})
            continue

        merged = False
        if row and base_v != current and scope == "shared":
            if key in MERGE_KEYS:
                value, merged = merge_lists(row.value, value), True
            else:
                results.append({"key": key, "error": "Boshqa foydalanuvchi buni allaqachon o'zgartirgan",
                                "code": 409, "v": current})
                continue
        if row:
            row.value, row.version, row.updated_by_id = value, current + 1, current_user.id
        else:
            row = XisKV(scope=scope, key=key, value=value, version=1, updated_by_id=current_user.id)
            db.session.add(row)
        db.session.flush()
        res = {"key": key, "v": row.version}
        if merged:
            res["value"] = value
        results.append(res)
    db.session.commit()
    return jsonify({"results": results})


# ---------------------------------------------------------------- admin tasdig'i

@xisoblovchi_bp.route("/api/admin-tasdiq", methods=["POST"])
@login_required
@permission_required("calc.view")
def api_admin_confirm():
    """Past marja / to'liq hisob-kitob: admin akkauntining paroli (eski "admin PIN" o'rniga)."""
    password = ((request.get_json(silent=True) or {}).get("parol") or "")[:128]
    throttle_name = ("calc:%d" % current_user.id)
    ip = request.remote_addr or ""
    if recent_failures(throttle_name, ip) >= MAX_ATTEMPTS:
        return jsonify({"ok": False, "xato": "Juda ko'p urinish. Bir necha daqiqadan keyin qayta urining."}), 429
    admins = User.query.filter_by(role="admin", is_active_user=True).all()
    approver = next((u for u in admins if password and u.check_password(password)), None)
    if not approver:
        record_failure(throttle_name, ip)
        return jsonify({"ok": False, "xato": "Parol noto'g'ri."}), 403
    clear_failures(throttle_name, ip)
    return jsonify({"ok": True, "nom": approver.display_name})


# ---------------------------------------------------------------- rasmlar

def _image_ext(b):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if b[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return ".webp"
    if b[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    return None


def _upload_dir():
    return current_app.config.get("XIS_UPLOAD_DIR") or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "uploads", "xisoblovchi")


@xisoblovchi_bp.route("/api/rasm", methods=["POST"])
@login_required
@permission_required("calc.edit")
def api_image_upload():
    data = request.get_data(cache=False)
    if not data or len(data) > IMAGE_MAX_BYTES:
        return jsonify({"xato": "Rasm hajmi 1 baytdan %d MB gacha bo'lishi kerak" % (IMAGE_MAX_BYTES // 1048576)}), 413
    ext = _image_ext(data)
    if not ext:
        return jsonify({"xato": "Faqat WebP, PNG, JPEG yoki GIF rasm qabul qilinadi"}), 415
    name = hashlib.sha256(data).hexdigest()[:32] + ext  # bir xil rasm bir marta saqlanadi
    folder = _upload_dir()
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, name)
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(data)
    return jsonify({"url": "uploads/" + name})


@xisoblovchi_bp.route("/uploads/<nom>")
@login_required
@permission_required("calc.view")
def image_file(nom):
    if not IMAGE_NAME_RE.match(nom):
        abort(404)
    resp = send_from_directory(_upload_dir(), nom, max_age=0)
    resp.headers["Cache-Control"] = "private, max-age=31536000, immutable"
    return resp


# ---------------------------------------------------------------- zaxira: eksport / import

@xisoblovchi_bp.route("/zaxira")
@login_required
@permission_required("calc.edit")
def backup_page():
    count = XisKV.query.filter_by(scope="shared").count()
    return render_template("xisoblovchi/backup.html", count=count)


@xisoblovchi_bp.route("/zaxira/eksport")
@login_required
@permission_required("calc.edit")
def backup_export():
    rows = XisKV.query.filter_by(scope="shared").order_by(XisKV.key).all()
    body = json.dumps({r.key: r.value for r in rows if r.key not in BLOCKED_KEYS}, ensure_ascii=False)
    log_action(current_user, "xisoblovchi_eksport", "xis_kv", None, "%d ta kalit" % len(rows))
    db.session.commit()
    return Response(body, mimetype="application/json", headers={
        "Content-Disposition": "attachment; filename=xisoblovchi-zaxira.json"})


def parse_backup(raw):
    """Zaxira faylini {kalit: matn} ga aylantiradi (xato bo'lsa ValueError)."""
    try:
        data = json.loads(raw)
    except ValueError:
        raise ValueError("Fayl JSON emas.")
    if not isinstance(data, dict):
        raise ValueError("Zaxira fayli {kalit: qiymat} ko'rinishida bo'lishi kerak.")
    out = {}
    for k, v in data.items():
        if not isinstance(k, str) or not k.startswith("erp_") or not KEY_RE.match(k):
            continue
        if k in BLOCKED_KEYS or k in USER_KEYS:
            continue
        if not isinstance(v, str):
            v = json.dumps(v, ensure_ascii=False)
        if len(v.encode("utf-8")) > MAX_VALUE_BYTES:
            raise ValueError("«%s» qiymati juda katta." % k)
        out[k] = v
    if not out:
        raise ValueError("Faylda import qilinadigan erp_* sozlamalari topilmadi.")
    return out


@xisoblovchi_bp.route("/excel/shablon", methods=["POST"])
@login_required
@permission_required("calc.edit")
def excel_shablon():
    """Brauzer joriy (standartlari bilan) sozlamalarni yuboradi — Excel shablon qaytadi."""
    payload = request.get_json(silent=True) or {}
    sections = payload.get("bolimlar")
    if not isinstance(sections, list) or len(sections) > 100:
        return jsonify({"xato": "Noto'g'ri so'rov"}), 400
    data = xisoblovchi_excel.build_workbook(sections)
    log_action(current_user, "xisoblovchi_excel_shablon", "xis_kv", None, "%d ta bo'lim" % len(sections))
    db.session.commit()
    return Response(
        data,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="xisoblovchi-narxlar.xlsx"',
                 "Cache-Control": "no-store"})


@xisoblovchi_bp.route("/excel/oqish", methods=["POST"])
@login_required
@permission_required("calc.edit")
def excel_oqish():
    """Yuklangan Excelni JSON'ga o'giradi (bazaga yozmaydi — qiymatlarni brauzer qo'shib saqlaydi)."""
    f = request.files.get("fayl")
    if not f:
        return jsonify({"xato": "Excel faylni tanlang."}), 400
    try:
        parsed = xisoblovchi_excel.parse_workbook(f.read(xisoblovchi_excel.MAX_FILE_BYTES + 1))
    except ValueError as e:
        return jsonify({"xato": str(e)}), 400
    log_action(current_user, "xisoblovchi_excel_yuklash", "xis_kv", None, "%d ta varaq" % len(parsed))
    db.session.commit()
    return jsonify({"bolimlar": parsed})


@xisoblovchi_bp.route("/zaxira/import", methods=["POST"])
@login_required
@permission_required("calc.edit")
def backup_import():
    f = request.files.get("fayl")
    if not f:
        flash("Zaxira faylini tanlang.", "danger")
        return redirect(url_for("xisoblovchi.backup_page"))
    try:
        items = parse_backup(f.read().decode("utf-8-sig"))
    except (ValueError, UnicodeDecodeError) as e:
        flash("Import bajarilmadi: %s" % e, "danger")
        return redirect(url_for("xisoblovchi.backup_page"))
    for key, value in items.items():
        row = XisKV.query.filter_by(scope="shared", key=key).first()
        if row:
            row.value, row.version, row.updated_by_id = value, row.version + 1, current_user.id
        else:
            db.session.add(XisKV(scope="shared", key=key, value=value, version=1,
                                 updated_by_id=current_user.id))
    log_action(current_user, "xisoblovchi_import", "xis_kv", None, "%d ta kalit" % len(items))
    db.session.commit()
    flash("Import tugadi: %d ta sozlama yuklandi." % len(items), "success")
    return redirect(url_for("xisoblovchi.backup_page"))
