const axios = require('axios');
const https = require('https');
const animeService = require('../services/animeService');
const db = require('../database/db');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const ACTION_MESSAGES = {
  hug: (s, t) => `🤗 *[ANIME HUG]*\n@${s} memeluk hangat @${t} dengan penuh kasih sayang!`,
  pat: (s, t) => `🐱 *[HEADPAT]*\n@${s} mengelus lembut kepala @${t}! Lucu banget!`,
  kiss: (s, t) => `💋 *[ANIME KISS]*\n@${s} mencium manis pipi @${t}! Bikin baper!`,
  slap: (s, t) => `👋 *[ANIME SLAP]*\nPLAKK! @${s} menampar keras @${t}! Jangan nakal lagi ya!`,
  punch: (s, t) => `👊 *[CYBER PUNCH]*\nBUKK! @${s} melayangkan pukulan tinju ke arah @${t}!`,
  poke: (s, t) => `👉 *[ANIME POKE]*\nColek colek! @${s} mencolek @${t} yang lagi melamun.`,
  cry: (s) => `😭 *[ANIME CRY]*\n@${s} sedang menangis tersedu-sedu... Butuh pelukan dan penghiburan!`,
  smile: (s) => `✨ *[ANIME SMILE]*\n@${s} tersenyum manis penuh semangat hari ini!`,
  dance: (s) => `💃 *[ANIME DANCE]*\n@${s} asik menari gembira mengikuti irama musik cyber!`,
  wink: (s) => `😉 *[ANIME WINK]*\n@${s} mengedipkan mata menggoda dengan penuh pesona!`
};

module.exports = {
  async handleAction(sock, chatId, senderId, actionType, targetJid, msg) {
    const sId = senderId.split('@')[0];
    const tId = targetJid ? targetJid.split('@')[0] : 'semua orang';
    const mentions = targetJid ? [senderId, targetJid] : [senderId];

    let imageUrl = null;
    try {
      const res = await axios.get(`https://nekos.best/api/v2/${actionType}`, {
        httpsAgent,
        timeout: 3500
      });
      imageUrl = res.data?.results?.[0]?.url;
    } catch (e) {
      imageUrl = await animeService.getRandomAnimeImage();
    }

    const captionGen = ACTION_MESSAGES[actionType] || ((s, t) => `✨ @${s} berinteraksi dengan @${t}!`);
    const caption = captionGen(sId, tId);

    try {
      return await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption,
        mentions
      }, { quoted: msg });
    } catch (e) {
      return await sock.sendMessage(chatId, { text: caption, mentions }, { quoted: msg });
    }
  },

  async handleCharacter(sock, chatId, category, msg) {
    let imageUrl = null;
    let title = category.toUpperCase();

    try {
      const res = await axios.get(`https://nekos.best/api/v2/${category}`, {
        httpsAgent,
        timeout: 3500
      });
      imageUrl = res.data?.results?.[0]?.url;
      const animeName = res.data?.results?.[0]?.anime_name || 'Anime Masterpiece';
      title = `${category.toUpperCase()} • ${animeName}`;
    } catch (e) {
      imageUrl = await animeService.getRandomAnimeImage();
    }

    const caption = `
🌸 *[ANIME GALLERY: ${title}]* 🌸
═════════════════════════════════════
✨ Koleksi visual anime pilihan terbaik!
═════════════════════════════════════
_Ketik .${category} untuk melihat gambar lainnya._
    `.trim();

    try {
      return await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption
      }, { quoted: msg });
    } catch (err) {
      return animeService.sendAnimeReply(sock, chatId, caption, msg);
    }
  }
};
