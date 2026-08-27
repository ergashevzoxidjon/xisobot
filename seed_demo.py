"""
Namuna (demo) ma'lumotlar — faqat tizimni sinab ko'rish uchun.

DIQQAT: bu skriptni real ishlaydigan bazada ISHGA TUSHIRMANG.

Ishga tushirish:  python seed_demo.py
"""

from datetime import timedelta
from decimal import Decimal

from app import create_app
from extensions import db
from models import User, Client, Order, Payment, Expense
from utils import today_local, to_money


def days_ago(n):
    return today_local() - timedelta(days=n)


DEMO_USERS = [
    ("menejer1", "Jasur Tursunov", "menejer"),
    ("xarajatchi1", "Otabek Yusupov", "xarajatchi"),
    ("boss1", "Nilufar Rashidova", "boss"),
]

DEMO_CLIENTS = [
    ("Andijon Poligraf MChJ", "+998901112233", "Andijon sh., Bobur ko'chasi 12", "Doimiy mijoz"),
    ("Sardor Xolmatov", "+998907654321", "Samarqand sh., Registon ko'chasi 5", ""),
    ("Tashkent Reklama MChJ", "+998933344556", "Toshkent sh., Chilonzor tumani", "Banner buyurtmalari"),
    ("Dilnoza Karimova", "+998998887766", "Farg'ona sh.", "To'y taklifnomalari"),
    ("Bek Trade MChJ", "+998971234567", "Buxoro sh., Mustaqillik ko'chasi 8", "Yirik buyurtmalar"),
]

# (mijoz, tur, tavsif, miqdor, narx, holat, to'lov ulushi, buyurtma kuni, muddat kuni)
DEMO_ORDERS = [
    ("Andijon Poligraf MChJ", "Vizitka", "Ikki tomonlama, glyanets laminatsiya", 1000, 150, "yetkazildi", 1.0, 55, 48),
    ("Bek Trade MChJ", "Kitob", "120 bet, qattiq muqova", 50, 45000, "yetkazildi", 1.0, 50, 40),
    ("Tashkent Reklama MChJ", "Banner", "3x2 metr, PVC banner", 6, 45000, "yetkazildi", 1.0, 40, 35),
    ("Dilnoza Karimova", "Taklifnoma", "To'y taklifnomasi, oltin bosma", 300, 4500, "yetkazildi", 0.5, 35, 25),
    ("Andijon Poligraf MChJ", "Taqvim", "Devoriy taqvim, 2027-yil", 200, 8000, "tayyor", 0.4, 25, 10),
    ("Sardor Xolmatov", "Buklet", "A4, uch burma", 500, 2000, "jarayonda", 0.3, 18, -5),
    ("Tashkent Reklama MChJ", "Plakat", "A2 format, 4+0 rang", 100, 5000, "jarayonda", 0.0, 12, -3),
    ("Bek Trade MChJ", "Vizitka", "Bir tomonlama, matt", 2000, 130, "yangi", 0.0, 6, -12),
    ("Dilnoza Karimova", "Naklekya (stiker)", "Doira shaklida, 5 sm", 1000, 800, "yangi", 0.0, 3, -20),
    ("Sardor Xolmatov", "Banner", "2x1 metr", 2, 45000, "bekor qilindi", 0.0, 30, 20),
    ("Andijon Poligraf MChJ", "Kitob", "80 bet, yumshoq muqova", 100, 28000, "yetkazildi", 0.6, 70, 60),
    ("Bek Trade MChJ", "Buklet", "A5, ikki burma", 800, 1800, "yetkazildi", 1.0, 85, 75),
]

DEMO_EXPENSES = [
    ("ijara", 3000000, "Sex va ofis ijarasi", 3),
    ("ish haqi", 15000000, "Xodimlar oylik maoshi", 5),
    ("kommunal", 800000, "Svet, suv, internet", 8),
    ("xomashyo", 6500000, "Qog'oz va bo'yoq xaridi", 12),
    ("transport", 500000, "Yetkazib berish xarajati", 15),
    ("boshqa", 350000, "Kanselyariya buyumlari", 18),
    ("ijara", 3000000, "O'tgan oy ijarasi", 34),
    ("ish haqi", 14500000, "O'tgan oy maoshi", 36),
    ("xomashyo", 5800000, "O'tgan oy qog'oz xaridi", 40),
    ("kommunal", 750000, "O'tgan oy kommunal", 42),
    ("soliq", 2200000, "Chorak soliq to'lovi", 45),
    ("jihoz", 4500000, "Kesish stanogi ta'miri", 60),
]


def main():
    app = create_app()
    with app.app_context():
        admin = User.query.filter_by(username="admin").first()
        if not admin:
            print("Avval `python seed.py` ni ishga tushiring (admin yaratilishi kerak).")
            return

        # ---- foydalanuvchilar ----
        for username, full_name, role in DEMO_USERS:
            if not User.query.filter_by(username=username).first():
                u = User(username=username, full_name=full_name, role=role)
                u.set_password("parol123")
                db.session.add(u)
                print(f"· {role}: {username} / parol123")
        db.session.commit()

        # ---- mijozlar ----
        for name, phone, address, notes in DEMO_CLIENTS:
            if not Client.query.filter_by(name=name).first():
                db.session.add(Client(name=name, phone=phone, address=address, notes=notes))
        db.session.commit()

        clients = {c.name: c for c in Client.query.all()}

        # ---- buyurtmalar va to'lovlar ----
        if Order.query.count() == 0:
            year = today_local().year
            seq = 1
            for (cname, otype, desc, qty, price, status, paid_ratio, created_days, deadline_days) in DEMO_ORDERS:
                unit_price = to_money(price)
                total = to_money(Decimal(qty) * unit_price)
                created = days_ago(created_days)

                o = Order(
                    order_number=f"B-{year}-{seq:04d}",
                    client_id=clients[cname].id,
                    order_type=otype,
                    description=desc,
                    quantity=qty,
                    unit_price=unit_price,
                    total_price=total,
                    status=status,
                    deadline=days_ago(deadline_days),
                    created_by=admin.id,
                )
                # created_at ni qo'lda o'rnatamiz (namuna tarixi uchun)
                o.created_at = created
                db.session.add(o)
                db.session.flush()

                if paid_ratio > 0:
                    amount = to_money(total * Decimal(str(paid_ratio)))
                    # to'lov buyurtmadan bir necha kun keyin qilingan
                    pay_date = created + timedelta(days=min(7, max(1, created_days // 3)))
                    if pay_date > today_local():
                        pay_date = today_local()
                    db.session.add(Payment(
                        order_id=o.id, amount=amount, paid_on=pay_date,
                        note="Namuna to'lov", created_by=admin.id,
                    ))
                seq += 1

            db.session.commit()
            print(f"· {len(DEMO_ORDERS)} ta namuna buyurtma va to'lovlari qo'shildi.")

        # ---- xarajatlar ----
        if Expense.query.count() == 0:
            for category, amount, description, days in DEMO_EXPENSES:
                db.session.add(Expense(
                    category=category, amount=to_money(amount),
                    description=description, date=days_ago(days),
                    created_by=admin.id,
                ))
            db.session.commit()
            print(f"· {len(DEMO_EXPENSES)} ta namuna xarajat qo'shildi.")

        print("\nNamuna ma'lumotlar tayyor.")


if __name__ == "__main__":
    main()
