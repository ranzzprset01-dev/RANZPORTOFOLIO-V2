const animeService = require('../services/animeService');

const NIAT_SHOLAT = {
  subuh: 'Ushallii fardhash-Shubhi rak’ataini mustaqbilal qiblati adaa’an lillaahi Ta’aalaa.\n(Aku berniat shalat fardhu Shubuh dua rakaat menghadap kiblat karena Allah Ta\'ala)',
  dzuhur: 'Ushallii fardhadh-Dhuhri arba’a raka’aatim mustaqbilal qiblati adaa’an lillaahi Ta’aalaa.\n(Aku berniat shalat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta\'ala)',
  ashar: 'Ushallii fardhal-‘Ashri arba’a raka’aatim mustaqbilal qiblati adaa’an lillaahi Ta’aalaa.\n(Aku berniat shalat fardhu Ashar empat rakaat menghadap kiblat karena Allah Ta\'ala)',
  maghrib: 'Ushallii fardhal-Maghribi tsalaatsa raka’aatim mustaqbilal qiblati adaa’an lillaahi Ta’aalaa.\n(Aku berniat shalat fardhu Maghrib tiga rakaat menghadap kiblat karena Allah Ta\'ala)',
  isya: 'Ushallii fardhal-‘Isyaa’i arba’a raka’aatim mustaqbilal qiblati adaa’an lillaahi Ta’aalaa.\n(Aku berniat shalat fardhu Isya empat rakaat menghadap kiblat karena Allah Ta\'ala)'
};

const KISAH_NABI = {
  adam: 'Nabi Adam AS adalah manusia pertama yang diciptakan Allah SWT dari tanah, ditempatkan di surga, lalu diturunkan ke bumi bersama Siti Hawa sebagai khalifah pertama.',
  nuh: 'Nabi Nuh AS berdakwah selama 950 tahun dengan kesabaran luar biasa, dan membuat bahtera besar penyelamat orang beriman saat banjir bandang melanda.',
  ibrahim: 'Nabi Ibrahim AS adalah bapak para Nabi (Khalilullah), penghancur berhala, yang diselamatkan dari kobaran api Raja Namrud dan membangun Ka\'bah bersama Nabi Ismail AS.',
  musa: 'Nabi Musa AS (Kalimullah) diutus kepada Fir\'aun, dianugerahi mukjizat tongkat membelah Laut Merah dan Kitab Taurat di Bukit Tursina.',
  isa: 'Nabi Isa AS dilahirkan oleh Maryam tanpa ayah dengan kekuasaan Allah, mampu menyembuhkan penyakit dan dianugerahi Kitab Injil.',
  muhammad: 'Nabi Muhammad SAW adalah penutup para Nabi dan Rasul (Khatamul Anbiya), pembawa risalah Islam bagi seluruh alam semesta (Rahmatan lil \'Alamin) dan penerima mukjizat agung Al-Quran.'
};

module.exports = {
  handleNiatSholat(sock, chatId, waktu) {
    const key = (waktu || '').trim().toLowerCase();
    const niat = NIAT_SHOLAT[key];
    if (!niat) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Pilihan sholat: `.niatsholat subuh/dzuhur/ashar/maghrib/isya`');
    }
    return animeService.sendAnimeReply(sock, chatId, `
🕌 *[BACAAN NIAT SHOLAT ${key.toUpperCase()}]* 🕌
═════════════════════════════════════
${niat}
═════════════════════════════════════
`.trim());
  },

  handleKisahNabi(sock, chatId, nama) {
    const key = (nama || 'muhammad').trim().toLowerCase();
    const kisah = KISAH_NABI[key] || `Nabi ${nama} AS adalah salah satu dari 25 Nabi dan Rasul utusan Allah SWT yang wajib kita imani keluhuran budi dan teladannya.`;
    return animeService.sendAnimeReply(sock, chatId, `
📜 *[RINGKASAN KISAH NABI & RASUL]* 📜
═════════════════════════════════════
🌟 *Nabi*: ${key.toUpperCase()} AS
📖 *Kisah Teladan*:
${kisah}
═════════════════════════════════════
`.trim());
  },

  handleAyatKursi(sock, chatId) {
    const text = `
✨ *[BACAAN AYAT KURSI (QS. AL-BAQARAH: 255)]* ✨
═════════════════════════════════════
Allahu laa ilaaha illaa Huwal Hayyul Qayyum. Laa ta’khudzuhuu sinatuw wa laa nawm. Lahuu maa fis-samaawaati wa maa fil ardh. Man dzal ladzii yasyfa’u ‘indahuu illaa bi idznih. Ya’lamu maa baina aidiihim wa maa khalfahum, wa laa yuhiithuuna bi syai’im min ‘ilmihii illaa bimaa syaa’. Wasi’a kursiyyuhus samaawaati wal ardh, wa laa ya’uuduhuu hifzhuhumaa, wa Huwal ‘Aliyyul ‘Azhiim.

*Artinya:*
"Allah, tidak ada tuhan selain Dia. Yang Mahahidup, Yang terus-menerus mengurus makhluk-Nya, tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi..."
═════════════════════════════════════
_Keutamaan: Membaca Ayat Kursi menjadi benteng perlindungan diri dari segala marabahaya._
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  },

  handleDzikir(sock, chatId, waktu) {
    const type = (waktu || 'pagi').trim().toLowerCase();
    const text = `
📿 *[DZIKIR ${type.toUpperCase()}]* 📿
═════════════════════════════════════
1. *Membaca Sayyidul Istighfar:*
"Allahumma Anta Rabbi laa ilaaha illaa Anta, khalaqtanii wa anaa ‘abduka..."

2. *Membaca Tasbih, Tahmid, Takbir (33x):*
• Subhanallah (Maha Suci Allah)
• Alhamdulillah (Segala Puji Bagi Allah)
• Allahu Akbar (Allah Maha Besar)

3. *Membaca Ayat Kursi & Al-Mu’awwidzat (Surah Al-Ikhlas, Al-Falaq, An-Nas)*
═════════════════════════════════════
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  },

  handleZakatCalc(sock, chatId, nominalArg) {
    const nominal = parseInt((nominalArg || '0').replace(/[^0-9]/g, ''), 10);
    if (!nominal || nominal <= 0) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan nominal harta/penghasilan Anda!\nContoh: `.zakatcalc 10000000`');
    }
    const zakat = Math.floor(nominal * 0.025);
    return animeService.sendAnimeReply(sock, chatId, `
💰 *[KALKULATOR ZAKAT MAL & PENGHASILAN]* 💰
═════════════════════════════════════
💵 *Total Penghasilan / Harta*: Rp ${nominal.toLocaleString('id-ID')}
📊 *Kadar Zakat (2.5%)*: Rp ${zakat.toLocaleString('id-ID')}
═════════════════════════════════════
_Kewajiban zakat berlaku jika telah mencapai batas nishab setara 85 gram emas per tahun._
`.trim());
  },

  handleTasbih(sock, chatId, senderId) {
    const text = `
📿 *[DIGITAL TASBIH COUNTER]* 📿
═════════════════════════════════════
• *Subhanallah* (33x)
• *Alhamdulillah* (33x)
• *Allahu Akbar* (33x)
• *Laa ilaaha illallah wahdahu laa syariika lah...* (1x)
═════════════════════════════════════
_Semoga harimu dipenuhi keberkahan dan ketenangan hati._
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  }
};
