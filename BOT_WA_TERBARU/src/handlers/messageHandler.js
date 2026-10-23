const db = require('../database/db');
const aiPlugin = require('../plugins/ai');
const aiAdvancedPlugin = require('../plugins/aiAdvanced');
const gamesPlugin = require('../plugins/games');
const dailyPlugin = require('../plugins/daily');
const toolsPlugin = require('../plugins/tools');
const groupPlugin = require('../plugins/group');
const werewolfPlugin = require('../plugins/werewolf');
const tebakgambarPlugin = require('../plugins/tebakgambar');
const economyPlugin = require('../plugins/economy');
const ownerPlugin = require('../plugins/owner');
const funPlugin = require('../plugins/fun');
const lifestylePlugin = require('../plugins/lifestyle');
const texttoolsPlugin = require('../plugins/texttools');
const securityDefensePlugin = require('../plugins/securityDefense');
const mediaTools = require('../plugins/mediaTools');
const aiService = require('../services/aiService');
const animeService = require('../services/animeService');
const iqcMaker = require('../plugins/iqcMaker');
const animeRoleplay = require('../plugins/animeRoleplay');
const cyberExtra = require('../plugins/cyberExtra');
const economyExtra = require('../plugins/economyExtra');
const islamicExtra = require('../plugins/islamicExtra');
const funExtra = require('../plugins/funExtra');
const utilityExtra = require('../plugins/utilityExtra');
const family100Plugin = require('../plugins/family100');
const importedTriviaPlugin = require('../plugins/importedTrivia');
const audioConverterPlugin = require('../plugins/audioConverter');

const userCooldowns = new Map();
const userLastMessageTime = new Map();
const spamWarnings = new Map();

// Daftar semua perintah yang dikenali (195+ Perintah Lengkap)
const KNOWN_COMMANDS = new Set([
  // Core & Menu
  'menu', 'help', 'bantuan', 'profile', 'me', 'status', 'leaderboard', 'top', 'sultan', 'ping', 'speed', 'afk', 'port', 'portbot',
  // Media, Sticker, View-Once & Downloaders
  'stiker', 's', 'sticker', 'rvo', 'readvo', 'lihat', 'buka', 'openvo', 'antivo', 'antiviewonce', 'rvovideo', 'unduh',
  'toaudio', 'tovn',
  'ytmp3', 'yta', 'play', 'tiktok', 'tt', 'ttvideo', 'scanqr', 'readqr', 'bacaqr', 'qrcode', 'qr',
  // Fake Chat & IQC Maker
  'iqc', 'fakechat', 'brat', 'tweet', 'grayscale', 'bw', 'invert', 'blur', 'flip', 'mirror',
  'winkhd',
  // Anime & Roleplay Actions
  'hug', 'pat', 'kiss', 'slap', 'punch', 'cry', 'smile', 'dance', 'poke', 'wink', 'waifu', 'husbando', 'neko', 'shinobu', 'megumin',
  // Cyber Recon, Security & Dev Tools
  'delayhard', 'anticrash', 'crash', 'counterspam', 'freeze', 'clearchat', 'firewall', 'shield',
  'hack', 'retas', 'emp', 'strike', 'inspect', 'scan', 'lockdown',
  'ddossim', 'ddos', 'firewalldefend', 'upgradefirewall', 'antivirus', 'malwarescan', 'patchsystem', 'stealthmode',
  'portcheck', 'checkport', 'sslcheck', 'checkssl', 'dnslookup', 'dns', 'headerscheck', 'headers',
  'cvesearch', 'cve', 'passcheck', 'checkpass', 'hashcalc', 'hash',
  'whois', 'httpstatus', 'useragent', 'ipcalc', 'traceroutesim', 'rot13', 'hex', 'dehex', 'urlencode', 'urldecode', 'timestamp', 'jsonformat', 'jwtdecode',
  // Banking, Economy & Casino Simulation
  'bank', 'deposit', 'withdraw', 'crypto', 'work', 'beg', 'rob', 'blackjack',
  // Islamic & Religi
  'niatsholat', 'kisahnabi', 'ayatkursi', 'dzikir', 'zakatcalc', 'tasbih',
  // Fun, Social & Predictions
  'truth', 'dare', 'kapankah', 'apakah', 'bisakah', 'rate', 'gantengcek', 'cantikcek', 'bucin', 'motivasi', 'pantun', 'filsafat', 'tarot',
  // System, Utility & Hardware
  'gitsearch', 'npmsearch', 'linuxcmd', 'systeminfo', 'cleanram', 'randomip', 'colorhex',
  // AI Standard & Visual Multimodal
  'ai', 'tanya', 'gpt', 'gemini', 'img', 'draw', 'gambar', 'askimg', 'aiimg', 'ocr', 'baca',
  'code', 'koding', 'summarize', 'ringkas', 'translate', 'terjemah', 'modeai', 'clearai', 'resetai',
  // AI Advanced & Reasoning
  'deepseek', 'think', 'reason', 'animeprompt', 'audit', 'fixcode',
  'ai-voice', 'aivoice', 'prompt', 'enhance', 'poem', 'puisi', 'roast', 'puji', 'story', 'cerita', 'grammar', 'explain', 'regex', 'mathsolve',
  // Games & Werewolf
  'ww', 'werewolf', 'family100', 'asahotak', 'susunkata', 'tebakgambar', 'tebakangka', 'tebakkata', 'kuismtk', 'math', 'slot', 'casino', 'rpg', 'petualangan', 'adventure', 'mining', 'tambang', 'suit', 'nyerah',
  // Fun Games
  'khodam', 'cekkhodam', 'jodoh', 'dadu', 'roll', 'coinflip', 'koin', 'wheel', 'spin', 'roulette', 'caklontong', 'tebakbendera', 'tebakkimia',
  // Lifestyle & Agama
  'quran', 'asmaulhusna', 'doa', 'gempa', 'wiki', 'kbbi', 'kurs', 'resep',
  // Text & Security Tools
  'fancy', 'morse', 'demorse', 'binary', 'debinary', 'base64', 'debase64', 'reverse', 'mock', 'passgen', 'uuid', 'count', 'qrcode', 'qr', 'shortlink', 'short', 'tts', 'audio',
  // Economy & Admin Koin
  'addcoin', 'tambahkoin', 'delcoin', 'kurangkoin', 'setcoin', 'addxp', 'setrole', 'transfer', 'shop', 'toko', 'buy', 'beli',
  // Owner Controls
  'eval', 'exec', 'backup', 'broadcast', 'bc', 'join', 'leave', 'ban', 'unban', 'resetuser', 'mode',
  'izinkan', 'cabutakses', 'daftarakses',
  // Group Moderation
  'tagall', 'hidetag', 'antilink', 'group', 'kick', 'promote', 'demote'
]);

