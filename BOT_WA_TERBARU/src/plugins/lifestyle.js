const axios = require('axios');

module.exports = {
  // 1. QURAN AYAT & TERJEMAHAN
  async getQuran(sock, chatId, query) {
    if (!query || !query.includes(':')) {
      return sock.sendMessage(chatId, {
        text: `💡 *Format:* \`.quran <nomor_surah:nomor_ayat>\`\nContoh: \`.quran 1:1\` (Al-Fatihah ayat 1)`
      });
    }

    const [surah, ayat] = query.split(':').map(s => s.trim());
    try {
      const res = await axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/id.indonesian`, { timeout: 8000 });
      const arRes = await axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/ar.alafasy`, { timeout: 8000 });

      const d = res.data.data;
      const ar = arRes.data.data;

      const text = `
📖 *[AL-QUR'ANUL KARIM]* 📖
══════════════════════════
Surah: *${d.surah.englishName}* (${d.surah.name}) | Ayat: *${d.numberInSurah}*

${ar.text}

📌 *Terjemahan*:
"${d.text}"
══════════════════════════
`;
      return sock.sendMessage(chatId, { text: text.trim() });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Ayat Al-Quran tidak ditemukan. Pastikan format: \`.quran 2:255\`` });
    }
  },

  // 2. ASMAUL HUSNA
  async getAsmaulHusna(sock, chatId) {
    try {
      const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/scraper/master/data/asmaulhusna.json', { timeout: 6000 });
      const list = res.data;
      const picked = list[Math.floor(Math.random() * list.length)];
      return sock.sendMessage(chatId, {
        text: `
✨ *[ASMAUL HUSNA]* ✨
══════════════════════════
Urutan Ke: *#${picked.index}*
Arab: *${picked.arabic}*
Latin: *${picked.latin}*
Arti: *${picked.translation_id}*
══════════════════════════
`
      });
    } catch (e) {
      return sock.sendMessage(chatId, {
        text: `✨ *[ASMAUL HUSNA]*\n\n1. Ar-Rahman (الرحمن) : Maha Pengasih\n2. Ar-Rahim (الرحيم) : Maha Penyayang\n3. Al-Malik (الملك) : Maha Merajai`
      });
    }
  },

  // 3. DOA HARIAN
  async getDoa(sock, chatId, query) {
    try {
      const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/scraper/master/data/doa.json', { timeout: 6000 });
      const doas = res.data;
      let picked = null;
      if (query) {
        picked = doas.find(d => d.title.toLowerCase().includes(query.toLowerCase()));
      }
      if (!picked) {
        picked = doas[Math.floor(Math.random() * doas.length)];
      }

      return sock.sendMessage(chatId, {
        text: `
🤲 *[DOA HARIAN ISLAMI]* 🤲
══════════════════════════
📌 *${picked.title}*

${picked.arabic}

_Latin_: ${picked.latin}
💡 *Artinya*: "${picked.translation}"
══════════════════════════
`
      });
    } catch (e) {
      return sock.sendMessage(chatId, {
        text: `🤲 *Doa Sebelum Belajar*: Rabbi zidni 'ilman warzuqni fahman (Ya Allah, tambahkanlah ilmuku dan berilah aku pemahaman yang baik).`
      });
    }
  },

  // 4. GEMPA BMKG TERKINI
  async getGempa(sock, chatId) {
    try {
      const res = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { timeout: 7000 });
      const g = res.data.Infogempa.gempa;
      const text = `
🌋 *[INFO GEMPA BUMI BMKG TERKINI]* 🌋
══════════════════════════
📅 Waktu: *${g.Tanggal}* (${g.Jam})
💥 Magnitudo: *${g.Magnitude} SR*
🌊 Kedalaman: *${g.Kedalaman}*
📍 Lokasi: *${g.Wilayah}*
📌 Koordinat: *${g.Coordinates}*
⚠️ Potensi: *${g.Potensi}*
══════════════════════════
`;
      const imgUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`;
      try {
        return await sock.sendMessage(chatId, {
          image: { url: imgUrl },
          caption: text.trim()
        });
      } catch (err) {
        return await sock.sendMessage(chatId, { text: text.trim() });
      }
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Gagal mengambil data gempa BMKG saat ini.` });
    }
  },

  // 5. WIKIPEDIA RINGKAS
  async getWiki(sock, chatId, query) {
    if (!query) return sock.sendMessage(chatId, { text: `💡 Format: \`.wiki <kata kunci>\`` });

    try {
      const res = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim())}`, { timeout: 7000 });
      const d = res.data;
      const text = `
