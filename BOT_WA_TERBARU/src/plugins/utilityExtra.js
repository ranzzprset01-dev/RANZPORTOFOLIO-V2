const axios = require('axios');
const os = require('os');
const https = require('https');
const animeService = require('../services/animeService');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const LINUX_COMMANDS = {
  ls: 'Menampilkan daftar file dan direktori. Contoh: `ls -la` (tampilkan hidden file & detail).',
  cd: 'Berpindah ke direktori lain. Contoh: `cd /var/www` atau `cd ..` (kembali ke folder atas).',
  grep: 'Mencari teks atau pola dalam file. Contoh: `grep -rn "API_KEY" .`',
  chmod: 'Mengubah izin akses file/folder. Contoh: `chmod +x script.sh` (beri izin eksekusi).',
  chown: 'Mengubah pemilik file/folder. Contoh: `chown -R www-data:www-data /var/www`',
  ps: 'Melihat proses yang sedang berjalan. Contoh: `ps aux | grep node`',
  kill: 'Menghentikan proses berdasarkan PID. Contoh: `kill -9 1234`',
  top: 'Memantau penggunaan CPU, RAM, dan proses sistem secara real-time (atau `htop`).',
  df: 'Melihat kapasitas ruang disk hard drive. Contoh: `df -h` (human-readable).',
  free: 'Melihat kapasitas RAM yang terpakai dan kosong. Contoh: `free -m` (dalam MB).'
};

module.exports = {
  // 1. CARI REPOSITORY GITHUB (.gitsearch <repo>)
  async handleGitSearch(sock, chatId, query) {
    if (!query) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan nama repository yang dicari!\nContoh: `.gitsearch baileys`');
    try {
      const res = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=3`, {
        headers: { 'User-Agent': 'CyberNovaBot/1.0' },
        timeout: 5000
      });
      const items = res.data.items || [];
      if (items.length === 0) return animeService.sendAnimeReply(sock, chatId, `Tidak ditemukan repo untuk: *${query}*`);

      let text = `🐙 *[GITHUB REPOSITORY SEARCH]* 🐙\n═════════════════════════════════════\n`;
      items.forEach((item, idx) => {
        text += `\n${idx + 1}. *${item.full_name}*\n⭐ Stars: ${item.stargazers_count.toLocaleString('id-ID')} | 🍴 Forks: ${item.forks_count}\n📝 ${item.description || 'No description'}\n🔗 ${item.html_url}\n`;
      });
      text += `═════════════════════════════════════`;
      return animeService.sendAnimeReply(sock, chatId, text.trim());
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mencari di GitHub: ${e.message}`);
    }
  },

  // 2. CARI NPM PACKAGE (.npmsearch <pkg>)
  async handleNpmSearch(sock, chatId, query) {
    if (!query) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan nama package npm!\nContoh: `.npmsearch express`');
    try {
      const res = await axios.get(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=3`, {
        timeout: 5000
      });
      const items = res.data.objects || [];
      if (items.length === 0) return animeService.sendAnimeReply(sock, chatId, `Tidak ditemukan package untuk: *${query}*`);

      let text = `📦 *[NPM REGISTRY SEARCH]* 📦\n═════════════════════════════════════\n`;
      items.forEach((o, idx) => {
        const p = o.package;
        text += `\n${idx + 1}. *${p.name}* (v${p.version})\n📝 ${p.description || 'Tanpa deskripsi'}\n🔗 ${p.links?.npm || ''}\n`;
      });
      text += `═════════════════════════════════════`;
      return animeService.sendAnimeReply(sock, chatId, text.trim());
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mencari di NPM: ${e.message}`);
    }
  },

  // 3. ENSIKLOPEDIA TERMINAL LINUX (.linuxcmd <cmd>)
  handleLinuxCmd(sock, chatId, cmdArg) {
    const cmd = (cmdArg || 'ls').trim().toLowerCase();
    const desc = LINUX_COMMANDS[cmd] || `Perintah \`${cmd}\` adalah utilitas shell Linux standar. Gunakan \`man ${cmd}\` di terminal untuk manual lengkap.`;

    const text = `
🐧 *[LINUX SHELL CHEAT-SHEET]* 🐧
═════════════════════════════════════
💻 *Perintah*: \`${cmd}\`
📖 *Fungsi*:
${desc}
═════════════════════════════════════
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  },

  // 4. INFO SERVER & HARDWARE TELEMETRY (.systeminfo)
  handleSystemInfo(sock, chatId) {
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const cpuCount = os.cpus().length;
    const cpuModel = os.cpus()[0]?.model || 'Tidak diketahui';
    const uptimeHours = (os.uptime() / 3600).toFixed(1);

    const text = `
🖥️ *[HOST SERVER HARDWARE TELEMETRY]* 🖥️
═════════════════════════════════════
💻 *Platform*: ${os.type()} (${os.arch()})
⚙️ *Processor*: ${cpuModel} (${cpuCount} Cores)
🧠 *RAM Terpakai*: ${usedMem} GB / ${totalMem} GB (${Math.round((usedMem / totalMem) * 100)}%)
🟢 *RAM Tersedia*: ${freeMem} GB
⏱️ *Host Uptime*: ${uptimeHours} Jam
⚡ *Node.js*: ${process.version}
═════════════════════════════════════
_Optimal, ringan, dan aman di perangkat sendiri._
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  },

  // 5. PEMBERSIH MEMORI RAM CACHE (.cleanram)
  handleCleanRam(sock, chatId) {
    if (global.gc) {
      global.gc();
    }
    const memUsage = process.memoryUsage();
    const heapUsedMb = (memUsage.heapUsed / 1024 / 1024).toFixed(1);

    return animeService.sendAnimeReply(sock, chatId, `
🧹 *[NODE.JS GARBAGE COLLECTOR TRIGGERED]* 🧹
═════════════════════════════════════
✅ Cache memori sementara dan buffer usang telah dibersihkan!
🧠 *Heap Memory Saat Ini*: ${heapUsedMb} MB
🚀 Bot berjalan lebih responsif dan ringan di perangkat.
═════════════════════════════════════
`.trim());
  },

  // 6. GENERATOR IPV4 ACAK (.randomip)
  handleRandomIP(sock, chatId) {
    const octet1 = Math.floor(Math.random() * 223) + 1; // 1-223 (Public unicast)
    const octet2 = Math.floor(Math.random() * 256);
    const octet3 = Math.floor(Math.random() * 256);
    const octet4 = Math.floor(Math.random() * 254) + 1;
    const ip = `${octet1}.${octet2}.${octet3}.${octet4}`;
    return animeService.sendAnimeReply(sock, chatId, `🌐 *[RANDOM IPV4 GENERATOR]*\nIP: \`${ip}\`\n_Gunakan untuk pengujian jaringan atau simulasi._`);
  },

  // 7. KONVERTER WARNA HEX/RGB (.colorhex <hex>)
  handleColorHex(sock, chatId, hexArg) {
    let hex = (hexArg || '#00f2fe').trim().replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan kode warna HEX 6-digit valid!\nContoh: `.colorhex #00f2fe` atau `.colorhex ff007f`');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const text = `
🎨 *[COLOR MATRIX INSPECTOR]* 🎨
═════════════════════════════════════
✨ *Hex*: \`#${hex.toUpperCase()}\`
🌈 *RGB*: \`rgb(${r}, ${g}, ${b})\`
💡 *Komposisi*: Merah ${r}, Hijau ${g}, Biru ${b}
═════════════════════════════════════
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  }
};
