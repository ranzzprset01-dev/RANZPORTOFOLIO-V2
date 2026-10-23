const axios = require('axios');
const dns = require('dns').promises;
const https = require('https');
const animeService = require('../services/animeService');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const HTTP_CODES = {
  '200': 'OK: Permintaan berhasil diproses oleh server.',
  '201': 'Created: Sumber daya baru berhasil dibuat.',
  '204': 'No Content: Berhasil tapi tidak mengembalikan konten.',
  '301': 'Moved Permanently: URL dialihkan permanen ke alamat baru.',
  '302': 'Found: URL dialihkan sementara.',
  '304': 'Not Modified: Sumber daya tidak berubah sejak cache terakhir.',
  '400': 'Bad Request: Format permintaan klien tidak valid atau rusak.',
  '401': 'Unauthorized: Memerlukan autentikasi atau token kredensial.',
  '403': 'Forbidden: Akses ditolak oleh izin server atau firewall.',
  '404': 'Not Found: Endpoint atau file tidak ditemukan di server.',
  '405': 'Method Not Allowed: Metode HTTP (GET/POST) tidak diizinkan.',
  '408': 'Request Timeout: Waktu koneksi klien ke server habis.',
  '429': 'Too Many Requests: Melebihi batas rate limit / Anti-Flood!',
  '500': 'Internal Server Error: Kerusakan atau bug pada server.',
  '502': 'Bad Gateway: Gateway atau proxy menerima respon tidak sah.',
  '503': 'Service Unavailable: Server overload atau dalam pemeliharaan.',
  '504': 'Gateway Timeout: Gateway hulu tidak merespon tepat waktu.'
};

module.exports = {
  // 1. DOMAIN WHOIS LOOKUP (.whois <domain>)
  async handleWhois(sock, chatId, domainArg) {
    const domain = (domainArg || '').trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!domain) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan domain untuk lookup WHOIS!\nContoh: `.whois cloudflare.com`');
    }

    try {
      const res = await axios.get(`https://rdap.org/domain/${domain}`, {
        httpsAgent,
        timeout: 6000
      });
      const d = res.data;
      const registrar = d.entities?.find(e => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || 'Unknown';
      const events = d.events || [];
      const created = events.find(e => e.eventAction === 'registration')?.eventDate || '-';
      const expires = events.find(e => e.eventAction === 'expiration')?.eventDate || '-';

      const text = `
🌐 *[WHOIS DOMAIN REGISTRY LOOKUP]* 🌐
═════════════════════════════════════
🏷️ *Domain*: \`${d.ldhName || domain}\`
🏢 *Registrar*: ${registrar}
📅 *Terdaftar*: ${created.split('T')[0]}
⏳ *Kedaluwarsa*: ${expires.split('T')[0]}
📡 *Status*: ${(d.status || []).slice(0, 2).join(', ') || 'Active'}
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, text.trim());
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mengambil WHOIS untuk ${domain}: ${e.message}`);
    }
  },

  // 2. HTTP STATUS ENCYCLOPEDIA (.httpstatus <code>)
  handleHttpStatus(sock, chatId, codeArg) {
    const code = (codeArg || '').trim();
    if (!code) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan kode status HTTP!\nContoh: `.httpstatus 404`');
    }
    const desc = HTTP_CODES[code] || 'Kode status HTTP tidak umum atau kustom.';
    return animeService.sendAnimeReply(sock, chatId, `
📡 *[HTTP STATUS CODE ENCYCLOPEDIA]* 📡
═════════════════════════════════════
🔢 *Kode*: \`${code}\`
📝 *Deskripsi*: ${desc}
═════════════════════════════════════
`.trim());
  },

  // 3. USER-AGENT PARSER (.useragent <ua>)
  handleUserAgent(sock, chatId, uaString) {
    const ua = (uaString || '').trim();
    if (!ua) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan User-Agent string untuk dianalisis!');
    }
    let os = 'Unknown OS';
    if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS (Apple)';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Unknown Browser';
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Google Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
    else if (/Edge/i.test(ua)) browser = 'Microsoft Edge';

    return animeService.sendAnimeReply(sock, chatId, `
🕵️ *[USER-AGENT PARSER]* 🕵️
═════════════════════════════════════
💻 *Sistem Operasi*: ${os}
🌐 *Peramban (Browser)*: ${browser}
📱 *Tipe Client*: ${/Mobile/i.test(ua) ? 'Perangkat Seluler (Mobile)' : 'Komputer Desktop'}
═════════════════════════════════════
`.trim());
  },

  // 4. IP SUBNET CALCULATOR (.ipcalc <ip/cidr>)
  handleIPCalc(sock, chatId, cidrArg) {
    const input = (cidrArg || '').trim();
    if (!input || !input.includes('/')) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.ipcalc <ip/prefix>`\nContoh: `.ipcalc 192.168.1.0/24`');
    }
    const [ip, prefixStr] = input.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      return animeService.sendAnimeReply(sock, chatId, '❌ Prefix subnet harus antara 0 dan 32!');
    }

    const totalHosts = Math.pow(2, 32 - prefix);
    const usableHosts = Math.max(0, totalHosts - 2);

    return animeService.sendAnimeReply(sock, chatId, `
🔢 *[IPV4 SUBNET CALCULATOR]* 🔢
═════════════════════════════════════
🌐 *Network CIDR*: \`${input}\`
⚡ *Prefix Subnet*: \`/${prefix}\`
👥 *Total Alamat IP*: ${totalHosts.toLocaleString('id-ID')}
🖥️ *Host yang Dapat Dipakai*: ${usableHosts.toLocaleString('id-ID')}
═════════════════════════════════════
`.trim());
  },

  // 5. TRACEROUTE SIMULATION (.traceroutesim <host>)
  async handleTraceRouteSim(sock, chatId, hostArg) {
    const host = (hostArg || '').trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!host) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.traceroutesim <domain/ip>`\nContoh: `.traceroutesim google.com`');
    }

    let ip = host;
    try {
      const res = await dns.lookup(host);
      ip = res.address;
    } catch (e) {}

    const text = `