class MessageHandler {
  constructor() {
    this.io = null;
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  emitLog(type, text, meta = {}) {
    if (this.io) {
      this.io.emit('bot_log', {
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type,
        text,
        meta
      });
    }
  }

  parseCommand(rawText, configuredPrefix) {
    const text = rawText.trim();
    if (!text) return null;

    let cleanText = text;

    if (configuredPrefix && cleanText.toLowerCase().startsWith(configuredPrefix.toLowerCase())) {
      cleanText = cleanText.slice(configuredPrefix.length).trim();
    } else if (/^[.!#/~$]/.test(cleanText)) {
      cleanText = cleanText.slice(1).trim();
    } else if (/^run\s+/i.test(cleanText)) {
      cleanText = cleanText.replace(/^run\s+/i, '').trim();
    }

    const parts = cleanText.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const query = args.join(' ');

    if (KNOWN_COMMANDS.has(command)) {
      return { command, args, query };
    }

    if (/^[.!#/~$]/.test(text)) {
      return { command, args, query, isUnknownCommand: true };
    }

    return null;
  }

  async handle(sock, msg) {
    try {
      if (!msg.message) return;
      const key = msg.key;
      const fromMe = key.fromMe;
      const chatId = key.remoteJid;
      const isGroup = chatId.endsWith('@g.us');
      const rawSenderId = isGroup ? key.participant || key.remoteJid : key.remoteJid;
      const senderPhone = isGroup ? key.participantPn : key.senderPn;
      const senderLid = isGroup ? key.participantLid : key.senderLid;
      const senderId = db.resolveWhatsAppUserId(rawSenderId, senderPhone, senderLid);

      if (chatId === 'status@broadcast') return;

      const messageContent = msg.message;

      // Ekstraksi respons klik tombol WhatsApp (Quick Reply, List, Native Flow)
      let buttonResponseId = '';
      if (messageContent.buttonsResponseMessage) {
        buttonResponseId = messageContent.buttonsResponseMessage.selectedButtonId || '';
      } else if (messageContent.templateButtonReplyMessage) {
        buttonResponseId = messageContent.templateButtonReplyMessage.selectedId || '';
      } else if (messageContent.listResponseMessage?.singleSelectReply?.selectedRowId) {
        buttonResponseId = messageContent.listResponseMessage.singleSelectReply.selectedRowId;
      } else if (messageContent.interactiveResponseMessage) {
        try {
          const params = JSON.parse(messageContent.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || '{}');
          buttonResponseId = params.id || params.selected_id || params.row_id || '';
        } catch (e) {}
      }

      const text = (
        buttonResponseId ||
        messageContent.conversation ||
        messageContent.extendedTextMessage?.text ||
        messageContent.imageMessage?.caption ||
        messageContent.videoMessage?.caption ||
        ''
      ).trim();

      const contextInfo = messageContent.extendedTextMessage?.contextInfo ||
        messageContent.imageMessage?.contextInfo ||
        messageContent.videoMessage?.contextInfo;
      const mentionedJids = contextInfo?.mentionedJid || [];
      const botNumber = sock.user?.id?.split(':')[0];
      const isBotMentioned = isGroup && botNumber &&
        mentionedJids.some(jid => jid.split('@')[0].split(':')[0] === botNumber);
      const accessDeniedText = '⛔ Nomor ini belum diberi akses ke bot. Silakan hubungi Owner di 082183317690 untuk meminta izin.';

      if (!text) {
        if (!isGroup && !db.hasBotAccess(senderId, fromMe)) {
          await sock.sendMessage(chatId, { text: accessDeniedText }, { quoted: msg });
        }
        return;
      }

      // ==========================================
      // 🛡️ CYBER DELAYHARD & ANTI-VIRTEX DEFENSE
      // ==========================================
      if (securityDefensePlugin.detectMaliciousPayload(text)) {
        console.warn(`[SECURITY] 🚨 Serangan Virtex/Crash dicegah dari: ${senderId}`);
        if (isGroup) {
          await sock.sendMessage(chatId, { delete: key }).catch(() => {});
        }
        return; // Hentikan proses agar memori HP Owner tidak freeze/crash
      }

      const senderName = msg.pushName || 'Traveler';
      const settings = db.getSettings();
      const prefix = settings.prefix || '.';
      const parsedCommand = this.parseCommand(text, prefix);

      if (!db.hasBotAccess(senderId, fromMe)) {
        if (parsedCommand || !isGroup || isBotMentioned) {
          await sock.sendMessage(chatId, { text: accessDeniedText }, { quoted: msg });
        }
        return;
      }

      const user = db.getUser(senderId, senderName, fromMe);

      // Skip group chats unless it's a command or critical feature
      if (isGroup) {
        const groupData = db.getGroup(chatId);
        const hasWelcome = groupData?.welcome;
        const hasAntilink = groupData?.antilink;

        // Skip if not a command and no critical features enabled
        if (!parsedCommand && !hasWelcome && !hasAntilink) {
          return;
        }
      }

      db.incrementStat('totalMessages');
      this.emitLog('incoming', `[${isGroup ? 'GRUP' : 'PRIBADI'}] ${senderName}: ${text.substring(0, 60)}`, { senderId, chatId });

      if (user.banned && !db.isOwner(senderId, fromMe)) return;

      // ==========================================
      // 🛡️ ANTI-SPAM: Block user yang spam <5 detik
      // ==========================================
      const now = Date.now();
      const lastMsgTime = userLastMessageTime.get(senderId) || 0;
      const timeDiff = now - lastMsgTime;

      if (timeDiff < 5000 && !fromMe && !db.isOwner(senderId, fromMe)) {
        const warningCount = (spamWarnings.get(senderId) || 0) + 1;
        spamWarnings.set(senderId, warningCount);

        if (warningCount >= 3) {
          // Auto ban spammer
          user.banned = true;
          db.updateUser(senderId, user);
          spamWarnings.delete(senderId);
          await sock.sendMessage(chatId, {
            text: `🚫 *[ANTI-SPAM]* @${senderId.split('@')[0]} telah diblokir otomatis karena spam berlebihan!`,
            mentions: [senderId]
          });
          return;
        }

        // Warning message
        if (warningCount === 1) {
          await sock.sendMessage(chatId, {
            text: `⚠️ Jangan spam! Tunggu 5 detik sebelum kirim pesan lagi. (Peringatan 1/3)`
          });
        }
        return;
      }

      userLastMessageTime.set(senderId, now);
      spamWarnings.delete(senderId);

      // Mode Self: Hanya Owner yang dapat mengakses
      if (settings.maintenanceMode && !db.isOwner(senderId, fromMe)) {
        return;
      }

      // ==========================================
      // CEK STATUS AFK PENGIRIM & MENTION
      // ==========================================
      if (user.afk && user.afk.isAfk) {
        user.afk.isAfk = false;
        db.updateUser(senderId, user);
        await sock.sendMessage(chatId, {
          text: `👋 Selamat datang kembali @${senderId.split('@')[0]}! Status AFK kamu telah dinonaktifkan.`,
          mentions: [senderId]
        });
      }

      if (mentionedJids.length > 0) {
        for (const jid of mentionedJids) {
          const mentionedUser = db.getUser(jid);
          if (mentionedUser.afk && mentionedUser.afk.isAfk) {
            await sock.sendMessage(chatId, {
              text: `💤 @${jid.split('@')[0]} sedang *AFK*:\n> "${mentionedUser.afk.reason}"`,
              mentions: [jid]
            });
          }
        }
      }

      // ==========================================
      // 1. CEK SESI GAME AKTIF (TANPA PREFIX)
      // ==========================================
      if (!parsedCommand && family100Plugin.hasActive(chatId)) {
        const handledFamily100 = await family100Plugin.checkAnswer(sock, chatId, senderId, text);
        if (handledFamily100) return;
      }

      if (!parsedCommand && importedTriviaPlugin.hasActive(chatId)) {
        const handledTrivia = await importedTriviaPlugin.checkAnswer(sock, chatId, senderId, text);
        if (handledTrivia) return;
      }

      if (tebakgambarPlugin.hasActive(chatId)) {
        const handledTg = await tebakgambarPlugin.checkAnswer(sock, chatId, senderId, text);
        if (handledTg) return;
      }

      if (funPlugin.hasActiveGame(chatId)) {
        if (funPlugin.checkCakLontong(sock, chatId, senderId, text)) return;
        if (funPlugin.checkTebakBendera(sock, chatId, senderId, text)) return;
        if (funPlugin.checkTebakKimia(sock, chatId, senderId, text)) return;
      }

      if (gamesPlugin.hasActiveGame(chatId)) {
        if (/^\d+$/.test(text)) {
          const handled = await gamesPlugin.tebakAngka(sock, chatId, senderId, [text], true);
          if (handled) return;
        }
        if (/^-?\d+$/.test(text)) {
          const handled = await gamesPlugin.kuisMatematika(sock, chatId, senderId, text, true);
          if (handled) return;
        }
        const handledWord = await gamesPlugin.tebakKata(sock, chatId, senderId, text, true);
        if (handledWord) return;
      }

      // ==========================================
      // 2. CEK PROTEKSI ANTILINK DI GRUP
      // ==========================================
      if (isGroup) {
        const groupData = db.getGroup(chatId);
        if (groupData.antilink && (text.includes('chat.whatsapp.com/') || text.includes('wa.me/'))) {
          const groupMeta = await sock.groupMetadata(chatId).catch(() => null);
          const participant = groupMeta?.participants?.find(p => p.id === senderId);
          const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

          if (!isAdmin && !fromMe && !db.isOwner(senderId, fromMe)) {
            await sock.sendMessage(chatId, { delete: key }).catch(() => {});
            await sock.sendMessage(chatId, {
              text: `⚠️ *[PERINGATAN ANTILINK]*\n@${senderId.split('@')[0]} dilarang membagikan tautan grup lain di sektor ini!`,
              mentions: [senderId]
            });
            return;
          }
        }
      }

      // ==========================================
      // 3. RATE LIMIT / ANTI-FLOOD COOLDOWN
      // ==========================================
      const cooldownMs = Math.min(settings.antiSpamCooldown || 1500, 2000);
      if (!fromMe && !db.isOwner(senderId, fromMe) && userCooldowns.has(senderId)) {
        const lastTime = userCooldowns.get(senderId);
        if (now - lastTime < cooldownMs) {
          return;
        }
      }
      userCooldowns.set(senderId, now);

      // ==========================================
      // 4. PARSER PERINTAH (MULTI-PREFIX & NO-PREFIX)
      // ==========================================
      const parsed = parsedCommand;

      if (parsed) {
        const { command, args, query, isUnknownCommand } = parsed;
        const startTs = Date.now();

        if (isUnknownCommand) {
          return await animeService.sendAnimeReply(sock, chatId, `❓ Perintah *${command}* tidak dikenali. Ketik *.menu* untuk melihat seluruh fitur!`, msg);
        }

        if (!['iqc', 'fakechat', 'menu', 'help', 'bantuan', 'izinkan', 'cabutakses', 'daftarakses'].includes(command)) {
          try {
            await animeService.sendCommandImage(sock, chatId, msg);
          } catch (imageError) {
            console.error('[COMMAND-IMAGE-ERROR]', imageError.message);
            this.emitLog('error', `Gambar perintah gagal dikirim: ${imageError.message}`);
          }
        }

        db.incrementStat('totalCommands');
        this.emitLog('command', `Eksekusi: [${command}] oleh ${senderName}`);

        switch (command) {
          // === MENU & PROFILE ===
          case 'menu':
          case 'help':
          case 'bantuan':
            return await toolsPlugin.showMenu(sock, chatId, senderId, args[0]);

          case 'profile':
          case 'me':
          case 'status':
            return await toolsPlugin.showProfile(sock, chatId, senderId);

          case 'leaderboard':
          case 'top':
          case 'sultan':
            return await toolsPlugin.showLeaderboard(sock, chatId);

          case 'ping':
          case 'speed':
            return await toolsPlugin.checkPing(sock, chatId, startTs);

          case 'port':
          case 'portbot':
            return await toolsPlugin.checkPort(sock, chatId);

          case 'afk':
            return await toolsPlugin.handleAFK(sock, chatId, senderId, query);

          // === 🛡️ SECURITY & DELAYHARD ANTICRASH ===
          case 'delayhard':
          case 'anticrash':
            return await securityDefensePlugin.handleDelayhard(sock, chatId, senderId, args, fromMe);

          case 'crash':
          case 'counterspam':
          case 'freeze': {
            const target = mentionedJids[0] || query;
            return await securityDefensePlugin.handleCrash(sock, chatId, senderId, target, fromMe);
          }

          case 'clearchat':
            return await securityDefensePlugin.clearChatBuffers(sock, chatId, senderId, fromMe);

          case 'firewall':
            return await securityDefensePlugin.showFirewallStatus(sock, chatId);

          case 'shield':
            return await securityDefensePlugin.handleCyberShield(sock, chatId, senderId);

          case 'hack':
          case 'retas': {
            const target = mentionedJids[0] || query;
            return await securityDefensePlugin.handleCyberHack(sock, chatId, senderId, target);
          }

          case 'emp': {
            const target = mentionedJids[0] || query;
            return await securityDefensePlugin.handleEMP(sock, chatId, senderId, target);
          }

          case 'strike': {
            const target = mentionedJids[0] || args[0];
            const reason = args.slice(1).join(' ') || 'Pelanggaran keamanan';
            return await securityDefensePlugin.handleStrike(sock, chatId, senderId, target, reason, isGroup, fromMe);
          }

          case 'inspect':
          case 'scan': {
            const target = mentionedJids[0] || query;
            return await securityDefensePlugin.handleInspect(sock, chatId, target);
          }

          case 'lockdown':
            return await securityDefensePlugin.handleLockdown(sock, chatId, senderId, args[0], isGroup, fromMe);

          case 'ddossim':
          case 'ddos': {
            const target = mentionedJids[0] || query;
            return await securityDefensePlugin.handleDDoSSim(sock, chatId, senderId, target);
          }

          case 'firewalldefend':
          case 'upgradefirewall':
            return await securityDefensePlugin.handleFirewallDefend(sock, chatId, senderId);

          case 'antivirus':
            return await securityDefensePlugin.handleAntivirus(sock, chatId, senderId);

          case 'malwarescan': {
            const target = mentionedJids[0] || query;
            return await securityDefensePlugin.handleMalwareScan(sock, chatId, target);
          }

          case 'patchsystem':
            return await securityDefensePlugin.handlePatchSystem(sock, chatId, senderId);

          case 'stealthmode':
            return await securityDefensePlugin.handleStealthMode(sock, chatId, senderId);

          case 'portcheck':
          case 'checkport':
            return await securityDefensePlugin.handlePortCheck(sock, chatId, args[0], args[1]);

          case 'sslcheck':
          case 'checkssl':
            return await securityDefensePlugin.handleSSLCheck(sock, chatId, query);

          case 'dnslookup':
          case 'dns':
            return await securityDefensePlugin.handleDNSLookup(sock, chatId, query);

          case 'headerscheck':
          case 'headers':
            return await securityDefensePlugin.handleHeadersCheck(sock, chatId, query);

          case 'cvesearch':
          case 'cve':
            return await securityDefensePlugin.handleCVESearch(sock, chatId, query);

          case 'passcheck':
          case 'checkpass':
            return await securityDefensePlugin.handlePasswordCheck(sock, chatId, query);

          case 'hashcalc':
          case 'hash':
            return await securityDefensePlugin.handleHashCalc(sock, chatId, query);

          // === AI INTELLIGENCE ===
          case 'ai':
          case 'tanya':
          case 'gpt':
          case 'gemini':
            return await aiPlugin.handleChatAI(sock, chatId, senderId, query);

          // === 👁️ VISION AI & DEEP REASONING ===
          case 'askimg':
          case 'aiimg':
          case 'ocr':
          case 'baca':
            return await aiAdvancedPlugin.handleVisionAI(sock, chatId, senderId, msg, query);

          case 'deepseek':
          case 'think':
          case 'reason':
            return await aiAdvancedPlugin.handleDeepReasoning(sock, chatId, senderId, query);

          case 'animeprompt':
            return await aiAdvancedPlugin.handleAnimePrompt(sock, chatId, senderId, query);

          case 'audit':
          case 'fixcode':
            return await aiAdvancedPlugin.handleCodeAudit(sock, chatId, senderId, query);

          case 'ai-voice':
          case 'aivoice':
            return await aiAdvancedPlugin.handleAIVoice(sock, chatId, senderId, query);

          case 'prompt':
          case 'enhance':
            return await aiAdvancedPlugin.enhancePrompt(sock, chatId, senderId, query);

          case 'poem':
          case 'puisi':
            return await aiAdvancedPlugin.generatePoem(sock, chatId, senderId, query);

          case 'roast':
            return await aiAdvancedPlugin.roastUser(sock, chatId, senderId, query);

          case 'puji':
            return await aiAdvancedPlugin.praiseUser(sock, chatId, senderId, query);

          case 'story':
          case 'cerita':
            return await aiAdvancedPlugin.generateStory(sock, chatId, senderId, query);

          case 'grammar':
            return await aiAdvancedPlugin.checkGrammar(sock, chatId, senderId, query);

          case 'explain':
            return await aiAdvancedPlugin.explainConcept(sock, chatId, senderId, query);

          case 'regex':
            return await aiAdvancedPlugin.generateRegex(sock, chatId, senderId, query);

          case 'mathsolve':
            return await aiAdvancedPlugin.solveMath(sock, chatId, senderId, query);

          case 'img':
          case 'draw':
          case 'gambar':
            return await aiPlugin.handleImageAI(sock, chatId, senderId, query);

          case 'code':
          case 'koding':
            return await aiPlugin.handleCodeAI(sock, chatId, senderId, args);

          case 'summarize':
          case 'ringkas':
            return await aiPlugin.handleSummarize(sock, chatId, senderId, query);

          case 'translate':
          case 'terjemah':
            return await aiPlugin.handleTranslate(sock, chatId, senderId, args);

          case 'modeai':
            return await aiPlugin.toggleAIMode(sock, chatId, args[0], isGroup);

          case 'clearai':
          case 'resetai':
            return aiPlugin.clearMemory(sock, chatId, senderId);

          // === GAMES & ENTERTAINMENT ===
          case 'ww':
          case 'werewolf':
            return await werewolfPlugin.handleWerewolf(sock, chatId, senderId, args, isGroup);

          case 'family100':
            if (args[0]?.toLowerCase() === 'stop' || args[0]?.toLowerCase() === 'nyerah') {
              return await family100Plugin.stop(sock, chatId);
            }
            return await family100Plugin.start(sock, chatId);

          case 'asahotak':
          case 'susunkata':
            return await importedTriviaPlugin.start(sock, chatId, command);

          case 'tebakgambar':
            return await tebakgambarPlugin.handleTebakGambar(sock, chatId, senderId);

          case 'caklontong':
            return funPlugin.handleCakLontong(sock, chatId, senderId);

          case 'tebakbendera':
            return await funPlugin.handleTebakBendera(sock, chatId, senderId);

          case 'tebakkimia':
            return funPlugin.handleTebakKimia(sock, chatId, senderId);

          case 'khodam':
          case 'cekkhodam':
            return funPlugin.checkKhodam(sock, chatId, senderId, query);

          case 'jodoh':
            return funPlugin.checkLove(sock, chatId, senderId, query);

          case 'dadu':
          case 'roll':
            return funPlugin.rollDice(sock, chatId, senderId);

          case 'coinflip':
          case 'koin':
            return funPlugin.flipCoin(sock, chatId, senderId);

          case 'wheel':
          case 'spin':
            return funPlugin.spinWheel(sock, chatId, senderId, query);

          case 'roulette':
            return funPlugin.russianRoulette(sock, chatId, senderId);

          case 'tebakangka':
            return await gamesPlugin.tebakAngka(sock, chatId, senderId, args, false);

          case 'tebakkata':
            return await gamesPlugin.tebakKata(sock, chatId, senderId, query, false);

          case 'kuismtk':
          case 'math':
            return await gamesPlugin.kuisMatematika(sock, chatId, senderId, query, false);

          case 'slot':
          case 'casino':
            return await gamesPlugin.slotMachine(sock, chatId, senderId, args[0]);

          case 'rpg':
          case 'petualangan':
          case 'adventure':
            return await gamesPlugin.rpgAdventure(sock, chatId, senderId);

          case 'mining':
          case 'tambang':
            return await gamesPlugin.miningCrypto(sock, chatId, senderId);

          case 'suit':
            return await gamesPlugin.suitGame(sock, chatId, senderId, args[0]);

          case 'nyerah': {
            if (family100Plugin.hasActive(chatId)) return await family100Plugin.stop(sock, chatId);
            if (importedTriviaPlugin.hasActive(chatId)) return await importedTriviaPlugin.cancel(sock, chatId);
            const tg = tebakgambarPlugin.cancel(chatId);
            if (tg) return await sock.sendMessage(chatId, { text: tg });
            const fg = funPlugin.cancelGames(chatId);
            if (fg) return await sock.sendMessage(chatId, { text: fg });
            const gm = gamesPlugin.cancelGame(chatId);
            if (gm) return await sock.sendMessage(chatId, { text: gm });
            return await sock.sendMessage(chatId, { text: `ℹ️ Tidak ada sesi permainan aktif.` });
          }

          // === LIFESTYLE & AGAMA ===
          case 'quran':
            return await lifestylePlugin.getQuran(sock, chatId, query);

          case 'asmaulhusna':
            return await lifestylePlugin.getAsmaulHusna(sock, chatId);

          case 'doa':
            return await lifestylePlugin.getDoa(sock, chatId, query);

          case 'gempa':
            return await lifestylePlugin.getGempa(sock, chatId);

          case 'wiki':
            return await lifestylePlugin.getWiki(sock, chatId, query);

          case 'kbbi':
            return await lifestylePlugin.getKBBI(sock, chatId, query);

          case 'kurs':
            return await lifestylePlugin.getKurs(sock, chatId, query);

          case 'resep':
            return await lifestylePlugin.getResep(sock, chatId, query);

          // === TEXT & DEV TOOLS ===
          case 'fancy':
            return texttoolsPlugin.fancyText(sock, chatId, query);

          case 'morse':
            return texttoolsPlugin.toMorse(sock, chatId, query);

          case 'demorse':
            return texttoolsPlugin.fromMorse(sock, chatId, query);

          case 'binary':
            return texttoolsPlugin.toBinary(sock, chatId, query);

          case 'debinary':
            return texttoolsPlugin.fromBinary(sock, chatId, query);

          case 'base64':
            return texttoolsPlugin.toBase64(sock, chatId, query);

          case 'debase64':
            return texttoolsPlugin.fromBase64(sock, chatId, query);

          case 'reverse':
            return texttoolsPlugin.reverseText(sock, chatId, query);

          case 'mock':
            return texttoolsPlugin.mockText(sock, chatId, query);

          case 'passgen':
            return texttoolsPlugin.generatePassword(sock, chatId, query);

          case 'uuid':
            return texttoolsPlugin.generateUUID(sock, chatId);

          case 'count':
            return texttoolsPlugin.countText(sock, chatId, query);

          // === 📸 MEDIA, STIKER & DOWNLOADER ===
          case 'stiker':
          case 's':
          case 'sticker':
            return await mediaTools.handleConvertToSticker(sock, chatId, senderId, msg);

          case 'rvo':
          case 'readvo':
          case 'lihat':
          case 'buka':
          case 'openvo':
          case 'antivo':
          case 'antiviewonce':
          case 'rvovideo':
          case 'unduh':
            return await mediaTools.handleRevealViewOnce(sock, chatId, senderId, msg);

          case 'ytmp3':
          case 'yta':
          case 'play':
            return await mediaTools.handleDownloadYouTubeAudio(sock, chatId, senderId, query, msg);

          case 'tiktok':
          case 'tt':
          case 'ttvideo':
            return await mediaTools.handleDownloadTikTok(sock, chatId, senderId, query, msg);

          // === 📱 QR CODE GENERATOR & SCANNER ===
          case 'qrcode':
          case 'qr':
            return await mediaTools.handleGenerateQRCode(sock, chatId, query);

          case 'scanqr':
          case 'readqr':
          case 'bacaqr':
            return await mediaTools.handleScanQRCode(sock, chatId, senderId, msg);

          case 'shortlink':
          case 'short':
            return await toolsPlugin.makeShortlink(sock, chatId, query);

          case 'tts':
          case 'audio':
            return await toolsPlugin.textToSpeech(sock, chatId, query);

          case 'toaudio':
            return await audioConverterPlugin.handle(sock, chatId, msg, false);

          case 'tovn':
            return await audioConverterPlugin.handle(sock, chatId, msg, true);

          // === EKONOMI & TOKO ===
          case 'addcoin':
          case 'tambahkoin': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            const amount = parseInt(args[1] || args[0], 10);
            return await economyPlugin.addCoins(sock, chatId, senderId, targetJid, amount);
          }

          case 'delcoin':
          case 'kurangkoin': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            const amount = parseInt(args[1] || args[0], 10);
            return await economyPlugin.deductCoins(sock, chatId, senderId, targetJid, amount);
          }

          case 'setcoin': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            const amount = parseInt(args[1] || args[0], 10);
            return await economyPlugin.setCoins(sock, chatId, senderId, targetJid, amount);
          }

          case 'addxp': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            const amount = parseInt(args[1] || args[0], 10);
            return await economyPlugin.addXP(sock, chatId, senderId, targetJid, amount);
          }

          case 'setrole': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            const role = args[1] || args[0];
            return await economyPlugin.setRole(sock, chatId, senderId, targetJid, role);
          }

          case 'transfer': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            const amount = parseInt(args[1] || args[0], 10);
            return await economyPlugin.transferCoins(sock, chatId, senderId, targetJid, amount);
          }

          case 'shop':
          case 'toko':
            return await economyPlugin.showShop(sock, chatId);

          case 'buy':
          case 'beli':
            return await economyPlugin.buyItem(sock, chatId, senderId, args[0]);

          case 'daily':
          case 'klaim':
            return await dailyPlugin.claimDaily(sock, chatId, senderId);

          case 'remind':
          case 'ingatkan':
            return await dailyPlugin.setReminder(sock, chatId, senderId, args);

          case 'todo':
          case 'tugas':
            return await dailyPlugin.handleTodo(sock, chatId, senderId, args);

          case 'note':
          case 'catatan':
            return await dailyPlugin.handleNotes(sock, chatId, senderId, args);

          case 'calc':
          case 'hitung':
            return await dailyPlugin.calculateMath(sock, chatId, query);

          case 'cuaca':
          case 'weather':
            return await dailyPlugin.checkWeather(sock, chatId, query);

          case 'sholat':
          case 'jadwalsholat':
            return await dailyPlugin.checkPrayerTimes(sock, chatId, query);

          case 'quote':
          case 'quotes':
            return dailyPlugin.getQuote(sock, chatId);

          case 'fakta':
          case 'fact':
            return dailyPlugin.getFact(sock, chatId);

          // === OWNER COMMANDS ===
          case 'izinkan':
            return await ownerPlugin.manageBotAccess(sock, chatId, senderId, query, 'add', fromMe);

          case 'cabutakses':
            return await ownerPlugin.manageBotAccess(sock, chatId, senderId, query, 'remove', fromMe);

          case 'daftarakses':
            return await ownerPlugin.manageBotAccess(sock, chatId, senderId, query, 'list', fromMe);

          case 'eval':
            return await ownerPlugin.evalCode(sock, chatId, senderId, query, fromMe);

          case 'exec':
            return await ownerPlugin.execCommand(sock, chatId, senderId, query, fromMe);

          case 'backup':
            return await ownerPlugin.backupDatabase(sock, chatId, senderId, fromMe);

          case 'broadcast':
          case 'bc':
            return await ownerPlugin.broadcastAll(sock, chatId, senderId, query, fromMe);

          case 'join':
            return await ownerPlugin.joinGroup(sock, chatId, senderId, query, fromMe);

          case 'leave':
            return await ownerPlugin.leaveGroup(sock, chatId, senderId, fromMe);

          case 'ban': {
            const targetJid = mentionedJids[0] || query;
            return await ownerPlugin.banUser(sock, chatId, senderId, targetJid, fromMe);
          }

          case 'unban': {
            const targetJid = mentionedJids[0] || query;
            return await ownerPlugin.unbanUser(sock, chatId, senderId, targetJid, fromMe);
          }

          case 'resetuser': {
            const targetJid = mentionedJids[0] || query;
            return await ownerPlugin.resetUser(sock, chatId, senderId, targetJid, fromMe);
          }

          case 'mode':
            return await ownerPlugin.toggleMode(sock, chatId, senderId, args[0], fromMe);

          // === GROUP MODERATION ===
          case 'tagall':
            if (!isGroup) return sock.sendMessage(chatId, { text: `Khusus grup!` });
            return await groupPlugin.tagAll(sock, chatId, senderId, query, false);

          case 'hidetag':
            if (!isGroup) return sock.sendMessage(chatId, { text: `Khusus grup!` });
            return await groupPlugin.tagAll(sock, chatId, senderId, query, true);

          case 'antilink':
            if (!isGroup) return sock.sendMessage(chatId, { text: `Khusus grup!` });
            return await groupPlugin.toggleAntiLink(sock, chatId, args[0]);

          case 'group':
            if (!isGroup) return sock.sendMessage(chatId, { text: `Khusus grup!` });
            return await groupPlugin.setGroupMode(sock, chatId, args[0]);

          case 'kick': {
            if (!isGroup) return sock.sendMessage(chatId, { text: `Khusus grup!` });
            return await groupPlugin.kickMember(sock, chatId, mentionedJids);
          }

          case 'promote':
          case 'demote': {
            if (!isGroup) return sock.sendMessage(chatId, { text: `Khusus grup!` });
            return await groupPlugin.changeAdminRole(sock, chatId, mentionedJids, command);
          }

          // === 🖼️ FAKE CHAT, IQC & IMAGE FILTERS ===
          case 'iqc':
          case 'fakechat':
            return await iqcMaker.handleIQC(sock, chatId, senderId, query, msg);

          case 'winkhd':
            return await sock.sendMessage(chatId, {
              text: '✨ *Wink — aplikasi resmi untuk peningkatan kualitas foto/video*\n\nBuka situs resmi Wink untuk mengunduh aplikasi dan memproses foto HD:\nhttps://wink.cn'
            }, { quoted: msg });

          case 'brat':
            return await iqcMaker.handleBrat(sock, chatId, senderId, query, msg);

          case 'tweet':
            return await iqcMaker.handleTweet(sock, chatId, senderId, query, msg);

          case 'grayscale':
          case 'bw':
            return await iqcMaker.handleImageFilter(sock, chatId, senderId, 'grayscale', msg);

          case 'invert':
            return await iqcMaker.handleImageFilter(sock, chatId, senderId, 'invert', msg);

          case 'blur':
            return await iqcMaker.handleImageFilter(sock, chatId, senderId, 'blur', msg);

          case 'flip':
          case 'mirror':
            return await iqcMaker.handleImageFilter(sock, chatId, senderId, 'flip', msg);

          // === 🌸 ANIME ROLEPLAY & CHARACTERS ===
          case 'hug':
          case 'pat':
          case 'kiss':
          case 'slap':
          case 'punch':
          case 'cry':
          case 'smile':
          case 'dance':
          case 'poke':
          case 'wink': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            return await animeRoleplay.handleAction(sock, chatId, senderId, command, targetJid, msg);
          }

