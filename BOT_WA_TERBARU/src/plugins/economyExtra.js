const axios = require('axios');
const https = require('https');
const db = require('../database/db');
const animeService = require('../services/animeService');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

module.exports = {
  // 1. CEK SALDO BANK (.bank)
  handleBank(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    user.bank = user.bank || 0;

    // Bunga bank 2% per 24 jam
    const now = Date.now();
    const lastInterest = user.bankInterestLast || now;
    if (now - lastInterest > 24 * 60 * 60 * 1000 && user.bank > 0) {
      const interestEarned = Math.floor(user.bank * 0.02);
      user.bank += interestEarned;
      user.bankInterestLast = now;
      db.updateUser(senderId, user);
    }

    const text = `
🏦 *[CYBER VAULT BANKING CENTER]* 🏦
═════════════════════════════════════
👤 *Nasabah*: ${user.name}
💰 *Dompet Tunai*: ${(user.coins || 0).toLocaleString('id-ID')} Koin
🔒 *Brankas Bank*: ${(user.bank || 0).toLocaleString('id-ID')} Koin
📈 *Bunga Harian*: 2.0% per 24 Jam
🛡️ *Status Brankas*: 100% Kebal dari Peretasan \`.hack\`

*Aksi:*
• \`.deposit <jumlah>\` - Simpan koin ke bank
• \`.withdraw <jumlah>\` - Tarik koin ke dompet
═════════════════════════════════════
`.trim();
    return animeService.sendAnimeReply(sock, chatId, text);
  },

  // 2. SETOR KE BANK (.deposit <amount>)
  handleDeposit(sock, chatId, senderId, amountArg) {
    const user = db.getUser(senderId);
    user.bank = user.bank || 0;
    let amount = 0;

    if (amountArg === 'all' || amountArg === 'semua') {
      amount = user.coins;
    } else {
      amount = parseInt(amountArg, 10);
    }

    if (isNaN(amount) || amount <= 0) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan jumlah koin valid!\nContoh: `.deposit 5000` atau `.deposit all`');
    }

    if (user.coins < amount) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Saldo koin dompet tidak mencukupi! (Saldo: ${user.coins.toLocaleString('id-ID')})`);
    }

    user.coins -= amount;
    user.bank += amount;
    db.updateUser(senderId, user);

    return animeService.sendAnimeReply(sock, chatId, `
✅ *[SETORAN BERHASIL]*
Berhasil menyetor +${amount.toLocaleString('id-ID')} Koin ke brankas bank!
🔒 Saldo Brankas Sekarang: ${user.bank.toLocaleString('id-ID')} Koin
`.trim());
  },

  // 3. TARIK DARI BANK (.withdraw <amount>)
  handleWithdraw(sock, chatId, senderId, amountArg) {
    const user = db.getUser(senderId);
    user.bank = user.bank || 0;
    let amount = 0;

    if (amountArg === 'all' || amountArg === 'semua') {
      amount = user.bank;
    } else {
      amount = parseInt(amountArg, 10);
    }

    if (isNaN(amount) || amount <= 0) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan jumlah koin valid!\nContoh: `.withdraw 5000` atau `.withdraw all`');
    }

    if (user.bank < amount) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Saldo brankas tidak cukup! (Isi Brankas: ${user.bank.toLocaleString('id-ID')})`);
    }

    user.bank -= amount;
    user.coins += amount;
    db.updateUser(senderId, user);

    return animeService.sendAnimeReply(sock, chatId, `
✅ *[PENARIKAN BERHASIL]*
Berhasil menarik +${amount.toLocaleString('id-ID')} Koin ke dompet tunai!
💰 Saldo Dompet Sekarang: ${user.coins.toLocaleString('id-ID')} Koin
`.trim());
  },

  // 4. CEK HARGA KRIPTO LIVE (.crypto)
  async handleCrypto(sock, chatId) {
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,tether&vs_currencies=idr,usd', {
        httpsAgent,
        timeout: 5000
      });
      const d = res.data;

      const text = `
🪙 *[LIVE CRYPTO MARKET RADAR]* 🪙
═════════════════════════════════════
₿ *Bitcoin (BTC)*:
• Rp ${(d.bitcoin?.idr || 0).toLocaleString('id-ID')} ($${(d.bitcoin?.usd || 0).toLocaleString('en-US')})

Ξ *Ethereum (ETH)*:
• Rp ${(d.ethereum?.idr || 0).toLocaleString('id-ID')} ($${(d.ethereum?.usd || 0).toLocaleString('en-US')})

◎ *Solana (SOL)*:
• Rp ${(d.solana?.idr || 0).toLocaleString('id-ID')} ($${(d.solana?.usd || 0).toLocaleString('en-US')})

🟡 *Binance Coin (BNB)*:
• Rp ${(d.binancecoin?.idr || 0).toLocaleString('id-ID')} ($${(d.binancecoin?.usd || 0).toLocaleString('en-US')})
═════════════════════════════════════
_Data real-time di-feed langsung dari CoinGecko Matrix._
`.trim();
      return animeService.sendAnimeReply(sock, chatId, text);
    } catch (e) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mengambil harga kripto pasar: ${e.message}`);
    }
  },

  // 5. KERJA FREELANCE CYBER (.work)
  handleWork(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const now = Date.now();
    const cooldown = 5 * 60 * 1000; // 5 Menit

    if (now - (user.lastWork || 0) < cooldown) {
      const remainingSec = Math.ceil((cooldown - (now - user.lastWork)) / 1000);
      return animeService.sendAnimeReply(sock, chatId, `⏳ Anda masih lelah setelah bekerja! Istirahatlah selama ${remainingSec} detik lagi.`);
    }

    const JOBS = [
      { role: 'Ethical Hacker', pay: 3500, xp: 45, desc: 'Menemukan bug critical pada sistem bank!' },
      { role: 'Frontend Engineer', pay: 2800, xp: 35, desc: 'Membangun dashboard UI cyberpunk futuristik!' },
      { role: 'Cyber Forensic Analyst', pay: 3200, xp: 40, desc: 'Melacak jejak sindikat spammer internasional!' },
      { role: 'Smart Contract Auditor', pay: 4000, xp: 50, desc: 'Mengaudit keamanan blockchain token!' },
      { role: 'Sysadmin VPS', pay: 2500, xp: 30, desc: 'Mengonfigurasi firewall dan Cloudflare Tunnel!' }
    ];

    const pick = JOBS[Math.floor(Math.random() * JOBS.length)];
    user.coins += pick.pay;
    user.xp += pick.xp;
    user.lastWork = now;
    db.updateUser(senderId, user);

    const report = `
