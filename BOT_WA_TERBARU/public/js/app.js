// ===================================================
// RANZZXITER // WHATSAPP COMMAND CENTER
// VERSION 2.0 - OWNER ACCESS & INTERACTIVE CONTROL
// ===================================================

const socket = io({ autoConnect: false });

// State
let soundEnabled = true;
let allUsersData = [];
let allVisitorsData = [];
let currentTunnelUrl = null;
let authToken = localStorage.getItem('cyber_token') || null;

// Audio Synthesizer (Web Audio API for Cyber SFX)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playCyberSound(type = 'click') {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    // Audio context may require user interaction
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  playCyberSound(type === 'error' ? 'alert' : 'success');

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Password toggle helper
function togglePasswordVisibility(inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

// Format Seconds to HH:MM:SS
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// DOM Elements
const hudStatusText = document.getElementById('hudStatusText');
const hudBotNumber = document.getElementById('hudBotNumber');
const hudUptime = document.getElementById('hudUptime');
const hudPort = document.getElementById('hudPort');
const qrImage = document.getElementById('qrImage');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const qrStatusMsg = document.getElementById('qrStatusMsg');
const terminalLogs = document.getElementById('terminalLogs');

// ===================================================
// AUTHENTICATION & MASTER LOCK GATE
// ===================================================

async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (authToken) {
    options.headers['x-auth-token'] = authToken;
  }
  const res = await fetch(url, options);
  if (res.status === 401) {
    authToken = null;
    localStorage.removeItem('cyber_token');
    showLockGate('Sesi autentikasi telah habis atau tidak sah. Silakan login kembali.');
    throw new Error('Unauthorized');
  }
  return res;
}

function showLockGate(msg = '') {
  const gate = document.getElementById('lockGate');
  if (gate) {
    gate.style.display = 'flex';
    const warning = document.getElementById('lockWarningMsg');
    if (warning) {
      if (msg) {
        warning.className = 'lock-warning error';
        warning.innerText = msg;
      } else {
        warning.className = 'lock-warning';
        warning.innerText = '';
      }
    }
    const input = document.getElementById('masterPasswordInput');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function hideLockGate() {
  const gate = document.getElementById('lockGate');
  if (gate) gate.style.display = 'none';
}

async function verifyInitialAuth() {
  if (!authToken) {
    showLockGate();
    return;
  }
  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'x-auth-token': authToken }
    });
    const data = await res.json();
    if (data.success) {
      hideLockGate();
      socket.auth = { token: authToken };
      socket.connect();
      loadSentinelData();
      loadDatabaseUsers();
    } else {
      authToken = null;
      localStorage.removeItem('cyber_token');
      showLockGate('Sesi kedaluwarsa. Silakan masukkan Master Password.');
    }
  } catch (e) {
    showLockGate();
  }
}

async function handleUnlock() {
  const passwordInput = document.getElementById('masterPasswordInput');
  const warningMsg = document.getElementById('lockWarningMsg');
  const password = passwordInput.value.trim();

  if (!password) {
    warningMsg.className = 'lock-warning error';
    warningMsg.innerText = '⚠️ Silakan masukkan Master Password!';
    return;
  }

  warningMsg.className = 'lock-warning';
  warningMsg.innerText = 'Memverifikasi kredensial Quantum...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      authToken = data.token;
      localStorage.setItem('cyber_token', data.token);
      socket.auth = { token: authToken };
      socket.connect();
      warningMsg.className = 'lock-warning success';
      warningMsg.innerText = '✅ Otentikasi Berhasil! Mengakses Dashboard...';
      playCyberSound('success');
      setTimeout(() => {
        hideLockGate();
        showToast('Selamat Datang, Supreme Owner!', 'success');
        fetchStatus();
        loadDatabaseUsers();
        loadSentinelData();
      }, 400);
    } else {
      playCyberSound('alert');
      warningMsg.className = 'lock-warning error';
      if (data.banned) {
        warningMsg.innerText = `🚫 AKSES DIBLOKIR: ${data.message}`;
      } else {
        warningMsg.innerText = `❌ ${data.message || 'Master Password Salah!'}`;
      }
    }
  } catch (e) {
    warningMsg.className = 'lock-warning error';
    warningMsg.innerText = `⚠️ Terjadi kesalahan jaringan: ${e.message}`;
  }
}

