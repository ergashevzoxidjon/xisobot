"""
cPanel (Passenger) uchun kirish nuqtasi.

cPanel "Setup Python App" bo'limi ilovani shu fayl orqali ishga tushiradi:
  · Application startup file : passenger_wsgi.py
  · Application Entry point  : application

Fayllarni o'zgartirgandan keyin cPanel'da "Restart" tugmasini bosing (yoki Git Version
Control'da "Deploy HEAD Commit" — u .cpanel.yml orqali o'zi restart qiladi) —
aks holda server eski nusxani ishlatishda davom etadi.
"""

import os
import sys

# Ilova papkasi import yo'liga qo'shiladi (app.py, models.py va h.k. topilishi uchun)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Yangi kod bilan kelgan baza o'zgarishlari (yangi ustunlar) avtomatik qo'llanadi.
# Xato bo'lsa ham sayt ishga tushadi (autodeploy.py ga qarang).
try:
    import autodeploy
    autodeploy.run_if_needed()
except Exception:  # migratsiya sayt ishga tushishiga to'sqinlik qilmasin
    pass

from app import app as application  # noqa: E402
