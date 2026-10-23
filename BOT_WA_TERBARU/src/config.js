require('dotenv').config();

module.exports = {
  // Server Web Dashboard
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '127.0.0.1',
  ENABLE_CLOUDFLARE_TUNNEL: process.env.ENABLE_CLOUDFLARE_TUNNEL === 'true',

  // Bot Identity & Owner
  BOT_NAME: process.env.BOT_NAME || 'RANZZXITER',
  BOT_VERSION: '2.0.0-RANZZXITER',
  OWNER_NAME: process.env.OWNER_NAME || 'Commander',
  OWNER_NUMBER: '6282183317690',
  DEFAULT_PREFIX: process.env.DEFAULT_PREFIX || '.',

  // AI Configuration
  AI_PROVIDER: process.env.AI_PROVIDER || 'auto', // 'openai', 'gemini', 'auto'
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',

  // AI Behavior Defaults
  AUTO_AI_PRIVATE: process.env.AUTO_AI_PRIVATE !== 'false', // Default true: otomatis jawab di chat pribadi
  AUTO_AI_GROUP: process.env.AUTO_AI_GROUP === 'true',     // Default false: di grup jawab jika di-tag atau ada prefix
  AI_SYSTEM_PROMPT: process.env.AI_SYSTEM_PROMPT ||
    'Kamu adalah RANZZXITER, asisten AI yang cerdas, ramah, solutif, santun, dan responsif. Gunakan bahasa yang natural, jelas, profesional, serta sesuaikan gaya dengan pengguna.',

  // Safety & Limits
  RATE_LIMIT_COOLDOWN_MS: 1500, // Anti-flood delay per user
  MAX_MESSAGE_HISTORY: 10,      // Max context memory turns per user
  REPLY_DELAY_MS: 1500,         // Human-like delay before bot replies

  // Paths
  SESSION_DIR: './auth_session',
  DATABASE_DIR: './data'
};
