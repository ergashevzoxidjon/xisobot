"""
Rolli kirish nazorati (RBAC).

4 ta rol:
- admin        — barchasini nazorat qiladi
- menejer      — buyurtma (zakaz) kiritadi va boshqaradi
- xarajatchi   — faqat xarajat kiritadi (ish boshqaruvchi)
- buxgalter    — barcha hisobotlarni faqat ko'radi (tahrirlay olmaydi)

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
    "buxgalter": "Buxgalter",
}

ROLE_DESCRIPTIONS = {
    "admin": "Barcha bo'limlar va foydalanuvchilar boshqaruvi",
    "menejer": "Buyurtma va mijozlar bilan ishlaydi",
    "xarajatchi": "Xarajatlarni kiritadi",
    "buxgalter": "Barcha hisobotlarni ko'radi (o'zgartira olmaydi)",
}

PERMISSIONS = {
    "orders.view", "orders.create", "orders.edit", "orders.manage", "orders.delete",
    "clients.view", "clients.create", "clients.delete",
    "expenses.view", "expenses.create", "expenses.analytics",
    "reports.view", "reports.export",
    "users.manage",
    "settings.manage",
}

ROLE_PERMISSIONS = {
    "admin": set(PERMISSIONS),
    # Menejer o'zi olgan buyurtmalarning xarajatini ham kiritadi
    "menejer": {
        "orders.view", "orders.create", "orders.edit", "orders.manage",
        "clients.view", "clients.create",
        "expenses.view", "expenses.create",
    },
    "xarajatchi": {"expenses.view", "expenses.create", "expenses.analytics", "orders.view"},
    "buxgalter": {
        "orders.view", "clients.view", "expenses.view", "expenses.analytics",
        "reports.view", "reports.export",
    },
}

# rol uchun kirishdan keyingi asosiy sahifa
ROLE_HOME_ENDPOINT = {
    "admin": "main.dashboard",
    "buxgalter": "main.dashboard",
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
