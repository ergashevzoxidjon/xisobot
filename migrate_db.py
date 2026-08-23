"""
Mavjud bazani yangi tuzilmaga xavfsiz o'tkazadi.

Nima qiladi:
  1. Bazadan zaxira nusxa oladi (SQLite bo'lsa)
  2. Yangi jadvallarni yaratadi (payment, order_type, audit_log,
     company_settings, telegram_settings, order_file, login_attempt)
  3. Yangi ustunlarni qo'shadi (is_active_user, created_by, version,
     is_deleted va boshqalar)
  4. Eski `order.paid_amount` qiymatlarini `payment` jadvaliga ko'chiradi
  5. Ombordan qolgan `material` va `material_transaction` jadvallarini o'chiradi
  6. Fayllar uchun papka yaratadi

Ishga tushirish:  python migrate_db.py
Bir necha marta ishga tushirish xavfsiz — bajarilgan qadamlar takrorlanmaydi.
"""

import os
import shutil
from datetime import datetime

from sqlalchemy import inspect, text

from app import create_app
from extensions import db


def backup_sqlite(app):
    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    if not uri.startswith("sqlite:///"):
        print("• PostgreSQL/boshqa baza — zaxira nusxa qo'lda olinishi kerak.")
        return
    path = uri.replace("sqlite:///", "")
    if not os.path.isabs(path):
        path = os.path.join(app.instance_path, path)
    if not os.path.exists(path):
        print("• Baza fayli topilmadi — yangi baza yaratiladi.")
        return
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = f"{path}.backup_{stamp}"
    shutil.copy2(path, dest)
    print(f"✓ Zaxira nusxa: {dest}")


def existing_tables():
    return set(inspect(db.engine).get_table_names())


def columns_of(table):
    try:
        return {c["name"] for c in inspect(db.engine).get_columns(table)}
    except Exception:
        return set()


def add_column(table, column_ddl, column_name):
    if table not in existing_tables():
        return
    if column_name in columns_of(table):
        print(f"  · {table}.{column_name} allaqachon mavjud")
        return
    db.session.execute(text(f"ALTER TABLE \"{table}\" ADD COLUMN {column_ddl}"))
    db.session.commit()
    print(f"✓ {table}.{column_name} ustuni qo'shildi")


def migrate_paid_amount():
    """Eski order.paid_amount -> payment jadvaliga bitta yozuv sifatida."""
    if "order" not in existing_tables():
        return
    if "paid_amount" not in columns_of("order"):
        print("  · paid_amount ustuni yo'q — ko'chirish shart emas")
        return

    already = db.session.execute(text("SELECT COUNT(*) FROM payment")).scalar()
    if already:
        print(f"  · payment jadvalida allaqachon {already} ta yozuv bor — ko'chirish o'tkazib yuborildi")
        return

    rows = db.session.execute(text(
        'SELECT id, paid_amount, created_at FROM "order" WHERE paid_amount IS NOT NULL AND paid_amount > 0'
    )).fetchall()

    moved = 0
    for row in rows:
        order_id, amount, created_at = row[0], row[1], row[2]
        paid_on = str(created_at)[:10] if created_at else datetime.now().strftime("%Y-%m-%d")
        db.session.execute(
            text("""INSERT INTO payment (order_id, amount, paid_on, note, created_at)
                    VALUES (:oid, :amt, :pon, :note, :cat)"""),
            {
                "oid": order_id, "amt": amount, "pon": paid_on,
                "note": "Eski tizimdan ko'chirildi",
                "cat": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            },
        )
        moved += 1
    db.session.commit()
    print(f"✓ {moved} ta eski to'lov payment jadvaliga ko'chirildi")


def drop_obsolete_tables():
    tables = existing_tables()
    for name in ("material_transaction", "material"):
        if name in tables:
            db.session.execute(text(f'DROP TABLE IF EXISTS "{name}"'))
            db.session.commit()
            print(f"✓ Eski '{name}' jadvali o'chirildi")


def ensure_upload_folder(app):
    folder = app.config.get("UPLOAD_FOLDER")
    if folder and not os.path.isdir(folder):
        os.makedirs(folder, exist_ok=True)
        print(f"✓ Fayllar papkasi yaratildi: {folder}")


def main():
    app = create_app()
    with app.app_context():
        print("=== Migratsiya boshlandi ===")
        backup_sqlite(app)

        # create_all yangi jadvallarni (payment, order_type, audit_log) yaratadi
        db.create_all()
        print("✓ Yangi jadvallar tekshirildi/yaratildi")

        # --- v2 ustunlari ---
        add_column("user", "is_active_user BOOLEAN DEFAULT 1 NOT NULL", "is_active_user")
        add_column("expense", "created_by INTEGER", "created_by")
        add_column("order", "updated_at DATETIME", "updated_at")

        # --- v3 ustunlari (optimistik qulflash va yumshoq o'chirish) ---
        add_column("order", "version INTEGER DEFAULT 1 NOT NULL", "version")
        add_column("order", "is_deleted BOOLEAN DEFAULT 0 NOT NULL", "is_deleted")
        add_column("order", "deleted_at DATETIME", "deleted_at")
        add_column("order", "deleted_by INTEGER", "deleted_by")
        add_column("client", "is_deleted BOOLEAN DEFAULT 0 NOT NULL", "is_deleted")
        add_column("client", "deleted_at DATETIME", "deleted_at")

        migrate_paid_amount()
        drop_obsolete_tables()
        ensure_upload_folder(app)

        print("=== Migratsiya muvaffaqiyatli tugadi ===")
        print("\nEslatma: eski 'order.paid_amount' ustuni tegilmadi (zarar qilmaydi).")
        print("Endi to'lovlar 'payment' jadvalidan hisoblanadi.")


if __name__ == "__main__":
    main()
