const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const QRCode = require('qrcode');

const config = require('./config');
const db = require('./database/db');
const bot = require('./bot');
const security = require('./security/fail2ban');
const auth = require('./security/auth');

// Global Exception Guards
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT-EXCEPTION-GUARD]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED-REJECTION-GUARD]', reason?.message || reason);
});

// Parse dynamic port from CLI args (--port=8080, --port 8080, or 8080) or process.env.PORT
const cliPortArg = process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1] ||
  (process.argv.indexOf('--port') !== -1 ? process.argv[process.argv.indexOf('--port') + 1] : null) ||
  (!isNaN(process.argv[2]) ? process.argv[2] : null);

const PORT = parseInt(process.env.PORT || cliPortArg || config.PORT || 3000, 10);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Pasang Sentinel Socket IO
security.setSocketIO(io);
bot.setSocketIO(io);

// 1. Sembunyikan Header & Pasang Anti-Flood / Fail2Ban / IP Tracker Middleware
app.use(helmet());
app.use(security.createMiddleware());

// 2. Rate Limit untuk HTTP requests (100 req per 15 menit per IP)
const httpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: '⚠️ Terlalu banyak permintaan! Silakan tunggu beberapa saat.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', httpLimiter);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

io.use((socket, next) => {
  if (auth.verifyToken(socket.handshake.auth?.token)) {
    return next();
  }
  return next(new Error('UNAUTHORIZED'));
});

// === CLOUDFLARE TUNNEL CONTROLLER ===
let tunnelProcess = null;
let tunnelUrl = null;

function startTunnel() {
  if (tunnelProcess) return tunnelUrl;
  const binPath = path.resolve('./cloudflared.exe');
  if (!fs.existsSync(binPath)) {
    console.warn('[CLOUDFLARE] cloudflared.exe belum tersedia.');
    return null;
  }

  try {
    tunnelProcess = spawn(binPath, ['tunnel', '--url', `http://localhost:${PORT}`]);

    tunnelProcess.stderr.on('data', (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match) {
        tunnelUrl = match[0];
        console.log(`\n======================================================`);
        console.log(`🌐 [CLOUDFLARE TUNNEL LIVE ONLINE]`);
        console.log(`🔗 Public URL: ${tunnelUrl}`);
        console.log(`🔒 Encrypted Edge Routing Activated!`);
        console.log(`======================================================\n`);
        io.emit('tunnel_status', { running: true, url: tunnelUrl });
      }
    });

    tunnelProcess.on('close', () => {
      tunnelProcess = null;
      tunnelUrl = null;
      io.emit('tunnel_status', { running: false, url: null });
    });
  } catch (err) {
    console.error('[TUNNEL-SPAWN-ERROR]', err.message);
  }
  return tunnelUrl;
}

function stopTunnel() {
  if (tunnelProcess) {
    try {
      tunnelProcess.kill();
    } catch (e) {}
    tunnelProcess = null;
    tunnelUrl = null;
    io.emit('tunnel_status', { running: false, url: null });
    return true;
  }
  return false;
}

// Public tunnel is opt-in; keep local deployments private by default.
if (config.ENABLE_CLOUDFLARE_TUNNEL) {
  startTunnel();
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const ip = security.getClientIP(req);
  const result = auth.login(password, ip);
  if (result.success) {
    security.logVisitor(ip, '/api/auth/login', req.headers['user-agent'], 'LOGIN_SUCCESS');
  } else {
    security.logVisitor(ip, '/api/auth/login', req.headers['user-agent'], 'LOGIN_FAILED');
  }
  res.json(result);
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers['x-auth-token'] || req.query.token;
  const valid = auth.verifyToken(token);
  res.json({ success: valid, role: valid ? 'SUPREME_OWNER' : null });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-auth-token'] || req.query.token;
  auth.logout(token);
  res.json({ success: true, message: 'Berhasil logout' });
});

// --- CLOUDFLARE TUNNEL API ---
app.get('/api/tunnel/status', auth.requireAuth, (req, res) => {
  res.json({
    success: true,
    running: tunnelProcess !== null,
    url: tunnelUrl,
    binaryExists: fs.existsSync(path.resolve('./cloudflared.exe'))
  });
});

app.post('/api/tunnel/start', auth.requireAuth, (req, res) => {
  const url = startTunnel();
  res.json({ success: true, message: 'Cloudflare Tunnel sedang dihubungkan...', url });
});

