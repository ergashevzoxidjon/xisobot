"""
Rolli kirish nazorati (RBAC).

4 ta rol:
- admin        — barchasini nazorat qiladi
- menejer      — buyurtma (zakaz) kiritadi va boshqaradi, moliyani ko'rmaydi
- xarajatchi   — faqat xarajat kiritadi (ish boshqaruvchi)
- boss         — rahbar, faqat KO'RADI: hisobot, tahlil, eksport (o'zgartirmaydi)

Himoya ikki qatlamli: shablonda menyu/tugma yashiriladi (has_perm) va
route darajasida bloklanadi (permission_required).
"""

from functools import wraps

from flask import redirect, url_for, flash
from flask_login import current_user

ROLE_LABELS = {
    "admin": "Administrator",
    "menejer": "Menejer",
    "xarajatchi": "Ish boshqaruvchi",
    "boss": "Boss",
}

ROLE_DESCRIPTIONS = {
    "admin": "Barcha bo'limlar va foydalanuvchilar boshqaruvi",
    "menejer": "Buyurtma va mijozlar bilan ishlaydi",
    "xarajatchi": "Ombor, xarajat va taminotchilarni yuritadi, hisobotlarni ko'radi",
    "boss": "Rahbar — barcha hisobot va tahlillarni ko'radi (o'zgartirmaydi)",
}

PERMISSIONS = {
    "orders.view", "orders.create", "orders.edit", "orders.manage", "orders.delete",
    # "ishlab chiqarishda" -> "yetkazish uchun tayyor" o'tishi uchun —
    # ish boshqaruvchi ishlab chiqarish tugaganini birinchi biladi
    # (2026-09-05, foydalanuvchi qarori). orders.manage'dan farqli — bu
    # faqat shu bitta o'tishga ruxsat beradi, to'lov/bekor qilishga emas.
    "orders.status",
    "clients.view", "clients.create", "clients.delete",
    "expenses.view", "expenses.create",
    "stock.view", "stock.manage",
    # Ombordagi mahsulotning joriy qoldig'i va narxini to'g'ridan-to'g'ri
    # tuzatish (masalan, jismoniy inventarizatsiyadan keyin) — bu oddiy
    # kirim/chiqimdan farqli, moliyaviy izsiz o'tkaziladigan operatsiya,
    # shuning uchun faqat admin (2026-09-03, foydalanuvchi qarori).
    "stock.adjust",
    "suppliers.view", "suppliers.manage",
    # Taminotchini o'chirish (yumshoq — ro'yxatlardan yashiriladi, keyin
    # tiklash mumkin, xuddi clients.delete kabi) — faqat admin (2026-09-16,
    # foydalanuvchi so'rovi). clients.delete'dan farqi: qarzdorlik bo'lsa
    # ham o'chirishga ruxsat beriladi, lekin avval alohida checkbox bilan
    # qayta tasdiqlash talab qilinadi (route: suppliers.delete_supplier);
    # qarz va xarid tarixi saqlanib qoladi, tiklaganda yana ko'rinadi.
    "suppliers.delete",
    "reports.view", "reports.export",
    "managers.view", "managers.manage",
    "hr.view", "hr.manage", "hr.pay",
    "users.manage",
    "settings.manage",
    # "Pullar" — naqd pul topshirish nazorati (2026-09-07). money.view —
    # ro'yxat/balansni ko'rish; money.confirm — o'ziga topshirilgan pulni
    # "qabul qildim" deb tasdiqlash (endi naqd — xarajatchi, karta — boss).
    # money.fund — OFIS zaxirasiga pul kiritish (2026-09-08, faqat boss/admin).
    # money.adjust — OFIS zaxirasiga xato kiritilgan summani/izohni tuzatish
    # (2026-09-16, foydalanuvchi so'rovi) — faqat admin (stock.adjust kabi:
    # to'g'ridan-to'g'ri tuzatish, boss o'ziga xato kiritgan bo'lsa ham
    # o'zi o'zgartira olmaydi, faqat admin orqali to'g'irlanadi).
    "money.view", "money.confirm", "money.fund", "money.adjust",
}

