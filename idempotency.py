"""Pul yoziladigan formalarni takror yuborishdan himoya (2026-11-18).

Muammo: "Saqlash" ikki marta bosilsa, sekin internetda forma qayta yuborilsa,
"orqaga" + qayta yuborish qilinsa yoki javob kelmay qolib foydalanuvchi qayta
urinsa — bitta to'lov/xarajat/kirim ikki marta yozilib, kassa va qoldiq buziladi.

Yechim (buyurtma formasidagi `SubmitToken` mexanizmining umumiy ko'rinishi):
  1. Forma ochilganda tasodifiy `form_token` yashirin maydon bilan beriladi
     (shablonda `{{ once() }}`).
  2. Marshrut POST boshida `find_submission()` bilan kalit ishlatilmaganini
     tekshiradi — ishlatilgan bo'lsa hech narsa yozilmaydi.
  3. Yozuvlar `commit_once()` bilan kalitning O'ZI bilan bitta tranzaksiyada
     saqlanadi. `token` unique bo'lgani uchun bir vaqtda kelgan ikkinchi so'rov
     commit'da yiqiladi va uning HAMMA yozuvlari bekor bo'ladi.

Kalit faqat MUVAFFAQIYATLI saqlashda band bo'ladi: tekshiruvdan o'tmagan
(xato bilan qaytgan) forma o'sha kalit bilan to'g'rilab qayta yuborilishi mumkin.

Kalit kelmasa (eski ochiq sahifa, test, tashqi mijoz) — himoya o'chiq, amal
avvalgidek bajariladi. Jadval `submit_token` — `db.create_all()` yaratadi.
"""

import random
import uuid
from datetime import timedelta

from flask import flash, request
from flask_login import current_user
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import SubmitToken
from utils import now_local

TOKEN_MAX_LENGTH = 64
KEEP_DAYS = 30              # shundan eski kalitlar tozalanadi
PURGE_CHANCE = 0.02         # har commit'da emas — ba'zan

DUPLICATE_MESSAGE = ("Bu amal allaqachon bajarilgan — ikkinchi marta yozilmadi. "
                     "Natijani ro'yxatdan tekshiring.")


def new_token():
    return uuid.uuid4().hex


def read_token(form=None):
    """So'rovdagi kalit (bo'sh satr — kalit yo'q)."""
    form = request.form if form is None else form
    return (form.get("form_token") or "").strip()[:TOKEN_MAX_LENGTH]


def find_submission(token=None):
    """Kalit avval ishlatilgan bo'lsa — `SubmitToken` yozuvi, aks holda None."""
    token = read_token() if token is None else token
    if not token:
        return None
    return SubmitToken.query.filter_by(token=token).first()


def flash_duplicate():
    flash(DUPLICATE_MESSAGE, "warning")


def commit_once(kind, object_id=None, token=None):
    """Joriy tranzaksiyani kalit bilan birga saqlaydi.

    True — saqlandi. False — bu kalit allaqachon ishlatilgan (parallel
    so'rov oldin yetib kelgan): hamma yozuvlar bekor qilindi, chaqiruvchi
    hech narsa yuborib/xabar qilib o'tirmasligi kerak.
    """
    token = read_token() if token is None else token
    if token:
        db.session.add(SubmitToken(
            token=token, kind=kind[:20], object_id=object_id,
            created_by=current_user.id if current_user.is_authenticated else None,
        ))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        if token and find_submission(token) is not None:
            return False
        raise   # kalitga aloqasiz xato — yashirmaymiz
    _purge_old()
    return True


def _purge_old():
    """Eski kalitlarni ba'zan tozalash — jadval cheksiz o'smasin."""
    if random.random() > PURGE_CHANCE:
        return
    try:
        cutoff = now_local() - timedelta(days=KEEP_DAYS)
        SubmitToken.query.filter(SubmitToken.created_at < cutoff).delete(
            synchronize_session=False)
        db.session.commit()
    except Exception:
        db.session.rollback()   # tozalash bajarilmasa ham asosiy amal buzilmasin
