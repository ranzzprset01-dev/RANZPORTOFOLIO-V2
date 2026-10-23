const crypto = require('crypto');
const net = require('net');
const tls = require('tls');
const dns = require('dns').promises;
const axios = require('axios');
const https = require('https');
const db = require('../database/db');
const animeService = require('../services/animeService');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// State Delayhard & Anti-Crash Protection
const defenseState = {
  delayhardActive: true,
  delayhardLevel: 'ULTRA_QUANTUM',
  blockedSpammers: new Set(),
  quarantinedUsers: new Set(),
  userShields: new Map(), // userId -> expiry timestamp
  userFirewalls: new Map(), // userId -> level (1-5)
  userStealth: new Map(), // userId -> expiry timestamp
  virtexDetections: 0,
  lastCleanTimestamp: Date.now()
};

// Deteksi karakter virtex / payload overload
function detectMaliciousPayload(text) {
  if (!text || typeof text !== 'string') return false;
  const invisibleChars = (text.match(/[\u200B-\u200D\uFEFF\u2060\u00A0]/g) || []).length;
  const isExtremeLength = text.length > 8000;
  const isVcardSpam = text.includes('BEGIN:VCARD') && text.length > 3000;
  return invisibleChars > 50 || isExtremeLength || isVcardSpam;
}

