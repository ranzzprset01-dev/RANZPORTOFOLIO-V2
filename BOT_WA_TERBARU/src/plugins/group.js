const db = require('../database/db');

module.exports = {
  // === 1. TAG ALL & HIDETAG ===
  async tagAll(sock, chatId, senderId, messageText, isHidden = false) {
    try {
      const groupMeta = await sock.groupMetadata(chatId);
      const participants = groupMeta.participants || [];
      const memberJids = participants.map(p => p.id);

      const senderNumber = senderId.split('@')[0];
      let formattedText = '';

      if (isHidden) {
        formattedText = `📢 *[CYBER BROADCAST ANNOUNCEMENT]* 📢\n\n${messageText || 'Perhatian seluruh personil sektor!'}\n\n_Pengirim: @${senderNumber}_`;
      } else {
        formattedText = `👥 *[CALLING ALL SQUAD MEMBERS]* 👥\n\n📌 *Pesan*: ${messageText || 'Panggilan berkumpul!'}\n\n`;
        participants.forEach((p, idx) => {
          formattedText += `${idx + 1}. @${p.id.split('@')[0]}\n`;
        });
        formattedText += `\n_Total Personil: ${participants.length}_`;
      }

      return sock.sendMessage(chatId, {
        text: formattedText.trim(),
        mentions: memberJids
      });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ Gagal mengambil daftar anggota grup: ${err.message}`
      });
    }
  },

  // === 2. ANTILINK TOGGLE ===
  async toggleAntiLink(sock, chatId, state) {
    const group = db.getGroup(chatId);
    if (state === 'on') {
      group.antilink = true;
      db.updateGroup(chatId, group);
      return sock.sendMessage(chatId, {
        text: `🛡️ *[ANTILINK PROTOCOL ACTIVATED]* 🛡️\n\nSistem pengaman aktif! Tautan grup WhatsApp eksternal dari non-admin akan otomatis dibersihkan.`
      });
    } else if (state === 'off') {
      group.antilink = false;
      db.updateGroup(chatId, group);
      return sock.sendMessage(chatId, {
        text: `🔓 *[ANTILINK PROTOCOL DEACTIVATED]*\n\nProteksi tautan dinonaktifkan.`
      });
    } else {
      return sock.sendMessage(chatId, {
        text: `💡 *Format:* \`.antilink on\` atau \`.antilink off\`\nStatus saat ini: *${group.antilink ? 'AKTIF' : 'NONAKTIF'}*`
      });
    }
  },

  // === 3. GROUP OPEN / CLOSE ===
  async setGroupMode(sock, chatId, mode) {
    try {
      if (mode === 'close' || mode === 'tutup') {
        await sock.groupSettingUpdate(chatId, 'announcement');
        return sock.sendMessage(chatId, {
          text: `🔒 *[SECTOR LOCKED]*\n\nGrup telah ditutup oleh admin! Hanya perwira/admin yang dapat mengirim pesan.`
        });
      } else if (mode === 'open' || mode === 'buka') {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        return sock.sendMessage(chatId, {
          text: `🔓 *[SECTOR OPENED]*\n\nGrup telah dibuka kembali! Seluruh anggota dipersilakan berdiskusi.`
        });
      } else {
        return sock.sendMessage(chatId, {
          text: `💡 *Format:* \`.group open\` atau \`.group close\``
        });
      }
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ Gagal mengubah setelan grup. Pastikan bot adalah Admin!`
      });
    }
  },

  // === 4. KICK MEMBER ===
  async kickMember(sock, chatId, mentionedJids) {
    if (!mentionedJids || mentionedJids.length === 0) {
      return sock.sendMessage(chatId, {
        text: `⚠️ *Format:* \`.kick @user\` (Tag anggota yang ingin dikeluarkan)`
      });
    }

    try {
      await sock.groupParticipantsUpdate(chatId, mentionedJids, 'remove');
      return sock.sendMessage(chatId, {
        text: `🚪 Personil berhasil dikeluarkan dari sektor demi ketertiban protokol.`
      });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ Gagal mengeluarkan member. Pastikan bot adalah Admin!`
      });
    }
  },

  // === 5. PROMOTE / DEMOTE ADMIN ===
  async changeAdminRole(sock, chatId, mentionedJids, action) {
    if (!mentionedJids || mentionedJids.length === 0) {
      return sock.sendMessage(chatId, {
        text: `⚠️ *Format:* \`.${action} @user\``
      });
    }

    try {
      const mode = action === 'promote' ? 'promote' : 'demote';
      await sock.groupParticipantsUpdate(chatId, mentionedJids, mode);
      const label = action === 'promote' ? 'dinaikkan menjadi Admin Sektor 🎖️' : 'diturunkan statusnya menjadi Anggota Biasa 👤';
      return sock.sendMessage(chatId, {
        text: `✅ Personil berhasil ${label}.`
      });
    } catch (err) {
      return sock.sendMessage(chatId, {
        text: `❌ Gagal mengubah jabatan. Pastikan bot adalah Admin!`
      });
    }
  }
};