// Unlock Listeners
document.getElementById('btnUnlockDashboard')?.addEventListener('click', handleUnlock);
document.getElementById('masterPasswordInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleUnlock();
});

// Lock Console Button
document.getElementById('btnLockConsole')?.addEventListener('click', async () => {
  try {
    if (authToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-auth-token': authToken }
      });
    }
  } catch (e) {}
  authToken = null;
  localStorage.removeItem('cyber_token');
  socket.disconnect();
  showLockGate('Terminal telah dikunci secara manual.');
  showToast('Dashboard dikunci.', 'info');
});

// Run Initial Auth Verification
verifyInitialAuth();

// ===================================================
// TAB NAVIGATION
// ===================================================

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    playCyberSound('click');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    const targetId = tab.getAttribute('data-tab');
    const targetPane = document.getElementById(targetId);
    if (targetPane) targetPane.classList.add('active');

    // Trigger data fetch for specific tabs
    if (targetId === 'tab-database') {
      loadDatabaseUsers();
      loadDatabaseGroups();
    } else if (targetId === 'tab-ai') {
      loadSettings();
    } else if (targetId === 'tab-sentinel') {
      loadSentinelData();
    }
  });
});

// Sound Toggle
document.getElementById('soundToggleBtn').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  document.getElementById('soundToggleBtn').innerText = soundEnabled ? '🔊' : '🔇';
  showToast(`Efek Suara UI: ${soundEnabled ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`);
});

// ===================================================
// SOCKET.IO REAL-TIME LISTENERS
// ===================================================

socket.on('connect', () => {
  appendLog('system', 'Terhubung ke server Nova WebSocket.');
});

socket.on('bot_status', (data) => {
  const status = data.status;
  if (status === 'connected') {
    hudStatusText.innerText = 'ONLINE // SECURE';
    hudStatusText.className = 'text-green';
    hudBotNumber.innerText = data.botNumber || 'ACTIVE';
    qrPlaceholder.style.display = 'flex';
    qrImage.style.display = 'none';
    qrStatusMsg.innerHTML = '🟢 <strong>TERHUBUNG KE WHATSAPP</strong><br>Bot beroperasi normal.';
  } else if (status === 'qr_ready') {
    hudStatusText.innerText = 'SCAN QR CODE';
    hudStatusText.className = 'text-gold';
    qrPlaceholder.style.display = 'none';
    qrImage.style.display = 'block';
  } else if (status === 'connecting') {
    hudStatusText.innerText = 'CONNECTING...';
    hudStatusText.className = 'text-cyan';
    qrPlaceholder.style.display = 'flex';
    qrImage.style.display = 'none';
    qrStatusMsg.innerText = 'Menyambungkan ke jaringan WhatsApp...';
  } else {
    hudStatusText.innerText = 'DISCONNECTED';
    hudStatusText.className = 'text-red';
    qrPlaceholder.style.display = 'flex';
    qrImage.style.display = 'none';
    qrStatusMsg.innerText = 'Terputus. Menunggu otentikasi...';
  }

  if (hudPort) {
    hudPort.innerText = data.port || window.location.port || '3000';
  }

  // Update metrics
  if (data.stats) {
    updateMetrics(data.stats);
  }
});

socket.on('bot_qr', (data) => {
  if (data.qrDataUrl) {
    qrImage.src = data.qrDataUrl;
    qrImage.style.display = 'block';
    qrPlaceholder.style.display = 'none';
  }
});

socket.on('pairing_code', (data) => {
  const display = document.getElementById('pairingCodeDisplay');
  const digits = document.getElementById('pairingCodeDigits');
  display.style.display = 'block';
  digits.innerText = data.code;
  showToast(`Kode pairing diterima: ${data.code}`);
  appendLog('system', `Kode Pairing untuk ${data.phoneNumber}: ${data.code}`);
});

