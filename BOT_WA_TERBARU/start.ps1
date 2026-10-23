$Host.UI.RawUI.WindowTitle = "RANZZXITER // WHATSAPP AI BOT"
$env:PATH = "C:\Program Files\nodejs;C:\Users\$env:USERNAME\AppData\Local\Programs\Git\cmd;" + $env:PATH
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    R A N Z Z X I T E R                       " -ForegroundColor Cyan
Write-Host "               RANZZXITER - WHATSAPP AI BOT v2.0                " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[*] Memulai RANZZXITER WhatsApp AI & Command Center..." -ForegroundColor Green
Write-Host "[*] Dashboard Web: http://localhost:3000" -ForegroundColor White
Write-Host ""

node src/server.js
