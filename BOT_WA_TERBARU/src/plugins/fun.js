const db = require('../database/db');
const tebakBenderaList = require('../data/imported-games/tebakbendera.json')
  .filter(item => typeof item.soal === 'string' && typeof item.jawaban === 'string')
  .map(item => ({ flag: item.soal, jawaban: item.jawaban }));
const tebakKimiaList = require('../data/imported-games/tebakkimia.json')
  .filter(item => typeof item.soal === 'string' && typeof item.jawaban === 'string');

// State game aktif
const activeCakLontong = {};
const activeTebakBendera = {};
const activeTebakKimia = {};
const activeTebakTebakan = {};

const khodamList = [
  'Naga RTX 4090 Ti', 'Harimau Putih Wi-Fi 6', 'Kucing Koding Python', 'Kuntilanak Low Latency',
  'Tuyul Penambang Kripto', 'Genderuwo Server Rack', 'Pocong Neon Cyberpunk', 'Elang Fiber Optic',
  'Buaya Kompilasi C++', 'Semut Quantum Core', 'Singa Overclock 6.0 GHz', 'Kambing Algoritma',
  'Kura-Kura High Bandwidth', 'Bebek Machine Learning', 'Lumba-Lumba Starlink', 'Garuda Cloud Computing'
];

const cakLontongList = [
  { soal: 'Matahari tenggelam di sebelah...', jawaban: 'BARAT', alasan: 'Gak mungkin di piring, itu bakso!' },
  { soal: 'Orang menyeberang jalan lewat...', jawaban: 'JALAN', alasan: 'Kalau lewat jembatan, namanya menyeberang sungai!' },
  { soal: 'Burung bisa terbang karena memiliki...', jawaban: 'BAKAT', alasan: 'Kalau punya sayap tapi gak punya bakat, jatoh juga!' },
  { soal: 'Makanan khas saat lebaran adalah...', jawaban: 'ENAK', alasan: 'Kalau gak enak, gak ada yang mau makan!' },
  { soal: 'Banteng warnanya...', jawaban: 'MERAH', alasan: 'Itu kan banteng lagi marah!' }
];

