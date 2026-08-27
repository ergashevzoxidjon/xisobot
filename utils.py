"""
Yordamchi funksiyalar: pul (Decimal), mahalliy vaqt va kiritilgan
ma'lumotni xavfsiz o'qish.
"""

from datetime import datetime, timedelta, timezone, date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

# O'zbekiston vaqti (UTC+5). Yozgi vaqtga o'tish yo'q, shuning uchun
# oddiy siljish yetarli.
TASHKENT_TZ = timezone(timedelta(hours=5))

ZERO = Decimal("0.00")
MAX_MONEY = Decimal("999999999999.99")

# Ombor miqdori — kg va metr uchun kasr kerak, shuning uchun 3 xona
QTY_ZERO = Decimal("0.000")
MAX_QTY = Decimal("99999999.999")


# ---------- vaqt ----------

def now_local():
    """Mahalliy (Toshkent) vaqtidagi naive datetime.

    Bazaga naive holda yoziladi — barcha taqqoslashlar ham mahalliy
    vaqtda bo'lgani uchun oy/kun chegaralari to'g'ri hisoblanadi.
    """
    return datetime.now(TASHKENT_TZ).replace(tzinfo=None)


def today_local():
    return now_local().date()


def month_bounds(year, month):
    """Oyning birinchi kuni va keyingi oy birinchi kuni (yarim ochiq oraliq)."""
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)
    return start, end


# ---------- pul ----------

def to_money(value, default=ZERO):
    """Har qanday qiymatni 2 xonali Decimal'ga aylantiradi."""
    if value is None:
        return default
    if isinstance(value, Decimal):
        d = value
    else:
        try:
            d = Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError):
            return default
    return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def money_str(value):
    """1234567.5 -> '1 234 567.50' ko'rinishida."""
    d = to_money(value)
    sign = "-" if d < 0 else ""
    d = abs(d)
    whole, _, frac = f"{d:.2f}".partition(".")
    grouped = f"{int(whole):,}".replace(",", " ")
    return f"{sign}{grouped}.{frac}"


# ---------- ombor miqdori ----------

def to_qty(value, default=QTY_ZERO):
    """Miqdorni 3 xonali Decimal'ga aylantiradi (0.5 kg, 2.75 metr)."""
    if value is None:
        return default
    if isinstance(value, Decimal):
        d = value
    else:
        try:
            d = Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError):
            return default
    return d.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)


def qty_str(value):
    """2.000 -> '2', 1.500 -> '1.5' — ortiqcha nollar olib tashlanadi."""
    d = to_qty(value)
    text = f"{d:f}".rstrip("0").rstrip(".")
    return text or "0"


# ---------- kiritilgan ma'lumotni xavfsiz o'qish ----------

class ValidationError(Exception):
    """Foydalanuvchiga ko'rsatiladigan tekshiruv xatosi."""


def parse_money(raw, field, required=True, min_value=ZERO, max_value=MAX_MONEY):
    raw = (raw or "").strip().replace(" ", "").replace(",", ".")
    if not raw:
        if required:
            raise ValidationError(f"{field}: qiymat kiritilmagan.")
        return ZERO
    try:
        d = Decimal(raw)
    except (InvalidOperation, ValueError):
        raise ValidationError(f"{field}: faqat raqam kiriting.")
    if not d.is_finite():
        raise ValidationError(f"{field}: noto'g'ri qiymat.")
    d = d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if d < min_value:
        raise ValidationError(f"{field}: {money_str(min_value)} dan kichik bo'lishi mumkin emas.")
    if d > max_value:
        raise ValidationError(f"{field}: juda katta qiymat.")
    return d


def parse_qty(raw, field, required=True, min_value=QTY_ZERO, max_value=MAX_QTY):
    """Ombor miqdorini o'qiydi — kasr son bo'lishi mumkin (0.5 kg)."""
    raw = (raw or "").strip().replace(" ", "").replace(",", ".")
    if not raw:
        if required:
            raise ValidationError(f"{field}: qiymat kiritilmagan.")
        return QTY_ZERO
    try:
        d = Decimal(raw)
    except (InvalidOperation, ValueError):
        raise ValidationError(f"{field}: faqat raqam kiriting.")
    if not d.is_finite():
        raise ValidationError(f"{field}: noto'g'ri qiymat.")
    d = d.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
    if d < min_value:
        raise ValidationError(f"{field}: {qty_str(min_value)} dan kichik bo'lishi mumkin emas.")
    if d > max_value:
        raise ValidationError(f"{field}: juda katta qiymat.")
    return d


def parse_int(raw, field, required=True, min_value=0, max_value=10_000_000, default=0):
    raw = (raw or "").strip().replace(" ", "")
    if not raw:
        if required:
            raise ValidationError(f"{field}: qiymat kiritilmagan.")
        return default
    try:
        n = int(raw)
    except ValueError:
        raise ValidationError(f"{field}: butun son kiriting.")
    if n < min_value:
        raise ValidationError(f"{field}: {min_value} dan kichik bo'lishi mumkin emas.")
    if n > max_value:
        raise ValidationError(f"{field}: juda katta qiymat.")
    return n


def parse_date(raw, field, required=False, default=None):
    raw = (raw or "").strip()
    if not raw:
        if required:
            raise ValidationError(f"{field}: sana tanlanmagan.")
        return default
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        raise ValidationError(f"{field}: sana formati noto'g'ri.")


def parse_text(raw, field, required=False, max_length=255, default=""):
    raw = (raw or "").strip()
    if not raw:
        if required:
            raise ValidationError(f"{field}: to'ldirilishi shart.")
        return default
    if len(raw) > max_length:
        raise ValidationError(f"{field}: {max_length} belgidan oshmasligi kerak.")
    return raw


def parse_choice(raw, field, allowed, required=True, default=None):
    raw = (raw or "").strip()
    if not raw:
        if required:
            raise ValidationError(f"{field}: tanlanmagan.")
        return default
    if raw not in allowed:
        raise ValidationError(f"{field}: noto'g'ri qiymat tanlandi.")
    return raw
