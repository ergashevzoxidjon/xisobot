@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Xisobot loyihasi ishga tushirilmoqda...
echo ============================================
echo.

call venv\Scripts\activate.bat

echo --- Kutubxonalar tekshirilmoqda (pip install) ---
pip install -r requirements.txt

echo.
echo --- Baza migratsiyasi (migrate_db.py) ---
python migrate_db.py

echo.
echo --- Server ishga tushirilmoqda: http://localhost:5000 ---
echo (Yopish uchun bu oynani yoping yoki Ctrl+C bosing)
echo.
set FLASK_DEBUG=1
python app.py

echo.
echo Server to'xtadi.
pause
