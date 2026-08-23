"""
Boshlang'ich sozlash — faqat zarur ma'lumotlar.
Production'da ham xavfsiz ishlatiladi (namuna ma'lumot qo'shmaydi).

Ishga tushirish:  python seed.py

Admin parolini environment orqali berish mumkin:
    ADMIN_PASSWORD=... python seed.py
"""

import os
import secrets

from app import create_app
from extensions import db
from models import User, OrderType
from utils import to_money

DEFAULT_ORDER_TYPES = [
    ("Vizitka", "dona", 150),
    ("Banner", "m²", 35000),
    ("Buklet A4", "dona", 2000),
    ("Plakat A2", "dona", 50000),
    ("Taqvim a6", "dona", 1500),
    ("Flayer", "dona", 400),
    ("Taklifnoma", "dona", 45000),
    ("Naklekya (stiker)", "dona", 800),
]


def main():
    app = create_app()
    with app.app_context():
        db.create_all()

        # ---- administrator ----
        admin = User.query.filter_by(username="admin").first()
        if not admin:
            password = os.environ.get("ADMIN_PASSWORD")
            generated = False
            if not password:
                password = secrets.token_urlsafe(9)
                generated = True

            admin = User(username="admin", full_name="Administrator", role="admin")
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()

            print("=" * 52)
            print("  Administrator yaratildi")
            print("  Login : admin")
            print(f"  Parol : {password}")
            if generated:
                print("\n  DIQQAT: bu parol tasodifiy yaratildi.")
                print("  Uni saqlab qo'ying va birinchi kirgandan so'ng")
                print("  'Parolni o'zgartirish' bo'limidan o'zgartiring.")
            print("=" * 52)
        else:
            print("· Administrator allaqachon mavjud — o'zgartirilmadi.")

        # ---- buyurtma turlari ma'lumotnomasi ----
        added = 0
        for name, unit, price in DEFAULT_ORDER_TYPES:
            if not OrderType.query.filter_by(name=name).first():
                db.session.add(OrderType(name=name, unit=unit, default_price=to_money(price)))
                added += 1
        if added:
            db.session.commit()
            print(f"· {added} ta standart buyurtma turi qo'shildi.")

        print("\nTayyor. Endi: python app.py")


if __name__ == "__main__":
    main()
