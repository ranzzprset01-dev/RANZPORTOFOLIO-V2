const sharp = require('sharp');
const animeService = require('../services/animeService');
const { downloadMedia, extractViewOnce } = require('./mediaTools');
const db = require('../database/db');

const AUTO_QUOTES = [
  "Kadang kita harus berhenti sejenak, bukan untuk menyerah, tapi untuk melihat seberapa jauh kita telah melangkah.",
  "Di dunia yang penuh dengan kebisingan, ketenangan batin adalah sebuah kekuatan super.",
  "Semesta tidak pernah salah menempatkan rasa, hanya manusia yang sering tergesa mengartikannya.",
  "Jangan biarkan masa lalumu mencuri keindahan masa depan yang sedang menunggumu.",
  "Teknologi menghubungkan kita dengan dunia luar, tapi kesunyian menghubungkan kita dengan diri sendiri.",
  "Bintang tidak bisa bersinar tanpa adanya kegelapan di sekelilingnya.",
  "Setiap detak waktu adalah kesempatan kedua yang dihadiahkan kepadamu.",
];

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text, maxCharsPerLine = 38) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function wrapChatText(text, maxCharsPerLine = 28, maxLines = 10) {
  const lines = [];
  let currentLine = '';
  let truncated = false;

  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (lines.length >= maxLines) {
      truncated = true;
      break;
    }

    let remaining = word;
    while (Array.from(remaining).length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      const characters = Array.from(remaining);
      lines.push(characters.slice(0, maxCharsPerLine).join(''));
      remaining = characters.slice(maxCharsPerLine).join('');
      if (lines.length >= maxLines) {
        truncated = Boolean(remaining);
        break;
      }
    }
    if (truncated) break;

    const nextLine = currentLine ? `${currentLine} ${remaining}` : remaining;
    if (Array.from(nextLine).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      if (lines.length >= maxLines) {
        truncated = true;
        break;
      }
      currentLine = remaining;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  if (truncated && lines.length) {
    const lastLine = Array.from(lines[lines.length - 1]);
    lines[lines.length - 1] = `${lastLine.slice(0, maxCharsPerLine - 1).join('')}…`;
  }
  return lines;
}

module.exports = {
  async handleIQC(sock, chatId, senderId, query, msg) {
    const user = db.getUser(senderId);
    const senderName = (user.name || 'Traveler').slice(0, 24);
    const [rawMessage = '', rawReply = '😊❤️'] = String(query || '').split('|', 2);
    const messageText = (rawMessage.trim() || AUTO_QUOTES[Math.floor(Math.random() * AUTO_QUOTES.length)])
      .slice(0, 320);
    const replyText = Array.from(rawReply.trim() || '😊❤️').slice(0, 12).join('');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const lines = wrapChatText(messageText);
    const cardWidth = 900;
    const cardHeight = 1400;
    const bubbleX = 136;
    const bubbleY = 412;
    const bubbleWidth = 604;
    const bubbleHeight = Math.max(94, 58 + lines.length * 42);
    const replyY = bubbleY + bubbleHeight + 82;
    const replyWidth = Math.min(480, Math.max(190, Array.from(replyText).length * 28 + 58));
    const replyX = cardWidth - 118 - replyWidth;
    const textSpans = lines.map((line, index) =>
      `<tspan x="${bubbleX + 28}" dy="${index === 0 ? 0 : 40}">${escapeXml(line)}</tspan>`
    ).join('');
    const initial = escapeXml((senderName.charAt(0) || 'U').toUpperCase());

    const svgContent = `
<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="wallpaper" width="76" height="76" patternUnits="userSpaceOnUse">
      <path d="M12 16h16m-8-8v16M52 52l12 12m0-12L52 64" stroke="#d7d0c6" stroke-width="2" opacity=".35" fill="none"/>
      <circle cx="53" cy="17" r="7" stroke="#d7d0c6" stroke-width="2" opacity=".35" fill="none"/>
    </pattern>
  </defs>
  <rect width="${cardWidth}" height="${cardHeight}" rx="68" fill="#111318"/>
  <rect x="24" y="24" width="${cardWidth - 48}" height="${cardHeight - 48}" rx="52" fill="#f7f7f7"/>

  <!-- iPhone status bar and Dynamic Island -->
  <rect x="350" y="37" width="200" height="42" rx="22" fill="#111318"/>
  <text x="76" y="105" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#17191d">${timeStr}</text>
  <text x="696" y="105" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="#17191d">●●●  Wi-Fi</text>
  <rect x="817" y="88" width="39" height="20" rx="6" fill="none" stroke="#17191d" stroke-width="2"/>
  <rect x="821" y="92" width="27" height="12" rx="3" fill="#17191d"/>
  <rect x="857" y="94" width="4" height="8" rx="2" fill="#17191d"/>

  <!-- WhatsApp iOS conversation header -->
  <rect x="24" y="128" width="${cardWidth - 48}" height="150" fill="#f7f7f7"/>
  <path d="M82 204h-36m0 0 17-18m-17 18 17 18" stroke="#0879e9" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="94" y="194" font-family="Arial, sans-serif" font-size="22" fill="#0879e9">WhatsApp</text>
  <circle cx="450" cy="197" r="42" fill="#d7eee4"/>
  <circle cx="450" cy="184" r="14" fill="#65a88b"/>
  <path d="M423 223q27-38 54 0" fill="#65a88b"/>
  <text x="450" y="255" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#17191d" text-anchor="middle">${escapeXml(senderName)}</text>
  <path d="M24 278h852" stroke="#dedede" stroke-width="2"/>

  <!-- Chat wallpaper -->
  <rect x="24" y="280" width="${cardWidth - 48}" height="${cardHeight - 440}" fill="#efe9e1"/>
  <rect x="24" y="280" width="${cardWidth - 48}" height="${cardHeight - 440}" fill="url(#wallpaper)"/>
  <rect x="322" y="308" width="256" height="42" rx="15" fill="#e3dcd2"/>
  <text x="450" y="336" font-family="Arial, sans-serif" font-size="18" fill="#665e56" text-anchor="middle">HARI INI</text>

  <!-- Incoming WhatsApp message -->
  <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleWidth}" height="${bubbleHeight}" rx="24" fill="#ffffff"/>
  <path d="M${bubbleX + 4} ${bubbleY + 20}l-18 12 20 8" fill="#ffffff"/>
  <text x="${bubbleX + 28}" y="${bubbleY + 47}" font-family="Arial, 'Segoe UI Emoji', sans-serif" font-size="27" fill="#202124">
    ${textSpans}
  </text>
  <text x="${bubbleX + bubbleWidth - 82}" y="${bubbleY + bubbleHeight - 16}" font-family="Arial, sans-serif" font-size="16" fill="#8a8a8a">${timeStr}</text>
  <rect x="${bubbleX + 22}" y="${bubbleY + bubbleHeight - 12}" width="100" height="46" rx="23" fill="#ffffff" stroke="#e7e3df" stroke-width="2"/>
  <text x="${bubbleX + 42}" y="${bubbleY + bubbleHeight + 19}" font-family="Arial, 'Segoe UI Emoji', sans-serif" font-size="23">❤️ 1</text>

  <!-- Emoji reply bubble -->
  <rect x="${replyX}" y="${replyY}" width="${replyWidth}" height="88" rx="24" fill="#d9fdd3"/>
  <path d="M${replyX + replyWidth - 8} ${replyY + 20}l20 12-22 8" fill="#d9fdd3"/>
  <text x="${replyX + 24}" y="${replyY + 52}" font-family="Arial, 'Segoe UI Emoji', sans-serif" font-size="32" fill="#202124">${escapeXml(replyText)}</text>
  <text x="${replyX + replyWidth - 92}" y="${replyY + 76}" font-family="Arial, sans-serif" font-size="15" fill="#66756a">${timeStr}  ✓✓</text>

  <!-- Message composer -->
  <rect x="24" y="${cardHeight - 160}" width="${cardWidth - 48}" height="112" fill="#f7f7f7"/>
  <circle cx="76" cy="${cardHeight - 105}" r="23" fill="#0879e9"/>
  <path d="M76 ${cardHeight - 117}v24m-12-12h24" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  <rect x="116" y="${cardHeight - 137}" width="660" height="64" rx="32" fill="#ffffff" stroke="#d7d7d7" stroke-width="2"/>
  <text x="148" y="${cardHeight - 97}" font-family="Arial, sans-serif" font-size="21" fill="#999999">Pesan</text>
  <circle cx="822" cy="${cardHeight - 105}" r="23" fill="#0879e9"/>
  <path d="M811 ${cardHeight - 105}h22m0 0-9-9m9 9-9 9" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="363" y="${cardHeight - 34}" width="174" height="8" rx="4" fill="#17191d"/>
</svg>`.trim();

    try {
      const buffer = await sharp(Buffer.from(svgContent)).png().toBuffer();

      console.log('[IQC-SUCCESS] Buffer size:', buffer.length);

      return await sock.sendMessage(chatId, {
        image: buffer,
        caption: `📱 *SIMULASI CHAT WHATSAPP iPHONE*\n💬 ${messageText}\n↩️ Balasan: ${replyText}`
      }, { quoted: msg });

    } catch (err) {
      console.error('[IQC-ERROR]', err);
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal IQC: ${err.message}`, msg);
    }
  },

  async handleBrat(sock, chatId, query, msg) {
    const text = (query || 'brat').trim().toLowerCase();
    const lines = wrapText(text, 14);
    let textSpans = '';
    lines.forEach((l, i) => {
      textSpans += `<tspan x="40" dy="${i === 0 ? 0 : 54}">${escapeXml(l)}</tspan>`;
    });
    const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#8ACE00"/><text x="40" y="240" font-family="Arial" font-size="48" fill="#000">${textSpans}</text></svg>`;
    try {
      const buffer = await sharp(Buffer.from(svg), { density: 200 }).webp().toBuffer();
      return await sock.sendMessage(chatId, { sticker: buffer }, { quoted: msg });
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Brat Error: ${e.message}`, msg);
    }
  },

  async handleTweet(sock, chatId, senderId, query, msg) {
    // sama kayak punya kamu, cuma fix density
    const user = db.getUser(senderId);
    const text = query ? query.trim() : 'Just setting up my RANZZXITER node.';
    const lines = wrapText(text, 36);
    let textSpans = '';
    lines.forEach((l, i) => { textSpans += `<tspan x="40" dy="${i === 0 ? 0 : 30}">${escapeXml(l)}</tspan>`; });
    const cardHeight = Math.max(300, 180 + lines.length * 30);
    const svg = `<svg width="600" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000" rx="16"/><circle cx="65" cy="65" r="25" fill="#1d9bf0"/><text x="65" y="73" font-family="Arial" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle">X</text><text x="105" y="60" font-family="Arial" font-size="16" font-weight="bold" fill="#fff">${escapeXml(user.name)}</text><text x="40" y="130" font-family="Arial" font-size="17" fill="#e7e9ea">${textSpans}</text></svg>`;
    try {
      const buffer = await sharp(Buffer.from(svg), { density: 250 }).png().toBuffer();
      return await sock.sendMessage(chatId, { image: buffer, caption: '🐦 FAKE X POST' }, { quoted: msg });
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Error: ${e.message}`, msg);
    }
  },

  async handleImageFilter(sock, chatId, senderId, filterType, msg) {
    const found = extractViewOnce(msg);
    if (!found || found.type !== 'image') {
      return animeService.sendAnimeReply(sock, chatId, `📸 Balas foto dengan .grayscale / .invert / .blur / .flip`, msg);
    }
    try {
      await sock.sendPresenceUpdate('composing', chatId).catch(() => {});
      const raw = await downloadMedia(found.media, 'image');
      let pipeline = sharp(raw);
      if (filterType === 'grayscale') pipeline = pipeline.grayscale();
      else if (filterType === 'invert') pipeline = pipeline.negate({ alpha: false });
      else if (filterType === 'blur') pipeline = pipeline.blur(10);
      else if (filterType === 'flip') pipeline = pipeline.flop();
      const outBuffer = await pipeline.png().toBuffer();
      return await sock.sendMessage(chatId, { image: outBuffer, caption: `✨ FILTER: ${filterType.toUpperCase()}` }, { quoted: msg });
    } catch (err) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal filter: ${err.message}`, msg);
    }
  }
};