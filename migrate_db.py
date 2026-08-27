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


def quote_ident(name):
    """Jadval nomini bazaga mos belgilar bilan o'raydi.

    SQLite va PostgreSQL qo'sh tirnoq ishlatadi, MySQL esa teskari tirnoq (`).
    Qo'sh tirnoqni MySQL matn deb tushunadi va ALTER TABLE xato beradi —
    shuning uchun nomni drayverning o'zi o'rashi kerak.
    """
    return db.engine.dialect.identifier_preparer.quote(name)


def add_column(table, column_ddl, column_name):
    if table not in existing_tables():
        return
    if column_name in columns_of(table):
        print(f"  · {table}.{column_name} allaqachon mavjud")
        return
    db.session.execute(text(f"ALTER TABLE {quote_ident(table)} ADD COLUMN {column_ddl}"))
    db.session.commit()
    print(f"✓ {table}.{column_name} ustuni qo'shildi")


def migrate_role_rename():
    """'buxgalter' roli 'boss' deb qayta nomlandi (2026-08-26).

    Boss — korxona rahbari, admin bilan teng huquqli. Eski bazadagi
    foydalanuvchilarning roli yangi nomga o'tkaziladi.
    """
    if "user" not in existing_tables():
        return
    if "role" not in columns_of("user"):
        return

    result = db.session.execute(text(
        f"UPDATE {quote_ident('user')} SET role = 'boss' WHERE role = 'buxgalter'"
    ))
    db.session.commit()
    if result.rowcount:
        print(f"✓ {result.rowcount} ta foydalanuvchining roli 'buxgalter' → 'boss'")
    else:
        print("  · 'buxgalter' rolidagi foydalanuvchi yo'q")


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


def drop_legacy_material():
    """Eski (olib tashlangan) ombor modulidan qolgan jadvallarni tozalaydi.

    2026-08-26 dan yangi ombor ham `material` jadvalidan foydalanadi, lekin
    ustunlari boshqacha. Shuning uchun eski jadval — `last_price` ustuni
    yo'q bo'lganidan bilinadi — o'chiriladi va `db.create_all()` yangisini
    quradi. Bu funksiya create_all dan OLDIN chaqirilishi shart.
    """
    tables = existing_tables()

    if "material_transaction" in tables:
        db.session.execute(text(f"DROP TABLE IF EXISTS {quote_ident('material_transaction')}"))
        db.session.commit()
        print("✓ Eski 'material_transaction' jadvali o'chirildi")

    if "material" in tables and "last_price" not in columns_of("material"):
        db.session.execute(text(f"DROP TABLE IF EXISTS {quote_ident('material')}"))
        db.session.commit()
        print("✓ Eski 'material' jadvali o'chirildi — yangi ombor uchun qayta quriladi")


def migrate_order_items():
    """Eski bir mahsulotli buyurtmalarni `order_item` qatorlariga ko'chiradi.

    Ilgari har bir buyurtmada bitta mahsulot bo'lardi (order.order_type,
    quantity, unit_price). Endi mahsulotlar alohida jadvalda turadi.
    Qatori yo'q har bir buyurtma uchun bitta qator yaratamiz.
    """
    from models import Order, OrderItem

    orders = (
        Order.query.outerjoin(OrderItem, OrderItem.order_id == Order.id)
        .filter(OrderItem.id.is_(None))
        .all()
    )
    if not orders:
        print("  · barcha buyurtmalarda mahsulot qatori bor — ko'chirish shart emas")
        return

    for o in orders:
        db.session.add(OrderItem(
            order_id=o.id,
            order_type=(o.order_type or "Mahsulot")[:100],
            description=(o.description or "")[:500] or None,
            quantity=o.quantity or 1,
            unit_price=o.unit_price or 0,
            total_price=o.total_price or 0,
            position=0,
        ))
    db.session.commit()
    print(f"✓ {len(orders)} ta buyurtma mahsulot qatoriga ko'chirildi")


