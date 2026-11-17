"""
Xisoblovchi narxlarini Excel orqali to'ldirish (2026-11-17, foydalanuvchi qarori).

Oqim: admin Xisoblovchi ichida "Excel shablon" ni yuklab oladi → narxlarni to'ldiradi →
"Excel yuklash" orqali qaytaradi → narxlar bazaga (xis_kv) yoziladi.

Hozirgi (standart qiymatlari bilan birga) sozlamalar faqat brauzerdagi JS o'zgaruvchilarida
turadi, shuning uchun:
  * eksport: brauzer joriy qiymatlarni yuboradi, bu modul .xlsx yasaydi (build_workbook);
  * import: bu modul .xlsx ni oddiy JSON'ga o'giradi (parse_workbook), qiymatlarni esa
    brauzer joriy ma'lumotga qo'shadi va odatiy saqlash yo'li (server-xotira.js) bilan bazaga yozadi.

Varaq turlari (A1 = kalit, B1 = tur):
  "jadval" — massiv (har qator = bitta yozuv): 2-qator sarlavha, keyin qatorlar. Qatorni
             "id" ustuni bo'lsa shu bo'yicha, bo'lmasa tartib raqami bo'yicha moslaydi.
  "daraxt" — obyekt: 2-qator "Yo'l | Qiymat", har qator bitta qiymat (masalan a.b[0].c).
Faqat qiymatlar yangilanadi va yangi qatorlar qo'shiladi; Excelda yo'q qatorlar o'chmaydi.
"""

import io
import re

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_STR_LEN = 300          # undan uzun matnlar (rasm base64 va h.k.) Excelga chiqarilmaydi
MAX_ROWS_PER_SHEET = 20000
HEAD_FILL = PatternFill("solid", fgColor="E31C79")
HEAD_FONT = Font(bold=True, color="FFFFFF")
KEY_FONT = Font(color="999999", italic=True)
PATH_FONT = Font(color="555555")

BAD_SHEET_CHARS = re.compile(r"[\[\]:*?/\\]")
TOKEN_RE = re.compile(r"^([^.\[\]]+)|\.([^.\[\]]+)|\[(\d+)\]")


def _is_scalar(v):
    return isinstance(v, (bool, int, float, str)) or v is None


def _keep_leaf(v):
    """Excelga chiqariladigan qiymatmi (rasm/uzun matn emas)."""
    if isinstance(v, str):
        return len(v) <= MAX_STR_LEN and not v.startswith("data:")
    return isinstance(v, (bool, int, float))