module.exports = {
  // 1. CEK KHODAM CYBER
  checkKhodam(sock, chatId, senderId, name) {
    const targetName = name ? name.trim() : 'Kamu';
    const khodam = khodamList[Math.floor(Math.random() * khodamList.length)];
    const powerLevel = Math.floor(Math.random() * 900) + 100;

    return sock.sendMessage(chatId, {
      text: `
🔮 *[RADAR KHODAM CYBERPUNK 2099]* 🔮
══════════════════════════════
👤 *Target*: ${targetName}
👻 *Khodam Pendamping*: *${khodam}*
⚡ *Tingkat Keselarasan Energi*: *${powerLevel}%*
✨ *Aura*: Holographic Neon Matrix

_Khodam ini bertugas menjaga stabilitas ping dan melindungi dari serangan lag!_
══════════════════════════════
`
    });
  },

  // 2. CEK JODOH / COMPATIBILITY
  checkLove(sock, chatId, senderId, text) {
    if (!text || !text.includes('&')) {
      return sock.sendMessage(chatId, {
        text: `💡 *Format:* \`.jodoh <Nama 1> & <Nama 2>\`\nContoh: \`.jodoh Romeo & Juliet\``
      });
    }

    const [name1, name2] = text.split('&').map(s => s.trim());
    const score = Math.floor(Math.random() * 51) + 50; // 50 - 100%

    let advice = '';
    if (score >= 90) advice = '💖 *Jodoh Sejati Abadi!* Algoritma semesta merestui hubungan ini!';
    else if (score >= 75) advice = '✨ *Sangat Cocok!* Saling melengkapi dan memiliki chemistry kuat.';
    else advice = '☕ *Cukup Baik!* Butuh komunikasi dan saling pengertian lebih dalam.';

    return sock.sendMessage(chatId, {
      text: `
💘 *[QUANTUM LOVE RADAR 2099]* 💘
══════════════════════════════
👤 Pasangan: *${name1}* & *${name2}*
📊 Persentase Kecocokan: *${score}%*
${advice}
══════════════════════════════
`
    });
  },

  // 3. DADU ROLL (1-6)
  rollDice(sock, chatId, senderId) {
    const dice = Math.floor(Math.random() * 6) + 1;
    const icons = ['⚀ (1)', '⚁ (2)', '⚂ (3)', '⚃ (4)', '⚄ (5)', '⚅ (6)'];
    return sock.sendMessage(chatId, {
      text: `🎲 *[ROLLING DICE]* 🎲\n\nKamu melempar dadu dan mendapatkan angka: *${icons[dice - 1]}*!`
    });
  },

  // 4. COIN FLIP
  flipCoin(sock, chatId, senderId) {
    const result = Math.random() > 0.5 ? '🪙 GAMBAR (HEADS)' : '🪙 ANGKA (TAILS)';
    return sock.sendMessage(chatId, {
      text: `🪙 *[QUANTUM COIN FLIP]* 🪙\n\nKoin berputar di udara...\nHasil: *${result}*!`
    });
  },

  // 5. SPIN WHEEL
  spinWheel(sock, chatId, senderId, query) {
    if (!query || !query.includes(',')) {
      return sock.sendMessage(chatId, {
        text: `💡 *Format:* \`.wheel <pilihan1, pilihan2, pilihan3, ...>\`\nContoh: \`.wheel Bakso, Nasi Goreng, Mie Ayam, Sate\``
      });
    }

    const options = query.split(',').map(s => s.trim()).filter(Boolean);
    if (options.length < 2) return sock.sendMessage(chatId, { text: `❌ Masukkan minimal 2 opsi pilihan dipisah tanda koma!` });

    const chosen = options[Math.floor(Math.random() * options.length)];
    return sock.sendMessage(chatId, {
      text: `🎡 *[RODA PUTAR KEBERUNTUNGAN]* 🎡\n\nRoda berputar kencang...\n🎯 *Hasil Pilihan*: *${chosen}*!`
    });
  },

  // 6. RUSSIAN ROULETTE
  russianRoulette(sock, chatId, senderId) {
    const chamber = Math.floor(Math.random() * 6);
    const user = db.getUser(senderId);

    if (chamber === 0) {
      user.hp = Math.max(1, user.hp - 50);
      user.coins = Math.max(0, user.coins - 500);
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `💥 *DORRRR!* Peluru meledak! Kamu terkena tembakan!\n❤️ HP berkurang -50 | 💸 Koin -500`
      });
    } else {
      user.coins += 500;
      user.xp += 50;
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `*KLIK!* Ruang peluru kosong! Kamu selamat dari maut!\n🎉 Hadiah keberanian: +500 Koin | +50 EXP`
      });
    }
  },

  // 7. CAK LONTONG GAME
  handleCakLontong(sock, chatId, senderId) {
    if (activeCakLontong[chatId]) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Kuis Cak Lontong masih aktif!\nSoal: *${activeCakLontong[chatId].soal}*`
      });
    }

    const item = cakLontongList[Math.floor(Math.random() * cakLontongList.length)];
    activeCakLontong[chatId] = item;

    return sock.sendMessage(chatId, {
      text: `
🤪 *[KUIS LOGIKA CAK LONTONG]* 🤪
══════════════════════════════
❓ *Soal*: "${item.soal}"

🎯 *Cara Jawab*: Langsung ketik tebakanmu di chat ini!
💰 *Hadiah*: +800 Koin & +80 EXP
══════════════════════════════
`
    });
  },

  checkCakLontong(sock, chatId, senderId, text) {
    const game = activeCakLontong[chatId];
    if (!game) return false;

    if (text.trim().toUpperCase() === game.jawaban) {
      const user = db.getUser(senderId);
      user.coins += 800;
      user.xp += 80;
      db.updateUser(senderId, user);
      delete activeCakLontong[chatId];

      sock.sendMessage(chatId, {
        text: `
🎉 *BENAR SEKALI!* @${senderId.split('@')[0]}
Jawaban: *${game.jawaban}*
💡 *Alasan Cak Lontong*: "${game.alasan}"
💰 Hadiah: +800 Koin & +80 EXP
`,
        mentions: [senderId]
      });
      return true;
    }
    return false;
  },

  // 8. TEBAK BENDERA GAME
  async handleTebakBendera(sock, chatId, senderId) {
    if (activeTebakBendera[chatId]) {
      return sock.sendMessage(chatId, { text: `⚠️ Tebak Bendera masih aktif!` });
    }

    const item = tebakBenderaList[Math.floor(Math.random() * tebakBenderaList.length)];
    activeTebakBendera[chatId] = item;

    return await sock.sendMessage(chatId, {
      text: `
🚩 *[GAME TEBAK BENDERA DUNIA]* 🚩
══════════════════════════════
Negara atau wilayah manakah yang memiliki bendera ini?

${item.flag}
🎯 *Cara Jawab*: Langsung ketik nama negaranya di chat ini!
💰 *Hadiah*: +900 Koin & +90 EXP
══════════════════════════════
`
    });
  },

  checkTebakBendera(sock, chatId, senderId, text) {
    const game = activeTebakBendera[chatId];
    if (!game) return false;

    if (text.trim().toLocaleLowerCase('id-ID') === game.jawaban.trim().toLocaleLowerCase('id-ID')) {
      const user = db.getUser(senderId);
      user.coins += 900;
      user.xp += 90;
      db.updateUser(senderId, user);
      delete activeTebakBendera[chatId];

      sock.sendMessage(chatId, {
        text: `🎉 *TEPAT!* Bendera tersebut adalah milik *${game.jawaban}*! (+900 Koin)`,
        mentions: [senderId]
      });
      return true;
    }
    return false;
  },

  // 9. TEBAK KIMIA GAME
  handleTebakKimia(sock, chatId, senderId) {
    if (activeTebakKimia[chatId]) {
      return sock.sendMessage(chatId, { text: `⚠️ Kuis Kimia masih aktif!` });
    }

    const item = tebakKimiaList[Math.floor(Math.random() * tebakKimiaList.length)];
    activeTebakKimia[chatId] = item;

    return sock.sendMessage(chatId, {
      text: `
🧪 *[KUIS TABEL PERIODIK KIMIA]* 🧪
══════════════════════════════
Apa lambang kimia dari unsur *${item.soal}*?
💰 *Hadiah*: +800 Koin & +80 EXP
══════════════════════════════
`
    });
  },

  checkTebakKimia(sock, chatId, senderId, text) {
    const game = activeTebakKimia[chatId];
    if (!game) return false;

    if (text.trim().toLocaleLowerCase('id-ID') === game.jawaban.trim().toLocaleLowerCase('id-ID')) {
      const user = db.getUser(senderId);
      user.coins += 800;
      user.xp += 80;
      db.updateUser(senderId, user);
      delete activeTebakKimia[chatId];

      sock.sendMessage(chatId, {
        text: `🎉 *BENAR!* Lambang unsur *${game.soal}* adalah *${game.jawaban}*! (+800 Koin)`,
        mentions: [senderId]
      });
      return true;
    }
    return false;
  },

  hasActiveGame(chatId) {
    return Boolean(activeCakLontong[chatId] || activeTebakBendera[chatId] || activeTebakKimia[chatId]);
  },

  cancelGames(chatId) {
    let msg = [];
    if (activeCakLontong[chatId]) {
      msg.push(`Cak Lontong: *${activeCakLontong[chatId].jawaban}*`);
      delete activeCakLontong[chatId];
    }
    if (activeTebakBendera[chatId]) {
      msg.push(`Bendera: *${activeTebakBendera[chatId].jawaban}*`);
      delete activeTebakBendera[chatId];
    }
    if (activeTebakKimia[chatId]) {
      msg.push(`Kimia: *${activeTebakKimia[chatId].jawaban}*`);
      delete activeTebakKimia[chatId];
    }
    return msg.length > 0 ? `🏳️ Game dibatalkan. Jawaban: ${msg.join(', ')}` : null;
  }
};
