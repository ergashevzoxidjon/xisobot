"""
Kunlik Telegram xulosasini yuborish.

Har kuni bir marta ishga tushiriladi (server vazifasi orqali).

Windows — Task Scheduler:
    Program:   C:\\Yo'l\\python.exe
    Arguments: send_daily.py
    Start in:  C:\\Yo'l\\poligrafiya_app

Linux — crontab (har kuni 09:00 da):
    0 9 * * * cd /yo'l/poligrafiya_app && /yo'l/venv/bin/python send_daily.py

Render.com — Cron Job servisi yarating, buyruq: python send_daily.py

Qo'shimcha:
    python send_daily.py --force       # bugun yuborilgan bo'lsa ham qayta yuborish
    python send_daily.py --deadlines   # faqat muddat eslatmasi
"""

import sys

from app import create_app
from notifications import send_daily_summary, send_deadline_reminders


def main():
    force = "--force" in sys.argv
    deadlines_only = "--deadlines" in sys.argv

    app = create_app()
    with app.app_context():
        if deadlines_only:
            ok, msg = send_deadline_reminders()
        else:
            ok, msg = send_daily_summary(force=force)

        print(("OK: " if ok else "· ") + msg)
        return 0 if ok else 0  # xato bo'lsa ham vazifa "muvaffaqiyatsiz" deb belgilanmasin


if __name__ == "__main__":
    sys.exit(main())
