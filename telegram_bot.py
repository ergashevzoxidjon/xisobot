"""
Telegram orqali xabar yuborish.

Sozlash:
  1. Telegram'da @BotFather ga yozing -> /newbot -> bot nomini bering
  2. Olingan tokenni "Telegram" sozlamalari sahifasiga kiriting
  3. Bot bilan suhbat boshlang (/start), so'ng chat ID ni sozlamalarga kiriting

Tashqi kutubxona kerak emas — standart urllib ishlatiladi.
Xabar yuborilmasa ham ilova ishlashda davom etadi (xato faqat jurnalga yoziladi).
"""

import json
import logging
import urllib.error
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

API_URL = "https://api.telegram.org/bot{token}/{method}"
TIMEOUT = 10


def _call(token, method, payload):
    url = API_URL.format(token=token, method=method)
    data = urllib.parse.urlencode(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = json.loads(resp.read().decode())
            if not body.get("ok"):
                return False, body.get("description", "noma'lum xato")
            return True, body.get("result")
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read().decode()).get("description", str(e))
        except Exception:
            detail = str(e)
        return False, detail
    except Exception as e:  # tarmoq yo'q, timeout va h.k.
        return False, str(e)


def send_message(token, chat_id, text, silent=False):
    """Xabar yuboradi. (muvaffaqiyat, xabar) juftligini qaytaradi."""
    if not token or not chat_id:
        return False, "Token yoki chat ID sozlanmagan"

    ok, result = _call(token, "sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
        "disable_notification": "true" if silent else "false",
    })
    if not ok:
        logger.warning("Telegram xabar yuborilmadi: %s", result)
    return ok, result


def check_token(token):
    """Token to'g'riligini tekshiradi va bot nomini qaytaradi."""
    ok, result = _call(token, "getMe", {})
    if ok and isinstance(result, dict):
        return True, result.get("username", "?")
    return False, result


# ---------------------------------------------------------------- xabar matnlari

def fmt_money(value):
    from utils import money_str
    return money_str(value)


def new_order_message(order):
    return (
        f"🆕 <b>Yangi buyurtma</b>\n\n"
        f"№ <b>{order.order_number}</b>\n"
        f"Mijoz: {order.client.name}\n"
        f"Turi: {order.order_type}\n"
        f"Miqdor: {order.quantity}\n"
        f"Summa: <b>{fmt_money(order.total_price)} so'm</b>\n"
        + (f"Muddat: {order.deadline.strftime('%d.%m.%Y')}\n" if order.deadline else "")
        + (f"Kiritdi: {order.creator.display_name}" if order.creator else "")
    )


def payment_message(order, amount):
    if order.remaining < 0:
        # qarzdan ko'p to'landi — ortiqchasi mijozning avansi
        tail = f"Avans (zapas): <b>{fmt_money(-order.remaining)} so'm</b>"
    else:
        tail = f"Qolgan qarz: {fmt_money(order.remaining)} so'm"
    return (
        f"💰 <b>To'lov qabul qilindi</b>\n\n"
        f"№ {order.order_number} · {order.client.name}\n"
        f"Summa: <b>{fmt_money(amount)} so'm</b>\n"
        + tail
    )


def order_ready_message(order):
    return (
        f"✅ <b>Buyurtmangiz tayyor</b>\n\n"
        f"Hurmatli {order.client.name},\n"
        f"№ {order.order_number} ({order.order_type}) buyurtmangiz tayyor.\n"
        + (f"\nQolgan to'lov: <b>{fmt_money(order.remaining)} so'm</b>"
           if order.remaining > 0 else "")
    )


def daily_summary_message(stats):
    lines = [f"📊 <b>Kunlik xulosa</b> — {stats['date'].strftime('%d.%m.%Y')}\n"]

    lines.append(f"Yangi buyurtmalar: <b>{stats['new_orders']}</b>")
    lines.append(f"Bugungi tushum: <b>{fmt_money(stats['income'])} so'm</b>")
    lines.append(f"Bugungi xarajat: {fmt_money(stats['expenses'])} so'm")

    if stats["overdue"]:
        lines.append(f"\n⚠️ Muddati o'tgan: <b>{len(stats['overdue'])} ta</b>")
        for o in stats["overdue"][:5]:
            lines.append(f"  · {o.order_number} — {o.client.name} ({-o.days_left} kun)")

    if stats["soon"]:
        lines.append(f"\n⏰ Muddati yaqin: <b>{len(stats['soon'])} ta</b>")
        for o in stats["soon"][:5]:
            lines.append(f"  · {o.order_number} — {o.client.name} ({o.days_left} kun)")

    if stats["debtors"]:
        lines.append(f"\n💸 Eng katta qarzdorlar:")
        for d in stats["debtors"][:5]:
            lines.append(f"  · {d['client'].name} — {fmt_money(d['debt'])} so'm")

    if not stats["overdue"] and not stats["soon"]:
        lines.append("\n✅ Kechikkan buyurtma yo'q")

    return "\n".join(lines)


def deadline_reminder_message(orders):
    lines = ["⏰ <b>Muddat eslatmasi</b>\n"]
    for o in orders[:10]:
        when = "BUGUN" if o.days_left == 0 else f"{o.days_left} kundan keyin"
        lines.append(f"· {o.order_number} — {o.client.name} ({when})")
    return "\n".join(lines)
