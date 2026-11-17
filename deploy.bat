@echo off
chcp 65001 >nul
title Xisobot - serverga yuborish
cd /d "F:\AI\xisobot platformasi"

echo.
echo ============================================
echo   O'ZGARGAN FAYLLAR
echo ============================================
git status --short
echo.

git diff --quiet && git diff --cached --quiet
if not errorlevel 1 (
  git ls-files --others --exclude-standard >nul 2>&1
  for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
)

set /p MSG="Izoh (nima o'zgardi): "
if "%MSG%"=="" set MSG=yangilanish

git add .
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo    Commit qilinmadi - ehtimol o'zgargan fayl yo'q.
  echo.
  pause
  exit /b
)

echo.
git push
if errorlevel 1 (
  echo.
  echo    XATO: GitHub'ga yuborilmadi.
  echo    Internetni va GitHub'ga kirish huquqini tekshiring.
  echo.
  pause
  exit /b
)

echo.
echo ============================================
echo   GITHUB'GA YUBORILDI
echo.
echo   Endi cPanel'da (ikki qadam):
echo.
echo   1) Git Version Control -^> Manage -^> Pull or Deploy
echo      -^> Update from Remote
echo.
echo   2) Shu yerdan "Deploy HEAD Commit" - u ilovani o'zi
echo      qayta ishga tushiradi va bazani yangilaydi.
echo      (Eski usul: Setup Python App -^> RESTART ham ishlaydi.)
echo ============================================
echo.
pause
