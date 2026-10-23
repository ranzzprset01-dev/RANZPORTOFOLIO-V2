# RANZZXITER v2.0 — WhatsApp AI Command Center

RANZZXITER adalah bot WhatsApp dengan menu kategori interaktif, gambar lokal pada perintah, integrasi AI, alat media, database atomik dengan backup, dan dashboard administrasi lokal.

---

## Fitur utama

### 1. 🖼️ Gambar pada Setiap Perintah
- Setiap perintah yang dikenali mengirim gambar anime lokal sebelum bot menjalankan perintah.
- Gambar dibuat sekali dari aset GIF lokal dan digunakan kembali; pemrosesan gambar tidak memerlukan layanan gambar eksternal.
- Menu (`.menu`, `menu`, `help`) tetap mengirimkan kartu menu bergambar.

### 2. 🐺 Game Werewolf Grup WhatsApp (`.ww`)
- Game deduksi sosial multipemain seru untuk grup WhatsApp:
  - Pembagian peran rahasia (Werewolf 🐺, Villager 👨‍🌾, Seer/Peramal 🔮, Guardian/Pelindung 🛡️) langsung ke pesan pribadi pemain.
  - Fase Malam (Werewolf memangsa korban, Seer menerawang peran, Guardian melindungi).
  - Fase Siang (Pengumuman korban gugur, diskusi grup, dan voting eksekusi tersangka).
  - Perintah: `.ww create`, `.ww join`, `.ww start`, `.ww vote @user`, `.ww status`, `.ww stop`.

### 3. 🧩 Game Tebak Gambar (`.tebakgambar`)
- Soal tebak gambar asli berupa susunan gambar teka-teki visual.
- Semua orang di grup/chat bisa langsung menebak tanpa tanda baca.
- Jawaban benar berhadiah **+1000 Koin & +100 EXP**.

### 4. 💰 Manajemen Koin & Ekonomi untuk Admin / Owner
- **Di WhatsApp:**
  - `.addcoin @user <jumlah>` / `.tambahkoin` : Tambah koin ke akun lain (Khusus Owner/Admin).
  - `.delcoin @user <jumlah>` : Potong saldo koin user lain.
  - `.setcoin @user <jumlah>` : Atur jumlah saldo koin user secara langsung.
  - `.addxp @user <jumlah>` : Tambah EXP user.
  - `.setrole @user <role>` : Ubah pangkat user (OWNER, ADMIN, VIP, CITIZEN).
  - `.transfer @user <jumlah>` : Transfer koin antar pemain (pajak 5%).
  - `.shop` & `.buy <item>` : Toko perlengkapan cyber (Shield, Stimpack, Katana, Tiket Lotere, VIP Badge).
- **Di Web Command Center:**
  - Tombol **[ 💰 KELOLA ]** pada setiap baris user di tab **Database & Users**.
  - Modal interaktif untuk menambah, memotong, atau mengatur koin & role user secara instan!

### 5. 🎨 Fitur Tambahan Menarik
- **Simulasi Chat WhatsApp iPhone:** `.iqc <pesan> | <balasan>` membuat gambar mockup chat iPhone dengan bubble pesan, reaksi, dan balasan emoji. Contoh: `.iqc Hai apa kabar? | 😊❤️`; balasan otomatis `😊❤️` jika tidak diisi. Gambar dibuat lokal.
- **AI Image Generator:** `.img <deskripsi>` (Membuat gambar visual AI dari teks).
- **Status AFK:** `.afk <alasan>` (Memberitahu otomatis jika ada yang mention bahwa kamu sedang AFK).
- **Multi-Prefix & Tanpa Prefix:** Semua perintah dapat diketik dengan tanda baca (`.menu`, `!menu`) maupun **langsung tanpa tanda baca** (`menu`, `slot`, `daily`, `rpg`, `ai`).
- **Family 100:** `.family100` memulai kuis jawaban bersama; jawab langsung di chat, gunakan `.family100 stop` atau `.nyerah` untuk menghentikan ronde.
- **Dataset permainan lokal:** `.family100` memakai 6.964 soal; `.asahotak` (228 soal), `.susunkata` (356), `.tebakbendera` (86), `.tebakgambar` (1.000), dan `.tebakkimia` (125) juga menggunakan bank soal lokal dari `CLICK_HERE/Game`. Soal aktif dapat dijawab langsung di chat; `.nyerah` mengakhiri ronde yang mendukung pembatalan.
- **Konversi audio:** Balas atau kirim audio/video dengan `.toaudio` untuk menghasilkan MP3, atau `.tovn` untuk voice note. Media dibatasi maksimal 20 MB dan konversi memakai FFmpeg lokal.

