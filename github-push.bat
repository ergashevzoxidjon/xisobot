@echo off
chcp 65001 >nul
title Xisobot - GitHub'ga avtomatik yuklash
cd /d "F:\AI\xisobot platformasi"

echo.
echo ============================================
echo   O'ZGARGAN FAYLLAR
echo ============================================
git status --short
echo.

git add .

set MSG=Avtomatik yangilanish - %date% %time%
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo    Yangi o'zgarish topilmadi - commit qilinmadi, mavjud commit'lar push qilinadi.
  echo.
)

echo.
echo   GitHub'ga yuborilmoqda...
echo.
git push origin main
if errorlevel 1 (
  echo.
  echo ============================================
  echo    XATO: GitHub'ga yuborilmadi.
  echo    Internetni va GitHub'ga kirish huquqini (login yoki token) tekshiring.
  echo ============================================
  echo.
  pause
  exit /b
)

echo.
echo ============================================
echo   GITHUB'GA MUVAFFAQIYATLI YUKLANDI!
echo ============================================
echo.
pause
