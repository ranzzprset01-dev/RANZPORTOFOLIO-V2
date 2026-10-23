const aiService = require('../services/aiService');

module.exports = {
  // 1. AI VOICE (JAWABAN DALAM BENTUK VOICE NOTE AUDIO)
  async handleAIVoice(sock, chatId, senderId, question) {
    if (!question) {
      return sock.sendMessage(chatId, { text: `🎙️ *Format:* \`.ai-voice <pertanyaan>\`` });
    }

    try {
      await sock.sendPresenceUpdate('recording', chatId);
      const answer = await aiService.askAI(question, senderId, 'Jawab dengan singkat, padat, dan ramah dalam 2 kalimat bahasa Indonesia.');
      
      const encoded = encodeURIComponent(answer.substring(0, 200));
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=id&client=tw-ob`;

      await sock.sendMessage(chatId, {
        audio: { url: ttsUrl },
        mimetype: 'audio/mp4',
        ptt: true
      });

      return sock.sendMessage(chatId, {
        text: `🤖 *[RANZZXITER AI VOICE TRANSCRIPT]*\n\n"${answer}"`
      });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Gagal menghasilkan respon audio.` });
    }
  },

  // 2. PROMPT ENHANCER
  async enhancePrompt(sock, chatId, senderId, idea) {
    if (!idea) return sock.sendMessage(chatId, { text: `💡 Format: \`.prompt <ide mentah>\`` });
    const prompt = `Tolong kembangkan ide mentah berikut menjadi sebuah AI Image Prompt profesional (dalam bahasa Inggris), hyper-detailed, 8k resolution, cinematic lighting:\n"${idea}"`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah Prompt Engineering Specialist kelas dunia.');
    return sock.sendMessage(chatId, {
      text: `✨ *[ENHANCED AI PROMPT]* ✨\n\n${res}\n\n_Salin prompt di atas ke Midjourney / DALL-E / .img_`
    });
  },

  // 3. PUISI / LIRIK CYBER
  async generatePoem(sock, chatId, senderId, theme) {
    if (!theme) return sock.sendMessage(chatId, { text: `💡 Format: \`.poem <tema>\`` });
    const prompt = `Tuliskan sebuah puisi indah bertema ${theme} dengan sentuhan estetika masa depan/cyberpunk.`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah pujangga dan penyair terhebat abad 21.');
    return sock.sendMessage(chatId, { text: `📜 *[CYBER POEM]*\n\n${res}` });
  },

  // 4. ROASTING PEDAS CERDAS
  async roastUser(sock, chatId, senderId, target) {
    const who = target || 'orang yang lagi baca ini';
    const prompt = `Lakukan roasting komedi cerdas, pedas tapi lucu dan jangan terlalu kasar untuk: ${who}.`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah Stand-up Comedian roasting juara dunia.');
    return sock.sendMessage(chatId, { text: `🔥 *[RANZZXITER ROASTING ARENA]* 🔥\n\n${res}` });
  },

  // 5. PUJIAN & GOMBALAN CYBER
  async praiseUser(sock, chatId, senderId, target) {
    const who = target || 'orang spesial ini';
    const prompt = `Berikan pujian gombalan manis bercampur analogi teknologi masa depan untuk: ${who}.`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah asisten romantis dan penuh kehangatan.');
    return sock.sendMessage(chatId, { text: `💖 *[QUANTUM COMPLIMENT]* 💖\n\n${res}` });
  },

  // 6. SHORT STORY GENERATOR
  async generateStory(sock, chatId, senderId, theme) {
    if (!theme) return sock.sendMessage(chatId, { text: `💡 Format: \`.story <tema>\`` });
    const prompt = `Tuliskan sebuah cerita pendek fiksi menarik dan penuh plot twist tentang: ${theme}. Panjang sekitar 3 paragraf.`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah novelis fiksi bestseller.');
    return sock.sendMessage(chatId, { text: `📖 *[RANZZXITER CHRONICLES: ${theme.toUpperCase()}]*\n\n${res}` });
  },

  // 7. GRAMMAR CHECKER
  async checkGrammar(sock, chatId, senderId, sentence) {
    if (!sentence) return sock.sendMessage(chatId, { text: `💡 Format: \`.grammar <kalimat>\`` });
    const prompt = `Periksa tata bahasa dan ejaan kalimat berikut, tunjukkan kesalahannya dan berikan versi yang benar serta penjelasannya:\n"${sentence}"`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah ahli linguistik dan tata bahasa profesional.');
    return sock.sendMessage(chatId, { text: `📝 *[GRAMMAR AUDIT REPORT]*\n\n${res}` });
  },

  // 8. EXPLAIN LIKE I'M 5
  async explainConcept(sock, chatId, senderId, concept) {
    if (!concept) return sock.sendMessage(chatId, { text: `💡 Format: \`.explain <konsep>\`` });
    const prompt = `Jelaskan konsep berikut seolah-olah kamu menjelaskannya kepada anak berusia 5 tahun, gunakan perumpamaan sederhana:\n"${concept}"`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah guru sains anak yang sangat ramah.');
    return sock.sendMessage(chatId, { text: `🧒 *[ELI5: PENJELASAN SEDERHANA]*\n\n${res}` });
  },

  // 9. REGEX HELPER
  async generateRegex(sock, chatId, senderId, req) {
    if (!req) return sock.sendMessage(chatId, { text: `💡 Format: \`.regex <kebutuhan validasi>\`\nContoh: \`.regex validasi email dan nomor telepon\`` });
    const prompt = `Buatkan pola Regular Expression (Regex) untuk: ${req}. Berikan pola kode dan contoh penggunaannya.`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah Senior Software Engineer.');
    return sock.sendMessage(chatId, { text: `🔍 *[REGEX ARCHITECT]*\n\n${res}` });
  },

  // 10. MATH SOLVER
  async solveMath(sock, chatId, senderId, problem) {
    if (!problem) return sock.sendMessage(chatId, { text: `💡 Format: \`.mathsolve <soal cerita atau matematika>\`` });
    const prompt = `Selesaikan soal matematika berikut langkah demi langkah secara jelas hingga didapat jawaban akhir:\n"${problem}"`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah profesor matematika.');
    return sock.sendMessage(chatId, { text: `📐 *[STEP-BY-STEP MATH SOLUTION]*\n\n${res}` });
  },

  // 11. VISION AI (ANALISIS GAMBAR DENGAN GEMINI MULTIMODAL)
  async handleVisionAI(sock, chatId, senderId, msg, query) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const current = msg.message;
    const imgObj = quoted?.imageMessage || current?.imageMessage;

    if (!imgObj) {
      return sock.sendMessage(chatId, {
        text: `📸 *[QUANTUM VISION AI]*\nKirim atau balas (quote) sebuah foto dengan perintah:\n\`.askimg <pertanyaanmu>\` atau \`.aiimg\`\n\nContoh: Balas foto makanan dengan \`.askimg berapa kalori makanan ini?\``
      }, { quoted: msg });
    }

    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const mediaTools = require('./mediaTools');
      const buffer = await mediaTools.downloadMedia(imgObj, 'image');
      const userPrompt = query && query.trim().length > 0 ? query.trim() : 'Jelaskan gambar ini secara detail, informatif, dan sebutkan objek-objek penting di dalamnya.';

      await sock.sendMessage(chatId, { text: '🧠 Sedang memindai & menganalisis gambar menggunakan Gemini Vision...' }, { quoted: msg });
      const analysis = await aiService.askImageAI(buffer, imgObj.mimetype || 'image/jpeg', userPrompt, senderId);

      const reply = `
👁️ *[RANZZXITER VISION MULTIMODAL]* 👁️
═════════════════════════════════════
❓ *Pertanyaan*: "${userPrompt}"
═════════════════════════════════════
${analysis}
═════════════════════════════════════
_Didukung oleh Gemini 2026 Multimodal Processing_
`.trim();

      return await sock.sendMessage(chatId, { text: reply }, { quoted: msg });
    } catch (err) {
      return sock.sendMessage(chatId, { text: `❌ Gagal memproses gambar: ${err.message}` }, { quoted: msg });
    }
  },

  // 12. DEEP REASONING AI (CHAIN OF THOUGHT)
  async handleDeepReasoning(sock, chatId, senderId, query) {
    if (!query) {
      return sock.sendMessage(chatId, {
        text: `🧠 *Format:* \`.think <pertanyaan kompleks>\` atau \`.deepseek <topik>\``
      });
    }

    await sock.sendPresenceUpdate('composing', chatId);
    const reasoning = await aiService.askDeepReasoning(query, senderId);
    return sock.sendMessage(chatId, {
      text: `
🧠 *[RANZZXITER DEEP REASONING]* 🧠
═════════════════════════════════════
${reasoning}
═════════════════════════════════════
`.trim()
    });
  },

  // 13. ANIME PROMPT GENERATOR
  async handleAnimePrompt(sock, chatId, senderId, idea) {
    if (!idea) {
      return sock.sendMessage(chatId, { text: `🎨 *Format:* \`.animeprompt <ide karakter/scene>\`` });
    }

    const prompt = `Buatkan AI Image Prompt bertema Anime Masterpiece untuk: "${idea}". 
Sertakan tags seperti: masterpiece, best quality, ultra-detailed, anime aesthetic, dynamic angle, vibrant colors, 8k resolution. Tuliskan dalam bahasa Inggris.`;
    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah Anime Art Director & AI Prompt Specialist.');

    return sock.sendMessage(chatId, {
      text: `
🎨 *[ANIME ART MASTERPIECE PROMPT]* 🎨
═════════════════════════════════════
${res}
═════════════════════════════════════
_Gunakan prompt di atas pada \`.img <prompt>\` untuk langsung menghasilkan gambar!_
`.trim()
    });
  },

  // 14. CODE AUDITOR & SECURITY REVIEWER
  async handleCodeAudit(sock, chatId, senderId, code) {
    if (!code) {
      return sock.sendMessage(chatId, { text: `💻 *Format:* \`.audit <kode program>\`` });
    }

    const prompt = `Lakukan audit komprehensif terhadap kode berikut:
1. Temukan potensi bug atau vulnerability keamanan.
2. Analisis kompleksitas waktu & memori.
3. Berikan saran perbaikan dan versi kode optimalnya.
Kode:
\`\`\`
${code}
\`\`\``;

    const res = await aiService.askAI(prompt, senderId, 'Kamu adalah Principal Security Architect & Lead Code Reviewer.');
    return sock.sendMessage(chatId, {
      text: `
🛡️ *[CYBER CODE AUDIT & SECURITY REPORT]* 🛡️
═════════════════════════════════════
${res}
═════════════════════════════════════
`.trim()
    });
  }
};