app.post('/api/tunnel/stop', auth.requireAuth, (req, res) => {
  const stopped = stopTunnel();
  res.json({ success: true, message: stopped ? 'Tunnel dihentikan' : 'Tunnel tidak aktif' });
});

// --- IP TRACKER & FAIL2BAN MANAGEMENT ---
app.get('/api/security/metrics', auth.requireAuth, (req, res) => {
  res.json({
    success: true,
    ...security.getSecurityMetrics()
  });
});

// Secret route to view IP log file
app.get('/ip-log', auth.requireAuth, (req, res) => {
  try {
    const logPath = path.resolve('./ip-log.txt');
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } else {
      res.send('Belum ada log IP yang tercatat.');
    }
  } catch (err) {
    res.status(500).send('Gagal membaca log IP.');
  }
});

app.get('/api/security/visitors', auth.requireAuth, (req, res) => {
  res.json({
    success: true,
    visitors: security.visitorLogs
  });
});

app.post('/api/security/jail', auth.requireAuth, (req, res) => {
  const { ip, reason, durationMinutes } = req.body;
  if (!ip) return res.status(400).json({ success: false, message: 'IP wajib diisi!' });
  security.jailIP(ip, reason || 'Manual Ban dari Dashboard', durationMinutes || 60);
  res.json({ success: true, message: `IP ${ip} berhasil dimasukkan ke Fail2Ban Jail!` });
});

app.post('/api/security/unban', auth.requireAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ success: false, message: 'IP wajib diisi!' });
  const unbanned = security.unbanIP(ip);
  res.json({ success: unbanned, message: unbanned ? `IP ${ip} berhasil dipulihkan!` : `IP tidak ditemukan di daftar blokir` });
});

// --- STATUS & TELEMETRY ---
app.get('/api/status', auth.requireAuth, async (req, res) => {
  const stats = db.getStats();
  const qrDataUrl = bot.currentQR ? await QRCode.toDataURL(bot.currentQR).catch(() => null) : null;
  res.json({
    success: true,
    status: bot.status,
    port: PORT,
    botNumber: bot.sock?.user?.id ? bot.sock.user.id.split(':')[0] : '6282183317690',
    uptime: stats.uptimeSeconds,
    stats,
    currentQR: bot.currentQR ? true : false,
    qrDataUrl,
    pairingCode: bot.pairingCode,
    tunnel: {
      running: tunnelProcess !== null,
      url: tunnelUrl
    }
  });
});

// Port Telemetry Endpoint
app.get('/api/port', (req, res) => {
  res.json({
    success: true,
    port: PORT,
    host: config.HOST || '0.0.0.0',
    localUrl: `http://localhost:${PORT}`,
    tunnelUrl: tunnelUrl,
    mode: 'QUANTUM_ULTRA_FAST'
  });
});

// --- SETTINGS (PROTECTED) ---
app.get('/api/settings', auth.requireAuth, (req, res) => {
  res.json({
    success: true,
    settings: db.getSettings()
  });
});