📚 *[WIKIPEDIA INDONESIA]* 📚
══════════════════════════
📌 *Judul*: ${d.title}

${d.extract || 'Tidak ada ringkasan.'}

🔗 *Link Lengkap*: ${d.content_urls?.desktop?.page || ''}
══════════════════════════
`;
      if (d.thumbnail?.source) {
        return await sock.sendMessage(chatId, {
          image: { url: d.thumbnail.source },
          caption: text.trim()
        });
      }
      return sock.sendMessage(chatId, { text: text.trim() });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Artikel tidak ditemukan di Wikipedia.` });
    }
  },

  // 6. KBBI (KAMUS BESAR BAHASA INDONESIA)
  async getKBBI(sock, chatId, word) {
    if (!word) return sock.sendMessage(chatId, { text: `💡 Format: \`.kbbi <kata>\`` });

    try {
      const res = await axios.get(`https://new-kbbi-api.vercel.app/find/${encodeURIComponent(word.trim())}`, { timeout: 7000 });
      const d = res.data.data;
      let text = `📖 *[KBBI - KAMUS BESAR BAHASA INDONESIA]*\nKata: *${word.toUpperCase()}*\n\n`;

      d.entries.forEach((e, i) => {
        text += `${i + 1}. *[${e.category || 'umum'}]* ${e.meanings.join('; ')}\n`;
      });

      return sock.sendMessage(chatId, { text: text.trim() });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Kata *${word}* tidak ditemukan di KBBI.` });
    }
  },

  // 7. KURS MATA UANG
  async getKurs(sock, chatId, curr = 'USD') {
    const target = (curr || 'USD').toUpperCase();
    try {
      const res = await axios.get(`https://open.er-api.com/v6/latest/${target}`, { timeout: 7000 });
      const idr = res.data.rates.IDR;
      const text = `
💱 *[RADAR KURS MATA UANG DUNIA]* 💱
══════════════════════════
1 ${target} = *Rp ${Math.round(idr).toLocaleString('id-ID')}*

Nilai Tukar Lain:
• EUR : ${(res.data.rates.EUR || 0).toFixed(4)}
• JPY : ${(res.data.rates.JPY || 0).toFixed(2)}
• SGD : ${(res.data.rates.SGD || 0).toFixed(4)}
• SAR : ${(res.data.rates.SAR || 0).toFixed(4)}
══════════════════════════
`;
      return sock.sendMessage(chatId, { text: text.trim() });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `💱 Perkiraan Kurs: 1 USD = Rp 16.200 | 1 EUR = Rp 17.500 | 1 SGD = Rp 12.100` });
    }
  },

  // 8. RESEP MASAKAN NUSANTARA
  async getResep(sock, chatId, query) {
    if (!query) return sock.sendMessage(chatId, { text: `💡 Format: \`.resep <nama masakan>\`\nContoh: \`.resep nasi goreng\`` });

    const menuResep = {
      'nasi goreng': 'Bahan: Nasi putih, bawang merah, bawang putih, cabai, telur, kecap manis, garam, minyak. Cara: Tumis bumbu halus sampai harum, masukkan telur orak-arik, masukkan nasi, tambahkan kecap & garam, aduk rata dengan api besar sampai matang merata!',
      'rendang': 'Bahan: Daging sapi, santan kental, serai, daun jeruk, bumbu rendang halus (cabai, jahe, lengkuas, bawang). Cara: Masak daging dan bumbu bersama santan dengan api sedang, aduk terus hingga air surut dan minyak kelapa keluar berwarna cokelat gelap pekat harum.',
      'ayam kecap': 'Bahan: Ayam potong, kecap manis, bawang bombay, bawang putih, merica, mentega. Cara: Goreng ayam setengah matang, tumis bawang dengan mentega, masukkan ayam dan kecap, beri sedikit air, masak hingga kuah meresap kental.'
    };

    const match = Object.keys(menuResep).find(k => query.toLowerCase().includes(k));
    if (match) {
      return sock.sendMessage(chatId, {
        text: `🍳 *[PANDUAN RESEP: ${match.toUpperCase()}]*\n\n${menuResep[match]}`
      });
    }

    return sock.sendMessage(chatId, {
      text: `🍳 *[PANDUAN MEMASAK: ${query.toUpperCase()}]*\nBahan utama: Bumbu dasar merah/putih, bahan pokok segar, garam & penyedap. Tumis bumbu hingga wangi, masukkan bahan utama, beri air secukupnya dan masak dengan api sedang hingga bumbu meresap sempurna!`
    });
  }
};