ROLE_PERMISSIONS = {
    "admin": set(PERMISSIONS),
    # Menejer moliya bilan ishlamaydi — faqat buyurtma va mijoz. Xarajat,
    # foyda va umumiy hisobotlar unga ko'rinmaydi, lekin o'zining shaxsiy
    # menejer hisobotini (managers.view) ko'radi (2026-08-29).
    "menejer": {
        "orders.view", "orders.create", "orders.edit", "orders.manage",
        "clients.view", "clients.create",
        "managers.view",
        # o'zi topshirgan naqd pullarning holatini (kutilmoqda/qabul
        # qilindi) kuzatib borishi uchun — tasdiqlay olmaydi, faqat ko'radi.
        "money.view",
    },
    # Ish boshqaruvchi omborni yuritadi: mahsulot qabul qiladi va sarflaydi,
    # taminotchilar bilan ishlaydi (qarz-to'lov). Moliyaviy hisobot va
    # tahlilni ham ko'radi (2026-08-27, foydalanuvchi qarori) — buyurtmalar
    # rentabelligi va boshqa hisobotlarni kuzatishi kerak.
    "xarajatchi": {"expenses.view", "expenses.create", "orders.view", "orders.status",
                   "stock.view", "stock.manage",
                   "suppliers.view", "suppliers.manage",
                   "reports.view",
                   # HR: xodimlar ro'yxatini ko'radi va avans kiritadi
                   # (2026-08-29, foydalanuvchi qarori) — pasport yuklash
                   # va xodim/oylik boshqaruvi faqat adminda (hr.manage).
                   "hr.view", "hr.pay",
                   # Manager xisoboti: ish boshqaruvchi menejerlarning
                   # kunlik mijozlar bilan ishlash jurnalini kuzatib borishi
                   # kerak (2026-08-29, foydalanuvchi qarori) — shu bilan
                   # birga sotuv/KPI hisobotini ham ko'radi (bitta ruxsat).
                   "managers.view",
                   # "Pullar" — o'ziga topshirilgan naqd pulni qabul
                   # qilganini tasdiqlaydi va xarajatga sarflaydi
                   # (2026-09-07, foydalanuvchi qarori).
                   "money.view", "money.confirm"},
    # Boss — korxona rahbari. Endi Buyurtmalar, Mijozlar, Taminotchilar va
    # Ombor bo'limlariga kirmaydi (2026-08-29, foydalanuvchi qarori) — faqat
    # hisobot, tahlil, menejerlar statistikasi va HR ro'yxatini ko'radi.
    # Istisno: "Ishchiga berilayotgan summa" (hr.pay) — Boss shu yerda
    # xarajatchi kabi to'liq kirita oladi (2026-08-29, foydalanuvchi qarori).
    "boss": {
        "expenses.view",
        "reports.view", "reports.export",
        "managers.view",
        "hr.view", "hr.pay",
        # Naqd pulni kuzatib boradi (ko'radi), karta to'lovlarini esa o'zi
        # tasdiqlaydi — mijoz to'lovni Karta deb belgilasa, pul boshliqning
        # shaxsiy kartasiga tushadi, shuni "qabul qildim" deb belgilaydi
        # (2026-09-08, foydalanuvchi qarori). money.fund — OFIS zaxirasini
        # to'ldirish huquqi.
        "money.view", "money.confirm", "money.fund",
    },
}

# rol uchun kirishdan keyingi asosiy sahifa — barcha rollar endi bitta
# umumiy Bosh sahifaga tushadi (2026-08-29, foydalanuvchi qarori): mazmuni
# shablonda (dashboard.html) ruxsatlarga qarab farqlanadi ("Diqqat talab
# qiladi" — faqat admin, moliyaviy kartalar — reports.view bo'lganlarga).
ROLE_HOME_ENDPOINT = {
    "admin": "main.dashboard",
    "boss": "main.dashboard",
    "menejer": "main.dashboard",
    "xarajatchi": "main.dashboard",
}


def role_permissions(role):
    return ROLE_PERMISSIONS.get(role, set())


def has_perm(perm):
    if not current_user.is_authenticated:
        return False
    return perm in role_permissions(current_user.role)


def home_endpoint():
    if not current_user.is_authenticated:
        return "auth.login"
    return ROLE_HOME_ENDPOINT.get(current_user.role, "auth.login")


def permission_required(perm):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for("auth.login"))
            if not has_perm(perm):
                flash("Bu bo'limga kirish huquqingiz yo'q.", "danger")
                return redirect(url_for(home_endpoint()))
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def register_permission_helpers(app):
    app.jinja_env.globals["has_perm"] = has_perm
    app.jinja_env.globals["role_label"] = lambda r: ROLE_LABELS.get(r, r)
    app.jinja_env.globals["role_description"] = lambda r: ROLE_DESCRIPTIONS.get(r, "")
