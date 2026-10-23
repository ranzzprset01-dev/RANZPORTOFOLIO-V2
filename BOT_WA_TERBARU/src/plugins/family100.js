const db = require('../database/db');
const questionBank = require('../data/imported-games/family100.json')
  .filter(item => typeof item.soal === 'string' && Array.isArray(item.jawaban) && item.jawaban.length > 0)
  .map(item => ({
    question: item.soal,
    answers: [...new Map(
      item.jawaban
        .filter(answer => typeof answer === 'string' && normalizeAnswer(answer))
        .map(answer => [normalizeAnswer(answer), answer])
    ).values()]
  }))
  .filter(item => item.answers.length > 0);

const activeGames = new Map();
const GAME_DURATION_MS = 2 * 60 * 1000;
const ANSWER_REWARD = 250;

function normalizeAnswer(text) {
  return String(text || '')
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

function formatAnswers(session, reveal = false) {
  return session.question.answers.map((answer, index) => {
    const found = session.found.get(index);
    return `${found ? '✅' : reveal ? '▫️' : '⬜'} ${found ? answer : reveal ? answer : '???'}`;
  }).join('\n');
}

module.exports = {
  hasActive(chatId) {
    return activeGames.has(chatId);
  },

  async start(sock, chatId) {
    if (activeGames.has(chatId)) {
      return sock.sendMessage(chatId, {
        text: '🎮 Family 100 masih berjalan di chat ini. Jawab dengan salah satu jawaban atau ketik `.family100 stop`.'
      });
    }

    const question = questionBank[Math.floor(Math.random() * questionBank.length)];
    const session = { question, found: new Map(), timeout: null };
    session.timeout = setTimeout(async () => {
      if (activeGames.get(chatId) !== session) return;
      activeGames.delete(chatId);
      try {
        await sock.sendMessage(chatId, {
          text: `⏰ Waktu Family 100 habis!\n\n${formatAnswers(session, true)}`
        });
      } catch (error) {
        console.error('[FAMILY100-TIMEOUT]', error.message);
      }
    }, GAME_DURATION_MS);
    session.timeout.unref?.();
    activeGames.set(chatId, session);

    return sock.sendMessage(chatId, {
      text: `🎯 *FAMILY 100*\n\n${question.question}\n\n${formatAnswers(session)}\n\nJawab langsung di chat. Setiap jawaban benar mendapat ${ANSWER_REWARD} koin. Waktu: 2 menit.`
    });
  },

  async checkAnswer(sock, chatId, senderId, text) {
    const session = activeGames.get(chatId);
    if (!session) return false;

    const answer = normalizeAnswer(text);
    if (!answer) return false;

    const answerIndex = session.question.answers.findIndex(item => normalizeAnswer(item) === answer);
    if (answerIndex === -1 || session.found.has(answerIndex)) return false;

    session.found.set(answerIndex, senderId);
    const user = db.getUser(senderId);
    user.coins += ANSWER_REWARD;
    user.xp += 25;
    db.updateUser(senderId, user);
    db.incrementStat('totalGamesPlayed');

    const isComplete = session.found.size === session.question.answers.length;
    if (isComplete) clearSession(chatId);

    await sock.sendMessage(chatId, {
      text: `✅ @${senderId.split('@')[0]} menemukan jawaban: *${session.question.answers[answerIndex]}*\n💰 +${ANSWER_REWARD} koin | ⚡ +25 XP\n\n${formatAnswers(session)}${isComplete ? '\n\n🏆 Semua jawaban ditemukan! Ketik `.family100` untuk main lagi.' : ''}`,
      mentions: [senderId]
    });
    return true;
  },

  async stop(sock, chatId) {
    const session = clearSession(chatId);
    if (!session) {
      return sock.sendMessage(chatId, { text: 'Tidak ada sesi Family 100 yang sedang berjalan.' });
    }
    return sock.sendMessage(chatId, {
      text: `Family 100 dihentikan.\n\n${formatAnswers(session, true)}`
    });
  }
};