          case 'waifu':
          case 'husbando':
          case 'neko':
          case 'shinobu':
          case 'megumin':
            return await animeRoleplay.handleCharacter(sock, chatId, command, msg);

          // === 🛡️ CYBER RECON, DEV TOOLS & CIPHERS ===
          case 'whois':
            return await cyberExtra.handleWhois(sock, chatId, query);

          case 'httpstatus':
            return cyberExtra.handleHttpStatus(sock, chatId, query);

          case 'useragent':
            return cyberExtra.handleUserAgent(sock, chatId, query);

          case 'ipcalc':
            return cyberExtra.handleIPCalc(sock, chatId, query);

          case 'traceroutesim':
            return await cyberExtra.handleTraceRouteSim(sock, chatId, query);

          case 'rot13':
            return cyberExtra.handleRot13(sock, chatId, query);

          case 'hex':
            return cyberExtra.handleHex(sock, chatId, query);

          case 'dehex':
            return cyberExtra.handleDeHex(sock, chatId, query);

          case 'urlencode':
            return cyberExtra.handleUrlEncode(sock, chatId, query);

          case 'urldecode':
            return cyberExtra.handleUrlDecode(sock, chatId, query);

          case 'timestamp':
            return cyberExtra.handleTimestamp(sock, chatId, query);