🚀 *[QUANTUM NETWORK TRACEROUTE SIMULATION]* 🚀
═════════════════════════════════════
🎯 *Target*: \`${host}\` (${ip})

Hop 1: \`10.0.0.1\` (Gateway Router) [1.2 ms]
Hop 2: \`172.16.20.1\` (ISP Edge Node) [4.8 ms]
Hop 3: \`103.28.14.9\` (IXP Cyber Backbone) [12.4 ms]
Hop 4: \`198.41.0.4\` (Anycast Scrubbing Center) [18.9 ms]
Hop 5: \`${ip}\` (Target Destination Node) [22.1 ms]

🟢 *Status*: 0% Packet Loss • Jitter: 1.1 ms
═════════════════════════════════════
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  },

  // 6. CIPHERS & ENCODINGS (ROT13, HEX, URL, TIMESTAMP, JSON, JWT)
  handleRot13(sock, chatId, text) {
    if (!text) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan teks untuk dienkripsi/dekripsi ROT13!');
    const res = text.replace(/[a-zA-Z]/g, c => {
      const b = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
    });
    return animeService.sendAnimeReply(sock, chatId, `🔤 *[ROT13 CIPHER]*\nHasil: \`\`\`${res}\`\`\``);
  },

  handleHex(sock, chatId, text) {
    if (!text) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan teks untuk dijadikan heksadesimal!');
    const hex = Buffer.from(text).toString('hex');
    return animeService.sendAnimeReply(sock, chatId, `🔢 *[STRING TO HEX]*\nHasil:\n\`\`\`${hex}\`\`\``);
  },

  handleDeHex(sock, chatId, hex) {
    if (!hex) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan teks heksadesimal untuk di-decode!');
    try {
      const str = Buffer.from(hex.replace(/\s+/g, ''), 'hex').toString('utf8');
      return animeService.sendAnimeReply(sock, chatId, `📝 *[HEX TO STRING]*\nHasil:\n\`\`\`${str}\`\`\``);
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Hex tidak valid.`);
    }
  },

  handleUrlEncode(sock, chatId, text) {
    if (!text) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan teks untuk di-URL encode!');
    return animeService.sendAnimeReply(sock, chatId, `🔗 *[URL ENCODED]*\n\`\`\`${encodeURIComponent(text)}\`\`\``);
  },

  handleUrlDecode(sock, chatId, text) {
    if (!text) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan teks untuk di-URL decode!');
    try {
      return animeService.sendAnimeReply(sock, chatId, `🔗 *[URL DECODED]*\n\`\`\`${decodeURIComponent(text)}\`\`\``);
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Teks URL tidak valid.`);
    }
  },

  handleTimestamp(sock, chatId, val) {
    let date = new Date();
    if (val && !isNaN(val)) {
      const num = parseInt(val, 10);
      date = new Date(num > 1e11 ? num : num * 1000);
    }
    const epochSec = Math.floor(date.getTime() / 1000);
    const epochMs = date.getTime();
    const utc = date.toUTCString();
    const local = date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    return animeService.sendAnimeReply(sock, chatId, `
⏱️ *[UNIX EPOCH TIMESTAMP CONVERTER]* ⏱️
═════════════════════════════════════
⚡ *Epoch (Detik)*: \`${epochSec}\`
⚡ *Epoch (Milidetik)*: \`${epochMs}\`
🌐 *Waktu UTC*: \`${utc}\`
🇮🇩 *Waktu Indonesia (WIB)*: \`${local}\`
═════════════════════════════════════
`.trim());
  },

  handleJsonFormat(sock, chatId, jsonStr) {
    if (!jsonStr) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan string JSON yang ingin dirapikan!');
    try {
      const parsed = JSON.parse(jsonStr);
      const pretty = JSON.stringify(parsed, null, 2);
      return animeService.sendAnimeReply(sock, chatId, `✨ *[JSON PRETTY-PRINT: VALID]*\n\`\`\`json\n${pretty}\n\`\`\``);
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Format JSON Rusak (Invalid): ${e.message}`);
    }
  },

  handleJwtDecode(sock, chatId, token) {
    if (!token || !token.includes('.')) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan token JWT yang valid!');
    }
    try {
      const parts = token.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      const text = `
🔐 *[JWT TOKEN DECODER]* 🔐
═════════════════════════════════════
📦 *HEADER*:
\`\`\`json
${JSON.stringify(header, null, 2)}
\`\`\`

📜 *PAYLOAD*:
\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`
═════════════════════════════════════
`.trim();
      return animeService.sendAnimeReply(sock, chatId, text);
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Token JWT tidak dapat di-decode: ${e.message}`);
    }
  }
};
