from utils import money_str, qty_str, today_local

ORDER_STATUS_COLORS = {
    "buyurtma yaratildi": "secondary",
    "to'lov qilish jarayonida": "info",
    "dizayn jarayonida": "primary",
    "ishlab chiqarishda": "warning",
    "yetkazish uchun tayyor": "dark",
    "maxsulot yetkazildi": "success",
    "bekor qilindi": "danger",
}

PAYMENT_STATUS_COLORS = {
    "to'lanmagan": "danger",
    "qisman": "warning",
    "to'liq": "success",
}

ORDER_STATUS_ICONS = {
    "buyurtma yaratildi": "bi-file-earmark-plus",
    "to'lov qilish jarayonida": "bi-cash-coin",
    "dizayn jarayonida": "bi-palette",
    "ishlab chiqarishda": "bi-gear-fill",
    "yetkazish uchun tayyor": "bi-box-seam",
    "maxsulot yetkazildi": "bi-truck",
    "bekor qilindi": "bi-x-circle",
}

EXPENSE_CATEGORY_ICONS = {
    "ijara": "bi-building",
    "ish haqi": "bi-people",
    "kommunal": "bi-lightning-charge",
    "transport": "bi-truck",
    "xomashyo": "bi-box-seam",
    "jihoz": "bi-tools",
    "soliq": "bi-bank",
    "buyurtma": "bi-receipt",
    "ofis xarajatlari": "bi-briefcase",
}


def status_color(status):
    return ORDER_STATUS_COLORS.get(status, "secondary")


def payment_color(status):
    return PAYMENT_STATUS_COLORS.get(status, "secondary")


def status_icon(status):
    return ORDER_STATUS_ICONS.get(status, "bi-circle")


def category_icon(category):
    return EXPENSE_CATEGORY_ICONS.get(category, "bi-three-dots")


def uzs(value):
    """Pul summasini o'qishga qulay ko'rinishga keltiradi."""
    return money_str(value)


def qty(value):
    """Ombor miqdori: 240.000 -> '240', 1.500 -> '1.5'."""
    return qty_str(value)


def date_uz(value):
    if not value:
        return "-"
    return value.strftime("%d.%m.%Y")


def datetime_uz(value):
    if not value:
        return "-"
    return value.strftime("%d.%m.%Y %H:%M")


def register_template_helpers(app):
    app.jinja_env.filters["status_color"] = status_color
    app.jinja_env.filters["payment_color"] = payment_color
    app.jinja_env.filters["status_icon"] = status_icon
    app.jinja_env.filters["category_icon"] = category_icon
    app.jinja_env.filters["uzs"] = uzs
    app.jinja_env.filters["qty"] = qty
    app.jinja_env.filters["date_uz"] = date_uz
    app.jinja_env.filters["datetime_uz"] = datetime_uz
    app.jinja_env.globals["today"] = today_local
