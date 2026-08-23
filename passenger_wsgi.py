"""
cPanel (Passenger) uchun kirish nuqtasi.

cPanel "Setup Python App" bo'limi ilovani shu fayl orqali ishga tushiradi:
  · Application startup file : passenger_wsgi.py
  · Application Entry point  : application

Fayllarni o'zgartirgandan keyin cPanel'da "Restart" tugmasini bosing —
aks holda server eski nusxani ishlatishda davom etadi.
"""

import os
import sys

# Ilova papkasi import yo'liga qo'shiladi (app.py, models.py va h.k. topilishi uchun)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app as application  # noqa: E402
