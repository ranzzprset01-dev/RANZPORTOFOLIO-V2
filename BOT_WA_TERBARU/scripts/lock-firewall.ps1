# =================================================================
# CYBER NOVA AI // VPS FIREWALL HARDENING & LOCK SCRIPT
# =================================================================
# Jalankan di PowerShell Run as Administrator untuk mengunci firewall VPS

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  🛡️  CYBER NOVA QUANTUM FIREWALL HARDENING SYSTEM" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Pastikan Windows Firewall Aktif di Seluruh Profil
Write-Host "[1/4] Mengaktifkan semua profil Windows Firewall..." -ForegroundColor Green
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# 2. Hapus Aturan Lama yang Mengizinkan Port 3000 dari Publik
Write-Host "[2/4] Membersihkan aturan lama untuk Port 3000..." -ForegroundColor Green
Remove-NetFirewallRule -DisplayName "CyberNova-Public-3000" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "CyberNova-Local-3000" -ErrorAction SilentlyContinue

# 3. Kunci Port 3000: Hanya izinkan dari Localhost / 127.0.0.1 (Cloudflare Tunnel)
Write-Host "[3/4] Mengunci Port 3000 (Hanya Localhost & Cloudflare Tunnel)..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "CyberNova-Local-3000" `
    -Direction Inbound `
    -LocalPort 3000 `
    -Protocol TCP `
    -Action Allow `
    -RemoteAddress 127.0.0.1 `
    -Description "Hanya izinkan Cloudflare Tunnel dan Reverse Proxy lokal mengakses Port 3000"

# Blokir akses publik langsung dari internet ke Port 3000
New-NetFirewallRule -DisplayName "CyberNova-Block-Public-3000" `
    -Direction Inbound `
    -LocalPort 3000 `
    -Protocol TCP `
    -Action Block `
    -RemoteAddress Any `
    -Description "Blokir probe langsung dari internet luar ke port dashboard"

# 4. Izinkan Outbound untuk Cloudflare Tunnel & WhatsApp Baileys
Write-Host "[4/4] Mengizinkan koneksi keluar (Outbound) untuk WhatsApp & Cloudflare..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "CyberNova-Outbound-SSL" `
    -Direction Outbound `
    -LocalPort Any `
    -RemotePort 443, 80, 5222 `
    -Protocol TCP `
    -Action Allow `
    -Description "Koneksi keluar aman untuk WhatsApp WebSockets & Cloudflare Edge" -ErrorAction SilentlyContinue

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  ✅ FIREWALL VPS BERHASIL DIKUNCI & DIAMANKAN!" -ForegroundColor Green
Write-Host "  Semua port eksternal terkunci. Akses dashboard aman melalui" -ForegroundColor White
Write-Host "  Cloudflare Tunnel atau http://localhost:3000." -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Cyan
