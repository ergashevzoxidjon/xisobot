"""utils.py — sof Python, Flask kerak emas."""
import sys
from decimal import Decimal
from datetime import date

import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    parse_money, parse_int, parse_date, parse_text, parse_choice,
    ValidationError, to_money, money_str, month_bounds, now_local, today_local,
)

fails = []

def check(name, fn, expect=None, should_raise=False):
    try:
        result = fn()
        if should_raise:
            fails.append(f"{name}: xato kutilgandi, lekin {result!r} qaytdi")
            print(f"  FAIL {name}")
            return
        if expect is not None and result != expect:
            fails.append(f"{name}: kutilgan {expect!r}, olingan {result!r}")
            print(f"  FAIL {name}: {result!r} != {expect!r}")
            return
        print(f"  OK   {name}  -> {result!r}")
    except ValidationError as e:
        if should_raise:
            print(f"  OK   {name}  -> rad etildi: {e}")
        else:
            fails.append(f"{name}: kutilmagan xato {e}")
            print(f"  FAIL {name}: {e}")
    except Exception as e:
        fails.append(f"{name}: {type(e).__name__} {e}")
        print(f"  FAIL {name}: {type(e).__name__} {e}")


print("=== PUL (parse_money) ===")
check("oddiy son", lambda: parse_money("15000", "Summa"), Decimal("15000.00"))
check("kasr son", lambda: parse_money("1500.55", "Summa"), Decimal("1500.55"))
check("vergul kasr", lambda: parse_money("1500,55", "Summa"), Decimal("1500.55"))
check("probel bilan", lambda: parse_money("1 500 000", "Summa"), Decimal("1500000.00"))
check("HARF kiritildi", lambda: parse_money("abc", "Summa"), should_raise=True)
check("MANFIY son", lambda: parse_money("-500", "Summa"), should_raise=True)
check("BO'SH (majburiy)", lambda: parse_money("", "Summa"), should_raise=True)
check("bo'sh (ixtiyoriy)", lambda: parse_money("", "Summa", required=False), Decimal("0.00"))
check("JUDA KATTA", lambda: parse_money("9" * 20, "Summa"), should_raise=True)
check("SQL injection urinishi", lambda: parse_money("1; DROP TABLE order", "Summa"), should_raise=True)
check("min 0.01 chegarasi", lambda: parse_money("0", "Summa", min_value=Decimal("0.01")), should_raise=True)

print("\n=== BUTUN SON (parse_int) ===")
check("oddiy", lambda: parse_int("150", "Miqdor", min_value=1), 150)
check("NOL (min=1)", lambda: parse_int("0", "Miqdor", min_value=1), should_raise=True)
check("MANFIY", lambda: parse_int("-5", "Miqdor", min_value=1), should_raise=True)
check("KASR berildi", lambda: parse_int("1.5", "Miqdor", min_value=1), should_raise=True)
check("HARF", lambda: parse_int("ko'p", "Miqdor", min_value=1), should_raise=True)

print("\n=== SANA (parse_date) ===")
check("to'g'ri sana", lambda: parse_date("2026-08-14", "Sana"), date(2026, 8, 14))
check("NOTO'G'RI format", lambda: parse_date("14.08.2026", "Sana"), should_raise=True)
check("MAVJUD BO'LMAGAN sana", lambda: parse_date("2026-02-31", "Sana"), should_raise=True)
check("bo'sh (ixtiyoriy)", lambda: parse_date("", "Sana"), None)

print("\n=== MATN (parse_text) ===")
check("oddiy", lambda: parse_text("  Vizitka  ", "Tur"), "Vizitka")
check("BO'SH (majburiy)", lambda: parse_text("   ", "Tur", required=True), should_raise=True)
check("JUDA UZUN", lambda: parse_text("x" * 300, "Tur", max_length=100), should_raise=True)

print("\n=== TANLOV (parse_choice) ===")
check("ruxsat etilgan", lambda: parse_choice("yangi", "Holat", ["yangi", "tayyor"]), "yangi")
check("RUXSAT ETILMAGAN", lambda: parse_choice("hacker", "Holat", ["yangi", "tayyor"]), should_raise=True)

print("\n=== PUL FORMATLASH ===")
check("format 1", lambda: money_str(Decimal("1234567.5")), "1 234 567.50")
check("format 2", lambda: money_str(0), "0.00")
check("format manfiy", lambda: money_str(Decimal("-5000")), "-5 000.00")
check("Decimal aniqligi", lambda: to_money("0.1") + to_money("0.2"), Decimal("0.30"))

print("\n=== OY CHEGARALARI ===")
check("avgust", lambda: month_bounds(2026, 8), (date(2026, 8, 1), date(2026, 9, 1)))
check("dekabr -> yanvar", lambda: month_bounds(2026, 12), (date(2026, 12, 1), date(2027, 1, 1)))

print("\n=== VAQT MINTAQASI (UTC+5) ===")
import datetime as _dt
utc_now = _dt.datetime.utcnow()
local_now = now_local()
diff_hours = round((local_now - utc_now).total_seconds() / 3600)
if diff_hours == 5:
    print(f"  OK   mahalliy vaqt UTC dan +{diff_hours} soat oldinda")
else:
    fails.append(f"vaqt mintaqasi: +5 kutilgandi, +{diff_hours} olingan")
    print(f"  FAIL vaqt mintaqasi: +{diff_hours}")

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("BARCHA UTILS TESTLARI MUVAFFAQIYATLI")
