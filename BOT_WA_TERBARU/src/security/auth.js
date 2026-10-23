const crypto = require('crypto');
const security = require('./fail2ban');

const MASTER_PASSWORD = process.env.DASHBOARD_PASSWORD;
if (!MASTER_PASSWORD) {
  throw new Error('DASHBOARD_PASSWORD must be configured before starting the dashboard.');
}
const activeTokens = new Map(); // token -> { createdAt, ip, role }

function generateToken() {
  return 'RANZZ_' + crypto.randomBytes(32).toString('hex');
}

module.exports = {
  MASTER_PASSWORD,

  login(password, ip) {
    if (security.isJailed(ip)) {
      return {
        success: false,
        error: 'JAILED',
        message: 'IP Anda sedang diblokir oleh Fail2Ban!'
      };
    }

    if (password === MASTER_PASSWORD) {
      security.clearFailedLogins(ip);
      const token = generateToken();
      activeTokens.set(token, {
        createdAt: Date.now(),
        ip,
        role: 'SUPREME_OWNER',
        user: 'Ranzz Commander'
      });

      return {
        success: true,
        token,
        role: 'SUPREME_OWNER',
        message: 'Akses Diterima! Selamat datang, Commander.'
      };
    } else {
      const failStatus = security.recordFailedLogin(ip);
      if (failStatus.jailed) {
        return {
          success: false,
          error: 'JAILED',
          message: '🚨 Terlalu banyak percobaan salah! IP Anda telah diblokir oleh Fail2Ban selama 30 menit.'
        };
      }
      return {
        success: false,
        error: 'INVALID_PASSWORD',
        message: `Password salah! Sisa percobaan sebelum IP diblokir: ${failStatus.remaining} kali.`
      };
    }
  },

  verifyToken(token) {
    if (!token) return false;
    return activeTokens.has(token);
  },

  logout(token) {
    if (token && activeTokens.has(token)) {
      activeTokens.delete(token);
      return true;
    }
    return false;
  },

  // Express middleware untuk memproteksi API & Rute Sensitif
  requireAuth(req, res, next) {
    const token = req.headers['x-auth-token'] || req.query.token;
    if (module.exports.verifyToken(token)) {
      return next();
    }

    return res.status(401).json({
      success: false,
      requireAuth: true,
      error: 'UNAUTHORIZED',
      message: '🔒 [QUANTUM SECURITY LOCK] Akses ditolak. Diperlukan autentikasi Master Password!'
    });
  }
};