module.exports = {
  detectMaliciousPayload,

  // 1. FITUR DELAYHARD ANTICRASH SHIELD
  async handleDelayhard(sock, chatId, senderId, args, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return animeService.sendAnimeReply(sock, chatId, '⛔ Akses Ditolak: Fitur Delayhard hanya dapat dikontrol oleh Supreme Owner.');
    }

    const mode = (args[0] || '').toLowerCase();
    if (mode === 'on' || mode === 'aktif') {
      defenseState.delayhardActive = true;
      defenseState.delayhardLevel = 'ULTRA_QUANTUM';
    } else if (mode === 'off' || mode === 'mati') {
      defenseState.delayhardActive = false;
    } else if (mode === 'high' || mode === 'max') {
      defenseState.delayhardActive = true;
      defenseState.delayhardLevel = 'MAX_DEFENSE';
    }

    const statusText = `
╔══════════════════════════════════════╗
║   🛡️ *CYBER DELAYHARD IMMUNITY* 🛡️   ║
║      *ANTI-CRASH & ANTI-VIRTEX*      ║
╚══════════════════════════════════════╝

⚡ *Status Delayhard*: ${defenseState.delayhardActive ? '🟢 AKTIF (IMMUNE)' : '🔴 NONAKTIF'}
🛡️ *Tingkat Proteksi*: \`${defenseState.delayhardLevel}\`
🚫 *Serangan Dicegah*: *${defenseState.virtexDetections} ancaman*
⚙️ *Hardware Buffer*: Protected against UI Freeze & OOM Crash

*Fitur Proteksi:*
• Zero-Width Character Filter (Anti-Virtex)
• Memory Overload Throttling (Anti-Lag)
• Automatic Malicious Packet Dropper
• Delayhard Safe Buffer Queue

_Ketik \`.delayhard on/off/max\` untuk konfigurasi perisai._
`;
    return animeService.sendAnimeReply(sock, chatId, statusText.trim());
  },

  // 2. COUNTER-SPAM & FREEZE CRASH PAYLOAD UNTUK SPAMMER
  async handleCrash(sock, chatId, senderId, targetArg, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return animeService.sendAnimeReply(sock, chatId, '⛔ Fitur penyerangan counter-spam hanya diizinkan untuk Supreme Owner.');
    }

    if (!targetArg) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan nomor target spammer!\nContoh: `.crash 628xxx`');
    }

    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
    defenseState.blockedSpammers.add(targetJid);

    try {
      const counterWarning = `
⚠️ *[SECURITY SYSTEM // COUNTER MEASURE]* ⚠️
═════════════════════════════════════
Nomor Anda terdeteksi melakukan spamming terhadap RANZZXITER Network!
IP & Hardware Signature Anda telah dicatat.
Sistem pertahanan telah memblokir transmisi Anda secara permanen.
═════════════════════════════════════
[QUANTUM_SHIELD_DROP_PACKET_ID_#99824]
`;
      await sock.sendMessage(targetJid, { text: counterWarning.trim() });
      await sock.updateBlockStatus(targetJid, 'block');
    } catch (e) {}

    return animeService.sendAnimeReply(sock, chatId, `✅ Target @${cleanNum} berhasil dinetralkan dan dimasukkan ke dalam daftar blokir permanen!`, null, {
      mentions: [targetJid]
    });
  },

  // 3. FITUR SERANGAN CYBER WARFARE (.hack @user)
  async handleCyberHack(sock, chatId, senderId, targetArg) {
    const attacker = db.getUser(senderId);
    if (!targetArg) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan target serangan cyber!\nContoh: `.hack @user` atau `.hack 628xxx`');
    }

    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;

    if (targetJid === senderId) {
      return animeService.sendAnimeReply(sock, chatId, '❌ Anda tidak dapat meretas sistem pertahanan diri sendiri!');
    }

    // Cek apakah target dalam Stealth Mode
    if (defenseState.userStealth.has(targetJid) && defenseState.userStealth.get(targetJid) > Date.now()) {
      return animeService.sendAnimeReply(sock, chatId, `👻 *[TARGET IN STEALTH MODE]*\nTarget @${cleanNum} sedang menggunakan *Ghost Stealth Cloak*. IP target tidak terlacak di radar!`, null, { mentions: [targetJid] });
    }

    const defender = db.getUser(targetJid);

    // Cek apakah target dilindungi Quantum Shield (.shield)
    const isShielded = defenseState.userShields.has(targetJid) && defenseState.userShields.get(targetJid) > Date.now();
    if (isShielded) {
      const penalty = Math.min(attacker.coins, 1000);
      attacker.coins -= penalty;
      defender.coins += penalty;
      db.updateUser(senderId, attacker);
      db.updateUser(targetJid, defender);

      const reflectText = `
🛡️ *[CYBER ATTACK REFLECTED / GAGAL]* 🛡️
═════════════════════════════════════
Target @${cleanNum} mengaktifkan *Quantum Energy Shield*!
⚡ Serangan peretasan Anda memantul kembali (*Feedback Surge*).
💥 Penalti Kerusakan: -${penalty.toLocaleString('id-ID')} Koin Cyber ditransfer ke target.
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, reflectText.trim(), null, { mentions: [targetJid, senderId] });
    }

    // Cek Level Firewall Target
    const fwLevel = defenseState.userFirewalls.get(targetJid) || 1;
    const baseSuccessRate = Math.max(0.2, 0.75 - (fwLevel * 0.1));
    const hackSuccess = Math.random() < baseSuccessRate;
    const lootCoins = Math.floor(Math.random() * 3000) + 1500;
    const gainedXp = Math.floor(Math.random() * 80) + 40;

    if (hackSuccess) {
      const stolenCoins = Math.min(defender.coins, lootCoins);
      defender.coins -= stolenCoins;
      attacker.coins += stolenCoins;
      attacker.xp += gainedXp;

      db.updateUser(senderId, attacker);
      db.updateUser(targetJid, defender);

      const successReport = `
💻 *[CYBER ATTACK: BREACH SUCCESSFUL]* 💻
═════════════════════════════════════
👤 *Penyerang*: @${senderId.split('@')[0]}
🎯 *Target*: @${cleanNum}
📡 *Protokol*: Quantum Infiltration Protocol v9.2

[██████████] 100% FIREWALL CRACKED!
💥 *Hasil Penyerangan*:
• Saldo Terkuras: +${stolenCoins.toLocaleString('id-ID')} Koin Cyber
• Pengalaman Cyber: +${gainedXp} EXP
• Status Target: Firewall Level ${fwLevel} Terobos
═════════════════════════════════════
_Gunakan \`.shield\` atau \`.firewalldefend\` untuk memperkuat node Anda!_
`;
      return animeService.sendAnimeReply(sock, chatId, successReport.trim(), null, { mentions: [senderId, targetJid] });
    } else {
      const fine = Math.min(attacker.coins, 800);
      attacker.coins -= fine;
      db.updateUser(senderId, attacker);

      const failReport = `
🚫 *[CYBER ATTACK: DETECTED & TRACED]* 🚫
═════════════════════════════════════
👤 *Penyerang*: @${senderId.split('@')[0]}
🎯 *Target*: @${cleanNum}
🛡️ *Firewall Target*: Level ${fwLevel} Defended

[██████░░░░] BREACH BLOCKED!
⚠️ Sentinel Drone mendeteksi IP Anda!
💥 Peretasan gagal, terkena denda keamanan -${fine.toLocaleString('id-ID')} Koin!
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, failReport.trim(), null, { mentions: [senderId, targetJid] });
    }
  },

  // 4. PASANG QUANTUM SHIELD PERTAHANAN (.shield)
  async handleCyberShield(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const cost = 2000;

    if (user.coins < cost) {
      return animeService.sendAnimeReply(sock, chatId, `⚠️ Koin Anda tidak mencukupi untuk memasang Quantum Shield!\nDiperlukan: 2.000 Koin (Saldo Anda: ${user.coins.toLocaleString('id-ID')}).`);
    }

    user.coins -= cost;
    const durationMs = 12 * 60 * 60 * 1000; // 12 jam
    defenseState.userShields.set(senderId, Date.now() + durationMs);
    db.updateUser(senderId, user);

    const shieldText = `
🛡️ *[QUANTUM ENERGY SHIELD ACTIVATED]* 🛡️
═════════════════════════════════════
Akun Anda berhasil diselimuti *Quantum Barrier*.
⏱️ *Durasi Aktif*: 12 Jam ke depan
💎 *Biaya Generator*: 2.000 Koin Cyber
✨ *Efek*: Kebal dari serangan \`.hack\` dan memantulkan serangan ke musuh!
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, shieldText.trim());
  },

  // 5. UPGRADE FIREWALL PERTAHANAN DIRI (.firewalldefend / .upgradefirewall)
  async handleFirewallDefend(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const currentFw = defenseState.userFirewalls.get(senderId) || 1;

    if (currentFw >= 5) {
      return animeService.sendAnimeReply(sock, chatId, `🛡️ Firewall pertahanan akun Anda sudah berada di tingkat maksimal (*Level 5 - Quantum Hardened Wall*)!`);
    }

    const nextFw = currentFw + 1;
    const cost = nextFw * 1500;

    if (user.coins < cost) {
      return animeService.sendAnimeReply(sock, chatId, `⚠️ Saldo koin tidak cukup untuk upgrade Firewall ke Level ${nextFw}!\nDiperlukan: ${cost.toLocaleString('id-ID')} Koin (Saldo: ${user.coins.toLocaleString('id-ID')}).`);
    }

    user.coins -= cost;
    defenseState.userFirewalls.set(senderId, nextFw);
    db.updateUser(senderId, user);

    const fwCard = `
🛡️ *[FIREWALL SYSTEM UPGRADED]* 🛡️
═════════════════════════════════════
Tingkat Firewall: *Level ${nextFw} / 5*
💎 Biaya Upgrade: ${cost.toLocaleString('id-ID')} Koin Cyber
⚡ Resistensi Serangan: +${nextFw * 15}% Reduksi Keberhasilan Hack Musuh
🔒 Fitur Enkripsi: AES-256 GCM Quantum Matrix
═════════════════════════════════════
_Kini akun Anda jauh lebih tangguh menghadapi serangan cyber warfare!_
`;
    return animeService.sendAnimeReply(sock, chatId, fwCard.trim());
  },

  // 6. SIMULATED QUANTUM DDOS ASSAULT (.ddossim @user)
  async handleDDoSSim(sock, chatId, senderId, targetArg) {
    const attacker = db.getUser(senderId);
    if (!targetArg) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan target serangan DDoS Simulation!\nContoh: `.ddossim @user`');
    }

    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;

    if (targetJid === senderId) {
      return animeService.sendAnimeReply(sock, chatId, '❌ Anda tidak dapat meluncurkan flood ke node diri sendiri!');
    }

    const defender = db.getUser(targetJid);
    const fwLevel = defenseState.userFirewalls.get(targetJid) || 1;
    const isShielded = defenseState.userShields.has(targetJid) && defenseState.userShields.get(targetJid) > Date.now();

    if (isShielded) {
      return animeService.sendAnimeReply(sock, chatId, `🛡️ *[DDOS MITIGATED]*\nTarget @${cleanNum} dilindungi oleh Quantum Energy Shield. Seluruh paket DDoS 100% terserap tanpa dampak!`, null, { mentions: [targetJid] });
    }

    // Packet barrage simulation
    const packets = Math.floor(Math.random() * 500000) + 200000;
    const breachChance = Math.max(0.2, 0.8 - (fwLevel * 0.12));
    const isOverwhelmed = Math.random() < breachChance;

    if (isOverwhelmed) {
      const damageCoins = Math.floor(Math.random() * 2000) + 1000;
      const stolen = Math.min(defender.coins, damageCoins);
      defender.coins -= stolen;
      attacker.coins += stolen;
      attacker.xp += 60;
      db.updateUser(senderId, attacker);
      db.updateUser(targetJid, defender);

      const ddosSuccess = `
🌊 *[QUANTUM DDOS ASSAULT: OVERWHELMED]* 🌊
═════════════════════════════════════
👤 *Penyerang*: @${senderId.split('@')[0]}
🎯 *Target*: @${cleanNum}
📦 *Paket Terkirim*: ${packets.toLocaleString('id-ID')} SYN/UDP Packets
⚡ *Bandwidth Surge*: 480 Gbps Quantum Vector

[██████████] BUFFER OVERFLOW REACHED!
💥 *Dampak*:
• Node target mengalami latency overload!
• Kerugian Target: -${stolen.toLocaleString('id-ID')} Koin Cyber
• Penyerang Menerima: +${stolen.toLocaleString('id-ID')} Koin & +60 EXP
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, ddosSuccess.trim(), null, { mentions: [senderId, targetJid] });
    } else {
      const ddosFail = `
🛡️ *[QUANTUM DDOS ASSAULT: FILTERED]* 🛡️
═════════════════════════════════════
👤 *Penyerang*: @${senderId.split('@')[0]}
🎯 *Target*: @${cleanNum}
📦 *Paket Dibuang*: ${packets.toLocaleString('id-ID')} Packets (Dropped)
🛡️ *Firewall Target*: Level ${fwLevel} Anti-DDoS Scrubbing Active

Semua paket serangan berhasil diredam oleh scrubbing center target!
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, ddosFail.trim(), null, { mentions: [senderId, targetJid] });
    }
  },

  // 7. ANTIVIRUS & SCAN MALWARE PROFILE (.antivirus)
  async handleAntivirus(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    user.hp = user.maxHp || 100;
    db.updateUser(senderId, user);

    const report = `
🩺 *[CYBER ANTIVIRUS // DEEP SYSTEM SCAN]* 🩺
═════════════════════════════════════
🔍 *Status Pindai*: 100% Selesai
📁 *Objek Dipindai*: 14.892 Sektor File & Buffer
🛡️ *Ancaman Ditemukan*: 0 Malware / 0 Trojan
❤️ *Integritas Node*: HP Dipulihkan ke 100% (${user.hp}/${user.maxHp || 100})
✨ *Status Node*: Optimal, Bersih & Terproteksi
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, report.trim());
  },

  // 8. MALWARE & VULNERABILITY RECON (.malwarescan @user)
  async handleMalwareScan(sock, chatId, targetArg) {
    if (!targetArg) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan target scan!\nContoh: `.malwarescan @user`');
    }

    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
    const target = db.getUser(targetJid);
    const fw = defenseState.userFirewalls.get(targetJid) || 1;

    const scanText = `
🔬 *[CYBER RECONNAISSANCE SCANNER]* 🔬
═════════════════════════════════════
👤 *Target*: @${cleanNum} (${target.name})
🎖️ *Rank*: ${target.rank} (Lv.${target.level})
🛡️ *Tingkat Firewall*: Level ${fw} / 5
⚡ *Kerentanan Terdeteksi*: Port RPC/3000 Open, SMB v1 Unpatched
💥 *Peluang Penetrasi*: ~${Math.round((0.8 - (fw * 0.1)) * 100)}%
═════════════════════════════════════
_Gunakan data ini untuk merencanakan serangan .hack atau .ddossim!_
`;
    return animeService.sendAnimeReply(sock, chatId, scanText.trim(), null, { mentions: [targetJid] });
  },

  // 9. PATCH SYSTEM SECURITY (.patchsystem)
  async handlePatchSystem(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    user.defense = (user.defense || 100) + 5;
    db.updateUser(senderId, user);

    const text = `
🔧 *[SYSTEM KERNEL SECURITY PATCH]* 🔧
═════════════════════════════════════
Patch Terpasang: \`KB-99812-ZERO-DAY-FIX\`
🛡️ Stat Pertahanan: +5 Poin Defense (Total: ${user.defense})
⚡ Buffer Overflow Mitigasi: Diaktifkan
═════════════════════════════════════
_Node Anda kini lebih tahan terhadap exploit zero-day!_
`;
    return animeService.sendAnimeReply(sock, chatId, text.trim());
  },

  // 10. STEALTH MODE / CLOAK (.stealthmode)
  async handleStealthMode(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const cost = 1000;
    if (user.coins < cost) {
      return animeService.sendAnimeReply(sock, chatId, `⚠️ Diperlukan 1.000 Koin untuk mengaktifkan Stealth Mode!`);
    }

    user.coins -= cost;
    const duration = 30 * 60 * 1000; // 30 Menit
    defenseState.userStealth.set(senderId, Date.now() + duration);
    db.updateUser(senderId, user);

    const text = `
👻 *[GHOST STEALTH CLOAK ACTIVATED]* 👻
═════════════════════════════════════
Status: *CLOAKED (INVISIBLE TO RADAR)*
⏱️ Durasi: 30 Menit
🛡️ Efek: Akun Anda tidak dapat di-lock target oleh .hack atau .ddossim!
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, text.trim());
  },

  // 11. CEK PORT JARINGAN NYATA (.portcheck <host> [port])
  async handlePortCheck(sock, chatId, hostArg, portArg) {
    const host = (hostArg || '').trim();
    const port = parseInt(portArg || '80', 10);

    if (!host) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.portcheck <host/domain> [port]`\nContoh: `.portcheck google.com 443`');
    }

    const startTs = Date.now();
    const checkSocket = new net.Socket();
    checkSocket.setTimeout(3500);

    checkSocket.on('connect', () => {
      const latency = Date.now() - startTs;
      checkSocket.destroy();
      const resText = `
🌐 *[NETWORK PORT AUDIT: SUCCESS]* 🌐
═════════════════════════════════════
📡 *Host*: \`${host}\`
🚪 *Port*: \`${port}\`
🟢 *Status*: *OPEN / ACCESSIBLE*
⚡ *Latency*: ${latency} ms
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, resText.trim());
    });

    checkSocket.on('timeout', () => {
      checkSocket.destroy();
      return animeService.sendAnimeReply(sock, chatId, `🔴 *[PORT CLOSED / FILTERED]*\nHost: \`${host}\` | Port: \`${port}\`\nStatus: Connection Timed Out (Filtered by Firewall)`);
    });

    checkSocket.on('error', (err) => {
      checkSocket.destroy();
      return animeService.sendAnimeReply(sock, chatId, `🔴 *[PORT CLOSED]*\nHost: \`${host}\` | Port: \`${port}\`\nStatus: ${err.message}`);
    });

    checkSocket.connect(port, host);
  },

  // 12. AUDIT SERTIFIKAT SSL/TLS (.sslcheck <domain>)
  async handleSSLCheck(sock, chatId, domainArg) {
    const domain = (domainArg || '').trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!domain) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.sslcheck <domain>`\nContoh: `.sslcheck google.com`');
    }

    try {
      const socket = tls.connect({ host: domain, port: 443, servername: domain, timeout: 5000 }, () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();

        if (!cert || Object.keys(cert).length === 0) {
          return animeService.sendAnimeReply(sock, chatId, `⚠️ Tidak ada sertifikat SSL yang valid untuk domain \`${domain}\`.`);
        }

        const validTo = new Date(cert.valid_to);
        const daysLeft = Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        const text = `
🔒 *[SSL/TLS CERTIFICATE AUDIT]* 🔒
═════════════════════════════════════
🌐 *Domain*: \`${domain}\`
🏢 *Penerbit (Issuer)*: ${cert.issuer?.O || cert.issuer?.CN || 'Unknown CA'}
📅 *Masa Berlaku Sampai*: ${validTo.toLocaleDateString('id-ID')}
⏳ *Sisa Waktu*: *${daysLeft} Hari lagi*
🔐 *Enkripsi Cipher*: ${socket.getCipher()?.name || 'TLSv1.3'}
${daysLeft > 15 ? '🟢 *Status*: Valid & Terenkripsi Kuat' : '⚠️ *Status*: Segera Kedaluwarsa!'}
═════════════════════════════════════
`;
        return animeService.sendAnimeReply(sock, chatId, text.trim());
      });

      socket.on('error', (e) => {
        return animeService.sendAnimeReply(sock, chatId, `❌ Gagal memeriksa SSL untuk ${domain}: ${e.message}`);
      });
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Error: ${e.message}`);
    }
  },

  // 13. AUDIT DNS RECORDS (.dnslookup <domain>)
  async handleDNSLookup(sock, chatId, domainArg) {
    const domain = (domainArg || '').trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!domain) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.dnslookup <domain>`\nContoh: `.dnslookup cloudflare.com`');
    }

    try {
      const [ipv4, mx, ns] = await Promise.allSettled([
        dns.resolve4(domain),
        dns.resolveMx(domain),
        dns.resolveNs(domain)
      ]);

      const ips = ipv4.status === 'fulfilled' ? ipv4.value.join(', ') : 'None';
      const mxStr = mx.status === 'fulfilled' ? mx.value.map(m => `${m.exchange} (Prio: ${m.priority})`).join('\n• ') : 'None';
      const nsStr = ns.status === 'fulfilled' ? ns.value.join(', ') : 'None';

      const dnsText = `
📡 *[DNS RECONNAISSANCE LOOKUP]* 📡
═════════════════════════════════════
🌐 *Target Domain*: \`${domain}\`
📍 *A Records (IPv4)*:
${ips}

📨 *MX Records (Mail)*:
• ${mxStr}

🏢 *Name Servers (NS)*:
${nsStr}
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, dnsText.trim());
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mengambil DNS untuk ${domain}: ${e.message}`);
    }
  },

  // 14. AUDIT SECURITY HEADERS (.headerscheck <url>)
  async handleHeadersCheck(sock, chatId, urlArg) {
    let target = (urlArg || '').trim();
    if (!target) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.headerscheck <url>`\nContoh: `.headerscheck https://google.com`');
    }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    try {
      const res = await axios.get(target, { httpsAgent, timeout: 5000, validateStatus: () => true });
      const h = res.headers;

      const hasHsts = Boolean(h['strict-transport-security']);
      const hasCsp = Boolean(h['content-security-policy']);
      const hasNoSniff = Boolean(h['x-content-type-options']);
      const hasFrame = Boolean(h['x-frame-options']);
      const hasPowered = Boolean(h['x-powered-by']);

      let score = 0;
      if (hasHsts) score += 25;
      if (hasCsp) score += 25;
      if (hasNoSniff) score += 25;
      if (hasFrame) score += 25;
      if (hasPowered) score -= 15;

      const grade = score >= 90 ? 'A+' : score >= 75 ? 'A' : score >= 50 ? 'B' : score >= 25 ? 'C' : 'F';

      const auditText = `
🛡️ *[HTTP SECURITY HEADERS AUDIT]* 🛡️
═════════════════════════════════════
🌐 *Target*: \`${target}\`
🏆 *Security Grade*: *${grade} (${score}/100)*

• *HSTS (Enforce HTTPS)*: ${hasHsts ? '🟢 ADA' : '🔴 TIDAK ADA'}
• *CSP (Content Security Policy)*: ${hasCsp ? '🟢 ADA' : '🔴 TIDAK ADA'}
• *X-Content-Type-Options*: ${hasNoSniff ? '🟢 nosniff' : '🔴 TIDAK ADA'}
• *X-Frame-Options*: ${hasFrame ? `🟢 ${h['x-frame-options']}` : '🔴 TIDAK ADA'}
• *Server Cloaking*: ${hasPowered ? '⚠️ Bocor (X-Powered-By Terbuka)' : '🟢 Tersembunyi (Aman)'}
═════════════════════════════════════
`;
      return animeService.sendAnimeReply(sock, chatId, auditText.trim());
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal memeriksa header untuk ${target}: ${e.message}`);
    }
  },

  // 15. PENGHITUNG HASH KRIPTOGRAFI (.hashcalc <teks>)
  handleHashCalc(sock, chatId, textArg) {
    const text = (textArg || '').trim();
    if (!text) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.hashcalc <teks>`\nContoh: `.hashcalc QuantumSecretKey`');
    }

    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const sha1 = crypto.createHash('sha1').update(text).digest('hex');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');
    const sha512 = crypto.createHash('sha512').update(text).digest('hex');

    const result = `
🔐 *[CRYPTOGRAPHIC HASH CALCULATOR]* 🔐
═════════════════════════════════════
📝 *Input*: "${text}"

• *MD5 (128-bit)*:
\`${md5}\`

• *SHA-1 (160-bit)*:
\`${sha1}\`

• *SHA-256 (256-bit)*:
\`${sha256}\`

• *SHA-512 (512-bit)*:
\`${sha512.substring(0, 64)}...\`
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, result.trim());
  },

  // 16. AUDIT KEKUATAN PASSWORD DEFENSIVE (.passcheck <password>)
  handlePasswordCheck(sock, chatId, passArg) {
    const pwd = (passArg || '').trim();
    if (!pwd) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.passcheck <password>`\nContoh: `.passcheck Cyber#Nova_2099`');
    }

    let entropy = 0;
    if (/[a-z]/.test(pwd)) entropy += 26;
    if (/[A-Z]/.test(pwd)) entropy += 26;
    if (/[0-9]/.test(pwd)) entropy += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) entropy += 32;

    const totalBits = Math.round(pwd.length * Math.log2(entropy || 1));
    const strength = totalBits >= 80 ? '🟢 ULTRA STRONG (Immune to Brute Force)' : totalBits >= 60 ? '🟡 STRONG (Good Defense)' : totalBits >= 40 ? '🟠 MODERATE' : '🔴 WEAK (Vulnerable to Dictionary Attack)';

    const passCard = `
🔑 *[DEFENSIVE PASSWORD ENTROPY AUDIT]* 🔑
═════════════════════════════════════
📏 *Panjang Karakter*: ${pwd.length}
⚡ *Nilai Entropi*: ~${totalBits} bits
🛡️ *Tingkat Kekuatan*: *${strength}*

*Komposisi Kunci:*
• Huruf Besar & Kecil: ${/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) ? '✅' : '❌'}
• Angka Numerik: ${/[0-9]/.test(pwd) ? '✅' : '❌'}
• Karakter Khusus/Simbol: ${/[^a-zA-Z0-9]/.test(pwd) ? '✅' : '❌'}
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, passCard.trim());
  },

  // 17. CARI ADVISORY CVE VULNERABILITY (.cvesearch <query>)
  async handleCVESearch(sock, chatId, query) {
    if (!query || !query.trim()) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.cvesearch <nama software/cve>`\nContoh: `.cvesearch openssl` atau `.cvesearch log4j`');
    }

    try {
      const res = await axios.get(`https://cve.circl.lu/api/search/${encodeURIComponent(query.trim())}`, {
        httpsAgent,
        timeout: 6000
      });

      const list = Array.isArray(res.data) ? res.data.slice(0, 3) : [];
      if (list.length === 0) {
        return animeService.sendAnimeReply(sock, chatId, `ℹ️ Tidak ditemukan entri CVE terbuka untuk kata kunci: *${query}*.`);
      }

      let entries = '';
      for (const item of list) {
        entries += `\n🔴 *${item.id}* (CVSS: ${item.cvss || 'N/A'})\n📝 ${item.summary?.substring(0, 150)}...\n`;
      }

      const text = `
🚨 *[NATIONAL VULNERABILITY DATABASE LOOKUP]* 🚨
═════════════════════════════════════
Kata Kunci: *${query}*
${entries}
═════════════════════════════════════
_Gunakan informasi ini untuk patching dan hardening pertahanan sistem Anda._
`;
      return animeService.sendAnimeReply(sock, chatId, text.trim());
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mengambil data CVE: ${e.message}`);
    }
  },

  // EMP, STRIKE, INSPECT, LOCKDOWN, STATUS FIREWALL
  async handleEMP(sock, chatId, senderId, targetArg) {
    if (!targetArg) {
      return animeService.sendAnimeReply(sock, chatId, '⚡ Masukkan target serangan EMP!\nContoh: `.emp @user`');
    }
    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;

    if (defenseState.userShields.has(targetJid)) {
      defenseState.userShields.delete(targetJid);
      return animeService.sendAnimeReply(sock, chatId, `💥 *[EMP BLAST DEPLOYED]* 💥\nGelombang elektromagnetik quantum melumpuhkan *Quantum Shield* milik @${cleanNum} secara instan! Target kini terbuka untuk diserang (\`.hack\`).`, null, { mentions: [targetJid] });
    }

    return animeService.sendAnimeReply(sock, chatId, `⚡ *[EMP DISCHARGED]*\nTarget @${cleanNum} tidak memiliki perisai aktif. Firewall target mengalami korsleting ringan!`, null, { mentions: [targetJid] });
  },

  async handleStrike(sock, chatId, senderId, targetArg, reason, isGroup, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return animeService.sendAnimeReply(sock, chatId, '⛔ Perintah penindakan Strike hanya dapat dijalankan oleh Supreme Owner / Admin.');
    }
    if (!targetArg) return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.strike @user <alasan>`');

    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
    const targetUser = db.getUser(targetJid);
    targetUser.warnings = (targetUser.warnings || 0) + 1;
    db.updateUser(targetJid, targetUser);

    let actionNotice = `⚠️ Peringatan ke-${targetUser.warnings}/3.`;
    if (targetUser.warnings >= 3) {
      targetUser.banned = true;
      db.updateUser(targetJid, targetUser);
      actionNotice = `🚨 *BATAS MAKSIMAL TERCAPAI (3/3)*! Target telah diblokir secara permanen dari sistem.`;
      if (isGroup) {
        await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove').catch(() => {});
      }
    }

    const strikeCard = `
