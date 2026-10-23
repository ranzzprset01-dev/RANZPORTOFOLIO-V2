const db = require('../database/db');

// State game tebak gambar per chat
const activeTebakGambar = {};

const soalTebakGambarList = require('../data/imported-games/tebakgambar.json')
  .filter(item => {
    if (typeof item.img !== 'string' || typeof item.jawaban !== 'string') return false;
    try {
      const imageUrl = new URL(item.img);
      return imageUrl.protocol === 'https:' && imageUrl.hostname === 'www.cademedia.com';
    } catch {
      return false;
    }
  })
  .map(item => ({
    img: item.img,
    jawaban: item.jawaban,
    hint: item.deskripsi || `Soal tebak gambar #${item.index + 1}`
  }));

module.exports = {
  async handleTebakGambar(sock, chatId, senderId) {
    if (activeTebakGambar[chatId]) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Tebak Gambar masih berlangsung di chat ini!\nPetunjuk: _${activeTebakGambar[chatId].hint}_\n\nLangsung ketik tebakanmu atau ketik *.nyerah* untuk membatalkan.`
      });
    }

    const picked = soalTebakGambarList[Math.floor(Math.random() * soalTebakGambarList.length)];
    activeTebakGambar[chatId] = {
      jawaban: picked.jawaban.toUpperCase(),
      hint: picked.hint,
      startedAt: Date.now()
    };

    const caption = `
🖼️ *[GAME TEBAK GAMBAR CYBER]* 🖼️
══════════════════════════
Tebak maksud dari susunan gambar di atas!

💡 *Petunjuk*: ${picked.hint}
🎯 *Cara Jawab*: Langsung ketik tebakanmu di chat ini!
💰 *Hadiah*: +1000 Koin | +100 EXP
⏳ Waktu: 2 Menit | Ketik *.nyerah* untuk menyerah.
══════════════════════════
`;

    try {
      return await sock.sendMessage(chatId, {
        image: { url: picked.img },
        caption: caption.trim()
      });
    } catch (e) {
      // Fallback jika gambar url gagal muat
      return await sock.sendMessage(chatId, {
        text: `🖼️ *[TEBAK KATA GAMBAR]*\n\n💡 Petunjuk: ${picked.hint}\nLangsung ketik jawabannya di chat!\n💰 Hadiah: +1000 Koin`
      });
    }
  },

  async checkAnswer(sock, chatId, senderId, text) {
    const session = activeTebakGambar[chatId];
    if (!session) return false;

    const input = text.trim().toUpperCase();
    if (input === session.jawaban) {
      const user = db.getUser(senderId);
      user.coins += 1000;
      user.xp += 100;
      db.updateUser(senderId, user);
      db.incrementStat('totalGamesPlayed');

      delete activeTebakGambar[chatId];

      await sock.sendMessage(chatId, {
        text: `
🎉 *[TEBAKAN GAMBAR TEPAT!]* 🎉
══════════════════════════
Selamat @${senderId.split('@')[0]}!
Jawaban yang benar: *${session.jawaban}*

💰 *Hadiah Koin*: +1000 Cyber Coins
⚡ *Hadiah EXP*: +100 EXP
💳 *Saldo Koin*: ${user.coins.toLocaleString('id-ID')}

Ketik *.tebakgambar* untuk bermain lagi!
══════════════════════════
`,
        mentions: [senderId]
      });
      return true;
    }
    return false;
  },

  hasActive(chatId) {
    return Boolean(activeTebakGambar[chatId]);
  },

  cancel(chatId) {
    if (activeTebakGambar[chatId]) {
      const ans = activeTebakGambar[chatId].jawaban;
      delete activeTebakGambar[chatId];
      return `🏳️ Sesi Tebak Gambar dibatalkan. Jawabannya adalah *${ans}*.`;
    }
    return null;
  }
};
