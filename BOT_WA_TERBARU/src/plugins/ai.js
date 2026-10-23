const aiService = require('../services/aiService');
const db = require('../database/db');

module.exports = {
  // === 1. TANYA JAWAB AI (CHATGPT / GEMINI) ===
  async handleChatAI(sock, chatId, senderId, question) {
    if (!question || !question.trim()) {
      return sock.sendMessage(chatId, {
        text: `🤖 *[RANZZXITER AI ASSISTANT]* 🤖\n\nKetik pertanyaan atau permintaanmu setelah perintah:\nContoh: \`.ai Jelaskan cara kerja kecerdasan buatan dalam bahasa sederhana\``
      });
    }

    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const response = await aiService.askAI(question.trim(), senderId);
      const formatted = `🤖 *[RANZZXITER AI]* 🤖\n\n${response}\n\n_⚡ Respon dihasilkan oleh modul AI_`;
      return sock.sendMessage(chatId, { text: formatted });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Maaf, terjadi gangguan saat memproses query AI: ${err.message}`
      });
    }
  },

  // === 2. AI IMAGE GENERATOR (TEKS KE GAMBAR) ===
  async handleImageAI(sock, chatId, senderId, prompt) {
    if (!prompt || !prompt.trim()) {
      return sock.sendMessage(chatId, {
        text: `🎨 *[AI IMAGE ARCHITECT]* 🎨\n\nFormat: \`.img <deskripsi gambar>\`\nContoh: \`.img gadis anime cyberpunk berambut biru di kota masa depan\``
      });
    }

    try {
      await sock.sendMessage(chatId, {
        text: `🎨 *[MEMPROSES GAMBAR]*\nSedang mengenerate visual AI untuk: "${prompt}"... Mohon tunggu sejenak.`
      });

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=800&height=800&nologo=true`;

      return await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: `✨ *[CYBER AI ART GENERATED]*\n\n📝 *Prompt*: "${prompt.trim()}"\n⚡ Dibuat dengan kecerdasan visual AI.`
      });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ Gagal menghasilkan gambar AI: ${err.message}`
      });
    }
  },

  // === 3. GENERATOR & DEBUGGER KODE ===
  async handleCodeAI(sock, chatId, senderId, args) {
    if (args.length < 2) {
      return sock.sendMessage(chatId, {
        text: `💻 *[CYBER CODE ARCHITECT]* 💻\n\nFormat: \`.code <bahasa> <deskripsi tugas kode>\`\n\nContoh:\n\`.code python Buat script scraping data cuaca dengan requests dan BeautifulSoup\``
      });
    }

    const language = args[0];
    const task = args.slice(1).join(' ');
    const codePrompt = `Tuliskan kode program dalam bahasa ${language} yang bersih, modern, dan lengkap dengan komentar untuk tugas berikut: ${task}. Sertakan penjelasan singkat cara menjalankannya.`;

    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const codeOutput = await aiService.askAI(codePrompt, senderId, 'Kamu adalah Software Architect & Senior Developer kelas dunia. Berikan kode yang efisien, tanpa error, dan berikan penjelasan singkat.');
      return sock.sendMessage(chatId, {
        text: `💻 *[CODE RESULT: ${language.toUpperCase()}]*\n\n${codeOutput}`
      });
    } catch (err) {
      return sock.sendMessage(chatId, { text: `❌ Gagal menghasilkan kode: ${err.message}` });
    }
  },

  // === 4. RINGKASAN TEKS OTOMATIS ===
  async handleSummarize(sock, chatId, senderId, text) {
    if (!text || text.trim().length < 20) {
      return sock.sendMessage(chatId, {
        text: `📝 *Format:* \`.summarize <teks/artikel panjang yang ingin diringkas>\``
      });
    }

    const prompt = `Tolong ringkas teks berikut menjadi beberapa poin utama yang padat, jelas, dan mudah dipahami:\n\n${text}`;
    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const summary = await aiService.askAI(prompt, senderId, 'Kamu adalah ahli perangkum dokumen dan analis teks profesional.');
      return sock.sendMessage(chatId, { text: `📑 *[RINGKASAN EKSEKUTIF]*\n\n${summary}` });
    } catch (err) {
      return sock.sendMessage(chatId, { text: `❌ Gagal meringkas teks: ${err.message}` });
    }
  },

  // === 5. PENERJEMAH BAHASA ===
  async handleTranslate(sock, chatId, senderId, args) {
    if (args.length < 2) {
      return sock.sendMessage(chatId, {
        text: `🌐 *Format:* \`.translate <bahasa target> <kalimat>\`\nContoh: \`.translate jepang Selamat pagi, semoga harimu menyenangkan\``
      });
    }

    const targetLang = args[0];
    const sourceText = args.slice(1).join(' ');
    const prompt = `Terjemahkan kalimat berikut ke dalam bahasa ${targetLang} secara natural, akurat, dan sopan:\n"${sourceText}"`;

    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const translated = await aiService.askAI(prompt, senderId, 'Kamu adalah penerjemah multi-bahasa profesional.');
      return sock.sendMessage(chatId, { text: `🌐 *[TERJEMAHAN -> ${targetLang.toUpperCase()}]*\n\n${translated}` });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Gagal menerjemahkan: ${e.message}` });
    }
  },

  // === 6. MODE AUTO-AI SAKLAR ===
  async toggleAIMode(sock, chatId, state, isGroup) {
    if (isGroup) {
      const group = db.getGroup(chatId);
      if (state === 'on') {
        group.autoAi = true;
        db.updateGroup(chatId, group);
        return sock.sendMessage(chatId, {
          text: `🤖 *[AUTO-AI GROUP ACTIVATED]*\n\nRANZZXITER AI sekarang akan aktif menjawab obrolan di grup ini secara otomatis!`
        });
      } else if (state === 'off') {
        group.autoAi = false;
        db.updateGroup(chatId, group);
        return sock.sendMessage(chatId, {
          text: `🤖 *[AUTO-AI GROUP DEACTIVATED]*\n\nAuto AI di grup dimatikan.`
        });
      }
    } else {
      if (state === 'on') {
        db.updateSettings({ autoAiPrivate: true });
        return sock.sendMessage(chatId, { text: `🤖 *[AUTO-AI PRIVATE ACTIVATED]*\n\nRANZZXITER AI akan otomatis membalas semua pesan pribadi!` });
      } else if (state === 'off') {
        db.updateSettings({ autoAiPrivate: false });
        return sock.sendMessage(chatId, { text: `🤖 *[AUTO-AI PRIVATE DEACTIVATED]*\n\nAuto AI di chat pribadi dimatikan.` });
      }
    }

    return sock.sendMessage(chatId, { text: `💡 *Format:* \`.modeai on\` atau \`.modeai off\`` });
  },

  // === 7. RESET MEMORI CHAT ===
  clearMemory(sock, chatId, senderId) {
    aiService.clearHistory(senderId);
    return sock.sendMessage(chatId, {
      text: `🧹 *[QUANTUM CACHE PURGED]*\n\nMemori konteks percakapan AI denganmu telah di-reset bersih!`
    });
  }
};
