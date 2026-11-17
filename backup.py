"""
Bazani avtomatik zaxiralash (2026-11-17).

Nima qiladi:
  1. Butun bazaning (SQLite yoki MySQL) to'liq nusxasini bitta SQLite faylga yozadi
     (mysqldump'ga bog'liq emas — umumiy hostingda ham ishlaydi);
  2. Faylni siqadi:  xisobot-YYYYmmdd-HHMMSS.db.gz;
  3. Eng yangi BACKUP_KEEP (standart 14) ta nusxani qoldirib, eskilarini o'chiradi;
  4. Telegram sozlangan bo'lsa, nusxani tashqariga ham (rahbar chatiga) yuboradi —
     hosting buzilsa ham zaxira qoladi. O'chirish: BACKUP_TELEGRAM=0.

Papka: BACKUP_DIR muhit o'zgaruvchisi, bo'lmasa  <ilova>/instance/backups.

Hostingda kunlik ishga tushirish (cPanel -> Cron Jobs, har kuni 03:00):
    0 3 * * * cd /home/mylogo/repositories/xisobot && /home/mylogo/virtualenv/repositories/xisobot/3.10/bin/python backup.py

Qo'lda:   python backup.py            (Telegramga ham yuboradi)
          python backup.py --local    (faqat diskka)

Tiklash: faylni gunzip qiling -> .db fayl; lokalda instance/poligrafiya.db sifatida
qo'ying (db_nusxa.py yo'riqnomasiga qarang).
"""

import gzip
import os
import shutil
import sqlite3
import sys
import tempfile
from datetime import datetime

from sqlalchemy import MetaData, create_engine, inspect, select

BATCH = 500
PREFIX = "xisobot-"
SUFFIX = ".db.gz"


def backup_dir(app):
    path = os.environ.get("BACKUP_DIR") or os.path.join(app.instance_path, "backups")
    os.makedirs(path, exist_ok=True)
    return path


def keep_count():
    try:
        return max(1, int(os.environ.get("BACKUP_KEEP", "14")))
    except ValueError:
        return 14


def _snapshot_sqlite(src_path, out_path):
    """Ishlayotgan SQLite bazasidan izchil nusxa (yozish paytida ham xavfsiz)."""
    src = sqlite3.connect(src_path)
    dst = sqlite3.connect(out_path)
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()


def _snapshot_generic(db, out_path):
    """MySQL/boshqa bazadan: jadvallarni SQLite faylga ko'chiradi (db_nusxa.py bilan bir xil usul)."""
    src_engine = db.engine
    dst_engine = create_engine(f"sqlite:///{out_path}")
    db.metadata.create_all(dst_engine)
    src_meta = MetaData()
    src_meta.reflect(bind=src_engine)
    src_tables = set(inspect(src_engine).get_table_names())
    with src_engine.connect() as src, dst_engine.begin() as dst:
        for table in db.metadata.sorted_tables:
            if table.name not in src_tables:
                continue
            src_table = src_meta.tables[table.name]
            cols = [c.name for c in table.columns if c.name in src_table.columns]
            result = src.execute(select(*[src_table.c[n] for n in cols]))
            while True:
                rows = result.mappings().fetchmany(BATCH)
                if not rows:
                    break
                dst.execute(table.insert(), [dict(r) for r in rows])
    dst_engine.dispose()


def make_backup(app, send_telegram=True):
    """Zaxira yaratadi. (fayl_yo'li, telegram_natijasi_matni) qaytaradi."""
    from extensions import db

    folder = backup_dir(app)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    final_path = os.path.join(folder, f"{PREFIX}{stamp}{SUFFIX}")

    tmp_dir = tempfile.mkdtemp(prefix="xisobot-bk-")
    tmp_db = os.path.join(tmp_dir, "snapshot.db")
    try:
        engine = db.engine
        if engine.dialect.name == "sqlite" and engine.url.database \
                and engine.url.database != ":memory:":
            _snapshot_sqlite(engine.url.database, tmp_db)
        else:
            _snapshot_generic(db, tmp_db)
        with open(tmp_db, "rb") as fin, gzip.open(final_path, "wb", compresslevel=6) as fout:
            shutil.copyfileobj(fin, fout)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    prune(folder)

    tg_note = "Telegramga yuborilmadi (o'chirilgan)"
    if send_telegram:
        tg_note = send_offsite(final_path)
    return final_path, tg_note


def prune(folder):
    files = list_backups_in(folder)
    for item in files[keep_count():]:
        try:
            os.remove(item["path"])
        except OSError:
            pass


def list_backups_in(folder):
    """Zaxiralar, eng yangisi birinchi: [{name, path, size, mtime}]."""
    items = []
    if not os.path.isdir(folder):
        return items
    for name in os.listdir(folder):
        if name.startswith(PREFIX) and name.endswith(SUFFIX):
            path = os.path.join(folder, name)
            st = os.stat(path)
            items.append({"name": name, "path": path, "size": st.st_size,
                          "mtime": datetime.fromtimestamp(st.st_mtime)})
    items.sort(key=lambda x: x["name"], reverse=True)
    return items


def send_offsite(path):
    """Zaxirani Telegramdagi rahbar chatiga yuboradi (tashqi nusxa)."""
    if os.environ.get("BACKUP_TELEGRAM", "1").strip().lower() in ("0", "false", "no", "off"):
        return "Telegramga yuborilmadi (BACKUP_TELEGRAM=0)"
    try:
        from models import TelegramSettings
        import telegram_bot as tg
        s = TelegramSettings.get()
        if not s.is_ready:
            return "Telegram sozlanmagan — tashqi nusxa yuborilmadi"
        size_mb = os.path.getsize(path) / 1024 / 1024
        ok, msg = tg.send_document(
            s.bot_token, s.manager_chat_id, path,
            caption=f"💾 Xisobot bazasi zaxirasi ({size_mb:.1f} MB)")
        return "Telegramga yuborildi" if ok else f"Telegramga yuborilmadi: {msg}"
    except Exception as e:  # zaxira o'zi muvaffaqiyatli — tashqi nusxa xatosi uni buzmasin
        return f"Telegramga yuborilmadi: {e}"


def main():
    from app import create_app
    app = create_app()
    with app.app_context():
        path, note = make_backup(app, send_telegram="--local" not in sys.argv)
        size_mb = os.path.getsize(path) / 1024 / 1024
        print(f"OK: {path} ({size_mb:.2f} MB). {note}")


if __name__ == "__main__":
    main()
