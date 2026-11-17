"""
Mijozga SMS yuborish (2026-11-17): "buyurtmangiz tayyor" xabari.

Provayder — Eskiz.uz (O'zbekistonda eng keng tarqalgan). Sozlash (cPanel -> Setup Python App ->
Environment variables yoki .env):

    ESKIZ_EMAIL     = Eskiz kabinetidagi email
    ESKIZ_PASSWORD  = Eskiz kabinetidagi "Secret key" (parol)
    ESKIZ_FROM      = jo'natuvchi nomi (standart "4546")
    SMS_AUTO_READY  = 1  -> buyurtma "yetkazish uchun tayyor" bo'lganda avtomatik yuboradi
                           (standart: 0, ya'ni faqat "SMS yuborish" tugmasi orqali)

Sozlanmagan bo'lsa hech narsa buzilmaydi: tugma ko'rinmaydi, avtomatik yuborish o'tkazib yuboriladi.
Tashqi kutubxona kerak emas (urllib).
"""

import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

API = "https://notify.eskiz.uz/api"
TIMEOUT = 15
_token_cache = {"token": None}


def normalize_phone(raw):
    """'+998 90 123-45-67', '90 123 45 67', '998901234567' -> '998901234567'. Yaroqsiz bo'lsa None."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 9:
        digits = "998" + digits
    if len(digits) == 12 and digits.startswith("998"):
        return digits
    return None


def is_configured():
    return bool(os.environ.get("ESKIZ_EMAIL") and os.environ.get("ESKIZ_PASSWORD"))


def auto_on_ready():
    return os.environ.get("SMS_AUTO_READY", "0").strip().lower() in ("1", "true", "yes", "on")


def _request(path, data=None, token=None):
    headers = {}
    body = None
    if data is not None:
        body = urllib.parse.urlencode(data).encode()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API}{path}", data=body, headers=headers,
                                 method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode())


def _login():
    res = _request("/auth/login", {
        "email": os.environ["ESKIZ_EMAIL"], "password": os.environ["ESKIZ_PASSWORD"]})
    token = (res.get("data") or {}).get("token")
    if not token:
        raise RuntimeError(res.get("message") or "Eskiz: token olinmadi")
    _token_cache["token"] = token
    return token


def send_sms(phone, text):
    """(muvaffaqiyat, xabar) juftligini qaytaradi. Hech qachon xato ko'tarmaydi."""
    if not is_configured():
        return False, "SMS sozlanmagan"
    number = normalize_phone(phone)
    if not number:
        return False, "Telefon raqami noto'g'ri"
    payload = {"mobile_phone": number, "message": text,
               "from": os.environ.get("ESKIZ_FROM", "4546")}
    try:
        for attempt in (1, 2):
            token = _token_cache["token"] or _login()
            try:
                res = _request("/message/sms/send", payload, token=token)
                status = str(res.get("status", "")).lower()
                if status in ("waiting", "success", "ok", "true") or res.get("id"):
                    return True, "SMS yuborildi"
                return False, res.get("message") or "SMS yuborilmadi"
            except urllib.error.HTTPError as e:
                if e.code == 401 and attempt == 1:   # token eskirgan — qayta kiramiz
                    _token_cache["token"] = None
                    continue
                return False, f"Eskiz xatosi: {e.code}"
    except Exception as e:
        logger.warning("SMS yuborilmadi: %s", e)
        return False, f"SMS yuborilmadi: {e}"
    return False, "SMS yuborilmadi"


def ready_message(order, company_name=""):
    """'Buyurtmangiz tayyor' matni (qisqa, bitta SMS'ga sig'adigan)."""
    text = f"Hurmatli {order.client.name}, {order.order_number}-sonli buyurtmangiz tayyor."
    debt = order.debt
    if debt and debt > 0:
        text += f" Qolgan to'lov: {int(debt):,} so'm.".replace(",", " ")
    if company_name:
        text += f" {company_name}"
    return text
