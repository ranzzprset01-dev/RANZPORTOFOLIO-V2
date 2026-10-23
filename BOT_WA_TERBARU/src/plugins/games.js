const db = require('../database/db');

// State game aktif per chat (grup atau pribadi)
const activeGames = {
  tebakangka: {},
  tebakkata: {},
  kuismtk: {}
};

// Bank soal tebak kata bahasa Indonesia
const tebakKataList = [
  { soal: 'P A T O P T L', jawaban: 'LAPTOP', hint: 'Komputer portabel yang bisa dibawa kemana-mana' },
  { soal: 'A H K P O N E S', jawaban: 'HANDPHONE', hint: 'Perangkat komunikasi genggam serba guna' },
  { soal: 'E L G A N D U N G', jawaban: 'GELANDANG', hint: 'Posisi pemain sepak bola di tengah lapangan' },
  { soal: 'K E T O B R I P', jawaban: 'ROBOTIK', hint: 'Ilmu tentang perancangan dan pembuatan robot' },
  { soal: 'I F I A R T I L I C', jawaban: 'ARTIFICIAL', hint: 'Kata depan AI (Kecerdasan Buatan)' },
  { soal: 'T A N P L E', jawaban: 'PLANET', hint: 'Benda langit yang mengorbit bintang' },
  { soal: 'K R I P T O', jawaban: 'KRIPTO', hint: 'Mata uang digital berbasis blockchain' },
  { soal: 'A L I G O R T M A', jawaban: 'ALGORITMA', hint: 'Langkah logis terstruktur penyelesaian masalah' },
  { soal: 'F I R E W A L L', jawaban: 'FIREWALL', hint: 'Sistem pengaman jaringan komputer' },
  { soal: 'S A T E L I T', jawaban: 'SATELIT', hint: 'Benda ruang angkasa pemancar sinyal komunikasi' }
];