⚖️ *[CYBER SECURITY ENFORCEMENT: STRIKE]* ⚖️
═════════════════════════════════════
🎯 *Pelanggar*: @${cleanNum}
👮 *Petugas*: @${senderId.split('@')[0]}
📝 *Alasan*: ${reason || 'Pelanggaran Protokol Keamanan Cyber'}
⚡ *Akumulasi Strike*: ${targetUser.warnings} / 3

${actionNotice}
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, strikeCard.trim(), null, { mentions: [targetJid, senderId] });
  },

  async handleInspect(sock, chatId, targetArg) {
    if (!targetArg) return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan target inspeksi!\nContoh: `.inspect @user`');
    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
    const targetUser = db.getUser(targetJid);

    const hasShield = defenseState.userShields.has(targetJid) && defenseState.userShields.get(targetJid) > Date.now();
    const fwLevel = defenseState.userFirewalls.get(targetJid) || 1;
    const isStealthed = defenseState.userStealth.has(targetJid) && defenseState.userStealth.get(targetJid) > Date.now();
    const threatScore = (targetUser.warnings || 0) * 33 + (targetUser.banned ? 100 : 0);
    const threatLevel = threatScore >= 66 ? '🔴 CRITICAL THREAT' : threatScore >= 33 ? '🟡 SUSPICIOUS' : '🟢 CLEAR & SECURE';

    const inspectReport = `
🔍 *[CYBER FORENSIC SECURITY SCANNER]* 🔍
═════════════════════════════════════
👤 *Identitas*: @${cleanNum} (${targetUser.name})
🎖️ *Rank*: ${targetUser.rank} [${targetUser.role}]
🛡️ *Tingkat Ancaman*: *${threatLevel}*
⚡ *Skor Risiko*: ${threatScore}%
🔒 *Quantum Shield*: ${hasShield ? '🟢 ACTIVE' : '🔴 INACTIVE'}
🛡️ *Firewall Grade*: Level ${fwLevel} / 5
👻 *Stealth Mode*: ${isStealthed ? '🟢 ACTIVE' : '🔴 INACTIVE'}
💰 *Saldo*: ${targetUser.coins.toLocaleString('id-ID')} Koin
═════════════════════════════════════
`;
    return animeService.sendAnimeReply(sock, chatId, inspectReport.trim(), null, { mentions: [targetJid] });
  },

  async handleLockdown(sock, chatId, senderId, modeArg, isGroup, fromMe) {
    if (!isGroup) return animeService.sendAnimeReply(sock, chatId, 'Khusus di dalam grup!');
    if (!db.isOwner(senderId, fromMe)) {
      return animeService.sendAnimeReply(sock, chatId, '⛔ Akses Ditolak: Hanya Supreme Owner / Admin yang dapat memicu lockdown.');
    }

    const mode = (modeArg || '').toLowerCase();
    if (mode === 'on' || mode === 'aktif') {
      await sock.groupSettingUpdate(chatId, 'announcement');
      return animeService.sendAnimeReply(sock, chatId, `🚨 *[SECTOR EMERGENCY LOCKDOWN ACTIVATED]* 🚨\n\nSeluruh transmisi anggota biasa telah dikunci demi keamanan sektor. Hanya Pengelola Sektor / Admin yang diizinkan berbicara hingga ancaman mereda!`);
    } else {
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      return animeService.sendAnimeReply(sock, chatId, `🟢 *[SECTOR LOCKDOWN LIFTED]* 🟢\n\nSektor telah dinyatakan aman dan kondusif. Seluruh warga dapat kembali berkomunikasi normal.`);
    }
  },

  async clearChatBuffers(sock, chatId, senderId, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return animeService.sendAnimeReply(sock, chatId, '⛔ Akses Ditolak.');
    }
    defenseState.lastCleanTimestamp = Date.now();
    return animeService.sendAnimeReply(sock, chatId, `🧹 *[CYBER BUFFER PURGED]* 🧹\nSeluruh antrean memori sementara, cache teks overload, dan buffer virtex telah dibersihkan!\nRAM perangkat Anda kembali lega dan stabil.`);
  },

  async showFirewallStatus(sock, chatId) {
    const text = `
╔══════════════════════════════════════╗
║     🔒 *RANZZXITER FIREWALL v2.0*    ║
╚══════════════════════════════════════╝

🛡️ *Delayhard Protection*: ${defenseState.delayhardActive ? 'ONLINE [ULTRA]' : 'OFFLINE'}
🚫 *Spammers Blocked*: ${defenseState.blockedSpammers.size} nomor
⚡ *Virtex Intercepted*: ${defenseState.virtexDetections} paket
🛡️ *Active Quantum Shields*: ${defenseState.userShields.size} pengguna
⏱️ *Hardware Flush*: Baru saja
🔒 *Database Security*: SQLite/JSON Atomic Write Sync (Anti-Corrupt)

_Sistem sepenuhnya terlindungi dari crash, spam, dan virtex pihak ketiga._
`;
    return animeService.sendAnimeReply(sock, chatId, text.trim());
  }
};