💼 *[CYBER FREELANCE WORK COMPLETED]* 💼
═════════════════════════════════════
🛠️ *Profesi*: ${pick.role}
📝 *Tugas*: ${pick.desc}
💰 *Gaji Diterima*: +${pick.pay.toLocaleString('id-ID')} Koin Cyber
⚡ *Pengalaman*: +${pick.xp} EXP
═════════════════════════════════════
_Kembali lagi dalam 5 menit untuk mengambil kontrak kerja baru._
`.trim();
    return animeService.sendAnimeReply(sock, chatId, report);
  },

  // 6. MINTA-MINTA KOIN DARURAT (.beg)
  handleBeg(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const now = Date.now();
    const cooldown = 3 * 60 * 1000;

    if (now - (user.lastBeg || 0) < cooldown) {
      return animeService.sendAnimeReply(sock, chatId, '⏳ Jangan terlalu sering mengemis! Tunggu sebentar lagi.');
    }

    const gotLoot = Math.random() < 0.7;
    user.lastBeg = now;

    if (gotLoot) {
      const loot = Math.floor(Math.random() * 800) + 200;
      user.coins += loot;
      db.updateUser(senderId, user);
      return animeService.sendAnimeReply(sock, chatId, `🥺 Seorang dermawan siber kasihan melihatmu dan memberimu +${loot} Koin!`);
    } else {
      return animeService.sendAnimeReply(sock, chatId, `❌ Orang-orang mengabaikanmu... Kamu tidak mendapatkan koin apa pun kali ini.`);
    }
  },

  // 7. ROB / COPET KOIN USER LAIN (.rob @user)
  handleRob(sock, chatId, senderId, targetArg) {
    if (!targetArg) return animeService.sendAnimeReply(sock, chatId, '⚠️ Format: `.rob @user`');
    const attacker = db.getUser(senderId);
    const cleanNum = targetArg.replace(/[^0-9]/g, '');
    const targetJid = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;

    if (targetJid === senderId) return animeService.sendAnimeReply(sock, chatId, '❌ Kamu tidak bisa mencopet dirimu sendiri!');

    const defender = db.getUser(targetJid);
    if (defender.coins < 1000) {
      return animeService.sendAnimeReply(sock, chatId, `Target @${cleanNum} terlalu miskin untuk dicopet (koin di bawah 1.000).`, null, { mentions: [targetJid] });
    }

    const now = Date.now();
    if (now - (attacker.lastRob || 0) < 10 * 60 * 1000) {
      return animeService.sendAnimeReply(sock, chatId, '⏳ Tunggu 10 menit sebelum melakukan aksi pencopetan berikutnya!');
    }
    attacker.lastRob = now;

    // Peluang berhasil 45%
    const success = Math.random() < 0.45;
    if (success) {
      const stolen = Math.floor(Math.random() * 2500) + 500;
      const actual = Math.min(defender.coins, stolen);
      defender.coins -= actual;
      attacker.coins += actual;
      db.updateUser(senderId, attacker);
      db.updateUser(targetJid, defender);

      return animeService.sendAnimeReply(sock, chatId, `
