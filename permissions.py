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
    "clients.view", "clients.create", "clients.delete",
    "expenses.view", "expenses.create",
    "stock.view", "stock.manage",
    "suppliers.view", "suppliers.manage",
    "reports.view", "reports.export",
    "users.manage",
    "settings.manage",
}

ROLE_PERMISSIONS = {
    "admin": set(PERMISSIONS),
    # Menejer moliya bilan ishlamaydi — faqat buyurtma va mijoz.
    # Xarajat, foyda va hisobotlar unga ko'rinmaydi.
    "menejer": {
        "orders.view", "orders.create", "orders.edit", "orders.manage",
        "clients.view", "clients.create",
    },
    # Ish boshqaruvchi omborni yuritadi: mahsulot qabul qiladi va sarflaydi,
    # taminotchilar bilan ishlaydi (qarz-to'lov). Moliyaviy hisobot va
    # tahlilni ham ko'radi (2026-08-27, foydalanuvchi qarori) — buyurtmalar
    # rentabelligi va boshqa hisobotlarni kuzatishi kerak.
    "xarajatchi": {"expenses.view", "expenses.create", "orders.view",
                   "stock.view", "stock.manage",
                   "suppliers.view", "suppliers.manage",
                   "reports.view"},
    # Boss — korxona rahbari. Hamma narsani KO'RADI, hech narsani
    # o'zgartirmaydi: buyurtma, mijoz, ombor va sozlamalarga tegmaydi.
    "boss": {
        "orders.view", "clients.view", "stock.view",
        "expenses.view", "suppliers.view",
        "reports.view", "reports.export",
    },
}

# rol uchun kirishdan keyingi asosiy sahifa
ROLE_HOME_ENDPOINT = {
    "admin": "main.dashboard",
    "boss": "main.dashboard",
    "menejer": "orders.list_orders",
    "xarajatchi": "finance.expenses_list",
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
