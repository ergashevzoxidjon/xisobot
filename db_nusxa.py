"""
Server bazasining (MySQL) to'liq nusxasini lokal sinov uchun SQLite fayliga
ko'chiradi (2026-11-17).

Nima uchun to'g'ridan-to'g'ri ulanmaymiz: lokalda sinov paytida qilingan har bir
o'chirish/xarajat jonli saytga yozilib ketardi. Nusxa esa butunlay alohida —
unda xohlagancha sinash mumkin, sayt bazasiga hech narsa yozilmaydi (bu skript
serverdan faqat O'QIYDI).

SERVERDA (cPanel -> Terminal):
    source /home/mylogo/virtualenv/repositories/xisobot/3.10/bin/activate
    cd /home/mylogo/repositories/xisobot
    export DATABASE_URL="mysql://mylogo_erp:PAROL@localhost/mylogo_poligrafiya"
    python db_nusxa.py

  Natija: /home/mylogo/xisobot-nusxa-YYYY-MM-DD.db
  (cPanel -> File Manager -> home papka -> faylni Download)

LOKALDA (Windows):
  1. Serverni to'xtating (Ctrl+C).
  2. Yuklab olingan faylni shu nom bilan qo'ying:
         E:\\AI\\xisobot platformasi\\instance\\poligrafiya.db
     (eski fayl bo'lsa, oldin nomini o'zgartirib saqlab qo'ying)
  3. python migrate_db.py   ->   run_local.bat (yoki python app.py)

Ixtiyoriy: python db_nusxa.py <chiqish_fayli.db>
"""

import os
import sys
from datetime import date

from sqlalchemy import MetaData, create_engine, select, inspect

BATCH = 500


def main():
    src_url = os.environ.get("DATABASE_URL", "")
    if not src_url:
        print("XATO: DATABASE_URL berilmagan. Yuqoridagi 'export DATABASE_URL=...' qatorini bajaring.")
        sys.exit(1)

    out_path = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
        f"~/xisobot-nusxa-{date.today().isoformat()}.db")
    out_path = os.path.abspath(out_path)
    if os.path.exists(out_path):
        os.remove(out_path)

    # app.config bilan bir xil URL tozalash (mysql:// -> mysql+pymysql://, utf8mb4)
    from app import create_app
    from extensions import db

    app = create_app()
    with app.app_context():
        src_engine = db.engine
        if src_engine.dialect.name == "sqlite" and os.path.abspath(
                src_engine.url.database or "") == out_path:
            print("XATO: manba va natija bir xil fayl.")
            sys.exit(1)

        # Natija bazasi — ilovaning modellari bo'yicha (indekslar, turlar bilan)
        dst_engine = create_engine(f"sqlite:///{out_path}")
        db.metadata.create_all(dst_engine)

        # Manba jadvallari — serverda haqiqatan bor ustunlar bo'yicha o'qiladi
        # (migratsiya qilinmagan ustun bo'lsa ham skript yiqilmaydi).
        src_meta = MetaData()
        src_meta.reflect(bind=src_engine)
        src_tables = set(inspect(src_engine).get_table_names())

        total = 0
        print("=" * 60)
        print(f"  Nusxa: {src_engine.dialect.name} -> {out_path}")
        print("=" * 60)
        with src_engine.connect() as src, dst_engine.begin() as dst:
            for table in db.metadata.sorted_tables:
                if table.name not in src_tables:
                    print(f"  -   {table.name:<28} serverda yo'q, o'tkazib yuborildi")
                    continue
                src_table = src_meta.tables[table.name]
                cols = [c.name for c in table.columns if c.name in src_table.columns]
                result = src.execute(select(*[src_table.c[name] for name in cols]))
                count = 0
                while True:
                    rows = result.mappings().fetchmany(BATCH)
                    if not rows:
                        break
                    dst.execute(table.insert(), [dict(r) for r in rows])
                    count += len(rows)
                total += count
                print(f"  OK  {table.name:<28} {count:>7} ta")

        size_mb = os.path.getsize(out_path) / 1024 / 1024
        print("=" * 60)
        print(f"  Jami {total} ta yozuv, fayl {size_mb:.1f} MB")
        print(f"  Fayl: {out_path}")
        print("  Uni yuklab olib, lokalda instance\\poligrafiya.db nomi bilan qo'ying.")
        print("=" * 60)


if __name__ == "__main__":
    main()
