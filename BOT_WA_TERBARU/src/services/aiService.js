const https = require('https');
const axios = require('axios');
const db = require('../database/db');
const config = require('../config');

// Bypass TLS cert expiration issues due to Windows 2026 date
const sslAgent = new https.Agent({ rejectUnauthorized: false });

class AIService {
  constructor() {
    this.history = new Map(); // senderId -> array of { role, content }
  }

  getHistory(senderId) {
    if (!this.history.has(senderId)) {
      this.history.set(senderId, []);
    }
    return this.history.get(senderId);
  }

  clearHistory(senderId) {
    this.history.delete(senderId);
  }

  appendHistory(senderId, role, content) {
    const list = this.getHistory(senderId);
    list.push({ role, content });
    if (list.length > 8) {
      list.shift();
    }
  }

  async askAI(prompt, senderId = 'user', customSystemPrompt = null) {
    const settings = db.getSettings();
    const openaiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
    const geminiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
    const systemPrompt = customSystemPrompt || settings.aiSystemPrompt || config.AI_SYSTEM_PROMPT;

    // 1. Google Gemini 2026 Quantum Flash Engine (Tercepat & Paling Akurat)
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const geminiReply = await this.callGemini(prompt, senderId, systemPrompt, geminiKey);
        if (geminiReply) {
          db.incrementStat('totalAiQueries');
          return geminiReply;
        }
      } catch (err) {
        console.warn('[AI-SERVICE] Gemini error:', err.message);
      }
    }

    // 2. OpenAI GPT-4o mini jika dikonfigurasi
    if (openaiKey && openaiKey.trim().length > 10) {
      try {
        const openaiReply = await this.callOpenAI(prompt, senderId, systemPrompt, openaiKey, settings.openaiModel || 'gpt-4o-mini');
        if (openaiReply) {
          db.incrementStat('totalAiQueries');
          return openaiReply;
        }
      } catch (err) {
        console.warn('[AI-SERVICE] OpenAI error:', err.message);
      }
    }

    // 3. Fallback: Fast Free Cloud AI
    try {
      const freeReply = await this.callFastFreeAI(prompt, senderId, systemPrompt);
      if (freeReply) {
        db.incrementStat('totalAiQueries');
        return freeReply;
      }
    } catch (err) {
      console.warn('[AI-SERVICE] Free AI error:', err.message);
    }

    // 4. Fallback Terakhir: Smart Local Cyber Brain
    db.incrementStat('totalAiQueries');
    return this.localCyberBrain(prompt);
  }

  async callGemini(prompt, senderId, systemPrompt, apiKey) {
    const history = this.getHistory(senderId);
    
    // Model Gemini versi 2026 yang aktif & terverifikasi
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-flash-lite'
    ];
    
    const contents = [
      {
        role: 'user',
        parts: [{ text: `System Instruction: ${systemPrompt}` }]
      },
      ...history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          { contents },
          { 
            headers: { 'Content-Type': 'application/json' },
            httpsAgent: sslAgent,
            timeout: 7000
          }
        );

        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          this.appendHistory(senderId, 'user', prompt);
          this.appendHistory(senderId, 'assistant', reply);
          return reply;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  // 5. FITUR GEMINI VISION MULTIMODAL (ANALISIS GAMBAR DENGAN AI)
  async askImageAI(imageBuffer, mimeType, prompt = 'Jelaskan gambar ini secara detail dan informatif', senderId = 'user') {
    const settings = db.getSettings();
    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return '⚠️ Kunci API Gemini belum dikonfigurasi.';

    const base64Data = imageBuffer.toString('base64');
    const model = 'gemini-flash-lite-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: mimeType || 'image/jpeg',
            data: base64Data
          }
        }
      ]
    }];

    try {
      const response = await axios.post(
        url,
        { contents },
        {
          headers: { 'Content-Type': 'application/json' },
          httpsAgent: sslAgent,
          timeout: 10000
        }
      );

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return reply || '⚠️ AI tidak dapat mengekstrak informasi dari gambar ini.';
    } catch (err) {
      console.error('[GEMINI-VISION-ERROR]', err.message);
      return `❌ Gagal menganalisis gambar: ${err.message}`;
    }
  }

  // 6. FITUR DEEP REASONING AI (CHAIN OF THOUGHT)
  async askDeepReasoning(prompt, senderId = 'user') {
    const reasoningSystemPrompt = `Kamu adalah ${config.BOT_NAME} REASONER, sistem penalaran AI tingkat tinggi.
Gunakan metode analitis langkah demi langkah (Step-by-step Chain of Thought):
1. [ANALISIS INTENSI & MASALAH]
2. [EKSPLORASI LOGIKA & PENALARAN]
3. [KESIMPULAN & REKOMENDASI TERBAIK]
Format jawaban dengan sangat rapi, ilmiah, dan elegan.`;

    return await this.askAI(prompt, senderId, reasoningSystemPrompt);
  }

  async callOpenAI(prompt, senderId, systemPrompt, apiKey, model = 'gpt-4o-mini') {
    const history = this.getHistory(senderId);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: prompt }
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: sslAgent,
        timeout: 7000
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (reply) {
      this.appendHistory(senderId, 'user', prompt);
      this.appendHistory(senderId, 'assistant', reply);
      return reply;
    }
    return null;
  }

  async callFastFreeAI(prompt, senderId, systemPrompt) {
    const cleanPrompt = prompt.substring(0, 300);
    const url = `https://text.pollinations.ai/${encodeURIComponent(cleanPrompt)}?model=openai-fast`;
    const res = await axios.get(url, { httpsAgent: sslAgent, timeout: 6000 });
    if (res.data && typeof res.data === 'string' && res.data.trim().length > 0) {
      const reply = res.data.trim();
      this.appendHistory(senderId, 'user', prompt);
      this.appendHistory(senderId, 'assistant', reply);
      return reply;
    }
    return null;
  }

  localCyberBrain(prompt) {
    const lower = prompt.toLowerCase();

    if (lower.includes('halo') || lower.includes('hai') || lower.includes('hi') || lower.includes('pagi') || lower.includes('siang') || lower.includes('malam')) {
      return `⚡ *[${config.BOT_NAME} AI]* ⚡\n\nHalo! Saya **${config.BOT_NAME}**, asisten AI Anda. Saya siap membantu pertanyaan, tugas, coding, dan fitur bot.\n\n💡 Ketik *.menu* untuk membuka menu interaktif!`;
    }

    if (lower.includes('siapa kamu') || lower.includes('tentang kamu') || lower.includes('bot apa') || lower.includes('nama kamu')) {
      return `🤖 *[${config.BOT_NAME} AI]*\n\nSaya adalah asisten AI ${config.BOT_NAME} dengan fitur analisis, permainan, media, dan utilitas produktivitas.`;
    }

    if (lower.includes('menu') || lower.includes('bantuan') || lower.includes('help') || lower.includes('fitur')) {
      return '📋 *[MENU FITUR]*\n\nKetik *.menu* untuk membuka kategori interaktif dan memilih fitur melalui tombol.';
    }

    if (lower.includes('terima kasih') || lower.includes('makasih') || lower.includes('thanks')) {
      return '✨ Sama-sama! Senang bisa membantu Anda. Jika butuh bantuan lain, langsung tanyakan saja!';
    }

    return `⚡ *[${config.BOT_NAME} AI]* ⚡\n\nPesan Anda telah diproses:\n> "${prompt}"\n\n💡 Buka *.menu* untuk memilih fitur dari tombol interaktif.`;
  }
}

module.exports = new AIService();