### Integrasi folder fitur
- Fitur yang aman dan kompatibel diadaptasi ke plugin serta handler RANZZXITER agar memakai satu koneksi WhatsApp, database, menu, dan kontrol akses.
- File entrypoint bot standalone yang obfuscated, command pengirim crash/bug, shell/SSH installer, pengelola plugin yang menulis/menghapus file, dan penghapus sesi tidak dijalankan atau diimpor. Kode tersebut tidak dapat dipadukan dengan aman tanpa audit dan adaptasi khusus.

---

## Menjalankan bot

1. Double-click file **`start.bat`** (atau jalankan `start.ps1` via PowerShell).
2. Buka browser di:
   👉 **`http://localhost:3000`**
3. Tautkan WhatsApp via **Scan QR** atau **8-Digit Pairing Code**.
4. Bot langsung aktif dan siap digunakan!

Cloudflare Quick Tunnel dijalankan otomatis pada konfigurasi PM2 saat ini (`ENABLE_CLOUDFLARE_TUNNEL=true`). URL Quick Tunnel bersifat sementara dan dapat berubah setelah proses tunnel dimulai ulang. Untuk menutup akses publik, set `ENABLE_CLOUDFLARE_TUNNEL=false`.
Secara default dashboard hanya mendengarkan koneksi komputer ini (`HOST=127.0.0.1`). Gunakan `HOST=0.0.0.0` hanya jika memang ingin mengizinkan akses dari jaringan lain.

### Akses Owner, tombol, kontak, dan Wink
- Secara default hanya Owner `082183317690` dan nomor yang telah disetujui Owner yang dapat menggunakan bot. Pengguna lain akan diminta menghubungi Owner.
- Owner mengatur izin langsung melalui WhatsApp: `.izinkan 6281234567890` untuk memberi akses, `.cabutakses 6281234567890` untuk mencabutnya, dan `.daftarakses` untuk melihat daftar. Nomor harus ditulis dalam format internasional tanpa tanda `+`; izin disimpan di database.
- Akses pengguna biasa tidak memberikan hak Owner. Perintah administrasi dan pengelolaan izin tetap memerlukan Owner.
- Nama bot dan prompt AI kini menggunakan identitas RANZZXITER; setelan lama yang masih menyebut NOVA/Cyber diperbarui saat database dimuat.
- Saat WhatsApp tersambung, bot mencoba mengubah nama profil akun tertaut menjadi `RANZZXITER`. Ini juga mengubah nama profil akun WhatsApp tersebut.
- Ketik `.menu` sekali, lalu pilih kategori melalui daftar interaktif WhatsApp. Fitur yang memerlukan teks, tautan, atau foto tetap memerlukan input tersebut.
- Nama/nomor kontak disinkronkan dari kontak yang dibagikan/diterima oleh akun WhatsApp bot. Bot tidak membaca buku kontak pribadi di sistem operasi ponsel.
- Tombol **Wink HD** membuka situs resmi [Wink](https://wink.cn) melalui `.winkhd`. Pemrosesan HD dilakukan di aplikasi Wink, bukan oleh bot.
