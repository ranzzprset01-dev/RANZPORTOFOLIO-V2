@echo off
title CYBER NOVA // CLOUDFLARE TUNNEL SENTINEL
color 0b
echo =================================================================
echo   [CLOUDFLARE TUNNEL - SECURE INGRESS GATEWAY]
echo   Menghubungkan Cyber Nova Web Dashboard ke Cloudflare Edge...
echo =================================================================
echo.

if not exist "%~dp0..\cloudflared.exe" (
    echo [ERROR] cloudflared.exe tidak ditemukan di direktori bot!
    pause
    exit /b 1
)

echo Menjalankan Quick Tunnel untuk http://localhost:3000 ...
echo Silakan salin URL *.trycloudflare.com yang muncul di bawah ini:
echo =================================================================
"%~dp0..\cloudflared.exe" tunnel --url http://localhost:3000
pause