module.exports = {
  // === 1. GAME TEBAK ANGKA ===
  async tebakAngka(sock, chatId, senderId, args, isAnswer = false) {
    const user = db.getUser(senderId);

    // Jika ini adalah jawaban tebakan
    if (isAnswer) {
      const session = activeGames.tebakangka[chatId];
      if (!session) return false;

      const guess = parseInt(args[0], 10);
      if (isNaN(guess)) return false;

      session.attempts += 1;

      if (guess === session.target) {
        const bonusCoins = Math.max(500, 2000 - (session.attempts * 150));
        const bonusXp = 100;
        user.coins += bonusCoins;
        user.xp += bonusXp;
        db.updateUser(senderId, user);
        db.incrementStat('totalGamesPlayed');

        delete activeGames.tebakangka[chatId];
        await sock.sendMessage(chatId, {
          text: `🎉 *[CYBER TARGET IDENTIFIED!]* 🎉\n\nSelamat @${senderId.split('@')[0]}!\nAngka rahasia memang *${session.target}*.\n\n📊 *Statistik Tebakan*: ${session.attempts}x percobaan\n💰 *Hadiah Koin*: +${bonusCoins} CYBER-COIN\n⚡ *Hadiah XP*: +${bonusXp} XP\n\nKetik *.tebakangka* untuk main lagi!`,
          mentions: [senderId]
        });
        return true;
      } else if (guess < session.target) {
        await sock.sendMessage(chatId, {
          text: `📉 Angka *${guess}* terlalu *KECIL*! Coba angka yang lebih tinggi. (Percobaan ke-${session.attempts})`
        });
        return true;
      } else {
        await sock.sendMessage(chatId, {
          text: `📈 Angka *${guess}* terlalu *BESAR*! Coba angka yang lebih rendah. (Percobaan ke-${session.attempts})`
        });
        return true;
      }
    }

    // Mulai game baru jika belum ada
    if (activeGames.tebakangka[chatId]) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Permainan Tebak Angka sedang berlangsung di chat ini! Tebak angka 1 - 100 dengan langsung mengetik angkanya, atau ketik *.nyerah* untuk membatalkan.`
      });
    }

    const secret = Math.floor(Math.random() * 100) + 1;
    activeGames.tebakangka[chatId] = {
      target: secret,
      attempts: 0,
      startedAt: Date.now()
    };

    return sock.sendMessage(chatId, {
      text: `🎲 *[GAME TEBAK ANGKA CYBER]* 🎲\n\nSistem telah mengacak sebuah angka rahasia antara *1 sampai 100*!\n\n🎯 *Cara Main*: Langsung ketik angka tebakanmu di chat ini (Contoh: \`50\`).\n💡 Bot akan memberitahu apakah angka terlalu BESAR atau KECIL.\n\n_Waktu: 2 Menit | Ketik *.nyerah* untuk menyerah._`
    });
  },

  // === 2. GAME TEBAK KATA ===
  async tebakKata(sock, chatId, senderId, text, isAnswer = false) {
    const user = db.getUser(senderId);

    if (isAnswer) {
      const session = activeGames.tebakkata[chatId];
      if (!session) return false;

      const input = text.trim().toUpperCase();
      if (input === session.jawaban) {
        user.coins += 800;
        user.xp += 80;
        db.updateUser(senderId, user);
        db.incrementStat('totalGamesPlayed');

        delete activeGames.tebakkata[chatId];
        await sock.sendMessage(chatId, {
          text: `✨ *[DEKRIPSI KATA BERHASIL!]* ✨\n\nBenar sekali @${senderId.split('@')[0]}! Kata rahasianya adalah *${session.jawaban}*.\n\n💰 *Hadiah*: +800 Koin | +80 XP\nKetik *.tebakkata* untuk ronde berikutnya!`,
          mentions: [senderId]
        });
        return true;
      }
      return false;
    }

    if (activeGames.tebakkata[chatId]) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Masih ada tebak kata yang belum terpecahkan! Kata acak: *${activeGames.tebakkata[chatId].soal}*\nPetunjuk: _${activeGames.tebakkata[chatId].hint}_`
      });
    }

    const chosen = tebakKataList[Math.floor(Math.random() * tebakKataList.length)];
    activeGames.tebakkata[chatId] = { ...chosen, startedAt: Date.now() };

    return sock.sendMessage(chatId, {
      text: `🧩 *[CYBER WORD DECRYPTION]* 🧩\n\nSusunlah huruf acak berikut menjadi kata yang tepat:\n\n🔤 *Huruf Acak*: \`${chosen.soal}\`\n💡 *Petunjuk*: ${chosen.hint}\n\n🎯 *Cara Jawab*: Langsung ketik jawabannya di chat ini!\n💰 *Hadiah*: 800 Koin & 80 XP.`
    });
  },

  // === 3. KUIS MATEMATIKA KILAT ===
  async kuisMatematika(sock, chatId, senderId, text, isAnswer = false) {
    const user = db.getUser(senderId);

    if (isAnswer) {
      const session = activeGames.kuismtk[chatId];
      if (!session) return false;

      const answer = parseInt(text.trim(), 10);
      if (answer === session.jawaban) {
        user.coins += 700;
        user.xp += 70;
        db.updateUser(senderId, user);
        db.incrementStat('totalGamesPlayed');

        delete activeGames.kuismtk[chatId];
        await sock.sendMessage(chatId, {
          text: `⚡ *[QUANTUM CALCULATION CORRECT!]* ⚡\n\nLuar biasa @${senderId.split('@')[0]}! Perhitungan tepat *${session.jawaban}*.\n💰 *Reward*: +700 Koin | +70 XP`,
          mentions: [senderId]
        });
        return true;
      }
      return false;
    }

    if (activeGames.kuismtk[chatId]) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Kuis matematika masih aktif! Soal: *${activeGames.kuismtk[chatId].soal}* = ?`
      });
    }

    const num1 = Math.floor(Math.random() * 50) + 5;
    const num2 = Math.floor(Math.random() * 25) + 3;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let result = 0;
    if (op === '+') result = num1 + num2;
    else if (op === '-') result = num1 - num2;
    else if (op === '*') result = num1 * num2;

    activeGames.kuismtk[chatId] = {
      soal: `${num1} ${op} ${num2}`,
      jawaban: result,
      startedAt: Date.now()
    };

    return sock.sendMessage(chatId, {
      text: `📐 *[KUIS MATEMATIKA KILAT]* 📐\n\nBerapakah hasil dari:\n⚡ *${num1} ${op} ${num2} = ?*\n\n🎯 Langsung ketik angka hasil perhitunganmu!\n💰 Hadiah: 700 Koin & 70 XP`
    });
  },

  // === 4. CYBER SLOT MACHINE ===
  async slotMachine(sock, chatId, senderId, betArg) {
    const user = db.getUser(senderId);
    let bet = parseInt(betArg, 10);
    if (isNaN(bet) || bet < 50) bet = 100;

    if (user.coins < bet) {
      return sock.sendMessage(chatId, {
        text: `❌ Koin kamu tidak mencukupi! Koinmu: *${user.coins}*. Taruhan minimal: *${bet}*.`
      });
    }

    user.coins -= bet;
    const symbols = ['💎', '⚡', '🔮', '🎰', '🛸', '🚀', '7️⃣'];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];

    let win = 0;
    let message = '';

    if (s1 === s2 && s2 === s3) {
      if (s1 === '7️⃣' || s1 === '💎') {
        win = bet * 10;
        message = '🔥 *MEGA ULTRA JACKPOT x10!* 🔥';
      } else {
        win = bet * 5;
        message = '🎉 *JACKPOT 3 MATCH x5!* 🎉';
      }
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      win = Math.floor(bet * 1.5);
      message = '✨ *DOUBLE MATCH x1.5!* ✨';
    } else {
      message = '💀 *Sayang sekali belum beruntung.*';
    }

    user.coins += win;
    user.xp += 15;
    db.updateUser(senderId, user);
    db.incrementStat('totalGamesPlayed');

    const resultText = `
🎰 *[CYBER SLOT CASINO 2099]* 🎰
═════════════════════
   [ ${s1} | ${s2} | ${s3} ]
═════════════════════
${message}

💵 Taruhan: ${bet} Koin
💰 Kemenangan: +${win} Koin
💳 Sisa Saldo: ${user.coins} Koin
⚡ +15 XP
`;

    return sock.sendMessage(chatId, { text: resultText.trim() });
  },

  // === 5. RPG CYBERPUNK ADVENTURE ===
  async rpgAdventure(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const cooldown = 3 * 60 * 1000; // 3 menit cooldown
    const now = Date.now();

    if (now - (user.lastRpg || 0) < cooldown) {
      const remainingSec = Math.ceil((cooldown - (now - user.lastRpg)) / 1000);
      return sock.sendMessage(chatId, {
        text: `⏳ Kamu sedang memulihkan stamina Cybernetic! Tunggu *${remainingSec} detik* lagi sebelum berpetualang kembali.`
      });
    }

    user.lastRpg = now;
    const monsters = [
      { name: 'Rogue Security Drone MK-IV', hp: 80, exp: 120, coin: 450, drop: 'Titanium Scraps' },
      { name: 'Cybernetic Mutant Stalker', hp: 110, exp: 180, coin: 650, drop: 'Bio-Silicon Core' },
      { name: 'Dark Net Assassin AI', hp: 140, exp: 240, coin: 900, drop: 'Quantum Encryption Key' },
      { name: 'Megacorp Mech Titan', hp: 200, exp: 350, coin: 1500, drop: 'Plasma Cannon Battery' }
    ];

    const target = monsters[Math.floor(Math.random() * monsters.length)];
    const playerDamage = Math.floor(Math.random() * 40) + user.attack;
    const monsterDamage = Math.max(5, Math.floor(Math.random() * 30) - (user.defense / 2));

    user.hp = Math.max(10, user.hp - monsterDamage);
    user.coins += target.coin;
    user.xp += target.exp;
    if (Math.random() > 0.5) {
      user.inventory.push(target.drop);
    }

    db.updateUser(senderId, user);
    db.incrementStat('totalGamesPlayed');

    const rpgText = `
⚔️ *[CYBER EXPEDITION REPORT]* ⚔️
══════════════════════════
📍 *Lokasi*: Neon Slums District 7
👾 *Musuh*: *${target.name}*
💥 *Seranganmu*: Menghasilkan *${playerDamage} DMG*!
🛡️ *Serangan Musuh*: Kamu terkena *${monsterDamage} DMG* (HP Sisa: ${user.hp}/${user.maxHp})

🏆 *HASIL PERTEMPURAN*:
> 💰 +${target.coin} Cyber Coins
> ⚡ +${target.exp} EXP Points
> 🎒 Loot: ${target.drop}

🎖️ *Status*: Lv.${user.level} [${user.rank}] | Total Koin: ${user.coins}
`;
    return sock.sendMessage(chatId, { text: rpgText.trim() });
  },

  // === 6. MINING CRYPTO ===
  async miningCrypto(sock, chatId, senderId) {
    const user = db.getUser(senderId);
    const cooldown = 5 * 60 * 1000; // 5 menit cooldown
    const now = Date.now();

    if (now - (user.lastMining || 0) < cooldown) {
      const remainingSec = Math.ceil((cooldown - (now - user.lastMining)) / 1000);
      return sock.sendMessage(chatId, {
        text: `⛏️ Rig penambang kripto kamu sedang overheat! Tunggu pendinginan selesai dalam *${remainingSec} detik*.`
      });
    }

    user.lastMining = now;
    const minedCoins = Math.floor(Math.random() * 600) + 300;
    const minedXp = Math.floor(Math.random() * 50) + 30;

    user.coins += minedCoins;
    user.xp += minedXp;
    db.updateUser(senderId, user);

    return sock.sendMessage(chatId, {
      text: `⛏️ *[QUANTUM CRYPTO MINING SUCCESS]* ⛏️\n\nRig penambangan berhasil memecahkan blok enkripsi SHA-512!\n\n💎 *Hasil Tambang*: +${minedCoins} Cyber Tokens\n⚡ *Hasil Hash*: +${minedXp} EXP\n💳 *Total Saldo*: ${user.coins} Koin\n\n_Bisa menambang lagi dalam 5 menit!_`
    });
  },

  // === 7. SUIT (Batu Gunting Kertas) ===
  async suitGame(sock, chatId, senderId, choice) {
    if (!choice || !['batu', 'gunting', 'kertas'].includes(choice.toLowerCase())) {
      return sock.sendMessage(chatId, {
        text: `✌️ *Cara main suit*: Ketik *.suit batu*, *.suit gunting*, atau *.suit kertas*`
      });
    }

    const user = db.getUser(senderId);
    const options = ['batu', 'gunting', 'kertas'];
    const botPick = options[Math.floor(Math.random() * options.length)];
    const playerPick = choice.toLowerCase();

    let result = '';
    let reward = 0;

    if (playerPick === botPick) {
      result = '🤝 *SERI!* Pilihan sama kuat.';
      reward = 50;
    } else if (
      (playerPick === 'batu' && botPick === 'gunting') ||
      (playerPick === 'gunting' && botPick === 'kertas') ||
      (playerPick === 'kertas' && botPick === 'batu')
    ) {
      result = '🎉 *KAMU MENANG!* Strategi cerdas.';
      reward = 350;
    } else {
      result = '💀 *BOT MENANG!* Algoritma AI membaca langkahmu.';
      reward = 20;
    }

    user.coins += reward;
    user.xp += 25;
    db.updateUser(senderId, user);

    return sock.sendMessage(chatId, {
      text: `
🎮 *[CYBER SUIT ARENA]* 🎮
👤 Pilihanmu: *${playerPick.toUpperCase()}*
🤖 Pilihan AI: *${botPick.toUpperCase()}*

${result}
💰 +${reward} Koin | ⚡ +25 EXP
`.trim()
    });
  },

  // Batalkan game jika menyerah
  cancelGame(chatId) {
    let canceled = false;
    if (activeGames.tebakangka[chatId]) {
      const secret = activeGames.tebakangka[chatId].target;
      delete activeGames.tebakangka[chatId];
      return `🏳️ Kamu menyerah! Angka rahasianya adalah *${secret}*.`;
    }
    if (activeGames.tebakkata[chatId]) {
      const word = activeGames.tebakkata[chatId].jawaban;
      delete activeGames.tebakkata[chatId];
      return `🏳️ Kamu menyerah! Kata rahasianya adalah *${word}*.`;
    }
    if (activeGames.kuismtk[chatId]) {
      const ans = activeGames.kuismtk[chatId].jawaban;
      delete activeGames.kuismtk[chatId];
      return `🏳️ Kamu menyerah! Jawabannya adalah *${ans}*.`;
    }
    return null;
  },

  hasActiveGame(chatId) {
    return Boolean(
      activeGames.tebakangka[chatId] ||
      activeGames.tebakkata[chatId] ||
      activeGames.kuismtk[chatId]
    );
  }
};
