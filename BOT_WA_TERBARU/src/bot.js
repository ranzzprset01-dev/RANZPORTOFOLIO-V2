const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const NodeCache = require('node-cache');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./database/db');
const messageHandler = require('./handlers/messageHandler');
const { cleanTempFolder } = require('./plugins/mediaTools');

const messageStore = new NodeCache({ stdTTL: 1800, checkperiod: 60, maxKeys: 1000 });
const msgRetryCounterCache = new NodeCache({ stdTTL: 600, checkperiod: 60, maxKeys: 500 });

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.io = null;
    this.status = 'disconnected';
    this.currentQR = null;
    this.pairingCode = null;
    this.sessionPath = path.resolve(config.SESSION_DIR || './auth_session');
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.presenceInterval = null;
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
    messageHandler.setSocketIO(ioInstance);
  }

  emitState(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  async start(usePairingNumber = null) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    try {
      this.status = 'connecting';
      this.emitState('bot_status', { status: 'connecting', message: `Memulai koneksi ${config.BOT_NAME}...` });

      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: true }));

      console.log(`[BOT] Baileys versi: ${version.join('.')}, isLatest: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        msgRetryCounterCache,
        getMessage: async (key) => {
          if (key && key.id && messageStore.has(key.id)) {
            return messageStore.get(key.id);
          }
          return { conversation: `${config.BOT_NAME} Sync` };
        },
        browser: [config.BOT_NAME, "Chrome", config.BOT_VERSION],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        defaultQueryTimeoutMs: undefined
      });

      cleanTempFolder();

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.status = 'qr_ready';
          this.currentQR = qr;

          const qrDataUrl = await QRCode.toDataURL(qr);
          this.emitState('bot_qr', { qrDataUrl, rawQR: qr });
          this.emitState('bot_status', { status: 'qr_ready', message: 'Scan QR Code di Web Dashboard untuk menghubungkan.' });

          console.log('\n[QR-CODE] Silakan scan QR Code di Web Dashboard (http://localhost:3000):\n');
          qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
          console.log(`[BOT] Koneksi terputus. Alasan: ${reason}`);

          this.status = 'disconnected';
          this.currentQR = null;
          this.isReconnecting = false;

          // Clear presence interval
          if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;
          }

          // 1. Sesi ditimpa perangkat lain (440)
          if (reason === DisconnectReason.connectionReplaced) {
            console.log('[BOT] Sesi digantikan oleh koneksi perangkat lain (440). Menunda reconnect...');
            this.emitState('bot_status', { status: 'disconnected', message: 'Koneksi digantikan oleh perangkat lain. Klik Restart bila ingin menghubungkan kembali.' });
            return;
          }

          // 2. Restart dibutuhkan (515) -> Reconnect langsung
          if (reason === DisconnectReason.restartRequired) {
            console.log('[BOT] WhatsApp meminta restart sesi (515). Menghubungkan ulang...');
            setTimeout(() => this.start(), 1500);
            return;
          }

          // 3. Keluar / Logged out (401)
          if (reason === DisconnectReason.loggedOut) {
            console.log('[BOT] Perangkat keluar (logged out 401). Menghapus sesi lama...');
            try {
              fs.rmSync(this.sessionPath, { recursive: true, force: true });
            } catch (e) {}
            this.reconnectAttempts = 0;
            this.emitState('bot_status', { status: 'disconnected', message: 'Sesi keluar. Silakan scan QR baru.' });
            setTimeout(() => this.start(), 2000);
            return;
          }

          // 4. Terputus jaringan normal (408, 428, 500)
          this.reconnectAttempts += 1;
          const delay = Math.min(20000, 3000 * Math.pow(1.2, this.reconnectAttempts));
          console.log(`[BOT] Reconnect dalam ${Math.round(delay / 1000)} detik (Percobaan ke-${this.reconnectAttempts})...`);
          this.emitState('bot_status', { status: 'disconnected', message: `Terputus (Kode: ${reason}). Mencoba menyambung ulang...` });
          setTimeout(() => this.start(), delay);
        } else if (connection === 'open') {
          this.status = 'connected';
          this.reconnectAttempts = 0;
          this.currentQR = null;
          this.isReconnecting = false;

          const botNumber = this.sock.user?.id ? this.sock.user.id.split(':')[0] : 'Aktif';
          console.log(`\n=================================================`);
          console.log(`⚡ [${config.BOT_NAME} TERHUBUNG KE WHATSAPP] ⚡`);
          console.log(`Nomor Bot: ${botNumber}`);
          console.log(`Status: ONLINE & SIAP MERESPON`);
          console.log(`=================================================\n`);

          try {
            await this.sock.updateProfileName(config.BOT_NAME);
          } catch (err) {
            console.warn(`[BOT-PROFILE] Gagal memperbarui nama profil WhatsApp: ${err.message}`);
          }

          this.emitState('bot_status', {
            status: 'connected',
            message: `Terhubung sebagai ${botNumber}`,
            botNumber,
            user: this.sock.user
          });

          // Auto sendPresenceUpdate setiap 10 detik
          if (this.presenceInterval) clearInterval(this.presenceInterval);
          this.presenceInterval = setInterval(async () => {
            try {
              await this.sock.sendPresenceUpdate('available');
            } catch (e) {}
          }, 10000);
        }
      });

      if (usePairingNumber && !state.creds.registered) {
        setTimeout(async () => {
          try {
            const cleanNumber = usePairingNumber.replace(/[^0-9]/g, '');
            const code = await this.sock.requestPairingCode(cleanNumber);
            this.pairingCode = code;
            console.log(`[PAIRING-CODE] Kode pairing untuk ${cleanNumber}: ${code}`);
            this.emitState('pairing_code', { code, phoneNumber: cleanNumber });
          } catch (e) {
            console.error('[PAIRING-ERROR] Gagal mendapatkan pairing code:', e.message);
          }
        }, 3000);
      }

      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Mendukung tipe notify (pesan masuk) maupun append (pesan dari perangkat sendiri / sync)
        for (const msg of messages) {
          if (msg.key?.id && msg.message) {
            messageStore.set(msg.key.id, msg.message);
          }
          await messageHandler.handle(this.sock, msg);
        }
      });

      const syncContacts = (contacts) => {
        const updated = db.syncWhatsAppContacts(contacts);
        if (updated > 0) {
          console.log(`[CONTACTS] ${updated} kontak WhatsApp disinkronkan ke database.`);
        }
      };

      this.sock.ev.on('contacts.upsert', syncContacts);
      this.sock.ev.on('contacts.update', syncContacts);

      this.sock.ev.on('group-participants.update', async (update) => {
        try {
          const { id, participants, action } = update;
          const group = db.getGroup(id);

          if (group.welcome && action === 'add') {
            for (const participant of participants) {
              const text = (group.welcomeMessage || 'Selamat datang @user di sektor {group}!')
                .replace(/@user/g, `@${participant.split('@')[0]}`)
                .replace(/{group}/g, group.name || 'Grup WhatsApp');

              await this.sock.sendMessage(id, { text, mentions: [participant] });
            }
          } else if (group.welcome && action === 'remove') {
            for (const participant of participants) {
              const text = (group.leaveMessage || 'Sampai jumpa @user.')
                .replace(/@user/g, `@${participant.split('@')[0]}`)
                .replace(/{group}/g, group.name || 'Grup WhatsApp');

              await this.sock.sendMessage(id, { text, mentions: [participant] });
            }
          }
        } catch (e) {
          console.error('[GROUP-EVENT-ERROR]', e.message);
        }
      });

      return this.sock;
    } catch (err) {
      console.error('[BOT-INIT-FATAL-ERROR]', err);
      this.status = 'disconnected';
      this.isReconnecting = false;
      this.emitState('bot_status', { status: 'disconnected', message: `Inisialisasi gagal: ${err.message}` });
    }
  }

  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
      }
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
      }
      this.status = 'disconnected';
      this.currentQR = null;
      this.sock = null;
      this.isReconnecting = false;
      this.emitState('bot_status', { status: 'disconnected', message: 'Berhasil logout dan reset sesi.' });
      setTimeout(() => this.start(), 2000);
    } catch (err) {
      console.error('[LOGOUT-ERROR]', err.message);
    }
  }

  async sendManualMessage(targetNumber, message) {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('Bot belum terhubung ke WhatsApp.');
    }
    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    const jid = targetNumber.includes('@') ? targetNumber : `${cleanNumber}@s.whatsapp.net`;
    return await this.sock.sendMessage(jid, { text: message });
  }
}

module.exports = new WhatsAppBot();
