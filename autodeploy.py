"""
Yangi kod serverga tushgach bazani AVTOMATIK migratsiya qilish (2026-11-17).

Muammo: har safar cPanel'da yangilangandan keyin SSH/terminalda `python migrate_db.py`
ni qo'lda ishga tushirish kerak edi — unutilsa sayt yangi ustun topilmay yiqilardi.
(Deploy vaqtidagi terminalda DATABASE_URL yo'q, shuning uchun migratsiya ilovaning o'zida,
to'g'ri muhit o'zgaruvchilari bilan bajariladi.)

Qanday ishlaydi: ilova ishga tushganda (passenger_wsgi.py) `run_if_needed()` chaqiriladi.
  * migrate_db.py ning SHA1 belgisi `instance/.migrated` faylidagi bilan solishtiriladi;
    o'zgarmagan bo'lsa — hech narsa qilinmaydi (tez);
  * o'zgargan bo'lsa — migratsiya bajariladi (u takroran ishga tushirilganda ham xavfsiz);
  * bir vaqtda bir nechta jarayon ishga tushsa, qulf-fayl faqat bittasiga ruxsat beradi;
  * migratsiya xato bersa sayt BARIBIR ishga tushadi, xato `instance/migrate_error.log` ga yoziladi
    va keyingi ishga tushishda qayta uriniladi.

O'chirish: AUTO_MIGRATE=0 muhit o'zgaruvchisi.
"""

import hashlib
import io
import os
import time
import traceback
from contextlib import redirect_stdout

HERE = os.path.dirname(os.path.abspath(__file__))
LOCK_STALE_SECONDS = 600


def _state_dir():
    path = os.path.join(HERE, "instance")
    os.makedirs(path, exist_ok=True)
    return path


def _digest():
    h = hashlib.sha1()
    with open(os.path.join(HERE, "migrate_db.py"), "rb") as fh:
        h.update(fh.read())
    return h.hexdigest()


def run_if_needed():
    """Migratsiya kerak bo'lsa bajaradi. True — bajarildi, False — o'tkazib yuborildi yoki xato."""
    if os.environ.get("AUTO_MIGRATE", "1").strip().lower() in ("0", "false", "no", "off"):
        return False

    state = _state_dir()
    marker = os.path.join(state, ".migrated")
    lock = os.path.join(state, ".migrate.lock")
    digest = _digest()

    try:
        with open(marker, encoding="utf-8") as fh:
            if fh.read().strip() == digest:
                return False
    except OSError:
        pass

    # Qulf: faqat bitta jarayon migratsiya qiladi
    try:
        if os.path.exists(lock) and time.time() - os.path.getmtime(lock) > LOCK_STALE_SECONDS:
            os.remove(lock)                      # eskirgan qulf (jarayon yiqilgan)
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.close(fd)
    except OSError:
        return False

    try:
        import migrate_db
        buf = io.StringIO()
        with redirect_stdout(buf):
            migrate_db.main()
        with open(marker, "w", encoding="utf-8") as fh:
            fh.write(digest)
        return True
    except BaseException:
        with open(os.path.join(state, "migrate_error.log"), "a", encoding="utf-8") as fh:
            fh.write(time.strftime("%Y-%m-%d %H:%M:%S") + "\n" + traceback.format_exc() + "\n")
        return False
    finally:
        try:
            os.remove(lock)
        except OSError:
            pass
