@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Baza migratsiyasi ishga tushirilmoqda...
echo ============================================
echo.

call venv\Scripts\activate.bat
python migrate_db.py

echo.
echo ============================================
echo   Migratsiya jarayoni tugadi (yuqoridagi natijani ko'ring).
echo   Bu oynani yopish uchun istalgan tugmani bosing.
echo ============================================
pause