          case 'jsonformat':
            return cyberExtra.handleJsonFormat(sock, chatId, query);

          case 'jwtdecode':
            return cyberExtra.handleJwtDecode(sock, chatId, query);

          // === 💰 BANKING, ECONOMY & CASINO ===
          case 'bank':
            return economyExtra.handleBank(sock, chatId, senderId);

          case 'deposit':
            return economyExtra.handleDeposit(sock, chatId, senderId, args[0]);

          case 'withdraw':
            return economyExtra.handleWithdraw(sock, chatId, senderId, args[0]);

          case 'crypto':
            return await economyExtra.handleCrypto(sock, chatId);

          case 'work':
            return economyExtra.handleWork(sock, chatId, senderId);

          case 'beg':
            return economyExtra.handleBeg(sock, chatId, senderId);

          case 'rob': {
            const targetJid = mentionedJids[0] || (args[0] && args[0].replace(/[^0-9]/g, ''));
            return economyExtra.handleRob(sock, chatId, senderId, targetJid);
          }

          case 'blackjack':
            return economyExtra.handleBlackjack(sock, chatId, senderId, args[0]);

          // === 🕌 ISLAMIC & SPIRITUAL ===
          case 'niatsholat':
            return islamicExtra.handleNiatSholat(sock, chatId, query);