socket.on('bot_log', (log) => {
  appendLog(log.type, log.text, log.timestamp);
});

// Cloudflare Tunnel Live Status Listener
socket.on('tunnel_status', (data) => {
  updateTunnelUI(data);
});

// Sentinel Real-time Ingress Listener
socket.on('visitor_activity', (visitor) => {
  if (!allVisitorsData) allVisitorsData = [];
  const existingIdx = allVisitorsData.findIndex(v => v.ip === visitor.ip && v.endpoint === visitor.endpoint);
  if (existingIdx !== -1) {
    allVisitorsData[existingIdx] = visitor;
  } else {
    allVisitorsData.push(visitor);
    if (allVisitorsData.length > 200) allVisitorsData.shift();
  }
  renderVisitorsTable(allVisitorsData);
});

// Fail2Ban Live Alert Listener
socket.on('fail2ban_alert', (data) => {
  playCyberSound('alert');
  showToast(`🚨 FAIL2BAN: IP ${data.ip} diblokir! Alasan: ${data.reason}`, 'error');
  loadSentinelData();
});

function appendLog(type, text, time = null) {
  const timestamp = time || new Date().toLocaleTimeString('id-ID');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${escapeHtml(text)}`;
  terminalLogs.appendChild(entry);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

document.getElementById('btnClearLogs').addEventListener('click', () => {
  terminalLogs.innerHTML = '';
  appendLog('system', 'Terminal dibersihkan.');
});

// Update Metrics Display
function updateMetrics(stats) {
  document.getElementById('metricTotalUsers').innerText = stats.totalUsers || 0;
  document.getElementById('metricTotalMessages').innerText = stats.totalMessages || 0;
  document.getElementById('metricTotalAi').innerText = stats.totalAiQueries || 0;
  document.getElementById('metricTotalGames').innerText = stats.totalGamesPlayed || 0;
  if (stats.uptimeSeconds !== undefined) {
    hudUptime.innerText = formatUptime(stats.uptimeSeconds);
  }
}

// ===================================================
// CLOUDFLARE TUNNEL CONTROLLER
// ===================================================

function updateTunnelUI(tunnel) {
  const chip = document.getElementById('hudTunnelStatus');
  const badge = document.getElementById('tunnelBadge');
  const copyBtn = document.getElementById('btnCopyTunnelUrl');
  const toggleBtn = document.getElementById('btnToggleTunnel');

  if (tunnel && tunnel.running && tunnel.url) {
    currentTunnelUrl = tunnel.url;
    if (chip) {
      chip.innerText = 'LIVE // SECURE';
      chip.className = 'chip-val text-green';
    }
    if (badge) {
      badge.innerHTML = `🟢 <strong>TUNNEL ONLINE:</strong> <a href="${tunnel.url}" target="_blank" rel="noopener noreferrer">${tunnel.url}</a>`;
      badge.className = 'badge-tunnel-live';
    }
    if (copyBtn) copyBtn.style.display = 'inline-block';
    if (toggleBtn) {
      toggleBtn.innerText = '🛑 HENTIKAN TUNNEL';
      toggleBtn.className = 'btn-cyber-danger';
    }
  } else if (tunnel && tunnel.running && !tunnel.url) {
    if (chip) {
      chip.innerText = 'CONNECTING...';
      chip.className = 'chip-val text-gold';
    }
    if (badge) {
      badge.innerHTML = `🟡 <strong>SEDANG MENGHUBUNGKAN:</strong> Menunggu URL Edge Cloudflare...`;
      badge.className = 'badge-tunnel-live';
    }
    if (copyBtn) copyBtn.style.display = 'none';
    if (toggleBtn) {
      toggleBtn.innerText = '🛑 HENTIKAN TUNNEL';
      toggleBtn.className = 'btn-cyber-danger';
    }
  } else {
    currentTunnelUrl = null;
    if (chip) {
      chip.innerText = 'OFFLINE';
      chip.className = 'chip-val text-red';
    }
    if (badge) {
      badge.innerHTML = `🔴 <strong>TUNNEL NONAKTIF:</strong> Akses publik tertutup.`;
      badge.className = 'badge-jailed';
    }
    if (copyBtn) copyBtn.style.display = 'none';
    if (toggleBtn) {
      toggleBtn.innerText = '🚀 MULAI TUNNEL';
      toggleBtn.className = 'btn-cyber-primary';
    }
  }
}

// Copy Tunnel URL
document.getElementById('btnCopyTunnelUrl')?.addEventListener('click', () => {
  if (currentTunnelUrl) {
    navigator.clipboard.writeText(currentTunnelUrl);
    showToast('Link Cloudflare Tunnel berhasil disalin ke clipboard!');
  }
});

// Toggle Tunnel (Start / Stop)
document.getElementById('btnToggleTunnel')?.addEventListener('click', async () => {
  playCyberSound('click');
  const isRunning = currentTunnelUrl !== null;
  const endpoint = isRunning ? '/api/tunnel/stop' : '/api/tunnel/start';
  showToast(isRunning ? 'Menghentikan Cloudflare Tunnel...' : 'Memulai Cloudflare Tunnel...');
  try {
    const res = await authFetch(endpoint, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      if (data.url) {
        updateTunnelUI({ running: true, url: data.url });
      }
    } else {
      showToast(data.message || 'Gagal mengubah status tunnel', 'error');
    }
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
});

// ===================================================
// SENTINEL & FAIL2BAN IP TRACKER
// ===================================================

async function loadSentinelData() {
  if (!authToken) return;
  try {
    // 1. Fetch Metrics & Jailed IPs
    const metricRes = await authFetch('/api/security/metrics');
    const metricData = await metricRes.json();
    if (metricData.success) {
      const jailedCountEl = document.getElementById('jailedCountDisplay');
      if (jailedCountEl) jailedCountEl.innerText = metricData.jailedCount || 0;
      renderJailedTable(metricData.jailedList || []);
    }

    // 2. Fetch Visitors
    const visitorRes = await authFetch('/api/security/visitors');
    const visitorData = await visitorRes.json();
    if (visitorData.success) {
      allVisitorsData = visitorData.visitors || [];
      renderVisitorsTable(allVisitorsData);
    }
  } catch (e) {
    // Silently ignore if unauthorized or loading
  }
}

function renderVisitorsTable(visitors) {
  const tbody = document.getElementById('visitorsTableBody');
  if (!tbody) return;

  if (!visitors || visitors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada aktivitas pengunjung tercatat.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  const sorted = [...visitors].reverse();
  sorted.forEach(v => {
    const tr = document.createElement('tr');
    const geo = v.geo || {};
    const isLocal = v.ip === '127.0.0.1' || v.ip === '::1';
    const geoStr = geo.country ? `${geo.flag || '🌐'} ${geo.country}, ${geo.city || '-'}` : (isLocal ? '🏠 Localhost / VPS Host' : '🔍 Mengambil Geo...');
    const ispStr = geo.isp || geo.org || (isLocal ? 'Local Loopback' : '-');
    const timeStr = v.time ? new Date(v.time).toLocaleTimeString('id-ID') : '-';

    let statusBadge = '<span class="text-green">PASS</span>';
    if (v.status === 'BLOCKED_FAIL2BAN') {
      statusBadge = '<span class="badge-jailed">BLOCKED (JAILED)</span>';
    } else if (v.status === 'LOGIN_SUCCESS') {
      statusBadge = '<span class="text-cyan">AUTH_SUCCESS</span>';
    } else if (v.status === 'LOGIN_FAILED') {
      statusBadge = '<span class="text-red">AUTH_FAILED</span>';
    }

    tr.innerHTML = `
      <td><small class="text-muted">${timeStr}</small></td>
      <td><strong class="text-cyan">${escapeHtml(v.ip)}</strong></td>
      <td>${escapeHtml(geoStr)}</td>
      <td><small>${escapeHtml(ispStr)}</small></td>
      <td><code>${escapeHtml(v.endpoint || '/')}</code></td>
      <td><small class="text-muted" title="${escapeHtml(v.ua || '')}">${escapeHtml((v.ua || 'Unknown').substring(0, 30))}...</small></td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn-jail-action" onclick="jailVisitorIP('${escapeHtml(v.ip)}')">🚨 JAIL</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderJailedTable(jailedList) {
  const tbody = document.getElementById('jailedTableBody');
  if (!tbody) return;

  if (!jailedList || jailedList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-green">Tidak ada IP yang sedang dijebloskan ke penjara Fail2Ban.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  jailedList.forEach(j => {
    const tr = document.createElement('tr');
    const bannedAtStr = j.bannedAt ? new Date(j.bannedAt).toLocaleTimeString('id-ID') : '-';
    const expiresAtStr = j.expiresAt ? new Date(j.expiresAt).toLocaleTimeString('id-ID') : '-';
    tr.innerHTML = `
      <td><strong class="text-red">${escapeHtml(j.ip)}</strong></td>
      <td><span class="badge-jailed">${escapeHtml(j.reason || 'Security Violation')}</span></td>
      <td><small class="text-muted">${bannedAtStr}</small></td>
      <td><small class="text-gold">${expiresAtStr}</small></td>
      <td>
        <button class="btn-action-small" style="border-color: #00ff88; color: #00ff88;" onclick="unbanIP('${escapeHtml(j.ip)}')">🔓 BEBASKAN</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Global Actions for Table Buttons
window.jailVisitorIP = async function(ip) {
  playCyberSound('alert');
  const reason = prompt(`Masukkan alasan memblokir IP ${ip} ke Fail2Ban:`, 'Aktivitas Mencurigakan / Probe Terlarang');
  if (!reason) return;
  try {
    const res = await authFetch('/api/security/jail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, reason, durationMinutes: 60 })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadSentinelData();
    } else {
      showToast(data.message || 'Gagal memblokir IP', 'error');
    }
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
};

window.unbanIP = async function(ip) {
  playCyberSound('click');
  if (!confirm(`Lepaskan IP ${ip} dari penjara Fail2Ban?`)) return;
  try {
    const res = await authFetch('/api/security/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadSentinelData();
    } else {
      showToast(data.message || 'Gagal unban IP', 'error');
    }
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
};

// Open Manual Jail Modal (Prompt)
document.getElementById('btnOpenManualJailModal')?.addEventListener('click', async () => {
  playCyberSound('click');
  const ip = prompt('Masukkan IP Target yang ingin diblokir secara manual:');
  if (!ip) return;
  const reason = prompt(`Alasan pemblokiran untuk ${ip}:`, 'Manual Security Ban oleh Owner');
  if (!reason) return;

  try {
    const res = await authFetch('/api/security/jail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: ip.trim(), reason: reason.trim(), durationMinutes: 60 })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadSentinelData();
    } else {
      showToast(data.message || 'Gagal memblokir IP', 'error');
    }
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
});

// Search filter for visitors
document.getElementById('visitorSearchInput')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allVisitorsData.filter(v => {
    const ipMatch = v.ip && v.ip.toLowerCase().includes(term);
    const countryMatch = v.geo && v.geo.country && v.geo.country.toLowerCase().includes(term);
    const cityMatch = v.geo && v.geo.city && v.geo.city.toLowerCase().includes(term);
    const ispMatch = v.geo && v.geo.isp && v.geo.isp.toLowerCase().includes(term);
    return ipMatch || countryMatch || cityMatch || ispMatch;
  });
  renderVisitorsTable(filtered);
});

document.getElementById('btnRefreshVisitors')?.addEventListener('click', () => {
  playCyberSound('click');
  loadSentinelData();
  showToast('Sentinel & IP Tracker diperbarui!');
});

// ===================================================
// REST API INTERACTIONS & POLLING
// ===================================================

// Fetch initial status every 5 seconds
async function fetchStatus() {
  if (!authToken) return;
  try {
    const res = await authFetch('/api/status');
    const data = await res.json();
    if (data.success) {
      if (data.stats) {
        updateMetrics(data.stats);
      }

      if (data.tunnel) {
        updateTunnelUI(data.tunnel);
      }

      if (data.status === 'connected') {
        hudStatusText.innerText = 'ONLINE // SECURE';
        hudStatusText.className = 'text-green';
        hudBotNumber.innerText = data.botNumber || 'ACTIVE';
        qrPlaceholder.style.display = 'flex';
        qrImage.style.display = 'none';
        qrStatusMsg.innerText = 'Quantum Bot Terhubung & Aktif';
      } else if (data.qrDataUrl) {
        hudStatusText.innerText = 'WAITING QR SCAN';
        hudStatusText.className = 'text-gold';
        qrImage.src = data.qrDataUrl;
        qrImage.style.display = 'block';
        qrPlaceholder.style.display = 'none';
        qrStatusMsg.innerText = 'Arahkan kamera WhatsApp dan scan QR Code di atas';
      }
    }
  } catch (e) {
    // Silent polling
  }
}
setInterval(fetchStatus, 4000);
fetchStatus();

// Load AI Settings
async function loadSettings() {
  try {
    const res = await authFetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById('settingAiProvider').value = s.aiProvider || 'auto';
      document.getElementById('settingOpenaiKey').value = s.openaiApiKey || '';
      document.getElementById('settingOpenaiModel').value = s.openaiModel || 'gpt-4o-mini';
      document.getElementById('settingGeminiKey').value = s.geminiApiKey || '';
      document.getElementById('settingGeminiModel').value = s.geminiModel || 'gemini-flash-lite-latest';
      document.getElementById('settingAutoAiPrivate').checked = s.autoAiPrivate !== false;
      document.getElementById('settingAutoAiGroup').checked = s.autoAiGroup === true;
      document.getElementById('settingPrefix').value = s.prefix || '.';
      document.getElementById('settingCooldown').value = s.antiSpamCooldown || 1500;
      document.getElementById('settingSystemPrompt').value = s.aiSystemPrompt || '';
    }
  } catch (e) {
    showToast('Gagal memuat setelan: ' + e.message, 'error');
  }
}

// Save AI Settings
document.getElementById('btnSaveSettings')?.addEventListener('click', async () => {
  playCyberSound('click');
  const payload = {
    aiProvider: document.getElementById('settingAiProvider').value,
    openaiApiKey: document.getElementById('settingOpenaiKey').value.trim(),
    openaiModel: document.getElementById('settingOpenaiModel').value,
    geminiApiKey: document.getElementById('settingGeminiKey').value.trim(),
    geminiModel: document.getElementById('settingGeminiModel').value,
    autoAiPrivate: document.getElementById('settingAutoAiPrivate').checked,
    autoAiGroup: document.getElementById('settingAutoAiGroup').checked,
    prefix: document.getElementById('settingPrefix').value.trim() || '.',
    antiSpamCooldown: parseInt(document.getElementById('settingCooldown').value, 10) || 1500,
    aiSystemPrompt: document.getElementById('settingSystemPrompt').value.trim()
  };

  try {
    const res = await authFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Setelan AI & Sistem berhasil disimpan!');
    } else {
      showToast(data.error || 'Gagal menyimpan', 'error');
    }
  } catch (e) {
    showToast('Gagal menyimpan: ' + e.message, 'error');
  }
});

// Request Pairing Code
document.getElementById('btnRequestPairing')?.addEventListener('click', async () => {
  playCyberSound('click');
  const phone = document.getElementById('pairingPhoneInput').value.trim();
  if (!phone) {
    showToast('Masukkan nomor WhatsApp Anda!', 'error');
    return;
  }

  showToast('Meminta kode pairing ke server WhatsApp...');
  try {
    const res = await authFetch('/api/action/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
    } else {
      showToast(data.message || 'Gagal', 'error');
    }
  } catch (e) {
    showToast('Koneksi gagal: ' + e.message, 'error');
  }
});

// Restart Bot
document.getElementById('btnRestartBot')?.addEventListener('click', async () => {
  playCyberSound('click');
  if (!confirm('Restart koneksi core bot?')) return;
  try {
    const res = await authFetch('/api/action/restart', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Restarting...');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
});

// Logout Session
document.getElementById('btnLogoutSession')?.addEventListener('click', async () => {
  playCyberSound('alert');
  if (!confirm('PERINGATAN: Apakah Anda yakin ingin LOGOUT dan mereset sesi WhatsApp? Anda harus scan QR baru nanti.')) return;
  try {
    const res = await authFetch('/api/action/logout', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Logout berhasil');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
});

// Send Manual Message
document.getElementById('btnSendManualMsg')?.addEventListener('click', async () => {
  playCyberSound('click');
  const target = document.getElementById('manualTargetInput').value.trim();
  const message = document.getElementById('manualMessageInput').value.trim();

  if (!target || !message) {
    showToast('Nomor target dan isi pesan wajib diisi!', 'error');
    return;
  }

  try {
    const res = await authFetch('/api/action/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, message })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Pesan berhasil terkirim!');
      document.getElementById('manualMessageInput').value = '';
    } else {
      showToast(data.message || 'Gagal mengirim pesan', 'error');
    }
  } catch (e) {
    showToast('Koneksi error: ' + e.message, 'error');
  }
});

// Broadcast Announcement
document.getElementById('btnSendBroadcast')?.addEventListener('click', async () => {
  playCyberSound('click');
  const targetType = document.getElementById('broadcastTargetType').value;
  const message = document.getElementById('broadcastMessageInput').value.trim();

  if (!message) {
    showToast('Isi pesan siaran wajib diisi!', 'error');
    return;
  }

  if (!confirm(`Luncurkan siaran pesan ini ke sasaran: ${targetType.toUpperCase()}?`)) return;

  showToast('Memulai transmisi siaran...');
  try {
    const res = await authFetch('/api/action/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, message })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      document.getElementById('broadcastMessageInput').value = '';
    } else {
      showToast(data.message || 'Gagal', 'error');
    }
  } catch (e) {
    showToast('Koneksi error: ' + e.message, 'error');
  }
});

// ===================================================
// DATABASE TAB: USERS & GROUPS
// ===================================================

async function loadDatabaseUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="text-center">Mengambil data pengguna...</td></tr>';

  try {
    const res = await authFetch('/api/users');
    const data = await res.json();
    if (data.success) {
      allUsersData = data.users || [];
      renderUsersTable(allUsersData);
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red">Gagal memuat pengguna: ${e.message}</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada user yang tercatat.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  users.forEach(u => {
    const cleanNum = u.phoneNumber || (u.id ? '+' + u.id.split('@')[0] : '-');
    const tr = document.createElement('tr');

    const isPaired = u.isPairedHost === true;
    const pairedTag = isPaired 
      ? '<div style="margin-top: 4px;"><span class="badge-paired-host">🛡️ LOGIN WA SENDIRI (PAIRED HOST)</span></div>' 
      : '';

    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(u.name || 'Traveler')}</strong>
        ${pairedTag}
        <br><small class="text-muted">${escapeHtml(cleanNum)}</small>
      </td>
      <td><span class="text-cyan">${escapeHtml(u.rank || 'Novice')}</span> (Lv.${u.level || 1})</td>
      <td class="text-gold">💰 ${(u.coins || 0).toLocaleString('id-ID')}</td>
      <td>⚡ ${u.xp || 0}</td>
      <td>❤️ ${u.hp || 100}/${u.maxHp || 100}</td>
      <td><span class="badge-${u.role === 'OWNER' ? 'owner' : 'citizen'}">${u.role || 'CITIZEN'}</span></td>
      <td>${u.banned ? '<span class="text-red">BANNED</span>' : '<span class="text-green">ACTIVE</span>'}</td>
      <td><button class="btn-action-small" onclick="openCoinModal('${escapeHtml(u.id)}', '${escapeHtml(u.name || 'Traveler')}', ${u.coins || 0}, '${escapeHtml(u.role || 'CITIZEN')}')">💰 KELOLA</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// User Search Filter
document.getElementById('userSearchInput')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allUsersData.filter(u => 
    (u.name && u.name.toLowerCase().includes(term)) ||
    (u.id && u.id.includes(term)) ||
    (u.phoneNumber && u.phoneNumber.includes(term))
  );
  renderUsersTable(filtered);
});

document.getElementById('btnRefreshUsers')?.addEventListener('click', () => {
  playCyberSound('click');
  loadDatabaseUsers();
  loadDatabaseGroups();
});

async function loadDatabaseGroups() {
  const tbody = document.getElementById('groupsTableBody');
  if (!tbody) return;
  try {
    const res = await authFetch('/api/groups');
    const data = await res.json();
    if (data.success && data.groups && data.groups.length > 0) {
      tbody.innerHTML = '';
      data.groups.forEach(g => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(g.name || 'Sektor Cyber')}</strong></td>
          <td><small class="text-muted">${escapeHtml(g.id)}</small></td>
          <td>${g.antilink ? '<span class="text-green">🛡️ AKTIF</span>' : '<span class="text-muted">NONAKTIF</span>'}</td>
          <td>${g.welcome ? '<span class="text-green">👋 AKTIF</span>' : '<span class="text-muted">NONAKTIF</span>'}</td>
          <td>${g.autoAi ? '<span class="text-cyan">🤖 AKTIF</span>' : '<span class="text-muted">STANDBY</span>'}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada grup yang tercatat. Masukkan bot ke grup untuk mendaftarkan!</td></tr>';
    }
  } catch (e) {
    // Ignore
  }
}

// ===================================================
// COIN & ECONOMY MODAL HANDLERS
// ===================================================

function openCoinModal(userId, userName, currentCoins, userRole) {
  playCyberSound('click');
  document.getElementById('modalUserId').value = userId;
  document.getElementById('modalUserName').value = `${userName} (${currentCoins.toLocaleString('id-ID')} Koin)`;
  document.getElementById('modalRole').value = userRole;
  document.getElementById('modalCoinAmount').value = '';
  document.getElementById('modalAction').value = 'add';
  document.getElementById('coinModalOverlay').style.display = 'flex';
}

function closeCoinModal() {
  document.getElementById('coinModalOverlay').style.display = 'none';
}

document.getElementById('btnCloseCoinModal')?.addEventListener('click', closeCoinModal);

document.getElementById('btnSaveUserCoins')?.addEventListener('click', async () => {
  playCyberSound('click');
  const userId = document.getElementById('modalUserId').value;
  const action = document.getElementById('modalAction').value;
  const amount = parseInt(document.getElementById('modalCoinAmount').value, 10) || 0;
  const role = document.getElementById('modalRole').value;

  if (amount < 0) {
    showToast('Jumlah koin tidak boleh negatif!', 'error');
    return;
  }

  try {
    const res = await authFetch('/api/users/edit-economy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, amount, role })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      closeCoinModal();
      loadDatabaseUsers();
    } else {
      showToast(data.message || 'Gagal menyimpan saldo', 'error');
    }
  } catch (err) {
    showToast('Error koneksi: ' + err.message, 'error');
  }
});

// ===================================================
// SIMULATOR PERINTAH BOT CYBER (TEST FITUR LANGSUNG)
// ===================================================
document.getElementById('btnRunSimCommand')?.addEventListener('click', async () => {
  playCyberSound('click');
  const inputEl = document.getElementById('simCommandInput');
  const resultBox = document.getElementById('simResultBox');
  const command = inputEl.value.trim();

  if (!command) {
    showToast('Masukkan perintah terlebih dahulu!', 'error');
    return;
  }

  resultBox.textContent = `[EXECUTING] Menjalankan perintah "${command}" pada Quantum Matrix...`;
  try {
    const res = await authFetch('/api/action/simulate-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    const data = await res.json();
    if (data.success) {
      resultBox.textContent = `>>> HASIL RESPON BOT (SIMULASI):\n\n${data.reply}`;
      showToast(`Perintah ${command} berhasil dijalankan!`);
    } else {
      resultBox.textContent = `[ERROR] ${data.error || data.message || 'Gagal menjalankan perintah'}`;
      showToast('Gagal menjalankan perintah', 'error');
    }
  } catch (e) {
    resultBox.textContent = `[NETWORK ERROR] ${e.message}`;
    showToast('Koneksi simulator gagal: ' + e.message, 'error');
  }
});
