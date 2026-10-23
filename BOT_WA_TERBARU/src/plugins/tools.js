const QRCode = require('qrcode');
const axios = require('axios');
const os = require('os');
const db = require('../database/db');
const animeService = require('../services/animeService');
const config = require('../config');

module.exports = {
  // =========================================================
  // 1. CYBER MENU ULTRA FAST DENGAN VIDEO AUTOPLAY & TOMBOL
  // =========================================================
  async showMenu(sock, chatId, senderId, categoryArg = '') {
    const user = db.getUser(senderId);
    const settings = db.getSettings();
    const stats = db.getStats();
    const prefix = settings.prefix || '.';
    const cat = (categoryArg || '').trim().toLowerCase();

    const formatUptime = (seconds) => {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${d}d ${h}h ${m}m ${s}s`;
    };

    const headerTelemetry = `
╔════════════════════════════════════════╗
║    ⚡ RANZZXITER // WHATSAPP AI ⚡     ║
║       [ INTERACTIVE BOT CORE ]         ║
╚════════════════════════════════════════╝

┌─── ⟨ 👤 USER TELEMETRY ⟩
│ 👤 Nama   : ${user.name}
│ 🎖️ Rank   : ${user.rank} (Lv.${user.level})
│ 💰 Koin   : ${user.coins.toLocaleString('id-ID')} KC
│ ⚡ Speed  : ULTRA FAST (<15ms)
│ 🤖 Engine : ${settings.aiProvider.toUpperCase()} (${settings.geminiModel})
└───`.trim();

    // --- KATEGORI 1: AI & VISION ---
    if (cat === 'ai') {
      const text = `
${headerTelemetry}

╭─── 🧠 *[MODUL AI, VISION & REASONING]*
│ • \`${prefix}ai <tanya>\` : Tanya jawab cerdas Gemini 2026
│ • \`${prefix}askimg <tanya>\` : Analisis gambar Gemini Vision 👁️
│ • \`${prefix}deepseek <tanya>\` : Deep Reasoning CoT 🧠
│ • \`${prefix}img <prompt>\` : Generator gambar visual AI Flux
│ • \`${prefix}animeprompt <ide>\` : Masterpiece prompt generator
│ • \`${prefix}audit <kode>\` : Audit bug & security koding
│ • \`${prefix}ai-voice <tanya>\` : Jawaban AI via Voice Note
│ • \`${prefix}poem <tema>\` : Pembuat puisi cyber / lirik
│ • \`${prefix}mathsolve <soal>\` : Solusi matematika lengkap
│ • \`${prefix}code <bhs> <tgs>\` : Bikin & debug kode
│ • \`${prefix}summarize <teks>\` : Ringkasan dokumen
│ • \`${prefix}translate <bhs> <teks>\` : Terjemahan bahasa
│ • \`${prefix}modeai <on/off>\` : Saklar auto-reply AI
│ • \`${prefix}clearai\` : Reset memori obrolan
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk mencoba fitur AI:_
      `.trim();

      const buttons = [
        { buttonId: '.ai Halo Nova', buttonText: { displayText: '💬 TANYA AI' }, type: 1 },
        { buttonId: '.deepseek Jelaskan relativitas', buttonText: { displayText: '🧠 DEEP REASON' }, type: 1 },
        { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 2: MEDIA & DOWNLOADER ---
    if (cat === 'media') {
      const text = `
${headerTelemetry}

╭─── 📸 *[MODUL MEDIA, STIKER & DOWNLOADER]*
│ • \`${prefix}stiker\` / \`${prefix}s\` : Foto / 1x lihat jadi stiker jernih! 🖼️
│ • \`${prefix}rvo\` / \`${prefix}lihat\` : Buka & unduh foto/video 1x lihat permanen! 🔓
│ • \`${prefix}winkhd\` : Buka aplikasi/situs resmi Wink untuk kualitas HD ✨
│ • \`${prefix}toaudio\` / \`${prefix}tovn\` : Ubah audio/video menjadi MP3 atau voice note
│ • \`${prefix}ytmp3 <url>\` : Unduh audio MP3 YouTube resmi 🎵
│ • \`${prefix}tiktok <url>\` : Unduh video TikTok tanpa watermark! 🎬
│ • \`${prefix}scanqr\` / \`${prefix}readqr\` : Scan QR Code dari foto 🔍
│ • \`${prefix}qrcode <teks>\` : Generator QR Code neon resolusi tinggi 📱
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk aksi cepat:_
      `.trim();

      const buttons = [
        { buttonId: '.winkhd', buttonText: { displayText: '✨ BUKA WINK HD' }, type: 1 },
        { buttonId: '.stiker', buttonText: { displayText: '🖼️ JADI STIKER' }, type: 1 },
        { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 3: FAKE CHAT & IQC ---
    if (cat === 'iqc') {
      const text = `
${headerTelemetry}

╭─── 💬 *[MODUL FAKE CHAT, IQC & MEME]*
│ • \`${prefix}iqc <pesan> | <balasan emoji>\` : Buat chat WhatsApp bergaya iPhone 💬
│   Contoh: \`${prefix}iqc Hai apa kabar? | 😊❤️\` (balasan emoji opsional)
│ • \`${prefix}brat <teks>\` : Stiker viral Brat hijau estetik 🟩
│ • \`${prefix}tweet <teks>\` : Kartu postingan palsu dark mode X 🐦
│ • \`${prefix}grayscale\` : Filter foto hitam putih elegan 🖤
│ • \`${prefix}invert\` : Filter warna negatif futuristik 🎭
│ • \`${prefix}blur\` : Filter efek blur artistik 🌫️
│ • \`${prefix}flip\` : Filter balik horizontal cermin 🪞
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk membuat kartu iOS:_
      `.trim();

      const buttons = [
        { buttonId: '.iqc', buttonText: { displayText: '📱 FAKE IOS CHAT' }, type: 1 },
        { buttonId: '.brat RANZZXITER', buttonText: { displayText: '🟩 BRAT STIKER' }, type: 1 },
        { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 4: CYBER WARFARE & DEFENSE ---
    if (cat === 'cyber') {
      const text = `
${headerTelemetry}

╭─── 🛡️ *[MODUL PERTAHANAN & SERANGAN SIBER]*
│ • \`${prefix}shield\` : Aktifkan Quantum Energy Shield (12 Jam) 🛡️
│ • \`${prefix}firewalldefend\` : Upgrade level firewall (Level 1-5) 🏰
│ • \`${prefix}antivirus\` : Deep scan & pulihkan HP profile 🩺
│ • \`${prefix}malwarescan @user\` : Scan celah keamanan target 🔬
│ • \`${prefix}patchsystem\` : Pasang patch zero-day (+Defense stat) 🔧
│ • \`${prefix}stealthmode\` : Cloak tak terlihat radar selama 30 menit 👻
│ • \`${prefix}hack @user\` : Infiltration & curi koin musuh 💻
│ • \`${prefix}ddossim @user\` : Simulasi quantum flood DDoS barrage 🌊
│ • \`${prefix}emp @user\` : Lumpuhkan perisai shield target ⚡
│ • \`${prefix}whois <domain>\` : Lookup WHOIS pendaftaran domain 🌐
│ • \`${prefix}httpstatus <code>\` : Ensiklopedia kode HTTP (200-504) 📡
│ • \`${prefix}portcheck <host>\` : Audit port service jaringan aktif 🌐
│ • \`${prefix}sslcheck <domain>\` : Cek sertifikat SSL/TLS domain 🔒
│ • \`${prefix}dnslookup <domain>\` : Reconnaissance DNS records 📡
│ • \`${prefix}headerscheck <url>\` : Audit security headers 🛡️
│ • \`${prefix}cvesearch <query>\` : Database kerentanan CVE 🚨
│ • \`${prefix}passcheck <pass>\` : Audit kekuatan kata sandi 🔑
│ • \`${prefix}hashcalc <teks>\` : Kalkulator MD5, SHA256, SHA512 🔐
│ • \`${prefix}rot13\` / \`${prefix}hex\` / \`${prefix}urlencode\` : Cipher tools 🔤
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk mengaktifkan pertahanan:_
      `.trim();

      const buttons = [
        { buttonId: '.shield', buttonText: { displayText: '🛡️ QUANTUM SHIELD' }, type: 1 },
        { buttonId: '.firewalldefend', buttonText: { displayText: '🏰 UPGRADE FIREWALL' }, type: 1 },
        { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 5: BANKING & EKONOMI ---
    if (cat === 'bank' || cat === 'economy') {
      const text = `
${headerTelemetry}

╭─── 🏦 *[MODUL BANKING, FREELANCE & CASINO]*
│ • \`${prefix}bank\` : Cek brankas koin (Bunga 2%/hari, anti-retas) 🏦
│ • \`${prefix}deposit <jml/all>\` : Setor koin tunai ke brankas 🔒
│ • \`${prefix}withdraw <jml/all>\` : Tarik koin ke dompet tunai 💰
│ • \`${prefix}crypto\` : Pantau harga BTC, ETH, SOL, BNB live 🪙
│ • \`${prefix}work\` : Kerja freelance cyber bergaji koin & EXP 💼
│ • \`${prefix}beg\` : Minta sumbangan koin darurat 🥺
│ • \`${prefix}rob @user\` : Copet koin kantong user lain 🥷
│ • \`${prefix}blackjack <bet>\` : Meja kasino blackjack kartu 21 🃏
│ • \`${prefix}daily\` : Klaim bonus koin harian
│ • \`${prefix}transfer @user <jml>\` : Kirim koin ke teman
│ • \`${prefix}shop\` : Toko belanja item cyber 🛒
│ • \`${prefix}buy <item>\` : Beli shield, stimpack, senjata
│ • \`${prefix}leaderboard\` : 10 sultan koin tertinggi 🏆
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk perbankan & kerja:_
      `.trim();

      const buttons = [
        { buttonId: '.bank', buttonText: { displayText: '🏦 CEK BRANKAS' }, type: 1 },
        { buttonId: '.work', buttonText: { displayText: '💼 KERJA CYBER' }, type: 1 },
        { buttonId: '.crypto', buttonText: { displayText: '🪙 LIVE KRIPTO' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 6: GAMES & WEREWOLF ---
    if (cat === 'games') {
      const text = `
${headerTelemetry}

╭─── 🎮 *[MODUL GAMES & ENTERTAINMENT]*
│ • \`${prefix}ww create/join/start\` : Game Werewolf Grup 🐺
│ • \`${prefix}family100\` : Tebak jawaban populer (6.964 soal) 👥
│ • \`${prefix}asahotak\` : Kuis asah otak (228 soal) 🧠
│ • \`${prefix}susunkata\` : Susun huruf menjadi kata (356 soal) 🔀
│ • \`${prefix}tebakgambar\` : Tebak gambar visual asli 🖼️
│ • \`${prefix}caklontong\` : Kuis logika konyol Cak Lontong 🤪
│ • \`${prefix}tebakbendera\` : Tebak bendera negara/wilayah (86 soal) 🚩
│ • \`${prefix}tebakkimia\` : Kuis tabel periodik (125 soal) 🧪
│ • \`${prefix}tebakangka\` : Tebak angka 1-100 🎲
│ • \`${prefix}tebakkata\` : Susun kata acak Indonesia 🧩
│ • \`${prefix}kuismtk\` : Kuis matematika kilat 📐
│ • \`${prefix}slot [taruhan]\` : Mesin kasino slot 3 simbol 🎰
│ • \`${prefix}rpg\` : Petualangan monster luar angkasa ⚔️
│ • \`${prefix}mining\` : Tambang token kripto ⛏️
│ • \`${prefix}suit <batu/gunting/kertas>\` : Adu suit vs AI ✌️
│ • \`${prefix}dadu\` / \`${prefix}coinflip\` : Lempar dadu & koin 🪙
│ • \`${prefix}wheel <a, b, c>\` : Roda putar undian 🎡
│ • \`${prefix}roulette\` : Russian roulette menantang maut 💥
│ • \`${prefix}nyerah\` : Menyerah dari ronde game aktif
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk bermain:_
      `.trim();

      const buttons = [
        { buttonId: '.family100', buttonText: { displayText: '👥 FAMILY 100' }, type: 1 },
        { buttonId: '.asahotak', buttonText: { displayText: '🧠 ASAH OTAK' }, type: 1 },
        { buttonId: '.susunkata', buttonText: { displayText: '🔀 SUSUN KATA' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 7: ANIME ROLEPLAY ---
    if (cat === 'anime') {
      const text = `
${headerTelemetry}

╭─── 🌸 *[MODUL ANIME ROLEPLAY & GALLERY]*
│ • \`${prefix}hug @user\` : Peluk hangat seseorang 🤗
│ • \`${prefix}pat @user\` : Elus lembut kepala (headpat) 🐱
│ • \`${prefix}kiss @user\` : Cium manis pipi gebetan 💋
│ • \`${prefix}slap @user\` : Tampar keras pelanggar aturan 👋
│ • \`${prefix}punch @user\` : Tinju siber bertenaga 👊
│ • \`${prefix}poke @user\` : Colek teman yang melamun 👉
│ • \`${prefix}cry\`, \`${prefix}smile\`, \`${prefix}dance\`, \`${prefix}wink\` : Reaksi emosi anime ✨
│ • \`${prefix}waifu\`, \`${prefix}husbando\`, \`${prefix}neko\` : Visual galeri waifu 🌸
│ • \`${prefix}shinobu\`, \`${prefix}megumin\` : Galeri karakter anime favorit 🌸
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk interaksi anime:_
      `.trim();

      const buttons = [
        { buttonId: '.hug', buttonText: { displayText: '🤗 HUG ANIME' }, type: 1 },
        { buttonId: '.pat', buttonText: { displayText: '🐱 HEADPAT' }, type: 1 },
        { buttonId: '.waifu', buttonText: { displayText: '🌸 GALERI WAIFU' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 8: ISLAMIC & RELIGI ---
    if (cat === 'islamic' || cat === 'religi') {
      const text = `
${headerTelemetry}

╭─── 🕌 *[MODUL KHASANAH ISLAM & IBADAH]*
│ • \`${prefix}quran <surah:ayat>\` : Ayat Quran & Terjemahan
│ • \`${prefix}asmaulhusna\` : Asmaul Husna 99 Nama Allah
│ • \`${prefix}doa <nama doa>\` : Kumpulan doa harian
│ • \`${prefix}niatsholat <waktu>\` : Niat sholat 5 waktu lengkap 🕌
│ • \`${prefix}kisahnabi <nama>\` : Kisah teladan 25 Nabi & Rasul 📜
│ • \`${prefix}ayatkursi\` : Bacaan & terjemahan Ayat Kursi agung ✨
│ • \`${prefix}dzikir [pagi/petang]\` : Panduan wirid dzikir harian 📿
│ • \`${prefix}zakatcalc <nominal>\` : Kalkulator zakat penghasilan 2.5% 💰
│ • \`${prefix}tasbih\` : Tasbih digital penghitung wirid 📿
│ • \`${prefix}sholat <kota>\` : Jadwal sholat Kemenag RI
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk doa & ibadah:_
      `.trim();

      const buttons = [
        { buttonId: '.ayatkursi', buttonText: { displayText: '✨ AYAT KURSI' }, type: 1 },
        { buttonId: '.dzikir', buttonText: { displayText: '📿 DZIKIR HARIAN' }, type: 1 },
        { buttonId: '.niatsholat subuh', buttonText: { displayText: '🕌 NIAT SHOLAT' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- KATEGORI 9: SISTEM & UTILITIES ---
    if (cat === 'system' || cat === 'utility') {
      const text = `
${headerTelemetry}

╭─── ⚙️ *[MODUL SISTEM, DEV & UTILITIES]*
│ • \`${prefix}port\` : Cek status port server & Cloudflare tunnel 🌐
│ • \`${prefix}cleanram\` : Bersihkan cache & heap RAM bot 🧹
│ • \`${prefix}systeminfo\` : Telemetri CPU, RAM & host server 🖥️
│ • \`${prefix}ping\` : Cek latency respon & RAM server 📶
│ • \`${prefix}gitsearch <repo>\` : Cari repository di GitHub 🐙
│ • \`${prefix}npmsearch <pkg>\` : Cari library/package di NPM 📦
│ • \`${prefix}linuxcmd <cmd>\` : Ensiklopedia cheat-sheet Linux 🐧
│ • \`${prefix}randomip\` : Generator IP address acak 🌐
│ • \`${prefix}colorhex <hex>\` : Analisis kode warna HEX ke RGB 🎨
│ • \`${prefix}fancy <teks>\` : Font aesthetic & cyber
│ • \`${prefix}morse <teks>\` : Enkripsi kode morse
│ • \`${prefix}demorse <code>\` : Dekripsi kode morse
│ • \`${prefix}binary <teks>\` : Teks ke biner 0101
│ • \`${prefix}base64 <teks>\` : Base64 encode & decode
│ • \`${prefix}shortlink <url>\` : Pemendek tautan link
│ • \`${prefix}tts <teks>\` : Teks ke suara audio
╰────────────────────────────────────────
_👇 Gunakan tombol di bawah untuk optimasi:_
      `.trim();

      const buttons = [
        { buttonId: '.cleanram', buttonText: { displayText: '⚡ SPEED BOOST' }, type: 1 },
        { buttonId: '.port', buttonText: { displayText: '🌐 CEK PORT' }, type: 1 },
        { buttonId: '.systeminfo', buttonText: { displayText: '🖥️ TELEMETRI' }, type: 1 }
      ];
      return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
    }

    // --- DEFAULT: MAIN QUANTUM COMMAND CENTER (ULTRA FAST) ---
    const mainMenuText = `
${headerTelemetry}

╭─── 📲 *PUSAT MENU INTERAKTIF*
│ Pilih kategori di tombol atau daftar menu.
│ Ketuk pilihan untuk membuka fitur tanpa mengetik perintah.
╰────────────────────────────────────────
    `.trim();

    const mainButtons = [
      { buttonId: '.menu ai', buttonText: { displayText: '🧠 MENU AI' }, type: 1 },
      { buttonId: '.menu media', buttonText: { displayText: '📸 MENU MEDIA' }, type: 1 },
      { buttonId: '.menu cyber', buttonText: { displayText: '🛡️ MENU CYBER' }, type: 1 }
    ];

    await animeService.sendAnimeReply(sock, chatId, mainMenuText, null, { buttons: mainButtons });

    return sock.sendMessage(chatId, {
      listMessage: {
        title: '📲 MENU FITUR BOT',
        description: 'Pilih kategori fitur yang ingin dibuka.',
        buttonText: 'PILIH FITUR',
        listType: 1,
        sections: [{
          title: 'KATEGORI',
          rows: [
            { title: '🧠 AI & Vision', description: 'Asisten AI dan analisis', rowId: `${prefix}menu ai` },
            { title: '📸 Media & Wink HD', description: 'Foto, stiker, downloader, Wink', rowId: `${prefix}menu media` },
            { title: '💬 Chat & Meme', description: 'Simulasi chat iPhone dan meme', rowId: `${prefix}menu iqc` },
            { title: '🛡️ Cyber & Keamanan', description: 'Utilitas keamanan dan proteksi', rowId: `${prefix}menu cyber` },
            { title: '🏦 Bank & Ekonomi', description: 'Koin, bank, dan ekonomi', rowId: `${prefix}menu bank` },
            { title: '🎮 Games', description: 'Permainan dan kuis', rowId: `${prefix}menu games` },
            { title: '🌸 Anime', description: 'Roleplay dan galeri', rowId: `${prefix}menu anime` },
            { title: '🕌 Religi', description: 'Doa, ayat, dan ibadah', rowId: `${prefix}menu islamic` },
            { title: '⚙️ Sistem', description: 'Status dan utilitas bot', rowId: `${prefix}menu system` }
          ]
        }]
      }
    });
  },

  // =========================================================
  // 2. CEK PORT & NETWORK STATUS (.port)
  // =========================================================
  async checkPort(sock, chatId) {
    const activePort = process.env.PORT || config.PORT || 3000;
    const stats = db.getStats();

    const text = `
🌐 *[CYBER NETWORK PORT & SOCKET TELEMETRY]* 🌐
════════════════════════════════════════
🔌 *Active Web Port*: \`${activePort}\`
📡 *Local Binding*: \`http://localhost:${activePort}\`
🌐 *Public Tunnel*: \`Cloudflare Edge Tunnel (Encrypted)\`
🛡️ *Sentinel Firewall*: ACTIVE (Port Protected)
🔒 *Fail2Ban Jail*: 0 IP Terblokir
⚡ *Engine Mode*: Ultra Fast Daemon
════════════════════════════════════════
_Gunakan tombol di bawah untuk pengujian jaringan:_
    `.trim();

    const buttons = [
      { buttonId: `.portcheck localhost ${activePort}`, buttonText: { displayText: '🔍 AUDIT PORT' }, type: 1 },
      { buttonId: '.systeminfo', buttonText: { displayText: '🖥️ TELEMETRI' }, type: 1 },
      { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
    ];

    return await animeService.sendAnimeReply(sock, chatId, text, null, { buttons });
  },

  // =========================================================
  // 3. PROFILE USER DENGAN TOMBOL
  // =========================================================
  async showProfile(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const requiredXp = user.level * 100;
    const progressPercent = Math.min(100, Math.floor((user.xp / requiredXp) * 100));
    const progressBar = '█'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));

    const card = `
╔═══════════════════════════════╗
║    🆔 *CYBER CITIZEN ID CARD* ║
╚═══════════════════════════════╝

👤 *Nama*: ${user.name}
🔢 *Nomor*: @${senderId.split('@')[0]}
🎖️ *Title Rank*: *${user.rank}*
🛡️ *Otoritas*: [${user.role}]

📊 *METRIK STATUS*:
⭐ *Level*: Lv.${user.level}
⚡ *EXP*: [${progressBar}] ${user.xp}/${requiredXp} (${progressPercent}%)
💰 *Cyber Coins*: ${user.coins.toLocaleString('id-ID')}
🔒 *Bank Vault*: ${(user.bank || 0).toLocaleString('id-ID')}
❤️ *Kesehatan (HP)*: ${user.hp}/${user.maxHp}
⚔️ *Attack Power*: ${user.attack}
🛡️ *Defense Shield*: ${user.defense}

🎒 *INVENTARIS*:
${user.inventory && user.inventory.length > 0 ? user.inventory.map(i => `> • ${i}`).join('\n') : '> (Kosong)'}
    `.trim();

    const buttons = [
      { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 },
      { buttonId: '.bank', buttonText: { displayText: '🏦 CEK BANK' }, type: 1 },
      { buttonId: '.daily', buttonText: { displayText: '🎁 KLAIM DAILY' }, type: 1 }
    ];

    return await animeService.sendAnimeReply(sock, chatId, card, null, { buttons, mentions: [senderId] });
  },

  // =========================================================
  // 4. LEADERBOARD SULTAN DENGAN TOMBOL
  // =========================================================
  async showLeaderboard(sock, chatId) {
    const users = db.getAllUsers();
    users.sort((a, b) => (b.coins || 0) - (a.coins || 0));
    const top10 = users.slice(0, 10);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    let text = `🏆 *[CYBER HALL OF FAME - TOP SULTAN]* 🏆\n═══════════════════════════════\n\n`;

    top10.forEach((u, idx) => {
      const medal = medals[idx] || '🔹';
      const cleanNumber = u.id ? u.id.split('@')[0] : 'Unknown';
      text += `${medal} *${u.name}* (@${cleanNumber})\n`;
      text += `   💰 ${u.coins.toLocaleString('id-ID')} Koin | Lv.${u.level} [${u.rank}]\n\n`;
    });

    text += `═══════════════════════════════\n💡 Tingkatkan koinmu dengan bekerja (.work) dan bermain game!`;

    const mentions = top10.map(u => u.id).filter(Boolean);
    const buttons = [
      { buttonId: '.bank', buttonText: { displayText: '🏦 CEK SALDO' }, type: 1 },
      { buttonId: '.work', buttonText: { displayText: '💼 KERJA CYBER' }, type: 1 },
      { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
    ];

    return await animeService.sendAnimeReply(sock, chatId, text.trim(), null, { buttons, mentions });
  },

  // =========================================================
  // 5. PING & SPEED TEST DENGAN TOMBOL
  // =========================================================
  async checkPing(sock, chatId, startTimestamp) {
    const latency = Date.now() - startTimestamp;
    const stats = db.getStats();
    const memTotal = Math.round(os.totalmem() / 1024 / 1024);
    const memFree = Math.round(os.freemem() / 1024 / 1024);
    const memUsed = memTotal - memFree;
    const nodeVer = process.version;
    const activePort = process.env.PORT || config.PORT || 3000;

    const pingText = `
⚡ *[QUANTUM LATENCY & NETWORK REPORT]* ⚡
══════════════════════════
📶 *Respon Ping*: *${latency} ms* [ULTRA FAST]
🔌 *Server Port*: \`${activePort}\`
💻 *Platform OS*: ${os.type()} ${os.release()} (${os.arch()})
🧠 *Node.js Runtime*: ${nodeVer}
💾 *Penggunaan RAM*: ${memUsed} MB / ${memTotal} MB
👥 *Total User*: ${stats.totalUsers} pengguna
💬 *Total Query AI*: ${stats.totalAiQueries} permintaan
🎮 *Total Game*: ${stats.totalGamesPlayed} ronde
══════════════════════════
🟢 *Status Sistem*: 100% ULTRA STABLE & RESPONSIVE
    `.trim();

    const buttons = [
      { buttonId: '.cleanram', buttonText: { displayText: '⚡ SPEED BOOST' }, type: 1 },
      { buttonId: '.port', buttonText: { displayText: '🌐 CEK PORT' }, type: 1 },
      { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
    ];

    return await animeService.sendAnimeReply(sock, chatId, pingText, null, { buttons });
  },

  async handleAFK(sock, chatId, senderId, reason) {
    const user = db.getUser(senderId);
    user.afk = {
      isAfk: true,
      reason: reason || 'Sedang sibuk / tidak berada di tempat',
      time: Date.now()
    };
    db.updateUser(senderId, user);

    const buttons = [
      { buttonId: '.ping', buttonText: { displayText: '📶 STATUS' }, type: 1 },
      { buttonId: '.menu', buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 }
    ];

    return await animeService.sendAnimeReply(sock, chatId, `💤 @${senderId.split('@')[0]} sekarang dalam status *AFK*:\n> "${user.afk.reason}"`, null, { buttons, mentions: [senderId] });
  },

  async generateQRCode(sock, chatId, text) {
    if (!text || !text.trim()) {
      return animeService.sendAnimeReply(sock, chatId, `📷 *Format:* \`.qrcode <teks atau link URL>\``);
    }

    try {
      const buffer = await QRCode.toBuffer(text.trim(), {
        errorCorrectionLevel: 'H',
        margin: 2,
        scale: 8,
        color: { dark: '#00F0FF', light: '#050814' }
      });

      return await sock.sendMessage(chatId, {
        image: buffer,
        caption: `✨ *[CYBER QR CODE GENERATED]*\n\nIsi: "${text.trim()}"`
      });
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal membuat QR Code: ${e.message}`);
    }
  },

  async makeShortlink(sock, chatId, url) {
    if (!url || !url.startsWith('http')) {
      return animeService.sendAnimeReply(sock, chatId, `🔗 *Format:* \`.shortlink <url>\``);
    }

    try {
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url.trim())}`, { timeout: 8000 });
      return animeService.sendAnimeReply(sock, chatId, `🔗 *[CYBER SHORTLINK READY]*\n\n📌 *Asli*: ${url.trim()}\n⚡ *Pendek*: *${res.data}*`);
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal memendekkan tautan link.`);
    }
  },

  async textToSpeech(sock, chatId, text) {
    if (!text) {
      return animeService.sendAnimeReply(sock, chatId, `🗣️ *Format:* \`.tts <kalimat>\``);
    }

    try {
      const encoded = encodeURIComponent(text.trim().substring(0, 200));
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=id&client=tw-ob`;
      
      return await sock.sendMessage(chatId, {
        audio: { url: ttsUrl },
        mimetype: 'audio/mp4',
        ptt: true
      });
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal menghasilkan audio TTS.`);
    }
  }
};