🥷 *[AKSI PENCOPETAN BERHASIL]* 🥷
Kamu berhasil menyelinap dan mencopet +${actual.toLocaleString('id-ID')} Koin dari kantong @${cleanNum}!
`.trim(), null, { mentions: [targetJid] });
    } else {
      const fine = Math.min(attacker.coins, 1000);
      attacker.coins -= fine;
      db.updateUser(senderId, attacker);

      return animeService.sendAnimeReply(sock, chatId, `
👮 *[TERCIDUK POLISI SIBER]* 👮
Aksimu mencopet @${cleanNum} gagal! Kamu tertangkap basah dan didenda -${fine.toLocaleString('id-ID')} Koin!
`.trim(), null, { mentions: [targetJid] });
    }
  },

  // 8. BLACKJACK CARD GAME (.blackjack <bet>)
  handleBlackjack(sock, chatId, senderId, betArg) {
    const user = db.getUser(senderId);
    const bet = parseInt(betArg, 10) || 500;

    if (user.coins < bet) {
      return animeService.sendAnimeReply(sock, chatId, `⚠️ Saldo koinmu tidak cukup untuk taruhan ${bet.toLocaleString('id-ID')} Koin!`);
    }

    // Hitung kartu pemain (16-21) vs dealer (15-21)
    const playerCard1 = Math.floor(Math.random() * 10) + 2;
    const playerCard2 = Math.floor(Math.random() * 10) + 2;
    const playerTotal = playerCard1 + playerCard2;

    const dealerTotal = Math.floor(Math.random() * 7) + 15;

    let result = '';
    if (playerTotal > dealerTotal && playerTotal <= 21) {
      user.coins += bet;
      result = `🎉 *KAMU MENANG!* (+${bet.toLocaleString('id-ID')} Koin)`;
    } else if (playerTotal === dealerTotal) {
      result = `🤝 *SERI (PUSH)!* Koin taruhan dikembalikan.`;
    } else {
      user.coins -= bet;
      result = `💀 *DEALER MENANG!* (-${bet.toLocaleString('id-ID')} Koin)`;
    }
    db.updateUser(senderId, user);

    const card = `
🃏 *[BLACKJACK 21 CASINO TABLE]* 🃏
═════════════════════════════════════
👤 *Kartu Kamu*: [${playerCard1}] + [${playerCard2}] = *${playerTotal}*
🤖 *Kartu Dealer*: *${dealerTotal}*
💰 *Taruhan*: ${bet.toLocaleString('id-ID')} Koin

${result}
═════════════════════════════════════
`.trim();
    return animeService.sendAnimeReply(sock, chatId, card);
  }
};
