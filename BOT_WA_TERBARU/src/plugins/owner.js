const db = require('../database/db');
const config = require('../config');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  // 1. EVAL CODE (JAVASCRIPT RUNNER LIVE)
  async evalCode(sock, chatId, senderId, code, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return sock.sendMessage(chatId, { text: `⛔ Akses ditolak! Perintah khusus *OWNER*.` });
    }

    if (!code) {
      return sock.sendMessage(chatId, { text: `💡 Format: \`.eval <kode javascript>\`` });
    }

    try {
      let evaled = await eval(code);
      if (typeof evaled !== 'string') {
        evaled = require('util').inspect(evaled, { depth: 2 });
      }
      return sock.sendMessage(chatId, {
        text: `⚡ *[EVAL OUTPUT]* ⚡\n\`\`\`js\n${evaled}\n\`\`\``
      });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ *[EVAL ERROR]* ❌\n\`\`\`js\n${err.message}\n\`\`\``
      });
    }
  },

  // 2. EXEC SHELL COMMAND
  async execCommand(sock, chatId, senderId, cmd, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return sock.sendMessage(chatId, { text: `⛔ Akses ditolak! Perintah khusus *OWNER*.` });
    }

    if (!cmd) {
      return sock.sendMessage(chatId, { text: `💡 Format: \`.exec <perintah shell / powershell>\`` });
    }

    exec(cmd, { timeout: 15000 }, (error, stdout, stderr) => {
      const output = stdout || stderr || (error ? error.message : 'Selesai tanpa output.');
      return sock.sendMessage(chatId, {
        text: `💻 *[TERMINAL SHELL EXEC]* 💻\n\`\`\`bash\n${output.trim().substring(0, 2000)}\n\`\`\``
      });
    });
  },

  // 3. BACKUP DATABASE KE CHAT WA
  async backupDatabase(sock, chatId, senderId, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    try {
      const usersPath = path.resolve('./data/users.json');
      const settingsPath = path.resolve('./data/settings.json');
      const groupsPath = path.resolve('./data/groups.json');

      if (fs.existsSync(usersPath)) {
        await sock.sendMessage(chatId, {
          document: fs.readFileSync(usersPath),
          fileName: 'users_backup.json',
          mimetype: 'application/json',
          caption: '📦 Backup Data Pengguna (users.json)'
        });
      }
      if (fs.existsSync(settingsPath)) {
        await sock.sendMessage(chatId, {
          document: fs.readFileSync(settingsPath),
          fileName: 'settings_backup.json',
          mimetype: 'application/json',
          caption: '📦 Backup Setelan Bot (settings.json)'
        });
      }
      return sock.sendMessage(chatId, {
        text: `✅ Seluruh basis data ${config.BOT_NAME} berhasil dicadangkan dan dikirim!`
      });
    } catch (err) {
      return sock.sendMessage(chatId, { text: `❌ Gagal mengirim backup: ${err.message}` });
    }
  },

  // 4. BROADCAST SEMUA GRUP
  async broadcastAll(sock, chatId, senderId, text, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    if (!text) {
      return sock.sendMessage(chatId, { text: `💡 Format: \`.broadcast <pesan pengumuman>\`` });
    }

    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupJids = Object.keys(groups);
      let sentCount = 0;

      const formatted = `📢 *[CYBER OWNER ANNOUNCEMENT]* 📢\n══════════════════════════════\n\n${text}\n\n══════════════════════════════\n_⚡ Ditransmisikan langsung oleh Supreme Commander_`;

      for (const jid of groupJids) {
        try {
          await sock.sendMessage(jid, { text: formatted });
          sentCount += 1;
          await new Promise(r => setTimeout(r, 1200));
        } catch (e) {}
      }

      return sock.sendMessage(chatId, {
        text: `✅ Siaran berhasil terkirim ke *${sentCount}* sektor grup!`
      });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Broadcast error: ${e.message}` });
    }
  },

  // 5. JOIN VIA LINK GRUP
  async joinGroup(sock, chatId, senderId, link, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    if (!link || !link.includes('chat.whatsapp.com/')) {
      return sock.sendMessage(chatId, { text: `💡 Format: \`.join <link undangan grup whatsapp>\`` });
    }

    try {
      const code = link.split('chat.whatsapp.com/')[1].trim();
      const res = await sock.groupAcceptInvite(code);
      return sock.sendMessage(chatId, {
        text: `✅ Berhasil bergabung ke grup baru! Sektor ID: ${res}`
      });
    } catch (e) {
      return sock.sendMessage(chatId, { text: `❌ Gagal bergabung ke grup: ${e.message}` });
    }
  },

  // 6. LEAVE GRUP
  async leaveGroup(sock, chatId, senderId, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    await sock.sendMessage(chatId, {
      text: `👋 Perintah dari Supreme Commander diterima. Bot izin pamit undur diri dari sektor ini. Sampai jumpa!`
    });
    return await sock.groupLeave(chatId);
  },

  // 7. BAN USER
  async banUser(sock, chatId, senderId, targetJid, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    if (!targetJid) return sock.sendMessage(chatId, { text: `💡 Format: \`.ban @user\`` });

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const target = db.getUser(cleanTarget);
    target.banned = true;
    db.updateUser(cleanTarget, target);

    return sock.sendMessage(chatId, {
      text: `🚫 @${cleanTarget.split('@')[0]} telah resmi *DIBLOKIR / BANNED* dari seluruh protokol bot!`,
      mentions: [cleanTarget]
    });
  },

  // 8. UNBAN USER
  async unbanUser(sock, chatId, senderId, targetJid, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    if (!targetJid) return sock.sendMessage(chatId, { text: `💡 Format: \`.unban @user\`` });

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const target = db.getUser(cleanTarget);
    target.banned = false;
    db.updateUser(cleanTarget, target);

    return sock.sendMessage(chatId, {
      text: `🔓 Blokir akses untuk @${cleanTarget.split('@')[0]} telah dicabut!`,
      mentions: [cleanTarget]
    });
  },

  // 9. RESET USER DATA
  async resetUser(sock, chatId, senderId, targetJid, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    if (!targetJid) return sock.sendMessage(chatId, { text: `💡 Format: \`.resetuser @user\`` });

    const cleanTarget = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const target = db.getUser(cleanTarget);
    target.coins = 1000;
    target.xp = 0;
    target.level = 1;
    target.rank = 'Novice Hacker';
    target.inventory = ['Quantum Healing Stimpack x2'];
    db.updateUser(cleanTarget, target);

    return sock.sendMessage(chatId, {
      text: `🔄 Data profil dan saldo @${cleanTarget.split('@')[0]} berhasil di-reset ke setelan awal!`,
      mentions: [cleanTarget]
    });
  },

  // 10. GANTI MODE BOT (SELF / PUBLIC)
  async toggleMode(sock, chatId, senderId, mode, fromMe) {
    if (!db.isOwner(senderId, fromMe)) return;

    const chosen = (mode || '').toLowerCase();
    const settings = db.getSettings();

    if (chosen === 'self') {
      settings.maintenanceMode = true;
      db.updateSettings(settings);
      return sock.sendMessage(chatId, {
        text: `🔒 *[MODE SELF ACTIVATED]*\nBot sekarang berada dalam mode privat. Hanya Owner yang dapat menjalankan perintah.`
      });
    } else if (chosen === 'public') {
      settings.maintenanceMode = false;
      db.updateSettings(settings);
      return sock.sendMessage(chatId, {
        text: `🌐 *[MODE PUBLIC ACTIVATED]*\nBot sekarang aktif untuk seluruh pengguna umum di semua sektor!`
      });
    } else {
      return sock.sendMessage(chatId, { text: `💡 Format: \`.mode self\` atau \`.mode public\`` });
    }
  },

  async manageBotAccess(sock, chatId, senderId, target, action, fromMe) {
    if (!db.isOwner(senderId, fromMe)) {
      return sock.sendMessage(chatId, { text: '⛔ Perintah ini khusus Owner.' });
    }

    if (action === 'list') {
      const authorizedUsers = db.getAuthorizedUsers();
      const list = authorizedUsers.length
        ? authorizedUsers.map((number, index) => `${index + 1}. +${number}`).join('\n')
        : 'Belum ada pengguna yang diberi akses.';
      return sock.sendMessage(chatId, {
        text: `👥 *DAFTAR AKSES BOT*\n\n${list}\n\nUntuk memberi akses: \`.izinkan <nomor>\``
      });
    }

    if (!target) {
      const usage = action === 'add'
        ? 'Format: `.izinkan <nomor WhatsApp>`'
        : 'Format: `.cabutakses <nomor WhatsApp>`';
      return sock.sendMessage(chatId, { text: `💡 ${usage}\nContoh: \`.izinkan 6281234567890\`` });
    }

    const result = action === 'add'
      ? db.addAuthorizedUser(target)
      : db.removeAuthorizedUser(target);

    if (result.reason === 'invalid') {
      return sock.sendMessage(chatId, {
        text: '❌ Nomor tidak valid. Gunakan nomor WhatsApp internasional 8–15 digit, misalnya `6281234567890`.'
      });
    }
    if (result.reason === 'exists') {
      return sock.sendMessage(chatId, { text: `ℹ️ Nomor +${result.number} sudah memiliki akses.` });
    }
    if (result.reason === 'not_found') {
      return sock.sendMessage(chatId, { text: `ℹ️ Nomor +${result.number} tidak ada dalam daftar akses.` });
    }

    const message = action === 'add'
      ? `✅ Akses bot diberikan kepada +${result.number}. Pengguna tersebut sekarang dapat mengirim \`.menu\` ke bot.`
      : `✅ Akses bot untuk +${result.number} telah dicabut.`;
    return sock.sendMessage(chatId, { text: message });
  }
};
