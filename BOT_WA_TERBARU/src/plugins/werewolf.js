const db = require('../database/db');

// State game Werewolf aktif per chat grup
const activeWWGames = {};

module.exports = {
  // === WEREWOLF HANDLER UTAMA ===
  async handleWerewolf(sock, chatId, senderId, args, isGroup) {
    if (!isGroup) {
      return sock.sendMessage(chatId, {
        text: `🐺 Game Werewolf hanya dapat dimainkan di dalam *Grup WhatsApp*!`
      });
    }

    const subCmd = (args[0] || '').toLowerCase();
    const query = args.slice(1).join(' ');

    switch (subCmd) {
      case 'create':
      case 'bikin':
      case 'start-lobby':
        return await this.createLobby(sock, chatId, senderId);

      case 'join':
      case 'ikut':
        return await this.joinLobby(sock, chatId, senderId);

      case 'leave':
      case 'keluar':
        return await this.leaveLobby(sock, chatId, senderId);

      case 'start':
      case 'mulai':
        return await this.startGame(sock, chatId, senderId);

      case 'vote':
        return await this.votePlayer(sock, chatId, senderId, query);

      case 'kill':
      case 'bunuh':
        return await this.werewolfKill(sock, chatId, senderId, query);

      case 'see':
      case 'terawang':
        return await this.seerCheck(sock, chatId, senderId, query);

      case 'protect':
      case 'lindungi':
        return await this.guardianProtect(sock, chatId, senderId, query);

      case 'status':
      case 'info':
        return await this.showStatus(sock, chatId);

      case 'stop':
      case 'cancel':
      case 'bubar':
        return await this.stopGame(sock, chatId, senderId);

      default:
        return sock.sendMessage(chatId, {
          text: `
🐺 *[CYBER WEREWOLF PROTOCOL 2099]* 🐺
══════════════════════════════
Perintah Game Werewolf Grup:
• \`.ww create\` : Membuka lobi permainan baru
• \`.ww join\` : Bergabung ke dalam lobi permainan
• \`.ww leave\` : Keluar dari lobi sebelum mulai
• \`.ww start\` : Memulai game (Minimal 4 pemain)
• \`.ww status\` : Melihat status pemain & fase game
• \`.ww vote @user\` : Voting siang untuk menghukum tersangka
• \`.ww kill @user\` : [Werewolf] Mangsa korban malam
• \`.ww see @user\` : [Seer] Terawang peran seseorang
• \`.ww protect @user\` : [Guardian] Lindungi warga malam
• \`.ww stop\` : Membatalkan sesi permainan (Host/Admin)
══════════════════════════════
`
        });
    }
  },

  // 1. Buat Lobi
  async createLobby(sock, chatId, senderId) {
    if (activeWWGames[chatId]) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Sesi game Werewolf sudah berjalan di grup ini! Ketik \`.ww status\` untuk melihat atau \`.ww stop\` untuk membatalkan.`
      });
    }

    const hostUser = db.getUser(senderId);
    activeWWGames[chatId] = {
      host: senderId,
      hostName: hostUser.name || 'Commander',
      phase: 'lobby', // 'lobby', 'night', 'day'
      players: [{ id: senderId, name: hostUser.name, role: null, alive: true }],
      dayCount: 0,
      nightActions: { killTarget: null, seeTarget: null, protectTarget: null },
      votes: {},
      timer: null
    };

    return sock.sendMessage(chatId, {
      text: `
🌕 *[LOBI WEREWOLF DIBUKA!]* 🌕
══════════════════════════════
Host: @${senderId.split('@')[0]}
Pemain Bergabung (1/15):
1. @${senderId.split('@')[0]} (Host)

👥 Ketik *.ww join* untuk ikut bergabung!
🚀 Minimal 4 pemain untuk memulai dengan *.ww start*
══════════════════════════════
`,
      mentions: [senderId]
    });
  },

  // 2. Gabung Lobi
  async joinLobby(sock, chatId, senderId) {
    const game = activeWWGames[chatId];
    if (!game) {
      return sock.sendMessage(chatId, {
        text: `❌ Belum ada lobi Werewolf di grup ini. Ketik *.ww create* untuk membuka lobi baru!`
      });
    }

    if (game.phase !== 'lobby') {
      return sock.sendMessage(chatId, {
        text: `⚠️ Permainan sedang berlangsung! Tunggu sampai sesi ronde ini selesai.`
      });
    }

    const exists = game.players.some(p => p.id === senderId);
    if (exists) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Kamu sudah terdaftar di lobi!`
      });
    }

    const user = db.getUser(senderId);
    game.players.push({ id: senderId, name: user.name || 'Player', role: null, alive: true });

    let playerList = `🌕 *[PEMAIN BARU BERGABUNG]* 🌕\nTotal Pemain: ${game.players.length}\n\n`;
    game.players.forEach((p, idx) => {
      playerList += `${idx + 1}. @${p.id.split('@')[0]}\n`;
    });
    playerList += `\n💡 Ketik *.ww join* untuk ikut atau host ketik *.ww start* jika sudah cukup!`;

    const mentions = game.players.map(p => p.id);
    return sock.sendMessage(chatId, { text: playerList.trim(), mentions });
  },

  // 3. Keluar Lobi
  async leaveLobby(sock, chatId, senderId) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'lobby') return;

    if (game.host === senderId) {
      delete activeWWGames[chatId];
      return sock.sendMessage(chatId, { text: `🚪 Host meninggalkan lobi. Permainan Werewolf dibatalkan!` });
    }

    game.players = game.players.filter(p => p.id !== senderId);
    return sock.sendMessage(chatId, {
      text: `👋 @${senderId.split('@')[0]} keluar dari lobi. Sisa pemain: ${game.players.length}`,
      mentions: [senderId]
    });
  },

  // 4. Mulai Permainan
  async startGame(sock, chatId, senderId) {
    const game = activeWWGames[chatId];
    if (!game) return;

    if (game.host !== senderId) {
      return sock.sendMessage(chatId, { text: `⚠️ Hanya Host (@${game.host.split('@')[0]}) yang bisa memulai game!` });
    }

    if (game.players.length < 4) {
      return sock.sendMessage(chatId, {
        text: `❌ Jumlah pemain minimal *4 orang* untuk memulai! Saat ini baru ada ${game.players.length} pemain.`
      });
    }

    // Pembagian peran acak
    const count = game.players.length;
    let roles = [];
    if (count === 4) roles = ['werewolf', 'seer', 'guardian', 'villager'];
    else if (count === 5) roles = ['werewolf', 'seer', 'guardian', 'villager', 'villager'];
    else if (count <= 7) roles = ['werewolf', 'werewolf', 'seer', 'guardian', 'villager', 'villager', 'villager'].slice(0, count);
    else roles = ['werewolf', 'werewolf', 'seer', 'guardian', 'villager', 'villager', 'villager', 'villager'].slice(0, count);

    // Shuffle roles
    roles.sort(() => Math.random() - 0.5);

    for (let i = 0; i < game.players.length; i++) {
      game.players[i].role = roles[i];
    }

    game.phase = 'night';
    game.dayCount = 1;
    game.nightActions = { killTarget: null, seeTarget: null, protectTarget: null };

    // Kirim peran rahasia ke masing-masing pemain via chat pribadi (japri)
    for (const p of game.players) {
      const roleName = this.formatRoleName(p.role);
      const roleDesc = this.getRoleDescription(p.role);
      try {
        await sock.sendMessage(p.id, {
          text: `
🤫 *[KARTU PERAN RAHASIA WEREWOLF]* 🤫
══════════════════════════════
Peranmu: *${roleName}*
Grup Sektor: Sektor Cyber Werewolf

📜 *Tugas Peran*:
${roleDesc}
══════════════════════════════
_Jangan beritahu peranmu ke siapapun!_
`
        });
      } catch (e) {
        // Jika gagal japri, tetap lanjut
      }
    }

    let startText = `
🌑 *[FASE MALAM HARI KE-1 TELAH TIBA]* 🌑
═════════════════════════════════
Desa telah tertidur lelap. Kegelapan menyelimuti sektor...
Kartu peran telah dikirim ke *Chat Pribadi (Japri)* masing-masing pemain!

🐾 *Instruksi Malam*:
• 🐺 *Werewolf*: Ketik \`.ww kill @user\` (Pilih mangsamu)
• 🔮 *Seer*: Ketik \`.ww see @user\` (Terawang identitas seseorang)
• 🛡️ *Guardian*: Ketik \`.ww protect @user\` (Lindungi 1 warga)

⏳ Waktu malam: 60 Detik!
Ketik *.ww status* untuk cek daftar pemain yang hidup.
═════════════════════════════════
`;

    const mentions = game.players.map(p => p.id);
    await sock.sendMessage(chatId, { text: startText.trim(), mentions });

    // Pasang timer malam otomatis 60 detik
    game.timer = setTimeout(() => {
      this.processNightPhase(sock, chatId);
    }, 60000);
  },

  // 5. Aksi Malam: Werewolf Kill
  async werewolfKill(sock, chatId, senderId, query) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'night') return;

    const player = game.players.find(p => p.id === senderId);
    if (!player || !player.alive || player.role !== 'werewolf') {
      return sock.sendMessage(chatId, { text: `❌ Perintah ini hanya bisa digunakan oleh *Werewolf* yang masih hidup di fase malam!` });
    }

    const targetNumber = query.replace(/[^0-9]/g, '');
    const targetPlayer = game.players.find(p => p.id.includes(targetNumber) && p.alive);

    if (!targetPlayer) {
      return sock.sendMessage(chatId, { text: `❌ Target mangsa tidak ditemukan atau sudah gugur!` });
    }

    game.nightActions.killTarget = targetPlayer.id;
    return sock.sendMessage(chatId, {
      text: `🩸 Serigala telah mengunci aroma mangsa malam ini...`
    });
  },

  // 6. Aksi Malam: Seer Check
  async seerCheck(sock, chatId, senderId, query) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'night') return;

    const player = game.players.find(p => p.id === senderId);
    if (!player || !player.alive || player.role !== 'seer') {
      return sock.sendMessage(chatId, { text: `❌ Hanya *Seer / Peramal* yang dapat menerawang di malam hari!` });
    }

    const targetNumber = query.replace(/[^0-9]/g, '');
    const target = game.players.find(p => p.id.includes(targetNumber) && p.alive);

    if (!target) {
      return sock.sendMessage(chatId, { text: `❌ Target tidak ditemukan!` });
    }

    const isWW = target.role === 'werewolf';
    // Kirim hasil terawang ke Seer via chat pribadi
    try {
      await sock.sendMessage(senderId, {
        text: `🔮 *[HASIL TERAWANGAN SEER]*\n@${target.id.split('@')[0]} adalah *${isWW ? '🐺 WEREWOLF!' : '👨‍🌾 WARGA BAIK (Bukan Serigala)'}*`,
        mentions: [target.id]
      });
    } catch (e) {}

    return sock.sendMessage(chatId, {
      text: `🔮 Peramal telah melihat masa depan dalam bola kristalnya...`
    });
  },

  // 7. Aksi Malam: Guardian Protect
  async guardianProtect(sock, chatId, senderId, query) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'night') return;

    const player = game.players.find(p => p.id === senderId);
    if (!player || !player.alive || player.role !== 'guardian') {
      return sock.sendMessage(chatId, { text: `❌ Hanya *Guardian* yang dapat melindungi di malam hari!` });
    }

    const targetNumber = query.replace(/[^0-9]/g, '');
    const target = game.players.find(p => p.id.includes(targetNumber) && p.alive);

    if (!target) return sock.sendMessage(chatId, { text: `❌ Target tidak ditemukan!` });

    game.nightActions.protectTarget = target.id;
    return sock.sendMessage(chatId, {
      text: `🛡️ Perisai Guardian telah dipasang mengitari salah satu warga...`
    });
  },

  // Proses Pergantian dari Malam ke Siang
  async processNightPhase(sock, chatId) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'night') return;

    clearTimeout(game.timer);
    game.phase = 'day';
    game.votes = {};

    let victimId = game.nightActions.killTarget;
    let victimSaved = false;

    if (victimId && victimId === game.nightActions.protectTarget) {
      victimSaved = true;
      victimId = null;
    }

    let report = `
☀️ *[FASE SIANG HARI KE-${game.dayCount}]* ☀️
═════════════════════════════════
Matahari terbit menyinari desa...
`;

    if (victimId) {
      const victim = game.players.find(p => p.id === victimId);
      if (victim) {
        victim.alive = false;
        report += `💀 *KABAR DUKA*: @${victim.id.split('@')[0]} ditemukan tewas terkoyak oleh serigala!\nPerannya adalah: *${this.formatRoleName(victim.role)}*\n`;
      }
    } else if (victimSaved) {
      report += `✨ *KEAJAIBAN*: Semalam seseorang diserang Werewolf, namun berhasil diselamatkan oleh Guardian!\n`;
    } else {
      report += `🕊️ Malam yang tenang, tidak ada korban jiwa yang gugur semalam.\n`;
    }

    // Cek Kondisi Menang
    const winResult = this.checkWinner(game);
    if (winResult) {
      return this.endGameWithWinner(sock, chatId, winResult);
    }

    report += `
🗣️ *WAKTUNYA DISKUSI & VOTING LYNCHING!*
Bicarakan siapa yang mencurigakan di grup ini!
Gunakan perintah: \`.ww vote @user\` untuk memilih tersangka yang akan dihukum gantung.

Ketik *.ww status* untuk daftar pemain tersisa.
⏳ Waktu Siang: 90 Detik!
═════════════════════════════════
`;

    const aliveMentions = game.players.filter(p => p.alive).map(p => p.id);
    await sock.sendMessage(chatId, { text: report.trim(), mentions: aliveMentions });

    // Pasang timer siang 90 detik
    game.timer = setTimeout(() => {
      this.processDayVote(sock, chatId);
    }, 90000);
  },

  // 8. Voting Siang
  async votePlayer(sock, chatId, senderId, query) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'day') {
      return sock.sendMessage(chatId, { text: `⚠️ Voting hanya bisa dilakukan pada *Fase Siang*!` });
    }

    const voter = game.players.find(p => p.id === senderId);
    if (!voter || !voter.alive) {
      return sock.sendMessage(chatId, { text: `❌ Hanya pemain hidup yang memiliki hak suara!` });
    }

    const targetNumber = query.replace(/[^0-9]/g, '');
    const target = game.players.find(p => p.id.includes(targetNumber) && p.alive);

    if (!target) {
      return sock.sendMessage(chatId, { text: `❌ Target yang kamu vote tidak valid atau sudah mati!` });
    }

    game.votes[senderId] = target.id;
    const totalVotesForTarget = Object.values(game.votes).filter(id => id === target.id).length;

    return sock.sendMessage(chatId, {
      text: `🗳️ @${senderId.split('@')[0]} memberikan suara untuk menghukum @${target.id.split('@')[0]}! (Total: ${totalVotesForTarget} suara)`,
      mentions: [senderId, target.id]
    });
  },

  // Proses Eksekusi Voting Siang
  async processDayVote(sock, chatId) {
    const game = activeWWGames[chatId];
    if (!game || game.phase !== 'day') return;

    clearTimeout(game.timer);

    // Hitung suara terbanyak
    const tally = {};
    for (const targetId of Object.values(game.votes)) {
      tally[targetId] = (tally[targetId] || 0) + 1;
    }

    let maxVotes = 0;
    let lynchedId = null;
    let tie = false;

    for (const [targetId, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        lynchedId = targetId;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }

    let report = `
⚖️ *[HASIL PENGADILAN WARGA]* ⚖️
═════════════════════════════════
`;

    if (!lynchedId || tie || maxVotes === 0) {
      report += `🕊️ Hasil voting seri atau tidak ada suara mayoritas. Tidak ada warga yang dieksekusi hari ini!\n`;
    } else {
      const lynched = game.players.find(p => p.id === lynchedId);
      if (lynched) {
        lynched.alive = false;
        report += `⚰️ Warga sepakat mengeksekusi @${lynched.id.split('@')[0]} di tiang gantungan!\nPeran aslinya terungkap: *${this.formatRoleName(lynched.role)}*\n`;
      }
    }

    // Cek Kondisi Menang
    const winResult = this.checkWinner(game);
    if (winResult) {
      return this.endGameWithWinner(sock, chatId, winResult);
    }

    // Lanjut ke Malam Berikutnya
    game.dayCount += 1;
    game.phase = 'night';
    game.nightActions = { killTarget: null, seeTarget: null, protectTarget: null };

    report += `
🌑 Hari mulai gelap... *Malam ke-${game.dayCount}* telah tiba!
Werewolf, Seer, dan Guardian dipersilakan menjalankan aksinya kembali.
⏳ Waktu Malam: 60 Detik!
═════════════════════════════════
`;

    const aliveMentions = game.players.filter(p => p.alive).map(p => p.id);
    await sock.sendMessage(chatId, { text: report.trim(), mentions: aliveMentions });

    game.timer = setTimeout(() => {
      this.processNightPhase(sock, chatId);
    }, 60000);
  },

  // Cek Pemenang
  checkWinner(game) {
    const aliveWW = game.players.filter(p => p.alive && p.role === 'werewolf').length;
    const aliveVillagers = game.players.filter(p => p.alive && p.role !== 'werewolf').length;

    if (aliveWW === 0) return 'villagers'; // Semua werewolf mati
    if (aliveWW >= aliveVillagers) return 'werewolf'; // Jumlah werewolf sebanding atau melebihi warga
    return null;
  },

  // Akhiri Game dengan Pemenang & Bagi Koin Hadiah
  async endGameWithWinner(sock, chatId, winner) {
    const game = activeWWGames[chatId];
    clearTimeout(game.timer);

    const isWWWin = winner === 'werewolf';
    let text = `
🏆 *[PERMAINAN WEREWOLF SELESAI]* 🏆
═════════════════════════════════
KEMENANGAN JATUH KEPADA:
*${isWWWin ? '🐺 TIM WEREWOLF (SERIGALA)!' : '👨‍🌾 TIM WARGA DESA (VILLAGERS)!'}*

Daftar Peran Semua Pemain:
`;

    const rewardCoins = 1500;
    const rewardXp = 200;

    for (const p of game.players) {
      const isWinner = (isWWWin && p.role === 'werewolf') || (!isWWWin && p.role !== 'werewolf');
      if (isWinner) {
        const u = db.getUser(p.id);
        u.coins += rewardCoins;
        u.xp += rewardXp;
        db.updateUser(p.id, u);
      }
      text += `• @${p.id.split('@')[0]} : *${this.formatRoleName(p.role)}* [${p.alive ? '❤️ HIDUP' : '💀 MATI'}] ${isWinner ? '🎉 +1500 Koin' : ''}\n`;
    }

    text += `═════════════════════════════════\nKetik *.ww create* untuk membuka ronde baru!`;

    const allMentions = game.players.map(p => p.id);
    delete activeWWGames[chatId];
    return sock.sendMessage(chatId, { text: text.trim(), mentions: allMentions });
  },

  // 9. Cek Status
  async showStatus(sock, chatId) {
    const game = activeWWGames[chatId];
    if (!game) {
      return sock.sendMessage(chatId, { text: `ℹ️ Tidak ada permainan Werewolf yang aktif di grup ini.` });
    }

    let statusText = `
🐺 *[STATUS WEREWOLF SAKSI SEKTOR]* 🐺
══════════════════════════════
Fase: *${game.phase.toUpperCase()}* | Hari Ke: *${game.dayCount}*
Host: @${game.host.split('@')[0]}

👥 Status Pemain:
`;
    game.players.forEach((p, idx) => {
      statusText += `${idx + 1}. @${p.id.split('@')[0]} [${p.alive ? '🟢 HIDUP' : '💀 GUGUR'}]\n`;
    });

    statusText += `══════════════════════════════`;
    const mentions = game.players.map(p => p.id);
    return sock.sendMessage(chatId, { text: statusText.trim(), mentions });
  },

  // 10. Batalkan Game
  async stopGame(sock, chatId, senderId) {
    const game = activeWWGames[chatId];
    if (!game) return;

    if (game.host !== senderId) {
      return sock.sendMessage(chatId, { text: `⚠️ Hanya Host yang dapat membatalkan game!` });
    }

    clearTimeout(game.timer);
    delete activeWWGames[chatId];
    return sock.sendMessage(chatId, {
      text: `🛑 Permainan Werewolf telah dibatalkan oleh Host.`
    });
  },

  formatRoleName(role) {
    switch (role) {
      case 'werewolf': return '🐺 Werewolf';
      case 'seer': return '🔮 Seer (Peramal)';
      case 'guardian': return '🛡️ Guardian (Pelindung)';
      default: return '👨‍🌾 Villager (Warga)';
    }
  },

  getRoleDescription(role) {
    switch (role) {
      case 'werewolf':
        return 'Habisi seluruh warga desa sampai jumlah serigala menyamai atau melebihi warga. Di malam hari ketik: `.ww kill @user` di grup.';
      case 'seer':
        return 'Bantu warga menemukan serigala tersembunyi. Di malam hari ketik: `.ww see @user` untuk melihat peran seseorang.';
      case 'guardian':
        return 'Lindungi 1 warga setiap malam dari terkaman serigala. Di malam hari ketik: `.ww protect @user`.';
      default:
        return 'Cari tahu siapa serigala di antara kalian melalui diskusi di siang hari dan berikan suaramu dengan `.ww vote @user`.';
    }
  }
};
