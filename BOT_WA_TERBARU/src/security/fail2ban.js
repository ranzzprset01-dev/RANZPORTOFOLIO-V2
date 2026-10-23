const https = require('https');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const sslAgent = new https.Agent({ rejectUnauthorized: false });

class SecuritySystem {
  constructor() {
    this.jailedIPs = new Map(); // ip -> { reason, jailTime, expireAt, attempts }
    this.floodTracker = new Map(); // ip -> { count, windowStart }
    this.failedLogins = new Map(); // ip -> { count, lastAttempt }
    this.geoCache = new Map(); // ip -> { country, city, isp, org }
    this.visitorLogs = []; // array of last 150 visitors
    this.io = null;

    // Load persisted banned IPs if exists
    this.dataFile = path.resolve('./data/jailed_ips.json');
    this.loadPersistedJail();
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  loadPersistedJail() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [ip, data] of Object.entries(parsed)) {
          if (!data.expireAt || data.expireAt > Date.now()) {
            this.jailedIPs.set(ip, data);
          }
        }
      }
    } catch (e) {}
  }

  savePersistedJail() {
    try {
      const obj = {};
      for (const [ip, data] of this.jailedIPs.entries()) {
        obj[ip] = data;
      }
      fs.writeFileSync(this.dataFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {}
  }

  getClientIP(req) {
    let ip = req.headers['cf-connecting-ip'] ||
             req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.socket?.remoteAddress ||
             '127.0.0.1';

    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    if (ip === '::1') {
      ip = '127.0.0.1';
    }
    return ip;
  }

  async getGeoLocation(ip) {
    if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { country: 'Localhost / LAN', city: 'Internal VPS', isp: 'Private Network' };
    }

    if (this.geoCache.has(ip)) {
      return this.geoCache.get(ip);
    }

    try {
      const res = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp,org`, {
        httpsAgent: sslAgent,
        timeout: 3000
      });
      if (res.data && res.data.status === 'success') {
        const geo = {
          country: res.data.country || 'Unknown',
          city: res.data.city || res.data.regionName || 'Unknown',
          isp: res.data.isp || res.data.org || 'Unknown'
        };
        this.geoCache.set(ip, geo);
        return geo;
      }
    } catch (e) {}

    const fallback = { country: 'Global WAN', city: 'Encrypted Routing', isp: 'Internet Provider' };
    this.geoCache.set(ip, fallback);
    return fallback;
  }

  logVisitor(ip, endpoint, userAgent, status = 'ALLOWED') {
    this.getGeoLocation(ip).then(geo => {
      const record = {
        id: 'VIS_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        ip,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        date: new Date().toLocaleDateString('id-ID'),
        endpoint,
        userAgent: userAgent ? userAgent.substring(0, 100) : 'Unknown Browser',
        country: geo.country,
        city: geo.city,
        isp: geo.isp,
        status,
        isBanned: this.isJailed(ip)
      };

      this.visitorLogs.unshift(record);
      if (this.visitorLogs.length > 150) {
        this.visitorLogs.pop();
      }

      // Log to ip-log.txt file
      try {
        const logEntry = `[${record.date} ${record.timestamp}] IP: ${ip} | Country: ${geo.country} | City: ${geo.city} | Endpoint: ${endpoint} | Status: ${status}\n`;
        fs.appendFileSync(path.resolve('./ip-log.txt'), logEntry, 'utf8');
      } catch (e) {}

      if (this.io) {
        this.io.emit('visitor_activity', record);
      }
    }).catch(() => {});
  }

  isJailed(ip) {
    if (!this.jailedIPs.has(ip)) return false;
    const data = this.jailedIPs.get(ip);
    if (data.expireAt && data.expireAt < Date.now()) {
      this.jailedIPs.delete(ip);
      this.savePersistedJail();
      return false;
    }
    return true;
  }

  jailIP(ip, reason = 'Violated Security Protocols', durationMinutes = 15) {
    const expireAt = durationMinutes > 0 ? Date.now() + (durationMinutes * 60 * 1000) : null;
    const data = {
      ip,
      reason,
      jailTime: new Date().toLocaleTimeString('id-ID'),
      expireAt,
      durationMinutes
    };

    this.jailedIPs.set(ip, data);
    this.savePersistedJail();

    if (this.io) {
      this.io.emit('fail2ban_alert', {
        type: 'JAIL_TRIGGERED',
        ip,
        reason,
        expireAt
      });
    }
  }

  unbanIP(ip) {
    if (this.jailedIPs.has(ip)) {
      this.jailedIPs.delete(ip);
      this.failedLogins.delete(ip);
      this.savePersistedJail();
      return true;
    }
    return false;
  }

  recordFailedLogin(ip) {
    const current = this.failedLogins.get(ip) || { count: 0, lastAttempt: Date.now() };
    current.count += 1;
    current.lastAttempt = Date.now();
    this.failedLogins.set(ip, current);

    // Fail2Ban Threshold: 5 failed attempts
    if (current.count >= 5) {
      this.jailIP(ip, 'Fail2Ban: Terlalu banyak percobaan password salah (5x gagal)', 30);
      return { jailed: true, count: current.count };
    }

    return { jailed: false, count: current.count, remaining: 5 - current.count };
  }

  clearFailedLogins(ip) {
    this.failedLogins.delete(ip);
  }

  // Middleware Security Guard: Headers, Anti-Flood, Fail2Ban, IP Tracker
  createMiddleware() {
    return (req, res, next) => {
      // 1. Sembunyikan Header & Pasang Security Quantum Headers
      res.removeHeader('X-Powered-By');
      res.setHeader('Server', 'RANZZXITER-WHATSAPP-BOT');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      const ip = this.getClientIP(req);

      // 2. Cek Fail2Ban Status (IP Jail)
      if (this.isJailed(ip)) {
        const jailInfo = this.jailedIPs.get(ip);
        this.logVisitor(ip, req.path, req.headers['user-agent'], 'BLOCKED_JAILED');
        return res.status(403).json({
          success: false,
          error: 'ACCESS_FORBIDDEN_JAILED',
          message: `🚫 [FAIL2BAN // CYBER JAIL] IP Anda (${ip}) diblokir sementara karena aktivitas mencurigakan.`,
          reason: jailInfo?.reason || 'Security Protocol Violation'
        });
      }

      // 3. Anti-Flood & Rate Limiting (Max 70 requests per 20 seconds)
      const now = Date.now();
      const flood = this.floodTracker.get(ip) || { count: 0, windowStart: now };

      if (now - flood.windowStart > 20000) {
        flood.count = 1;
        flood.windowStart = now;
      } else {
        flood.count += 1;
      }
      this.floodTracker.set(ip, flood);

      if (flood.count > 70) {
        // Auto-jail for heavy flood
        this.jailIP(ip, 'Anti-Flood: Mendeteksi request flood mencurigakan (>70 req/20s)', 15);
        this.logVisitor(ip, req.path, req.headers['user-agent'], 'BLOCKED_FLOOD');
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: '⚠️ [ANTI-FLOOD TRIGGERED] Terlalu banyak permintaan! Transmisi ditahan.'
        });
      }

      // 4. Catat kunjungan ke dashboard/API jika bukan asset statis
      if (!req.path.startsWith('/css/') && !req.path.startsWith('/js/') && !req.path.includes('.ico')) {
        this.logVisitor(ip, req.path, req.headers['user-agent'], 'ALLOWED');
      }

      next();
    };
  }

  getSecurityMetrics() {
    return {
      jailedCount: this.jailedIPs.size,
      jailedList: Array.from(this.jailedIPs.values()),
      recentVisitors: this.visitorLogs.slice(0, 50),
      geoCacheSize: this.geoCache.size
    };
  }
}

module.exports = new SecuritySystem();
