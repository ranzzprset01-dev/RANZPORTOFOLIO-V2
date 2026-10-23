const animeService = require('../services/animeService');

const TRUTH_LIST = [
  "Siapa orang yang diam-diam sering kamu stalk di media sosial?",
  "Apa hal paling memalukan yang pernah kamu lakukan saat di depan gebetan?",
  "Kalau kamu bisa menghapus satu kenangan di masa lalu, kenangan apa itu?",
  "Pernahkah kamu pura-pura tertawa padahal tidak paham sama sekali leluconnya?",
  "Siapa kontak di WhatsApp kamu yang paling jarang kamu balas chat-nya?",
  "Apa rahasia terbesar yang belum pernah kamu ceritakan ke orang tuamu?"
];

const DARE_LIST = [
  "Kirim pesan teks acak 'Aku kangen banget' ke kontak nomor ke-5 di WhatsApp kamu!",
  "Ganti foto profil WhatsApp kamu pakai foto anime atau meme konyol selama 1 jam!",
  "Kirim voice note bernyanyi lagu anak-anak dengan nada opera ke grup ini!",
  "Tulis status WhatsApp: 'Lagi mikirin seseorang...' lalu hapus setelah 10 menit!",
  "Katakan sejujurnya hal yang paling kamu sukai dari admin bot ini!",
  "Kirim stiker paling aneh yang ada di koleksimu sekarang juga!"
];

const BUCIN_QUOTES = [
  "Kalau kamu adalah sebuah bug, aku rela jadi debugger yang gak pernah mau membetulkanmu biar kamu tetap ada.",
  "Bagi dunia kamu mungkin cuma seseorang, tapi bagi seseorang kamu adalah dunianya.",
  "Aku gak butuh sinyal 5G, yang aku butuh cuma sinyal kepastian dari hatimu.",
  "Cinta itu kayak codingan; rumit di awal, tapi kalau berhasil bikin bahagia sepanjang hari.",
  "Kopi boleh pahit, asal hariku bersamamu selalu manis."
];

const MOTIVASI_QUOTES = [
  "Sukses bukanlah kebetulan, ia adalah hasil kerja keras, ketekunan, belajar, dan cinta pada apa yang kamu lakukan.",
  "Jangan takut melangkah pelan, yang harus kamu takuti adalah saat kamu berhenti bergerak sama sekali.",
  "Pemenang tidak pernah menyerah, dan mereka yang menyerah tidak akan pernah menjadi pemenang.",
  "Masa depanmu diciptakan oleh apa yang kamu lakukan hari ini, bukan apa yang kamu rencanakan besok.",
  "Beban yang berat tidak akan menghancurkanmu, tapi caramu membawanya yang menentukan."
];

const PANTUN_LIST = [
  "Beli paku di pasar baru,\nBeli ketan sama kelapa.\nKalau kamu punya gebetan baru,\nJangan lupakan teman yang lama!",
  "Pergi ke pasar membeli mangga,\nMangga manis enak rasanya.\nWalau rintangan menghadang di dada,\nTetap tersenyum dan bahagia!",
  "Burung kenari terbang melayang,\nHinggap sebentar di dahan cemara.\nSelamat pagi duhai sayang,\nSemoga harimu penuh gembira!"
];

const FILSAFAT_LIST = [
  "Epictetus: 'Bukan peristiwa luar yang menyakiti kita, melainkan persepsi dan cara pandang kita terhadap peristiwa itu.'",
  "Socrates: 'Hidup yang tidak pernah direnungkan adalah hidup yang tidak layak untuk dijalani.'",
  "Friedrich Nietzsche: 'Apa yang tidak membunuhmu akan membuatmu bertumbuh jauh lebih kuat.'",
  "Rene Descartes: 'Cogito, ergo sum. Aku berpikir, maka aku ada.'",
  "Marcus Aurelius: 'Kamu memiliki kendali atas pikiranmu sendiri, bukan atas peristiwa di luar. Sadari ini, dan kamu akan menemukan kekuatan sejati.'"
];

