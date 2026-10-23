const db = require('../database/db');

const questionBanks = {
  asahotak: require('../data/imported-games/asahotak.json')
    .filter(item => typeof item.soal === 'string' && typeof item.jawaban === 'string')
    .map(item => ({ question: item.soal, answer: item.jawaban })),
  susunkata: require('../data/imported-games/susunkata.json')
    .filter(item => typeof item.soal === 'string' && typeof item.jawaban === 'string')
    .map(item => ({ question: item.soal, answer: item.jawaban, type: item.tipe }))
};

const activeGames = new Map();
const GAME_DURATION_MS = 90 * 1000;

function normalizeAnswer(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function clearSession(chatId) {
  const session = activeGames.get(chatId);
  if (!session) return null;
  clearTimeout(session.timeout);
  activeGames.delete(chatId);
  return session;
}

module.exports = {
  hasActive(chatId) {
    return activeGames.has(chatId);
  },

  async start(sock, chatId, gameType) {
    const bank = questionBanks[gameType];
    if (!bank?.length) {
      throw new Error(`Question bank is unavailable for ${gameType}`);
    }
    if (activeGames.has(chatId)) {
      return sock.sendMessage(chatId, { text: '⚠️ Kuis masih aktif di chat ini. Jawab soal yang sedang berjalan atau ketik `.nyerah`.' });
    }

    const item = bank[Math.floor(Math.random() * bank.length)];
    const session = { gameType, item, timeout: null };
    session.timeout = setTimeout(async () => {
      if (activeGames.get(chatId) !== session) return;
      activeGames.delete(chatId);
      try {
        await sock.sendMessage(chatId, { text: `⏰ Waktu ${gameType} habis. Jawabannya: *${item.answer}*` });
      } catch (error) {
        console.error(`[${gameType.toUpperCase()}-TIMEOUT]`, error.message);
      }
    }, GAME_DURATION_MS);
    session.timeout.unref?.();
    activeGames.set(chatId, session);

    const prompt = gameType === 'susunkata'
      ? `🔀 *SUSUN KATA*\n\nSusun huruf: *${item.question}*\nKategori: ${item.type || 'Umum'}`
      : `🧠 *ASAH OTAK*\n\n${item.question}`;
    return sock.sendMessage(chatId, {
      text: `${prompt}\n\nKetik jawabannya langsung di chat. Hadiah: +400 koin dan +40 XP. Waktu: 90 detik. Ketik \`.nyerah\` untuk berhenti.`
    });
  },

  async checkAnswer(sock, chatId, senderId, text) {
    const session = activeGames.get(chatId);
    if (!session || normalizeAnswer(text) !== normalizeAnswer(session.item.answer)) return false;

    clearSession(chatId);
    const user = db.getUser(senderId);
    user.coins += 400;
    user.xp += 40;
    db.updateUser(senderId, user);
    db.incrementStat('totalGamesPlayed');
    await sock.sendMessage(chatId, {
      text: `✅ @${senderId.split('@')[0]} menjawab dengan benar: *${session.item.answer}*\n💰 +400 koin | ⚡ +40 XP`,
      mentions: [senderId]
    });
    return true;
  },

  async cancel(sock, chatId) {
    const session = clearSession(chatId);
    if (!session) return null;
    await sock.sendMessage(chatId, {
      text: `🏳️ Kuis ${session.gameType} dihentikan. Jawabannya: *${session.item.answer}*`
    });
    return true;
  }
};
