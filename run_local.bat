@echo off
cd /d "%~dp0"
echo ============================================
echo   Xisobot tizimi lokalda ishga tushirilmoqda...
echo ============================================
echo.

python migrate_db.py
if errorlevel 1 goto migrate_error

set FLASK_DEBUG=1
echo.
echo ============================================
echo   Server manzili: http://127.0.0.1:5000
echo   Toxtatish uchun shu oynada Ctrl+C bosing.
echo ============================================
echo.
python app.py
echo.
echo Server toxtadi.
pause
goto :eof

:migrate_error
echo.
echo XATO: migratsiya muvaffaqiyatsiz boldi. Yuqoridagi xabarni koring.
echo Bazaga hech narsa yozilmagan - bu oynani yopmang, xabarni Claude'ga korsating.
pause