def widen_order_status_column():
    """order.status endi uzunroq nomlar saqlaydi (masalan "to'lov qilish
    jarayonida" — 24 belgi), eski ustun esa VARCHAR(20) edi. MySQL bunday
    uzunlikni QATTIQ bajaradi va qisqartirib tashlaydi — shuning uchun
    ustun kengaytiriladi. SQLite VARCHAR uzunligini umuman bajarmaydi,
    shuning uchun u yerda hech narsa qilish shart emas.
    """
    if "order" not in existing_tables():
        return
    if db.engine.dialect.name != "mysql":
        print("  · order.status uzunligi (SQLite uzunlikni bajarmaydi) — o'tkazib yuborildi")
        return
    db.session.execute(text(
        f"ALTER TABLE {quote_ident('order')} MODIFY COLUMN status VARCHAR(40) NOT NULL"
    ))
    db.session.commit()
    print("✓ order.status ustuni VARCHAR(40) gacha kengaytirildi")


def migrate_order_status_rename():
    """Buyurtma holati 5 bosqichdan 6 bosqichli jarayonga o'tkazildi
    (2026-08-27). Eski qiymatlar yangilariga avtomatik ko'chiriladi —
    foydalanuvchi qarori bilan har biri eng yaqin mos bosqichga tushadi.
    "bekor qilindi" o'zgarmaydi.
    """
    if "order" not in existing_tables():
        return

    RENAME_MAP = {
        "yangi": "buyurtma yaratildi",
        "jarayonda": "ishlab chiqarishda",
        "tayyor": "yetkazish uchun tayyor",
        "yetkazildi": "maxsulot yetkazildi",
    }
    total = 0
    for old, new in RENAME_MAP.items():
        result = db.session.execute(
            text(f'UPDATE {quote_ident("order")} SET status = :new WHERE status = :old'),
            {"new": new, "old": old},
        )
        total += result.rowcount
    db.session.commit()
    if total:
        print(f"✓ {total} ta buyurtma holati yangi 6 bosqichli nomlarga ko'chirildi")
    else:
        print("  · eski nomdagi buyurtma holati topilmadi — ko'chirish shart emas")


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

        # eski ombor jadvallari yangisi qurilishidan OLDIN tozalanadi
        drop_legacy_material()

        # create_all yangi jadvallarni (payment, order_type, audit_log,
        # material, stock_move) yaratadi
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

        # --- v4: ko'p qatorli buyurtma va buyurtmaga bog'langan xarajat ---
        add_column("expense", "order_id INTEGER", "order_id")
        migrate_order_items()

        # --- v5: 'buxgalter' roli 'boss' deb qayta nomlandi ---
        migrate_role_rename()

        # --- v6: taminotchilar (supplier, supplier_payment yangi jadvallar
        # create_all bilan yaratiladi; expense'ga bog'lovchi ustunlar) ---
        add_column("expense", "supplier_id INTEGER", "supplier_id")
        add_column("expense", "is_paid BOOLEAN DEFAULT 1 NOT NULL", "is_paid")

        # --- v7: ombor kirimida to'lov usuli (naqd / perechisleniye) va
        # perechisleniye bo'lganda qaysi tashkilot orqali to'langani ---
        add_column("expense", "payment_method VARCHAR(20)", "payment_method")
        add_column("expense", "paid_via VARCHAR(150)", "paid_via")

        # --- v8: buyurtma holati 6 bosqichli jarayonga o'tkazildi ---
        # avval ustun kengaytiriladi, SO'NG eski qiymatlar ko'chiriladi —
        # aks holda MySQL yangi (uzunroq) nomlarni kesib tashlaydi.
        widen_order_status_column()
        migrate_order_status_rename()

        migrate_paid_amount()
        ensure_upload_folder(app)

        print("=== Migratsiya muvaffaqiyatli tugadi ===")
        print("\nEslatma: eski 'order.paid_amount' ustuni tegilmadi (zarar qilmaydi).")
        print("Endi to'lovlar 'payment' jadvalidan hisoblanadi.")


if __name__ == "__main__":
    main()