          case 'kisahnabi':
            return islamicExtra.handleKisahNabi(sock, chatId, query);

          case 'ayatkursi':
            return islamicExtra.handleAyatKursi(sock, chatId);

          case 'dzikir':
            return islamicExtra.handleDzikir(sock, chatId, query);

          case 'zakatcalc':
            return islamicExtra.handleZakatCalc(sock, chatId, query);

          case 'tasbih':
            return islamicExtra.handleTasbih(sock, chatId, senderId);

          // === 🎲 FUN, SOCIAL & PREDICTIONS ===
          case 'truth':
            return funExtra.handleTruth(sock, chatId);

          case 'dare':
            return funExtra.handleDare(sock, chatId);

          case 'kapankah':
          case 'apakah':
          case 'bisakah':
            return funExtra.handleMagicShell(sock, chatId, command, query);

          case 'rate':
            return funExtra.handleRate(sock, chatId, query);

          case 'gantengcek':
          case 'cantikcek':
            return funExtra.handleRateGender(sock, chatId, command, query);

          case 'bucin':
            return funExtra.handleBucin(sock, chatId);

          case 'motivasi':
            return funExtra.handleMotivasi(sock, chatId);

          case 'pantun':
            return funExtra.handlePantun(sock, chatId);

          case 'filsafat':
            return funExtra.handleFilsafat(sock, chatId);

