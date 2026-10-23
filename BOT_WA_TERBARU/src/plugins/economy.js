const db = require('../database/db');

module.exports = {
  // === 1. TAMBAH KOIN (KHUSUS OWNER / ADMIN) ===
  async addCoins(sock, chatId, senderId, targetJid, amount) {
    const caller = db.getUser(senderId);
    if (caller.role !== 'OWNER' && caller.role !== 'ADMIN') {
      return sock.sendMessage(chatId, {
        text: `⛔ *AKSES DITOLAK!* Hanya Owner atau Admin bot yang dapat menambahkan koin!`
      });
    }

    if (!targetJid || isNaN(amount) || amount <= 0) {
      return sock.sendMessage(chatId, {
        text: `💡 *Format:* \`.addcoin @user <jumlah>\`\nContoh: \`.addcoin @628123456789 50000\``
      });
    }

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const targetUser = db.getUser(cleanTarget);
    targetUser.coins += amount;
    db.updateUser(cleanTarget, targetUser);

    return sock.sendMessage(chatId, {
      text: `
💳 *[INJEKSI SALDO CYBER BERHASIL]* 💳
══════════════════════════════
Otoritas: *${caller.role}* (@${senderId.split('@')[0]})
Penerima: @${cleanTarget.split('@')[0]}
💰 Saldo Ditambahkan: *+${amount.toLocaleString('id-ID')} Koin*
💳 Total Saldo Sekarang: *${targetUser.coins.toLocaleString('id-ID')} Koin*
══════════════════════════════
`,
      mentions: [senderId, cleanTarget]
    });
  },

  // === 2. KURANGI KOIN (KHUSUS OWNER / ADMIN) ===
  async deductCoins(sock, chatId, senderId, targetJid, amount) {
    const caller = db.getUser(senderId);
    if (caller.role !== 'OWNER' && caller.role !== 'ADMIN') {
      return sock.sendMessage(chatId, { text: `⛔ Hanya Owner atau Admin yang berhak memotong saldo!` });
    }

    if (!targetJid || isNaN(amount) || amount <= 0) {
      return sock.sendMessage(chatId, { text: `💡 *Format:* \`.delcoin @user <jumlah>\`` });
    }

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const targetUser = db.getUser(cleanTarget);
    targetUser.coins = Math.max(0, targetUser.coins - amount);
    db.updateUser(cleanTarget, targetUser);

    return sock.sendMessage(chatId, {
      text: `
💸 *[PENARIKAN SALDO CYBER]* 💸
Otoritas: *${caller.role}*
Penerima: @${cleanTarget.split('@')[0]}
📉 Pemotongan: *-${amount.toLocaleString('id-ID')} Koin*
💳 Sisa Saldo: *${targetUser.coins.toLocaleString('id-ID')} Koin*
`,
      mentions: [cleanTarget]
    });
  },

  // === 3. SET KOIN (KHUSUS OWNER) ===
  async setCoins(sock, chatId, senderId, targetJid, amount) {
    const caller = db.getUser(senderId);
    if (caller.role !== 'OWNER') {
      return sock.sendMessage(chatId, { text: `⛔ Perintah ini khusus untuk *OWNER UTAMA*!` });
    }

    if (!targetJid || isNaN(amount) || amount < 0) {
      return sock.sendMessage(chatId, { text: `💡 *Format:* \`.setcoin @user <jumlah_koin_baru>\`` });
    }

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const targetUser = db.getUser(cleanTarget);
    targetUser.coins = amount;
    db.updateUser(cleanTarget, targetUser);

    return sock.sendMessage(chatId, {
      text: `✅ Saldo koin @${cleanTarget.split('@')[0]} telah diatur menjadi *${amount.toLocaleString('id-ID')} Koin* oleh Owner!`,
      mentions: [cleanTarget]
    });
  },

  // === 4. TAMBAH EXP (KHUSUS OWNER / ADMIN) ===
  async addXP(sock, chatId, senderId, targetJid, amount) {
    const caller = db.getUser(senderId);
    if (caller.role !== 'OWNER' && caller.role !== 'ADMIN') return;

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const targetUser = db.getUser(cleanTarget);
    targetUser.xp += amount;
    db.updateUser(cleanTarget, targetUser);

    return sock.sendMessage(chatId, {
      text: `⚡ Berhasil menambahkan *+${amount} EXP* kepada @${cleanTarget.split('@')[0]}!`,
      mentions: [cleanTarget]
    });
  },

  // === 5. SET ROLE USER ===
  async setRole(sock, chatId, senderId, targetJid, roleName) {
    const caller = db.getUser(senderId);
    if (caller.role !== 'OWNER') {
      return sock.sendMessage(chatId, { text: `⛔ Hanya *OWNER* yang dapat mengubah status peran / role!` });
    }

    const validRoles = ['OWNER', 'ADMIN', 'VIP', 'CITIZEN'];
    const chosenRole = (roleName || '').toUpperCase();
    if (!validRoles.includes(chosenRole)) {
      return sock.sendMessage(chatId, {
        text: `💡 Role yang tersedia: \`OWNER\`, \`ADMIN\`, \`VIP\`, \`CITIZEN\``
      });
    }

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const targetUser = db.getUser(cleanTarget);
    targetUser.role = chosenRole;
    db.updateUser(cleanTarget, targetUser);

    return sock.sendMessage(chatId, {
      text: `🎖️ Status kewarganegaraan @${cleanTarget.split('@')[0]} kini resmi diubah menjadi *[${chosenRole}]*!`,
      mentions: [cleanTarget]
    });
  },

  // === 6. TRANSFER KOIN ANTAR USER ===
  async transferCoins(sock, chatId, senderId, targetJid, amount) {
    if (!targetJid || isNaN(amount) || amount <= 0) {
      return sock.sendMessage(chatId, {
        text: `💡 *Format:* \`.transfer @user <jumlah>\`\nContoh: \`.transfer @6281234567 1000\``
      });
    }

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (cleanTarget === senderId) {
      return sock.sendMessage(chatId, { text: `❌ Kamu tidak bisa mentransfer koin ke dirimu sendiri!` });
    }

    const sender = db.getUser(senderId);
    const tax = Math.ceil(amount * 0.05); // Pajak 5%
    const totalDeduction = amount + tax;

    if (sender.coins < totalDeduction) {
      return sock.sendMessage(chatId, {
        text: `❌ Saldo koin tidak mencukupi! Diperlukan *${totalDeduction.toLocaleString('id-ID')} Koin* (termasuk biaya transfer 5% sebesar ${tax} koin). Saldomu: *${sender.coins}*.`
      });
    }

    const recipient = db.getUser(cleanTarget);
    sender.coins -= totalDeduction;
    recipient.coins += amount;

    db.updateUser(senderId, sender);
    db.updateUser(cleanTarget, recipient);

    return sock.sendMessage(chatId, {
      text: `
💸 *[TRANSFER KOIN BERHASIL]* 💸
══════════════════════════════
Pengirim: @${senderId.split('@')[0]}
Penerima: @${cleanTarget.split('@')[0]}
💰 Nominal Diterima: *+${amount.toLocaleString('id-ID')} Koin*
🏛️ Biaya Jaringan (5%): *${tax} Koin*
💳 Sisa Saldo Pengirim: *${sender.coins.toLocaleString('id-ID')} Koin*
══════════════════════════════
`,
      mentions: [senderId, cleanTarget]
    });
  },

  // === 7. CYBER SHOP (TOKO) ===
  async showShop(sock, chatId) {
    const text = `
🛒 *[CYBERNETIC BLACK MARKET]* 🛒
═══════════════════════════════
Gunakan koinmu untuk memperkuat karakter & status:

1. 🛡️ *[shield]* - Cyber Defense Barrier (+15 Defense)
   💰 Harga: 2,500 Koin | Ketik: \`.buy shield\`

2. 💉 *[stimpack]* - Nano Healing Syringe (+50 Max HP)
   💰 Harga: 3,000 Koin | Ketik: \`.buy stimpack\`

3. ⚔️ *[katana]* - Plasma Laser Katana (+25 Attack Power)
   💰 Harga: 5,000 Koin | Ketik: \`.buy katana\`

4. 🎫 *[lottery]* - Quantum Lottery Ticket (Peluang Jackpot Koin)
   💰 Harga: 1,000 Koin | Ketik: \`.buy lottery\`

5. 🌟 *[vip]* - VIP Badge Title (Akses Otoritas Spesial)
   💰 Harga: 25,000 Koin | Ketik: \`.buy vip\`
═══════════════════════════════
Ketik *.buy <nama_item>* untuk membeli!
`;
    return sock.sendMessage(chatId, { text: text.trim() });
  },

  // === 8. BELI ITEM TOKO ===
  async buyItem(sock, chatId, senderId, itemCode) {
    if (!itemCode) {
      return sock.sendMessage(chatId, { text: `💡 Ketik \`.shop\` untuk melihat katalog barang yang bisa dibeli!` });
    }

    const user = db.getUser(senderId);
    const code = itemCode.toLowerCase();

    switch (code) {
      case 'shield':
        if (user.coins < 2500) return this.notEnoughCoins(sock, chatId, 2500, user.coins);
        user.coins -= 2500;
        user.defense += 15;
        user.inventory.push('Cyber Defense Barrier');
        db.updateUser(senderId, user);
        return sock.sendMessage(chatId, { text: `🛡️ Sukses membeli *Cyber Defense Barrier*! Pertahananmu bertambah +15 DEF.` });

      case 'stimpack':
        if (user.coins < 3000) return this.notEnoughCoins(sock, chatId, 3000, user.coins);
        user.coins -= 3000;
        user.maxHp += 50;
        user.hp = user.maxHp;
        user.inventory.push('Nano Healing Syringe');
        db.updateUser(senderId, user);
        return sock.sendMessage(chatId, { text: `💉 Sukses membeli *Nano Healing Syringe*! Max HP bertambah +50.` });

      case 'katana':
        if (user.coins < 5000) return this.notEnoughCoins(sock, chatId, 5000, user.coins);
        user.coins -= 5000;
        user.attack += 25;
        user.inventory.push('Plasma Laser Katana');
        db.updateUser(senderId, user);
        return sock.sendMessage(chatId, { text: `⚔️ Sukses membeli *Plasma Laser Katana*! Seranganmu bertambah +25 ATK.` });

      case 'lottery': {
        if (user.coins < 1000) return this.notEnoughCoins(sock, chatId, 1000, user.coins);
        user.coins -= 1000;
        const winChance = Math.random();
        let reward = 0;
        if (winChance > 0.8) {
          reward = 10000;
          user.coins += reward;
          db.updateUser(senderId, user);
          return sock.sendMessage(chatId, { text: `🎉 *SUPER HOKI!* Tiketmu tembus hadiah utama +10,000 Koin!` });
        } else if (winChance > 0.4) {
          reward = 2000;
          user.coins += reward;
          db.updateUser(senderId, user);
          return sock.sendMessage(chatId, { text: `✨ Selamat! Kamu memenangkan hadiah sampingan +2,000 Koin!` });
        } else {
          db.updateUser(senderId, user);
          return sock.sendMessage(chatId, { text: `💀 Sayang sekali tiketmu belum beruntung. Coba lagi lain waktu!` });
        }
      }

      case 'vip':
        if (user.coins < 25000) return this.notEnoughCoins(sock, chatId, 25000, user.coins);
        user.coins -= 2500;
        user.role = 'VIP';
        user.rank = 'Elite VIP Traveler';
        db.updateUser(senderId, user);
        return sock.sendMessage(chatId, { text: `🌟 Selamat! Akunmu telah ditingkatkan menjadi anggota *VIP CITIZEN*!` });

      default:
        return sock.sendMessage(chatId, { text: `❌ Item *${code}* tidak ditemukan di toko! Ketik \`.shop\` untuk daftar item.` });
    }
  },

  notEnoughCoins(sock, chatId, price, userCoins) {
    return sock.sendMessage(chatId, {
      text: `❌ Koin tidak cukup! Harga: *${price.toLocaleString('id-ID')}*, Saldomu: *${userCoins.toLocaleString('id-ID')}*.`
    });
  }
};