def flatten(obj, prefix=""):
    """{yo'l: qiymat} — faqat oddiy (son/matn/bool) qiymatlar. Nuqta/qavs bor kalitlar o'tkazib yuboriladi."""
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            if not isinstance(k, str) or re.search(r"[.\[\]]", k):
                continue
            out.update(flatten(v, k if not prefix else prefix + "." + k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out.update(flatten(v, "%s[%d]" % (prefix, i)))
    elif prefix and _keep_leaf(obj):
        out[prefix] = obj
    return out


def split_path(path):
    """'a.b[0].c' -> ['a', 'b', 0, 'c']; noto'g'ri yo'l -> None."""
    tokens, pos = [], 0
    while pos < len(path):
        m = TOKEN_RE.match(path[pos:])
        if not m:
            return None
        tokens.append(m.group(1) or m.group(2) or int(m.group(3)))
        pos += m.end()
    return tokens or None


def _sheet_title(nom, used):
    base = BAD_SHEET_CHARS.sub(" ", nom or "Varaq").strip()[:28] or "Varaq"
    title, n = base, 2
    while title.lower() in used:
        title = "%s %d" % (base[:26], n)
        n += 1
    used.add(title.lower())
    return title


def _style_header(ws, row, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.fill, cell.font = HEAD_FILL, HEAD_FONT
        cell.alignment = Alignment(vertical="center")


def build_workbook(sections):
    """sections: [{"kalit": "erp_x", "nom": "Qog'oz", "qiymat": <JSON>}] -> xlsx baytlari."""
    wb = Workbook()
    help_ws = wb.active
    help_ws.title = "Yo'riqnoma"
    lines = [
        "XISOBLOVCHI NARXLARI — EXCEL SHABLONI",
        "",
        "1. Kerakli varaqni oching va qiymatlarni (narx, o'lcham, miqdor...) o'zgartiring.",
        "2. Yangi yozuv qo'shish uchun jadval varaqlarida eng pastga yangi qator yozing.",
        "3. Faylni Xisoblovchida: Admin panel → \"Excel yuklash\" orqali qaytaring.",
        "",
        "MUHIM:",
        "- Faqat qiymatlar yangilanadi va yangi qatorlar qo'shiladi. Excelda bo'lmagan qatorlar bazadan O'CHMAYDI.",
        "- Bo'sh katak o'zgartirilmaydi (eski qiymat qoladi).",
        "- 1-qatordagi kulrang kalit va 2-qatordagi sarlavhalarni, \"Yo'l\" va \"id\" ustunlarini o'zgartirmang.",
        "- Sonlarni probelsiz yozing (masalan 12500 yoki 12500.5).",
        "- Rasmlar va juda uzun matnlar Excelga chiqarilmaydi — ularni Xisoblovchining o'zida o'zgartiring.",
    ]
    for i, text in enumerate(lines, 1):
        help_ws.cell(row=i, column=1, value=text)
    help_ws["A1"].font = Font(bold=True, size=14)
    help_ws.column_dimensions["A"].width = 110

    used = {"yo'riqnoma"}
    for sec in sections:
        key, nom, val = sec.get("kalit"), sec.get("nom"), sec.get("qiymat")
        if not isinstance(key, str) or not re.fullmatch(r"erp_[A-Za-z0-9_]{1,100}", key):
            continue
        ws = wb.create_sheet(_sheet_title(nom, used))
        ws["A1"], ws["B1"] = key, None
        ws["A1"].font = KEY_FONT
        if isinstance(val, list) and val and all(isinstance(x, dict) for x in val):
            ws["B1"] = "jadval"
            rows = [flatten(x) for x in val[:MAX_ROWS_PER_SHEET]]
            headers = []
            for r in rows:
                for h in r:
                    if h not in headers:
                        headers.append(h)
            if "id" in headers:       # id birinchi ustunda
                headers.remove("id")
                headers.insert(0, "id")
            for c, h in enumerate(headers, 1):
                ws.cell(row=2, column=c, value=h)
            _style_header(ws, 2, max(len(headers), 1))
            for ri, r in enumerate(rows, 3):
                for c, h in enumerate(headers, 1):
                    if h in r:
                        ws.cell(row=ri, column=c, value=r[h])
            for c, h in enumerate(headers, 1):
                ws.column_dimensions[get_column_letter(c)].width = max(12, min(len(h) + 4, 40))
            ws.freeze_panes = "A3"
        else:
            ws["B1"] = "daraxt"
            ws.cell(row=2, column=1, value="Yo'l")
            ws.cell(row=2, column=2, value="Qiymat")
            _style_header(ws, 2, 2)
            if isinstance(val, (bool, int, float)):
                leaves = {"qiymat": val}
            else:
                leaves = flatten(val)
            for ri, (path, v) in enumerate(list(leaves.items())[:MAX_ROWS_PER_SHEET], 3):
                ws.cell(row=ri, column=1, value=path).font = PATH_FONT
                ws.cell(row=ri, column=2, value=v)
            ws.column_dimensions["A"].width = 60
            ws.column_dimensions["B"].width = 24
            ws.freeze_panes = "A3"
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _cell_value(v):
    """Excel katagi -> JSON qiymati (None = bo'sh, o'tkazib yuboriladi)."""
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return int(v) if float(v).is_integer() and abs(v) < 1e15 else float(v)
    if isinstance(v, str):
        s = v.strip()
        return s or None
    return str(v)


def parse_workbook(data):
    """xlsx baytlari -> {kalit: {"tur": "jadval", "sarlavha": [...], "qatorlar": [[...]]}
                          yoki {"tur": "daraxt", "qatorlar": [[yo'l, qiymat]]}}.
    ValueError — fayl yaroqsiz."""
    if len(data) > MAX_FILE_BYTES:
        raise ValueError("Fayl juda katta (5 MB gacha).")
    try:
        wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    except Exception:
        raise ValueError("Bu Excel (.xlsx) fayl emas yoki buzilgan.")
    result = {}
    for ws in wb.worksheets:
        rows = ws.iter_rows(values_only=True, max_row=MAX_ROWS_PER_SHEET + 2)
        first = next(rows, None)
        if not first or not isinstance(first[0], str):
            continue
        key = first[0].strip()
        tur = (first[1] or "").strip() if len(first) > 1 and isinstance(first[1], str) else ""
        if not re.fullmatch(r"erp_[A-Za-z0-9_]{1,100}", key) or tur not in ("jadval", "daraxt"):
            continue
        if tur == "daraxt":
            items = []
            next(rows, None)  # sarlavha
            for r in rows:
                path = r[0] if r else None
                val = _cell_value(r[1]) if r and len(r) > 1 else None
                if isinstance(path, str) and val is not None:
                    path = path.strip()
                    if path == "qiymat" or split_path(path):
                        items.append([path, val])
            result[key] = {"tur": "daraxt", "qatorlar": items}
        else:
            header_row = next(rows, None) or ()
            headers = [h.strip() if isinstance(h, str) else None for h in header_row]
            while headers and headers[-1] is None:
                headers.pop()
            items = []
            for r in rows:
                cells = [_cell_value(c) for c in (r or ())[:len(headers)]]
                if any(c is not None for c in cells):
                    items.append(cells + [None] * (len(headers) - len(cells)))
            result[key] = {"tur": "jadval", "sarlavha": headers, "qatorlar": items}
    wb.close()
    if not result:
        raise ValueError("Faylda Xisoblovchi varaqlari topilmadi. Avval \"Excel shablon\" ni yuklab oling.")
    return result
