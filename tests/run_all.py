"""
Barcha testlarni ishga tushiradi.

Ishga tushirish:  python tests/run_all.py

Bu testlar Flask o'rnatilmagan bo'lsa ham ishlaydi — ular sof mantiq,
shablonlar va kod tuzilishini tekshiradi.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

TESTS = [
    ("test_utils.py", "Kiritilgan ma'lumot tekshiruvi, pul va vaqt"),
    ("test_finance_logic.py", "Moliyaviy hisob-kitob mantig'i"),
    ("test_templates.py", "Shablonlar, endpointlar, CSRF, rollar"),
    ("test_routes_audit.py", "Route himoyasi va kod auditi"),
    ("smoke_today.py", "Haqiqiy Flask+DB oqimlari (HR turkumlari, ombor joylashuvi, menejer jurnali)"),
]

failed = []
for fname, desc in TESTS:
    print("\n" + "=" * 70)
    print(f"  {fname} — {desc}")
    print("=" * 70)
    result = subprocess.run([sys.executable, os.path.join(HERE, fname)])
    if result.returncode != 0:
        failed.append(fname)

print("\n" + "=" * 70)
if failed:
    print(f"  XATO: {len(failed)} ta test to'plami muvaffaqiyatsiz: {', '.join(failed)}")
    sys.exit(1)
print(f"  BARCHA {len(TESTS)} TA TEST TO'PLAMI MUVAFFAQIYATLI")
print("=" * 70)
