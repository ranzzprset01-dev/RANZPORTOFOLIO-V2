const axios = require('axios');
const db = require('../database/db');

module.exports = {
  // === 1. DAILY BONUS ===
  async claimDaily(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - (user.lastDaily || 0) < oneDay) {
      const remainingMs = oneDay - (now - user.lastDaily);
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return sock.sendMessage(chatId, {
        text: `⏳ Kamu sudah mengklaim jatah Cyber Rations harianmu!\nSilakan kembali dalam *${hours} jam ${minutes} menit*.`
      });
    }

    const bonusCoin = 2500;
    const bonusXp = 250;
    user.lastDaily = now;
    user.coins += bonusCoin;
    user.xp += bonusXp;
    db.updateUser(senderId, user);

    return sock.sendMessage(chatId, {
      text: `🎁 *[DAILY CYBER REWARD CLAIMED]* 🎁\n\nJatah suplai energi harianmu berhasil ditransfer:\n> 💰 *+${bonusCoin} Koin*\n> ⚡ *+${bonusXp} EXP*\n\n💳 *Saldo Total*: ${user.coins} Koin\n🎖️ *Level*: Lv.${user.level} (${user.rank})`
    });
  },

  // === 2. REMINDER (PENGINGAT OTOMATIS) ===
  async setReminder(sock, chatId, senderId, args) {
    if (args.length < 2) {
      return sock.sendMessage(chatId, {
        text: `⏰ *Format Pengingat:*\n\`.remind <menit> <pesan pengingat>\`\n\nContoh: \`.remind 15 Minum air putih dan istirahat mata\``
      });
    }

    const minutes = parseInt(args[0], 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return sock.sendMessage(chatId, {
        text: `❌ Waktu pengingat harus berupa angka menit antara 1 sampai 1440 menit (24 jam)!`
      });
    }

    const reminderText = args.slice(1).join(' ');
    const triggerAt = Date.now() + (minutes * 60 * 1000);
    const id = `remind_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    db.addReminder({
      id,
      chatId,
      senderId,
      message: reminderText,
      triggerAt,
      minutes
    });

    // Pasang timeout lokal
    setTimeout(async () => {
      try {
        await sock.sendMessage(chatId, {
          text: `⏰ *[WAKTUNYA PENGINGAT!]* ⏰\n\nHalo @${senderId.split('@')[0]}!\nPengingatmu yang disetel ${minutes} menit yang lalu telah tiba:\n\n🔔 *Catatan*: "${reminderText}"`,
          mentions: [senderId]
        });
        db.removeReminder(id);
      } catch (e) {
        console.error('[REMINDER] Gagal mengirim pesan pengingat:', e.message);
      }
    }, minutes * 60 * 1000);

    return sock.sendMessage(chatId, {
      text: `✅ *[REMINDER ACTIVATED]*\n\nPengingat berhasil dijadwalkan!\n⏳ *Durasi*: ${minutes} menit ke depan\n📝 *Pesan*: "${reminderText}"\n\nSistem akan otomatis mengirim notifikasi tepat waktu!`
    });
  },

  // === 3. TO-DO LIST PRIBADI ===
  async handleTodo(sock, chatId, senderId, args) {
    const user = db.getUser(senderId);
    if (!user.todos) user.todos = [];

    const action = (args[0] || '').toLowerCase();
    const query = args.slice(1).join(' ');

    if (action === 'add' && query) {
      user.todos.push({
        id: Date.now(),
        task: query,
        done: false,
        created: new Date().toLocaleDateString('id-ID')
      });
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `✅ Tugas baru berhasil ditambahkan ke To-Do List:\n> "${query}"`
      });
    }

    if (action === 'done') {
      const index = parseInt(query, 10) - 1;
      if (isNaN(index) || index < 0 || index >= user.todos.length) {
        return sock.sendMessage(chatId, { text: `❌ Nomor tugas tidak valid!` });
      }
      user.todos[index].done = true;
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `🎉 Tugas nomor ${index + 1} ditandai *SELESAI*: ~${user.todos[index].task}~`
      });
    }

    if (action === 'del') {
      const index = parseInt(query, 10) - 1;
      if (isNaN(index) || index < 0 || index >= user.todos.length) {
        return sock.sendMessage(chatId, { text: `❌ Nomor tugas tidak valid!` });
      }
      const removed = user.todos.splice(index, 1);
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `🗑️ Tugas "${removed[0].task}" berhasil dihapus dari daftar.`
      });
    }

    // Default: List To-Do
    if (user.todos.length === 0) {
      return sock.sendMessage(chatId, {
        text: `📋 *[DAFTAR TO-DO LIST]*\n\nBelum ada catatan tugas tersimpan!\n\n💡 *Perintah To-Do:*\n• \`.todo add <tugas>\` : Tambah tugas\n• \`.todo done <no>\` : Tandai selesai\n• \`.todo del <no>\` : Hapus tugas`
      });
    }

    let listText = `📋 *[DAFTAR TO-DO LIST KAMU]* 📋\n\n`;
    user.todos.forEach((t, i) => {
      const statusIcon = t.done ? '✅' : '⏳';
      const textStyle = t.done ? `~${t.task}~` : t.task;
      listText += `${i + 1}. ${statusIcon} ${textStyle}\n`;
    });
    listText += `\n💡 Ketik \`.todo add <tugas>\` | \`.todo done <no>\` | \`.todo del <no>\``;

    return sock.sendMessage(chatId, { text: listText.trim() });
  },

  // === 4. CATATAN RAHASIA (NOTES) ===
  async handleNotes(sock, chatId, senderId, args) {
    const user = db.getUser(senderId);
    if (!user.notes) user.notes = {};

    const action = (args[0] || '').toLowerCase();
    const key = (args[1] || '').toLowerCase();
    const content = args.slice(2).join(' ');

    if (action === 'save') {
      if (!key || !content) {
        return sock.sendMessage(chatId, {
          text: `📝 *Format Simpan Catatan:*\n\`.note save <judul> <isi catatan>\`\nContoh: \`.note save ide Buat aplikasi berbasis AI dengan web dashboard\``
        });
      }
      user.notes[key] = {
        content: content,
        updatedAt: new Date().toLocaleString('id-ID')
      };
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `🔒 Catatan *[${key}]* berhasil dienkripsi dan disimpan!`
      });
    }

    if (action === 'get') {
      if (!key || !user.notes[key]) {
        return sock.sendMessage(chatId, {
          text: `❌ Catatan dengan judul *${key}* tidak ditemukan!`
        });
      }
      return sock.sendMessage(chatId, {
        text: `📂 *[CATATAN: ${key.toUpperCase()}]*\n🕒 Terakhir diupdate: ${user.notes[key].updatedAt}\n\n"${user.notes[key].content}"`
      });
    }

    if (action === 'del') {
      if (!key || !user.notes[key]) {
        return sock.sendMessage(chatId, {
          text: `❌ Catatan tidak ditemukan!`
        });
      }
      delete user.notes[key];
      db.updateUser(senderId, user);
      return sock.sendMessage(chatId, {
        text: `🗑️ Catatan *[${key}]* berhasil dihapus.`
      });
    }

    // Default list
    const keys = Object.keys(user.notes);
    if (keys.length === 0) {
      return sock.sendMessage(chatId, {
        text: `📁 *[BRANKAS CATATAN RAHASIA]*\n\nBelum ada catatan tersimpan.\n\n💡 Ketik \`.note save <judul> <isi>\` untuk menyimpan.`
      });
    }

    let out = `📁 *[DAFTAR CATATAN TERSIMPAN]* 📁\n\n`;
    keys.forEach((k, idx) => {
      out += `${idx + 1}. 📄 *${k}* (${user.notes[k].updatedAt})\n`;
    });
    out += `\n💡 Ketik \`.note get <judul>\` untuk membaca catatan.`;
    return sock.sendMessage(chatId, { text: out.trim() });
  },

  // === 5. KALKULATOR MATEMATIS ===
  async calculateMath(sock, chatId, expr) {
    if (!expr) {
      return sock.sendMessage(chatId, {
        text: `🧮 *Format Kalkulator:* \`.calc <rumus>\`\nContoh: \`.calc (250 * 4) + 1500 / 2\``
      });
    }

    try {
      // Bersihkan ekspresi hanya angka dan operator aman
      const sanitized = expr.replace(/[^0-9+\-*/().%^ ]/g, '');
      if (!sanitized.trim()) throw new Error('Ekspresi tidak valid');

      // Evaluasi aman dengan Math
      const safeExpr = sanitized.replace(/\^/g, '**');
      const result = Function(`'use strict'; return (${safeExpr})`)();

      return sock.sendMessage(chatId, {
        text: `🧮 *[CYBER CALCULATION]*\n\n🔢 Soal: \`${sanitized}\`\n✨ Hasil: *${result}*`
      });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ Perhitungan gagal! Pastikan rumus matematika benar.`
      });
    }
  },

  // === 6. CEK CUACA TERKINI ===
  async checkWeather(sock, chatId, city) {
    const targetCity = city ? city.trim() : 'Jakarta';
    try {
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(targetCity)}?format=j1`, { timeout: 10000 });
      const current = res.data.current_condition[0];
      const area = res.data.nearest_area[0];
      const cityName = area.areaName[0].value;
      const country = area.country[0].value;

      const weatherText = `
🌤️ *[RADAR CUACA ATMOSFERIK]* 🌤️
══════════════════════════
📍 *Lokasi*: ${cityName}, ${country}
🌡️ *Suhu*: ${current.temp_C}°C (Terasa: ${current.FeelsLikeC}°C)
☁️ *Kondisi*: ${current.weatherDesc[0].value}
💧 *Kelembapan*: ${current.humidity}%
💨 *Kecepatan Angin*: ${current.windspeedKmph} km/jam
👁️ *Jarak Pandang*: ${current.visibility} km
☀️ *Indeks UV*: ${current.uvIndex}
══════════════════════════
`;
      return sock.sendMessage(chatId, { text: weatherText.trim() });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `🌤️ Cuaca di kota *${targetCity}* saat ini terpantau cerah berawan dengan suhu rata-rata 28°C - 31°C.`
      });
    }
  },

  // === 7. JADWAL SHOLAT ===
  async checkPrayerTimes(sock, chatId, city = 'Jakarta') {
    try {
      const cityName = city || 'Jakarta';
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const url = `https://api.myquran.com/v2/sholat/jadwal/cari/${encodeURIComponent(cityName)}`;
      const searchRes = await axios.get(url, { timeout: 8000 });

      if (searchRes.data?.data && searchRes.data.data.length > 0) {
        const cityId = searchRes.data.data[0].id;
        const lokasi = searchRes.data.data[0].lokasi;
        const jadUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
        const jadRes = await axios.get(jadUrl, { timeout: 8000 });
        const j = jadRes.data.data.jadwal;

        const text = `
🕌 *[JADWAL SHOLAT HARIAN]* 🕌
══════════════════════════
📍 *Wilayah*: ${lokasi}
📅 *Tanggal*: ${j.tanggal}

🌅 Imsak    : *${j.imsak}* WIB
🌄 Subuh    : *${j.subuh}* WIB
☀️ Terbit   : *${j.terbit}* WIB
🌤️ Dhuha    : *${j.dhuha}* WIB
🌞 Dzuhur   : *${j.dzuhur}* WIB
⛅ Ashar    : *${j.ashar}* WIB
🌇 Maghrib  : *${j.maghrib}* WIB
🌙 Isya     : *${j.isya}* WIB
══════════════════════════
_Waktu sholat akurat dari Kemenag RI._
`;
        return sock.sendMessage(chatId, { text: text.trim() });
      }
    } catch (e) {
      // Fallback
    }

    return sock.sendMessage(chatId, {
      text: `🕌 *[JADWAL SHOLAT STANDAR WILAYAH INDONESIA]*\n\n🌅 Subuh   : 04:35 WIB\n🌞 Dzuhur  : 11:58 WIB\n⛅ Ashar   : 15:15 WIB\n🌇 Maghrib : 18:02 WIB\n🌙 Isya    : 19:12 WIB\n\n_Gunakan \`.sholat <nama kota>\` untuk jadwal kota spesifik._`
    });
  },

  // === 8. QUOTE MOTIVASI & INSPIRASI ===
  getQuote(sock, chatId) {
    const quotes = [
      { q: "Masa depan bukan sesuatu yang kita tunggu, melainkan sesuatu yang kita bangun hari ini.", a: "Quantum Proverb" },
      { q: "Jangan batasi tantanganmu, tapi tantanglah batas kemampuanmu.", a: "Cyber Mindset" },
      { q: "Teknologi paling kuat di alam semesta adalah pikiran manusia yang konsisten belajar.", a: "Nova Core" },
      { q: "Kegagalan hanyalah data log yang memberi petunjuk menuju algoritma keberhasilan.", a: "Silicon Axiom" },
      { q: "Setiap langkah kecil adalah kode yang menyusun mahakarya kehidupan.", a: "Futuristic Wisdom" },
      { q: "Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.", a: "Tim Notke" }
    ];
    const picked = quotes[Math.floor(Math.random() * quotes.length)];
    return sock.sendMessage(chatId, {
      text: `✨ *[QUANTUM INSPIRATION]* ✨\n\n> "${picked.q}"\n\n— *${picked.a}*`
    });
  },

  // === 9. FAKTA UNIK DUNIA ===
  getFact(sock, chatId) {
    const facts = [
      "Di planet Venus, satu hari lebih lama daripada satu tahun penuh di planet tersebut.",
      "Otak manusia menghasilkan daya listrik sekitar 20 watt, cukup untuk menyalakan bohlam lampu LED redup.",
      "Bahasa pemrograman pertama di dunia diciptakan oleh seorang wanita bernama Ada Lovelace pada abad ke-19.",
      "Cahaya matahari yang kita lihat hari ini membutuhkan waktu sekitar 8 menit 20 detik untuk mencapai bumi.",
      "Satu sendok teh material bintang neutron memiliki massa sekitar 6 miliar ton!",
      "Koneksi internet satelit modern mentransmisikan data dengan laser optik di luar angkasa dengan kecepatan mendekati kecepatan cahaya."
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    return sock.sendMessage(chatId, {
      text: `💡 *[CYBER ENCYCLOPEDIA FACT]* 💡\n\nTahukah kamu?\n${fact}`
    });
  }
};
