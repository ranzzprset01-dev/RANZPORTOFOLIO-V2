@echo off
title RANZZXITER // WHATSAPP AI BOT
color 0B
cls

echo ================================================================
echo              R A N Z Z X I T E R
echo.
echo           RANZZXITER - WHATSAPP AI BOT v2.0
echo ================================================================
echo.

:: Tambahkan Node.js dan Git ke PATH jika belum ada
set PATH=C:\Program Files\nodejs;C:\Users\%USERNAME%\AppData\Local\Programs\Git\cmd;%PATH%

:: Cek keberadaan Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di sistem!
    echo Pastikan Node.js sudah terinstall di C:\Program Files\nodejs
    pause
    exit /b 1
)

echo [*] Memulai RANZZXITER WhatsApp AI & Command Center...
echo [*] Buka browser di: http://localhost:3000
echo.
node src/server.js
pause
