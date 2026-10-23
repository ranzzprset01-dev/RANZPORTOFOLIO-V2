const fs = require('fs');
const path = require('path');
const config = require('../config');

class SecureDatabase {
  constructor() {
    this.dataDir = path.resolve(config.DATABASE_DIR || './data');
    this.backupDir = path.join(this.dataDir, 'backups');

    this.files = {
      users: path.join(this.dataDir, 'users.json'),
      groups: path.join(this.dataDir, 'groups.json'),
      settings: path.join(this.dataDir, 'settings.json'),
      stats: path.join(this.dataDir, 'stats.json'),
      reminders: path.join(this.dataDir, 'reminders.json')
    };

    this.cache = {
      users: {},
      groups: {},
      settings: {},
      stats: {
        totalMessages: 0,
        totalCommands: 0,
        totalAiQueries: 0,
        totalGamesPlayed: 0,
        startTime: Date.now()
      },
      reminders: []
    };

    this.writeLocks = {};
    this.init();
  }

  init() {
    // Pastikan direktori data & backup dibuat
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Default settings
    const defaultSettings = {
      botName: config.BOT_NAME,
      prefix: config.DEFAULT_PREFIX,
      ownerNumber: config.OWNER_NUMBER,
      ownerName: config.OWNER_NAME,
      autoAiPrivate: config.AUTO_AI_PRIVATE,
      autoAiGroup: config.AUTO_AI_GROUP,
      aiProvider: config.AI_PROVIDER,
      openaiApiKey: config.OPENAI_API_KEY,
      openaiModel: config.OPENAI_MODEL,
      geminiApiKey: config.GEMINI_API_KEY,
      geminiModel: config.GEMINI_MODEL,
      aiSystemPrompt: config.AI_SYSTEM_PROMPT,
      antiSpamCooldown: config.RATE_LIMIT_COOLDOWN_MS,
      authorizedUsers: [],
      lidToPhone: {},
      maintenanceMode: false
    };

    // Muat data dari file atau buat default
    for (const [key, filePath] of Object.entries(this.files)) {
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          this.cache[key] = JSON.parse(raw);
        } catch (err) {
          console.error(`[DB-ERROR] Gagal membaca ${filePath}, memulihkan dari backup atau inisialisasi baru:`, err.message);
          this.restoreFromBackup(key);
        }
      } else {
        if (key === 'settings') {
          this.cache.settings = { ...defaultSettings };
        }
        this.saveAtomic(key);
      }
    }

    // Gabungkan default settings bila ada properti baru
    this.cache.settings = { ...defaultSettings, ...this.cache.settings };
    if (!Array.isArray(this.cache.settings.authorizedUsers)) {
      this.cache.settings.authorizedUsers = [];
    }
    if (!this.cache.settings.lidToPhone || typeof this.cache.settings.lidToPhone !== 'object' || Array.isArray(this.cache.settings.lidToPhone)) {
      this.cache.settings.lidToPhone = {};
    }
    const identityChanged = this.cache.settings.botName !== config.BOT_NAME ||
      this.cache.settings.ownerNumber !== config.OWNER_NUMBER ||
      /CYBER\s*NOVA|NOVA\s*(?:QUANTUM|AI)/i.test(this.cache.settings.aiSystemPrompt || '');
    this.cache.settings.botName = config.BOT_NAME;
    this.cache.settings.ownerNumber = config.OWNER_NUMBER;
    if (/CYBER\s*NOVA|NOVA\s*(?:QUANTUM|AI)/i.test(this.cache.settings.aiSystemPrompt || '')) {
      this.cache.settings.aiSystemPrompt = config.AI_SYSTEM_PROMPT;
    }
    if (identityChanged) this.saveAtomic('settings');

    // Jadwalkan auto backup tiap 30 menit
    setInterval(() => this.createBackup(), 30 * 60 * 1000);
  }

  // Atomic write untuk mencegah kerusakan data jika server/listrik mati
  saveAtomic(key) {
    if (this.writeLocks[key]) return;
    this.writeLocks[key] = true;

    try {
      const filePath = this.files[key];
      const tempPath = `${filePath}.tmp.${Date.now()}`;
      const serialized = JSON.stringify(this.cache[key], null, 2);
      fs.writeFileSync(tempPath, serialized, 'utf-8');
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.error(`[DB-ATOMIC-ERROR] Gagal menyimpan ${key}:`, err.message);
    } finally {
      this.writeLocks[key] = false;
    }
  }

  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      for (const [key, filePath] of Object.entries(this.files)) {
        if (fs.existsSync(filePath)) {
          const backupPath = path.join(this.backupDir, `${key}_${timestamp}.json`);
          fs.copyFileSync(filePath, backupPath);
        }
      }
      // Bersihkan backup lama (simpan maksimal 10 file per kategori)
      this.cleanOldBackups();
    } catch (err) {
      console.error('[DB-BACKUP] Gagal membuat cadangan database:', err.message);
    }
  }

  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      for (const key of Object.keys(this.files)) {
        const matches = files
          .filter(f => f.startsWith(`${key}_`))
          .sort((a, b) => b.localeCompare(a));
        if (matches.length > 5) {
          for (const oldFile of matches.slice(5)) {
            fs.unlinkSync(path.join(this.backupDir, oldFile));
          }
        }
      }
    } catch (e) {
      // Abaikan error saat clean
    }
  }

  restoreFromBackup(key) {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith(`${key}_`))
        .sort((a, b) => b.localeCompare(a));
      if (files.length > 0) {
        const latestBackup = path.join(this.backupDir, files[0]);
        const data = fs.readFileSync(latestBackup, 'utf-8');
        this.cache[key] = JSON.parse(data);
        console.log(`[DB-RESTORE] Berhasil memulihkan ${key} dari ${files[0]}`);
        this.saveAtomic(key);
      }
    } catch (e) {
      console.error(`[DB-RESTORE] Gagal restore ${key}:`, e.message);
    }
  }

  isOwner(userId, fromMe = false) {
    if (fromMe) return true;
    const userNumber = String(userId).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    return userNumber === config.OWNER_NUMBER;
  }

  normalizeAuthorizedNumber(value) {
    const input = String(value || '').trim();
    if (!input || /@lid$/i.test(input)) return null;

    const number = input.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    if (number.length < 8 || number.length > 15 || number === config.OWNER_NUMBER) return null;
    return number;
  }

  resolveWhatsAppUserId(userId, phoneId, lidId) {
    const phoneNumber = this.normalizeWhatsAppPhone(phoneId);
    if (phoneNumber) return `${phoneNumber}@s.whatsapp.net`;

    const primaryId = String(userId || '').trim();
    if (!/@lid$/i.test(primaryId)) return primaryId;

    const lid = String(lidId || primaryId).trim();
    const mappedPhone = this.normalizeWhatsAppPhone(this.cache.settings.lidToPhone[lid]);
    return mappedPhone ? `${mappedPhone}@s.whatsapp.net` : primaryId;
  }

  normalizeWhatsAppPhone(value) {
    const input = String(value || '').trim();
    if (!input || /@lid$/i.test(input) || /@(g\.us|broadcast|newsletter)$/i.test(input)) return null;

    const number = input.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    return number.length >= 8 && number.length <= 15 ? number : null;
  }

  hasBotAccess(userId, fromMe = false) {
    if (this.isOwner(userId, fromMe)) return true;
    const number = this.normalizeAuthorizedNumber(userId);
    return Boolean(number && this.cache.settings.authorizedUsers.includes(number));
  }

  addAuthorizedUser(userId) {
    const number = this.normalizeAuthorizedNumber(userId);
    if (!number) return { success: false, reason: 'invalid' };

    if (this.cache.settings.authorizedUsers.includes(number)) {
      return { success: false, reason: 'exists', number };
    }

    this.cache.settings.authorizedUsers.push(number);
    this.saveAtomic('settings');
    return { success: true, number };
  }

  removeAuthorizedUser(userId) {
    const number = this.normalizeAuthorizedNumber(userId);
    if (!number) return { success: false, reason: 'invalid' };

    const authorizedUsers = this.cache.settings.authorizedUsers;
    const index = authorizedUsers.indexOf(number);
    if (index === -1) return { success: false, reason: 'not_found', number };

    authorizedUsers.splice(index, 1);
    this.saveAtomic('settings');
    return { success: true, number };
  }

  getAuthorizedUsers() {
    return [...this.cache.settings.authorizedUsers];
  }

  // === USER OPERATIONS ===
  getUser(userId, name = 'Cyber Traveler', fromMe = false) {
    const cleanId = String(userId).trim();
    const isOwnerUser = this.isOwner(cleanId, fromMe);

    if (!this.cache.users[cleanId]) {
      this.cache.users[cleanId] = {
        id: cleanId,
        name: name || (isOwnerUser ? 'Commander' : 'Traveler'),
        coins: isOwnerUser ? 999999999 : 1000,
        xp: isOwnerUser ? 99999 : 0,
        level: isOwnerUser ? 99 : 1,
        role: isOwnerUser ? 'OWNER' : 'CITIZEN',
        rank: isOwnerUser ? 'Cyber Emperor' : 'Novice Hacker',
        hp: isOwnerUser ? 9999 : 100,
        maxHp: isOwnerUser ? 9999 : 100,
        attack: isOwnerUser ? 999 : 15,
        defense: isOwnerUser ? 999 : 10,
        inventory: isOwnerUser ? ['Quantum God Core', 'Plasma Annihilator', 'Infinite Cyber Key'] : ['Quantum Healing Stimpack x2'],
        lastDaily: 0,
        lastMining: 0,
        lastRpg: 0,
        lastCommandTime: 0,
        totalCommands: 0,
        warnings: 0,
        banned: false,
        notes: {},
        todos: [],
        createdAt: Date.now()
      };
      this.saveAtomic('users');
    }

    if (isOwnerUser && this.cache.users[cleanId].role !== 'OWNER') {
      this.cache.users[cleanId].role = 'OWNER';
      this.cache.users[cleanId].rank = 'Cyber Emperor';
      this.saveAtomic('users');
    }

    return this.cache.users[cleanId];
  }

  updateUser(userId, data = {}) {
    const cleanId = String(userId).trim();
    const user = this.getUser(cleanId);
    Object.assign(user, data);

    // Cek level up berdasarkan XP
    const requiredXp = user.level * 100;
    if (user.xp >= requiredXp) {
      user.level += 1;
      user.coins += user.level * 250;
      user.maxHp += 20;
      user.hp = user.maxHp;
      user.attack += 5;
      user.defense += 3;
      user.leveledUp = true;
    }

    // Update Rank Title
    if (user.level >= 50) user.rank = 'Cyber Lord';
    else if (user.level >= 30) user.rank = 'Quantum Architect';
    else if (user.level >= 20) user.rank = 'Elite Netrunner';
    else if (user.level >= 10) user.rank = 'Cyber Specialist';
    else if (user.level >= 5) user.rank = 'Tech Operative';
    else user.rank = 'Novice Hacker';

    this.saveAtomic('users');
    return user;
  }

  getAllUsers() {
    const rawUsers = Object.values(this.cache.users);
    // Filter out group IDs / newsletters / ID obrolan non-kontak
    const validUsers = rawUsers.filter(u => {
      const id = String(u.id || '');
      return !id.includes('@g.us') && !id.includes('@newsletter') && !id.startsWith('120363') && !id.includes('@broadcast');
    });

    // Deduplicate by clean phone number
    const userMap = new Map();
    for (const u of validUsers) {
      const cleanNum = String(u.id).replace(/[^0-9]/g, '');
      if (!cleanNum || cleanNum.length < 5) continue;

      if (!userMap.has(cleanNum)) {
        userMap.set(cleanNum, u);
      } else {
        const existing = userMap.get(cleanNum);
        // Prioritize s.whatsapp.net or OWNER role or higher level
        if (u.id.includes('@s.whatsapp.net') || u.role === 'OWNER' || (u.level || 0) > (existing.level || 0)) {
          userMap.set(cleanNum, { ...existing, ...u });
        }
      }
    }

    const deduplicated = Array.from(userMap.values());

    return deduplicated.map(u => {
      const cleanNum = String(u.id).replace(/[^0-9]/g, '');
      const isPairedHost = cleanNum.includes('6282183317690') || cleanNum.includes('27793370959961');
      let formattedPhone = '+' + cleanNum;
      if (cleanNum.startsWith('62') && cleanNum.length >= 10) {
        formattedPhone = `+62 ${cleanNum.substring(2, 5)}-${cleanNum.substring(5, 9)}-${cleanNum.substring(9)}`;
      } else if (u.id.includes('@lid') && cleanNum.length >= 14) {
        formattedPhone = `LID: ${cleanNum.substring(0, 4)}...${cleanNum.substring(cleanNum.length - 4)}`;
      }

      let displayName = u.name || 'Traveler';
      displayName = displayName.replace(/\s*\[Login WA Sendiri\]/g, '').trim();

      return {
        ...u,
        phoneNumber: formattedPhone,
        isPairedHost,
        name: isPairedHost ? `${displayName} [Login WA Sendiri]` : displayName
      };
    }).sort((a, b) => {
      if (b.isPairedHost && !a.isPairedHost) return 1;
      if (!b.isPairedHost && a.isPairedHost) return -1;
      return (b.coins || 0) - (a.coins || 0);
    });
  }

  syncWhatsAppContacts(contacts = []) {
    let updated = 0;

    for (const contact of contacts) {
      const contactId = contact.jid || contact.id;
      const displayName = contact.name || contact.notify || contact.verifiedName;
      const lidId = contact.lid || (String(contact.id || '').endsWith('@lid') ? contact.id : null);
      const phoneNumber = this.normalizeWhatsAppPhone(contact.jid || (String(contact.id || '').endsWith('@s.whatsapp.net') ? contact.id : null));

      if (lidId && phoneNumber && this.cache.settings.lidToPhone[lidId] !== phoneNumber) {
        this.cache.settings.lidToPhone[lidId] = phoneNumber;
        this.saveAtomic('settings');
        updated += 1;
      }

      if (contactId && displayName && !/@(g\.us|broadcast|newsletter)$/.test(contactId)) {
        const user = this.getUser(contactId, displayName);
        if (user.name !== displayName || user.contactName !== displayName) {
          user.name = displayName;
          user.contactName = displayName;
          updated += 1;
        }
      }
    }

    if (updated > 0) this.saveAtomic('users');
    return updated;
  }

  // === GROUP OPERATIONS ===
  getGroup(groupId, name = 'Grup WhatsApp') {
    const cleanId = String(groupId);
    if (!this.cache.groups[cleanId]) {
      this.cache.groups[cleanId] = {
        id: cleanId,
        name: name,
        antilink: false,
        welcome: true,
        welcomeMessage: 'Selamat datang @user di sektor {group}! Harap patuhi protokol grup.',
        leaveMessage: 'Sampai jumpa @user. Koneksi terputus dari sektor.',
        autoAi: false,
        muted: false,
        gamesActive: {},
        createdAt: Date.now()
      };
      this.saveAtomic('groups');
    }
    return this.cache.groups[cleanId];
  }

  updateGroup(groupId, data = {}) {
    const cleanId = String(groupId);
    const group = this.getGroup(cleanId);
    Object.assign(group, data);
    this.saveAtomic('groups');
    return group;
  }

  getAllGroups() {
    return Object.values(this.cache.groups);
  }

  // === SETTINGS & STATS ===
  getSettings() {
    return this.cache.settings;
  }

  updateSettings(data = {}) {
    Object.assign(this.cache.settings, data);
    this.saveAtomic('settings');
    return this.cache.settings;
  }

  getStats() {
    return {
      ...this.cache.stats,
      totalUsers: Object.keys(this.cache.users).length,
      totalGroups: Object.keys(this.cache.groups).length,
      uptimeSeconds: Math.floor((Date.now() - this.cache.stats.startTime) / 1000)
    };
  }

  incrementStat(statName, value = 1) {
    if (this.cache.stats[statName] !== undefined) {
      this.cache.stats[statName] += value;
    } else {
      this.cache.stats[statName] = value;
    }
    this.saveAtomic('stats');
  }

  // === REMINDERS ===
  addReminder(reminder) {
    this.cache.reminders.push(reminder);
    this.saveAtomic('reminders');
  }

  getReminders() {
    return this.cache.reminders;
  }

  removeReminder(id) {
    this.cache.reminders = this.cache.reminders.filter(r => r.id !== id);
    this.saveAtomic('reminders');
  }
}

module.exports = new SecureDatabase();
