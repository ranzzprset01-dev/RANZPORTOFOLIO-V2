const crypto = require('crypto');

const morseMap = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', ' ': '/'
};

const reverseMorseMap = Object.entries(morseMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {});

module.exports = {
  // 1. FANCY TEXT (FONT AESTHETIC)
  fancyText(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.fancy <teks>\`` });

    const styles = [
      text.toUpperCase().split('').map(c => c >= 'A' && c <= 'Z' ? String.fromCodePoint(c.charCodeAt(0) + 0x1D370) : c).join(''),
      text.split('').map(c => {
        if (c >= 'a' && c <= 'z') return String.fromCodePoint(c.charCodeAt(0) + 0x1D4B6);
        if (c >= 'A' && c <= 'Z') return String.fromCodePoint(c.charCodeAt(0) + 0x1D4D0);
        return c;
      }).join(''),
      text.split('').map(c => {
        if (c >= 'a' && c <= 'z') return String.fromCodePoint(c.charCodeAt(0) + 0x1D4EA);
        if (c >= 'A' && c <= 'Z') return String.fromCodePoint(c.charCodeAt(0) + 0x1D504);
        return c;
      }).join(''),
      `『 ${text} 』`,
      `꧁༒ ${text} ༒꧂`,
      `░▒▓█ ${text} █▓▒░`,
      text.split('').join(' ')
    ];

    let out = `✨ *[FANCY TEXT GENERATOR]* ✨\n\n`;
    styles.forEach((s, idx) => {
      out += `${idx + 1}. ${s}\n`;
    });
    return sock.sendMessage(chatId, { text: out.trim() });
  },

  // 2. MORSE CODE
  toMorse(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.morse <teks>\`` });
    const morse = text.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
    return sock.sendMessage(chatId, {
      text: `📻 *[KODE MORSE TRANSMISSION]*\n\n${morse}`
    });
  },

  fromMorse(sock, chatId, morse) {
    if (!morse) return sock.sendMessage(chatId, { text: `💡 Format: \`.demorse <kode morse>\`` });
    const decoded = morse.split(' ').map(c => reverseMorseMap[c] || c).join('');
    return sock.sendMessage(chatId, {
      text: `📻 *[DECODE MORSE]*\n\n${decoded}`
    });
  },

  // 3. BINARY
  toBinary(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.binary <teks>\`` });
    const binary = Buffer.from(text).map(b => b.toString(2).padStart(8, '0')).join(' ');
    return sock.sendMessage(chatId, { text: `🔢 *[BINARY OUTPUT]*\n\n${binary}` });
  },

  fromBinary(sock, chatId, bin) {
    if (!bin) return sock.sendMessage(chatId, { text: `💡 Format: \`.debinary <biner>\`` });
    try {
      const chars = bin.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
      return sock.sendMessage(chatId, { text: `🔤 *[TEXT OUTPUT]*\n\n${chars}` });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Biner tidak valid!` });
    }
  },

  // 4. BASE64
  toBase64(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.base64 <teks>\`` });
    const b64 = Buffer.from(text).toString('base64');
    return sock.sendMessage(chatId, { text: `🔒 *[BASE64 ENCODED]*\n\n${b64}` });
  },

  fromBase64(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.debase64 <base64>\`` });
    try {
      const decoded = Buffer.from(text, 'base64').toString('utf-8');
      return sock.sendMessage(chatId, { text: `🔓 *[BASE64 DECODED]*\n\n${decoded}` });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Base64 tidak valid!` });
    }
  },

  // 5. REVERSE TEXT
  reverseText(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.reverse <teks>\`` });
    const rev = text.split('').reverse().join('');
    return sock.sendMessage(chatId, { text: `🔄 *[REVERSED TEXT]*\n\n${rev}` });
  },

  // 6. MOCKING SPONGEBOB
  mockText(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.mock <teks>\`` });
    const mocked = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
    return sock.sendMessage(chatId, { text: `🤪 ${mocked}` });
  },

  // 7. PASSWORD GENERATOR
  generatePassword(sock, chatId, lenStr) {
    let len = parseInt(lenStr, 10);
    if (isNaN(len) || len < 6 || len > 64) len = 16;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let pass = '';
    for (let i = 0; i < len; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return sock.sendMessage(chatId, {
      text: `🔑 *[QUANTUM ENCRYPTED PASSWORD]*\n\nPanjang: ${len} Karakter\n\`\`\`${pass}\`\`\`\n\n_Simpan di tempat yang aman!_`
    });
  },

  // 8. UUID GENERATOR
  generateUUID(sock, chatId) {
    const uuid = crypto.randomUUID();
    return sock.sendMessage(chatId, {
      text: `🆔 *[UUID v4 GENERATED]*\n\n\`${uuid}\``
    });
  },

  // 9. COUNT WORDS & CHARACTERS
  countText(sock, chatId, text) {
    if (!text) return sock.sendMessage(chatId, { text: `💡 Format: \`.count <teks>\`` });
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const vowels = (text.match(/[aeiou]/gi) || []).length;
    const consonants = (text.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;

    return sock.sendMessage(chatId, {
      text: `
📊 *[TEXT METRIC ANALYSIS]*
══════════════════════════
📝 Jumlah Karakter : *${chars}*
📖 Jumlah Kata     : *${words}*
🗣️ Huruf Vokal     : *${vowels}*
🔤 Huruf Konsonan  : *${consonants}*
══════════════════════════
`
    });
  }
};