          case 'tarot':
            return funExtra.handleTarot(sock, chatId);

          // === ⚙️ SYSTEM, DEV & UTILITIES ===
          case 'gitsearch':
            return await utilityExtra.handleGitSearch(sock, chatId, query);

          case 'npmsearch':
            return await utilityExtra.handleNpmSearch(sock, chatId, query);

          case 'linuxcmd':
            return utilityExtra.handleLinuxCmd(sock, chatId, query);

          case 'systeminfo':
            return utilityExtra.handleSystemInfo(sock, chatId);

          case 'cleanram':
            return utilityExtra.handleCleanRam(sock, chatId);

          case 'randomip':
            return utilityExtra.handleRandomIP(sock, chatId);

          case 'colorhex':
            return utilityExtra.handleColorHex(sock, chatId, query);

          default:
            break;
        }
      }

      // ==========================================
      // 5. AUTO-AI BALASAN (PRIBADI & GRUP)
      // ==========================================
      let shouldReplyWithAI = false;

      // Balas AI otomatis di chat pribadi hanya untuk pesan masuk dari orang lain
      if (!isGroup && settings.autoAiPrivate !== false && !fromMe) {
        shouldReplyWithAI = true;
      }

      // Balas AI di grup jika fitur aktif atau bot di-tag/mention
      if (isGroup && !fromMe) {
        const groupData = db.getGroup(chatId);
        const isBotMentioned = mentionedJids.some(jid => jid.includes(sock.user?.id?.split(':')[0] || '___'));

        if (groupData.autoAi || isBotMentioned) {
          shouldReplyWithAI = true;
        }
      }

      if (shouldReplyWithAI && text.length > 0) {
        await sock.sendPresenceUpdate('composing', chatId);
        // Human-like delay before reply
        const delay = Math.floor(Math.random() * 500) + 1500; // 1.5-2 seconds random delay
        await new Promise(resolve => setTimeout(resolve, delay));
        const aiReply = await aiService.askAI(text, senderId);
        if (aiReply) {
          return await animeService.sendAnimeReply(sock, chatId, aiReply, msg);
        }
      }
    } catch (err) {
      console.error('[MESSAGE-HANDLER-ERROR]', err);
    }
  }
}

module.exports = new MessageHandler();