module.exports = {
  handleTruth(sock, chatId) {
    const q = TRUTH_LIST[Math.floor(Math.random() * TRUTH_LIST.length)];
    return animeService.sendAnimeReply(sock, chatId, `🤔 *[TRUTH QUESTION]*\n"${q}"\n\n_Jawab dengan jujur dan jangan bohong!_`);
  },

  handleDare(sock, chatId) {
    const d = DARE_LIST[Math.floor(Math.random() * DARE_LIST.length)];
    return animeService.sendAnimeReply(sock, chatId, `🔥 *[DARE CHALLENGE]*\n"${d}"\n\n_Lakukan tantangan ini dan jangan lari!_`);
  },

  handleMagicShell(sock, chatId, type, query) {
    if (!query) return animeService.sendAnimeReply(sock, chatId, `⚠️ Masukkan pertanyaan!\nContoh: \`.${type} besok akan hujan?\``);

    let answer = '';
    if (type === 'kapankah') {
      const times = ['10 menit lagi', 'Besok pagi', 'Minggu depan', 'Bulan depan', 'Tahun 2027', 'Tidak akan pernah', 'Mungkin sebentar lagi'];
      answer = times[Math.floor(Math.random() * times.length)];
    } else if (type === 'apakah') {
      const answers = ['Ya, tentu saja!', 'Sangat besar kemungkinannya.', 'Bisa jadi iya.', 'Ragu-ragu...', 'Sepertinya tidak.', 'Pasti tidak!'];
      answer = answers[Math.floor(Math.random() * answers.length)];
    } else if (type === 'bisakah') {
      const answers = ['Tentu saja bisa!', 'Sangat bisa jika kamu berusaha.', 'Kemungkinan kecil.', 'Tidak mungkin sama sekali.'];
      answer = answers[Math.floor(Math.random() * answers.length)];
    }

    return animeService.sendAnimeReply(sock, chatId, `
🐚 *[KERANG AJAIB PREDICTION]* 🐚
═════════════════════════════════════
❓ *Pertanyaan*: "${query}"
🔮 *Jawaban Semesta*: *${answer}*
═════════════════════════════════════
`.trim());
  },

  handleRate(sock, chatId, text) {
    if (!text) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan hal yang ingin dinilai!\nContoh: `.rate wajahku`');
    const score = Math.floor(Math.random() * 101);
    return animeService.sendAnimeReply(sock, chatId, `📊 *[QUANTUM METER RATING]*\nObjek: "${text}"\nSkor: *${score}%* ${score > 80 ? '🌟 Sangat Sempurna!' : score > 50 ? '👍 Lumayan Oke!' : '💀 Perlu Evaluasi Diri!'}`);
  },

  handleRateGender(sock, chatId, type, name) {
    const target = name || 'Kamu';
    const score = Math.floor(Math.random() * 51) + 50;
    const label = type === 'gantengcek' ? 'Ketampanan' : 'Kecantikan';
    return animeService.sendAnimeReply(sock, chatId, `✨ *[${label.toUpperCase()} RADAR]*\nTarget: *${target}*\nTingkat ${label}: *${score}%* ${score > 85 ? '💖 Memikat Hati!' : '😊 Manis Alami!'}`);
  },

  handleBucin(sock, chatId) {
    const q = BUCIN_QUOTES[Math.floor(Math.random() * BUCIN_QUOTES.length)];
    return animeService.sendAnimeReply(sock, chatId, `💌 *[KATA-KATA BAPER BUCIN]*\n"${q}"`);
  },

  handleMotivasi(sock, chatId) {
    const q = MOTIVASI_QUOTES[Math.floor(Math.random() * MOTIVASI_QUOTES.length)];
    return animeService.sendAnimeReply(sock, chatId, `🔥 *[KATA MOTIVASI SUKSES]*\n"${q}"`);
  },

  handlePantun(sock, chatId) {
    const p = PANTUN_LIST[Math.floor(Math.random() * PANTUN_LIST.length)];
    return animeService.sendAnimeReply(sock, chatId, `📜 *[PANTUN JENAKA & NASIHAT]*\n${p}`);
  },

  handleFilsafat(sock, chatId) {
    const f = FILSAFAT_LIST[Math.floor(Math.random() * FILSAFAT_LIST.length)];
    return animeService.sendAnimeReply(sock, chatId, `🏛️ *[MUTIARA PEMIKIRAN FILSAFAT]*\n${f}`);
  },

  handleTarot(sock, chatId) {
    const CARDS = [
      { name: 'The Sun (Matahari)', meaning: 'Keberuntungan besar, kebahagiaan, dan vitalitas energi positif sedang mengelilingimu!' },
      { name: 'The Star (Bintang)', meaning: 'Harapan baru, inspirasi cemerlang, dan kedamaian pikiran akan segera tiba.' },
      { name: 'The Magician', meaning: 'Kamu memiliki semua keahlian dan potensi untuk mewujudkan rencanamu saat ini.' },
      { name: 'The Wheel of Fortune', meaning: 'Roda kehidupan sedang berputar menguntungkanmu. Siap-siap menerima kejutan baik!' },
      { name: 'The Hermit (Pertapa)', meaning: 'Waktunya mengambil jeda, menenangkan diri, dan mencari kejernihan batin.' }
    ];
    const pick = CARDS[Math.floor(Math.random() * CARDS.length)];
    return animeService.sendAnimeReply(sock, chatId, `
🔮 *[PEMBACAAN KARTU TAROT HARIAN]* 🔮
═════════════════════════════════════
🃏 *Kartu Terpilih*: *${pick.name}*
✨ *Makna & Energi*:
${pick.meaning}
═════════════════════════════════════
`.trim());
  }
};