app.post('/api/settings', auth.requireAuth, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, message: 'Setelan berhasil disimpan!', settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- USERS & DATABASE (CLEAN WHATSAPP NUMBERS & PAIRED HOST) ---
app.get('/api/users', auth.requireAuth, (req, res) => {
  const users = db.getAllUsers();
  res.json({ success: true, count: users.length, users });
});

app.post('/api/users/edit-economy', auth.requireAuth, (req, res) => {
  try {
    const { userId, action, amount, role } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID wajib diisi!' });
    }

    const user = db.getUser(userId);
    const parsedAmount = parseInt(amount, 10) || 0;

    if (action === 'add') {
      user.coins += parsedAmount;
    } else if (action === 'deduct') {
      user.coins = Math.max(0, user.coins - parsedAmount);
    } else if (action === 'set') {
      user.coins = Math.max(0, parsedAmount);
    }

    if (role) {
      user.role = role.toUpperCase();
      if (user.role === 'OWNER') {
        user.rank = 'Cyber Emperor';
        user.level = Math.max(user.level, 99);
      }
    }

    db.updateUser(userId, user);
    res.json({
      success: true,
      message: `Berhasil memperbarui data user @${userId.split('@')[0]} (Saldo: ${user.coins.toLocaleString('id-ID')} Koin, Role: ${user.role})`,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- GROUPS ---
app.get('/api/groups', auth.requireAuth, (req, res) => {
  const groups = db.getAllGroups();
  res.json({ success: true, count: groups.length, groups });
});

// --- PROTECTED BOT ACTIONS ---
app.post('/api/action/send', auth.requireAuth, async (req, res) => {
  try {
    const { target, message } = req.body;
    if (!target || !message) {
      return res.status(400).json({ success: false, message: 'Nomor target dan pesan wajib diisi!' });
    }
    await bot.sendManualMessage(target, message);
    res.json({ success: true, message: `Pesan berhasil dikirim ke ${target}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/action/broadcast', auth.requireAuth, async (req, res) => {
  try {
    const { targetType, message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Pesan siaran wajib diisi!' });
    }

    let targets = [];
    if (targetType === 'groups' || targetType === 'all') {
      const groups = db.getAllGroups();
      targets.push(...groups.map(g => g.id));
    }
    if (targetType === 'users' || targetType === 'all') {
      const users = db.getAllUsers();
      targets.push(...users.map(u => u.id));
    }

    let sentCount = 0;
    const formatted = `📢 *[CYBER BROADCAST TRANSMISSION]* 📢\n\n${message}\n\n_⚡ Ditransmisikan melalui Nova Command Center_`;

    for (const jid of targets) {
      try {
        await bot.sock.sendMessage(jid, { text: formatted });
        sentCount += 1;
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {}
    }

    res.json({ success: true, message: `Siaran berhasil terkirim ke ${sentCount} sasaran.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/action/pair', auth.requireAuth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Nomor HP wajib diisi!' });
    }
    await bot.start(phoneNumber);
    res.json({ success: true, message: 'Memproses kode pairing. Silakan pantau tampilan dashboard!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/action/restart', auth.requireAuth, async (req, res) => {
  try {
    await bot.start();
    res.json({ success: true, message: 'Proses restart bot dimulai...' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/action/logout', auth.requireAuth, async (req, res) => {
  try {
    await bot.logout();
    res.json({ success: true, message: 'Sesi WhatsApp berhasil di-logout dan di-reset!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- COMMAND SIMULATOR ---
app.post('/api/action/simulate-command', auth.requireAuth, async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, message: 'Perintah wajib diisi!' });
    }

    let capturedReply = '';
    const mockSock = {
      sendMessage: async (chatId, content) => {
        if (content.text) {
          capturedReply += content.text + '\n';
        } else if (content.caption) {
          capturedReply += (content.image ? '🖼️ [GAMBAR ANIME HD RESMI]\n\n' : '') + content.caption + '\n';
        }
        return { key: { id: 'sim_' + Date.now() } };
      },
      sendPresenceUpdate: async () => {},
      user: bot.sock?.user || { id: '6282183317690:80@s.whatsapp.net' }
    };

    const simulatedMsg = {
      key: {
        remoteJid: '6282183317690@s.whatsapp.net',
        fromMe: false,
        id: 'SIM_' + Date.now()
      },
      pushName: 'Commander',
      message: { conversation: command }
    };

    const messageHandler = require('./handlers/messageHandler');
    await messageHandler.handle(mockSock, simulatedMsg);

    res.json({
      success: true,
      command,
      reply: capturedReply.trim() || `⚡ Perintah berhasil diproses oleh ${config.BOT_NAME}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket Events
io.on('connection', (socket) => {
  socket.emit('bot_status', {
    status: bot.status,
    botNumber: bot.sock?.user?.id ? bot.sock.user.id.split(':')[0] : '6282183317690',
    stats: db.getStats()
  });

  if (tunnelUrl) {
    socket.emit('tunnel_status', { running: true, url: tunnelUrl });
  }

  if (bot.currentQR) {
    QRCode.toDataURL(bot.currentQR).then(qrDataUrl => {
      socket.emit('bot_qr', { qrDataUrl, rawQR: bot.currentQR });
    }).catch(() => {});
  }
});

server.listen(PORT, config.HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🌐 ${config.BOT_NAME} WEB COMMAND CENTER BERJALAN`);
  console.log(`📡 Akses Dashboard: http://localhost:${PORT}`);
  console.log(`🛡️ Sentinel Shield: Password Gate + Fail2Ban Active`);
  console.log(`🔒 Owner Access Gate & Fail2Ban Active`);
  console.log(`⚡ ${config.BOT_NAME} v${config.BOT_VERSION}`);
  console.log(`======================================================\n`);

  bot.start();
});
