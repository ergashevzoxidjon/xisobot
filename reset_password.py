"""
Foydalanuvchi parolini tiklash (login/parolni unutib qo'yganda).

Foydalanuvchilar ro'yxatini ko'rish:
    python reset_password.py

Parolni tiklash:
    python reset_password.py <username> [yangi_parol]
    (agar yangi_parol berilmasa, tasodifiy xavfsiz parol yaratiladi)

DIQQAT (serverda ishga tushirishdan oldin):
    source /home/mylogo/virtualenv/repositories/xisobot/3.10/bin/activate
    cd /home/mylogo/repositories/xisobot
    export DATABASE_URL="mysql://mylogo_erp:PAROL@localhost/mylogo_poligrafiya"
    python reset_password.py
"""

import sys
import secrets

from app import create_app
from extensions import db
from models import User


def main():
    app = create_app()
    with app.app_context():
        if len(sys.argv) < 2:
            print("=" * 60)
            print("  Mavjud foydalanuvchilar:")
            print("=" * 60)
            for u in User.query.order_by(User.id).all():
                holat = "faol" if u.is_active_user else "BLOKLANGAN"
                print(f"  #{u.id:<3} {u.username:<15} {u.role:<12} {u.full_name or '':<20} [{holat}]")
            print()
            print("Parolni tiklash uchun:")
            print("  python reset_password.py <username> [yangi_parol]")
            print("=" * 60)
            return

        username = sys.argv[1]
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"XATO: '{username}' nomli foydalanuvchi topilmadi.")
            print("Ro'yxatni ko'rish uchun argumentsiz ishga tushiring: python reset_password.py")
            return

        password = sys.argv[2] if len(sys.argv) > 2 else secrets.token_urlsafe(9)
        user.set_password(password)
        db.session.commit()

        print("=" * 60)
        print(f"  Parol tiklandi: {username}")
        print(f"  Yangi parol   : {password}")
        print()
        print("  Kirgandan so'ng 'Parolni o'zgartirish' bo'limidan")
        print("  bu parolni o'zingiz eslab qoladigan parolga almashtiring.")
        print("=" * 60)


if __name__ == "__main__":
    main()
