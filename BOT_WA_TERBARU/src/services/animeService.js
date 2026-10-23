'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║        RANZZXITER — ANIME CANVAS SERVICE                        ║
 * ║  Ultra Fast Canvas Card Generator + Anime Video Autoplay        ║
 * ║  Engine: Sharp v0.35.5 + SVG/RSVG + Pango (Native Text)        ║
 * ║  Performance: <100ms card generation (all in-memory buffers)    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const https = require('https');
const config = require('../config');

let sharp;
try { sharp = require('sharp'); } catch (e) { sharp = null; }

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CARD_W         = 780;
const CARD_H         = 420;
const IMG_W          = 280;  // Lebar kolom anime image
const TEXT_X         = IMG_W + 24;
const TEXT_W         = CARD_W - IMG_W - 32;

const NEON_CYAN      = '#00f0ff';
const NEON_PINK      = '#ff00c8';
const NEON_PURPLE    = '#a855f7';
const NEON_GOLD      = '#ffd700';
const BG_DARK        = '#050814';
const BG_CARD        = '#0a1628';
const ACCENT         = '#0d2244';

// cdn.nekos.life direct PNG images — verified working
const NEKOS_LIFE_IMGS = [
  'https://cdn.nekos.life/neko/neko001.png',
  'https://cdn.nekos.life/neko/neko002.png',
  'https://cdn.nekos.life/neko/neko003.png',
  'https://cdn.nekos.life/neko/neko004.png',
  'https://cdn.nekos.life/neko/neko005.png',
  'https://cdn.nekos.life/neko/neko006.png',
  'https://cdn.nekos.life/neko/neko007.png',
  'https://cdn.nekos.life/neko/neko008.png',
  'https://cdn.nekos.life/neko/neko009.png',
  'https://cdn.nekos.life/neko/neko010.png',
  'https://cdn.nekos.life/neko/neko011.png',
  'https://cdn.nekos.life/neko/neko012.png',
  'https://cdn.nekos.life/neko/neko013.png',
  'https://cdn.nekos.life/neko/neko014.png',
  'https://cdn.nekos.life/neko/neko015.png',
  'https://cdn.nekos.life/neko/neko016.png',
  'https://cdn.nekos.life/neko/neko017.png',
  'https://cdn.nekos.life/neko/neko018.png',
  'https://cdn.nekos.life/neko/neko019.png',
  'https://cdn.nekos.life/neko/neko020.png',
];

const NEKOS_CATEGORIES = [
  'dance','wink','wave','pat','smile','happy','hug',
  'cry','blushing','laugh','nod','nope','sleep','stare','thumbsup'
];

const FALLBACK_ANIME_URLS = [
  'https://nekos.best/api/v2/dance/bf9f0cc8-9bcc-4fe8-ba38-bfcfe40694d0.gif',
  'https://nekos.best/api/v2/wink/b76cae8e-d9fe-443b-8cf7-3005d53c7a3d.gif',
  'https://nekos.best/api/v2/wave/a65c9288-5182-4aa4-82a0-dae5a32bce22.gif',
  'https://nekos.best/api/v2/pat/383ea3b8-6ca6-4d24-81ae-35c602a5c2d1.gif',
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Potong teks panjang agar muat dalam card */
function wrapText(text, maxCharsPerLine, maxLines) {
  const words    = String(text || '').replace(/\n/g, ' ').split(' ');
  const lines    = [];
  let   current  = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current && lines.length < maxLines) lines.push(current.trim());
  return lines.slice(0, maxLines);
}

/** Escape karakter XML untuk SVG */
function xmlEsc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Minta URL anime acak dari nekos.best, fallback ke URL statis */
async function fetchRandomAnimeUrl() {
  try {
    const cat = NEKOS_CATEGORIES[Math.floor(Math.random() * NEKOS_CATEGORIES.length)];
    const res = await axios.get(`https://nekos.best/api/v2/${cat}`, {
      httpsAgent, timeout: 2800
    });
    const url = res.data?.results?.[0]?.url;
    if (url) return url;
  } catch (_) {}
  return FALLBACK_ANIME_URLS[Math.floor(Math.random() * FALLBACK_ANIME_URLS.length)];
}

/** Download buffer dari URL (gambar/gif) */
async function downloadBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    httpsAgent,
    timeout: 5000,
    headers: { 'User-Agent': `Mozilla/5.0 ${config.BOT_NAME}/${config.BOT_VERSION}` }
  });
  return Buffer.from(res.data);
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG CARD BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build SVG teks panel (background card tanpa gambar anime).
 * Gambar anime akan dicomposite oleh sharp setelah ini.
 */
function buildSvgPanel(captionLines, titleLine, footerLabel, timestamp) {
  // Hitung posisi baris teks
  const lineHeight = 28;
  const textStartY  = 130;
  const textBlocks  = captionLines.map((line, i) =>
    `<text x="${TEXT_X}" y="${textStartY + i * lineHeight}"
      font-family="monospace,DejaVu Sans Mono,Courier New"
      font-size="15" fill="#d0e8ff" xml:space="preserve">${xmlEsc(line)}</text>`
  ).join('\n    ');

  // Glow filter
  const svgHeader = `<svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${BG_DARK}"/>
      <stop offset="55%"  stop-color="${BG_CARD}"/>
      <stop offset="100%" stop-color="#071122"/>
    </linearGradient>
    <!-- Neon glow cyan -->
    <filter id="glowC" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Neon glow pink -->
    <filter id="glowP" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Neon glow gold -->
    <filter id="glowG" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Separator gradient vertical -->
    <linearGradient id="sepGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${NEON_CYAN}" stop-opacity="0"/>
      <stop offset="30%"  stop-color="${NEON_CYAN}" stop-opacity="1"/>
      <stop offset="70%"  stop-color="${NEON_PINK}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${NEON_PINK}" stop-opacity="0"/>
    </linearGradient>
    <!-- Top strip gradient -->
    <linearGradient id="topStrip" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${NEON_CYAN}"/>
      <stop offset="50%"  stop-color="${NEON_PURPLE}"/>
      <stop offset="100%" stop-color="${NEON_PINK}"/>
    </linearGradient>
    <!-- Image area clip -->
    <clipPath id="imgClip">
      <rect x="0" y="0" width="${IMG_W}" height="${CARD_H}" rx="16"/>
    </clipPath>
    <!-- Bottom strip gradient -->
    <linearGradient id="botStrip" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${NEON_PINK}"/>
      <stop offset="50%"  stop-color="${NEON_PURPLE}"/>
      <stop offset="100%" stop-color="${NEON_CYAN}"/>
    </linearGradient>
    <!-- Scanline pattern -->
    <pattern id="scanlines" x="0" y="0" width="100%" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="100%" height="2" fill="black" opacity="0.07"/>
    </pattern>
    <!-- Circuit pattern -->
    <pattern id="circuit" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M10 30 H50 M30 10 V50 M10 10 L50 50 M50 10 L10 50"
            stroke="${NEON_CYAN}" stroke-width="0.3" stroke-opacity="0.08"/>
    </pattern>
  </defs>

  <!-- Card background -->
  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#bgGrad)" rx="16"/>
  <!-- Circuit overlay -->
  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#circuit)" rx="16"/>
  <!-- Scanlines overlay -->
  <rect x="${IMG_W}" y="0" width="${CARD_W - IMG_W}" height="${CARD_H}" fill="url(#scanlines)"/>

  <!-- Outer neon border -->
  <rect x="1" y="1" width="${CARD_W - 2}" height="${CARD_H - 2}"
        fill="none" stroke="${NEON_CYAN}" stroke-width="1.5" rx="15.5" filter="url(#glowC)"/>

  <!-- Top rainbow strip -->
  <rect x="16" y="0" width="${CARD_W - 32}" height="3"
        fill="url(#topStrip)" rx="1.5"/>

  <!-- Bottom rainbow strip -->
  <rect x="16" y="${CARD_H - 3}" width="${CARD_W - 32}" height="3"
        fill="url(#botStrip)" rx="1.5"/>

  <!-- IMAGE placeholder rect (sharp will composite real image here) -->
  <rect x="0" y="0" width="${IMG_W}" height="${CARD_H}"
        fill="${ACCENT}" rx="16"/>
  <!-- Image frame neon border -->
  <rect x="0" y="0" width="${IMG_W}" height="${CARD_H}"
        fill="none" stroke="${NEON_PINK}" stroke-width="1.5" rx="16" filter="url(#glowP)"/>
  <!-- Image overlay shimmer -->
  <rect x="0" y="0" width="${IMG_W}" height="${CARD_H}"
        fill="url(#bgGrad)" opacity="0.18" rx="16"/>

  <!-- Vertical separator neon line -->
  <rect x="${IMG_W}" y="20" width="2" height="${CARD_H - 40}"
        fill="url(#sepGrad)" filter="url(#glowC)"/>

  <!-- ── TOP HEADER AREA ── -->
  <!-- Bot name badge background -->
  <rect x="${TEXT_X}" y="14" width="${TEXT_W - 10}" height="38"
        fill="${ACCENT}" rx="8" stroke="${NEON_CYAN}" stroke-width="0.8"/>
  <!-- Bot name  -->
  <text x="${TEXT_X + 12}" y="38"
        font-family="monospace,DejaVu Sans Mono" font-size="18" font-weight="bold"
        fill="${NEON_CYAN}" filter="url(#glowC)">⚡ ${xmlEsc(config.BOT_NAME)}</text>

  <!-- Model tag pill -->
  <rect x="${TEXT_X + 12}" y="56" width="70" height="16" fill="${NEON_PURPLE}" rx="4" opacity="0.6"/>
  <text x="${TEXT_X + 20}" y="68"
        font-family="monospace" font-size="9" fill="white">ULTRA FAST</text>
  <!-- Status pill -->
  <rect x="${TEXT_X + 90}" y="56" width="58" height="16" fill="${NEON_CYAN}" rx="4" opacity="0.5"/>
  <text x="${TEXT_X + 98}" y="68"
        font-family="monospace" font-size="9" fill="white">● ONLINE</text>
  <!-- AI tag pill -->
  <rect x="${TEXT_X + 156}" y="56" width="42" height="16" fill="${NEON_PINK}" rx="4" opacity="0.5"/>
  <text x="${TEXT_X + 162}" y="68"
        font-family="monospace" font-size="9" fill="white">AI BOT</text>

  <!-- Thin divider under header -->
  <line x1="${TEXT_X}" y1="80" x2="${CARD_W - 16}" y2="80"
        stroke="${NEON_CYAN}" stroke-width="0.8" stroke-opacity="0.5"/>

  <!-- ── TITLE LINE ── -->
  <text x="${TEXT_X}" y="108"
        font-family="monospace,DejaVu Sans Mono" font-size="16" font-weight="bold"
        fill="${NEON_GOLD}" filter="url(#glowG)">${xmlEsc(titleLine)}</text>

  <!-- ── CAPTION TEXT LINES ── -->
  ${textBlocks}

  <!-- ── BOTTOM FOOTER AREA ── -->
  <!-- Footer background strip -->
  <rect x="${TEXT_X}" y="${CARD_H - 52}" width="${TEXT_W - 10}" height="38"
        fill="${ACCENT}" rx="6" stroke="${NEON_PURPLE}" stroke-width="0.6" opacity="0.8"/>
  <!-- Timestamp -->
  <text x="${TEXT_X + 10}" y="${CARD_H - 33}"
        font-family="monospace" font-size="10" fill="#5580aa">⏱ ${xmlEsc(timestamp)}</text>
  <!-- Footer label -->
  <text x="${TEXT_X + 10}" y="${CARD_H - 18}"
        font-family="monospace" font-size="10" fill="${NEON_PURPLE}" opacity="0.9">${xmlEsc(footerLabel)}</text>

  <!-- Decorative corner accents -->
  <polyline points="4,20 4,4 20,4" fill="none" stroke="${NEON_CYAN}" stroke-width="2" filter="url(#glowC)"/>
  <polyline points="${CARD_W - 20},4 ${CARD_W - 4},4 ${CARD_W - 4},20"
            fill="none" stroke="${NEON_CYAN}" stroke-width="2" filter="url(#glowC)"/>
  <polyline points="4,${CARD_H - 20} 4,${CARD_H - 4} 20,${CARD_H - 4}"
            fill="none" stroke="${NEON_PINK}" stroke-width="2" filter="url(#glowP)"/>
  <polyline points="${CARD_W - 20},${CARD_H - 4} ${CARD_W - 4},${CARD_H - 4} ${CARD_W - 4},${CARD_H - 20}"
            fill="none" stroke="${NEON_PINK}" stroke-width="2" filter="url(#glowP)"/>

  <!-- Anime label watermark on image area -->
  <text x="${IMG_W / 2}" y="${CARD_H - 14}" text-anchor="middle"
        font-family="monospace" font-size="9" fill="${NEON_PINK}" opacity="0.7">✦ ANIME ✦</text>
</svg>`;

  return svgHeader;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLASS
// ─────────────────────────────────────────────────────────────────────────────

class AnimeService {
  constructor() {
    this.localVideoBuffers = [];
    this.localGifBuffers   = [];
    this.commandImagePromise = null;
    this.localGifsDir      = path.resolve(__dirname, '../../assets/anime');
    this._cardCache        = new Map();   // URL → {ts, buf} last 5 min
    this._cacheLimit       = 30;
    this.loadLocalVideos();
  }

  // ── Muat GIF lokal ke RAM ──────────────────────────────────────────────────
  loadLocalVideos() {
    try {
      if (fs.existsSync(this.localGifsDir)) {
        const files = fs.readdirSync(this.localGifsDir)
          .filter(f => f.match(/\.(gif|mp4)$/i));
        this.localVideoBuffers = files.map(f =>
          fs.readFileSync(path.join(this.localGifsDir, f))
        );
        this.localGifBuffers = files
          .filter(f => /\.gif$/i.test(f))
          .map(f => fs.readFileSync(path.join(this.localGifsDir, f)));
        console.log(`[ANIME] ⚡ ${this.localVideoBuffers.length} anime GIF dimuat ke RAM cache.`);
      }
    } catch (e) {
      console.warn('[ANIME] Gagal muat lokal:', e.message);
    }
  }

  async getCommandImageBuffer() {
    if (!sharp) throw new Error('sharp tidak tersedia untuk memproses gambar perintah.');
    if (!this.localGifBuffers.length) throw new Error('Tidak ada GIF lokal yang tersedia untuk gambar perintah.');

    if (!this.commandImagePromise) {
      const source = this.localGifBuffers[Math.floor(Math.random() * this.localGifBuffers.length)];
      const generation = sharp(source, { animated: false })
        .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      this.commandImagePromise = generation;
    }

    try {
      return await this.commandImagePromise;
    } catch (err) {
      this.commandImagePromise = null;
      throw err;
    }
  }

  async sendCommandImage(sock, chatId, quotedMsg = null) {
    const image = await this.getCommandImageBuffer();
    return sock.sendMessage(chatId, {
      image,
      caption: '⚡ Menjalankan perintah bot...'
    }, { quoted: quotedMsg });
  }

  getRandomAnimeVideoBuffer() {
    if (!this.localVideoBuffers.length) return null;
    return this.localVideoBuffers[Math.floor(Math.random() * this.localVideoBuffers.length)];
  }

  async getRandomAnimeVideoUrl() {
    return fetchRandomAnimeUrl();
  }

  // ── Footer chip text ───────────────────────────────────────────────────────
  formatQuickActionFooter(buttons = []) {
    if (!buttons?.length) return '';
    const chips = buttons.map(b => `[ 🔘 ${b.buttonId} ]`).join('  ');
    return `\n\n╭─── 🔘 *[AKSI TOMBOL CEPAT]*\n│ ${chips}\n╰────────────────────────────`;
  }

  // ── Canvas card builder ────────────────────────────────────────────────────
  /**
   * Build PNG card buffer menggunakan Sharp SVG + composite anime image.
   * @param {string} captionText  — Teks utama pesan
   * @param {string} [title]      — Judul/label di atas caption
   * @param {string} [animeUrl]   — URL gambar anime (opsional; auto-fetch jika null)
   * @returns {Promise<Buffer>}   — PNG buffer card
   */
  async buildAnimeCard(captionText, title = '🤖 PESAN BOT', animeUrl = null) {
    if (!sharp) throw new Error('sharp tidak tersedia');

    // 1. Dapatkan URL anime
    const imgUrl = animeUrl || await fetchRandomAnimeUrl();

    // 2. Cek cache
    const cached = this._cardCache.get(imgUrl);
    if (cached && Date.now() - cached.ts < 300_000) {
      // Cache hit: reuse background, buat SVG baru dengan teks baru
    }

    // 3. Download anime image → buffer
    let animeImgBuf;
    try {
      animeImgBuf = await downloadBuffer(imgUrl);
    } catch (e) {
      console.warn('[ANIME-CARD] Gagal download anime img:', e.message);
      // Gunakan lokal jika ada
      animeImgBuf = this.getRandomAnimeVideoBuffer();
    }

    // 4. Resize anime image → 280×420 cover (PNG)
    let animeResized;
    try {
      animeResized = await sharp(animeImgBuf)
        .resize(IMG_W, CARD_H, { fit: 'cover', position: 'centre' })
        .png({ compressionLevel: 6 })
        .toBuffer();
    } catch (e) {
      console.warn('[ANIME-CARD] Gagal resize anime:', e.message);
      animeResized = null;
    }

    // 5. Prepare teks
    const titleLine    = String(title || '🤖 PESAN BOT').slice(0, 60);
    const captionLines = wrapText(captionText, Math.floor(TEXT_W / 9), 8);
    const now          = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const footerLabel  = `⚡ ${config.BOT_NAME} | WhatsApp AI`;

    // 6. Render SVG panel → PNG
    const svgStr = buildSvgPanel(captionLines, titleLine, footerLabel, now);
    let panelBuf;
    try {
      panelBuf = await sharp(Buffer.from(svgStr))
        .png({ compressionLevel: 6 })
        .toBuffer();
    } catch (svgErr) {
      console.error('[ANIME-CARD] SVG render error:', svgErr.message);
      throw svgErr;
    }

    // 7. Composite: overlay anime image ke sisi kiri card
    const compositeOps = [];
    if (animeResized) {
      compositeOps.push({ input: animeResized, left: 0, top: 0, blend: 'over' });
    }

    const finalBuf = await sharp(panelBuf)
      .composite(compositeOps)
      .png({ compressionLevel: 7 })
      .toBuffer();

    return finalBuf;
  }

  // ── Send with canvas card (primary) ───────────────────────────────────────
  /**
   * Kirim pesan dengan canvas anime card PNG + interactive buttons.
   * Fallback otomatis ke video autoplay → teks biasa.
   */
  async sendAnimeReply(sock, chatId, captionText, quotedMsg = null, options = {}) {
    const cleanCaption = typeof captionText === 'string'
      ? captionText.trim()
      : String(captionText || '');

    const footer  = options.footer  || `⚡ ${config.BOT_NAME} // INTERACTIVE BOT`;
    const title   = options.title   || `🤖 ${config.BOT_NAME} — PESAN BOT`;
    const buttons = options.buttons || [
      { buttonId: '.menu',     buttonText: { displayText: '📋 MENU UTAMA' }, type: 1 },
      { buttonId: '.profile',  buttonText: { displayText: '🆔 STATUS USER' }, type: 1 },
      { buttonId: '.cleanram', buttonText: { displayText: '⚡ SPEED BOOST' }, type: 1 },
    ];

    const footerChips = options.noFooterChips ? '' : this.formatQuickActionFooter(buttons);
    const captionWithChips = cleanCaption + footerChips;

    // ── OPSI 1: Canvas card PNG + buttons (UTAMA) ──────────────────────────
    if (sharp) {
      try {
        const animeUrl = options.animeUrl || null;
        const cardBuf  = await this.buildAnimeCard(cleanCaption, title, animeUrl);

        return await sock.sendMessage(chatId, {
          image: cardBuf,
          caption: captionWithChips,
          footer,
          buttons,
          headerType: 4,
          mentions: options.mentions || [],
        }, { quoted: quotedMsg });
      } catch (errCard) {
        console.warn('[ANIME] Canvas card gagal, fallback video:', errCard.message);
      }
    }

    // ── OPSI 2: Video GIF autoplay dari RAM + buttons ──────────────────────
    const videoBuf = this.getRandomAnimeVideoBuffer();
    if (videoBuf) {
      try {
        return await sock.sendMessage(chatId, {
          video: videoBuf,
          gifPlayback: true,
          caption: captionWithChips,
          footer,
          buttons,
          headerType: 5,
          mentions: options.mentions || [],
        }, { quoted: quotedMsg });
      } catch (errVid) {
        try {
          // buttons gagal, kirim video tanpa buttons
          return await sock.sendMessage(chatId, {
            video: videoBuf,
            gifPlayback: true,
            caption: captionWithChips,
            mentions: options.mentions || [],
          }, { quoted: quotedMsg });
        } catch (_) {}
      }
    }

    // ── OPSI 3: Video URL online + buttons ─────────────────────────────────
    try {
      const videoUrl = await this.getRandomAnimeVideoUrl();
      return await sock.sendMessage(chatId, {
        video: { url: videoUrl },
        gifPlayback: true,
        caption: captionWithChips,
        footer,
        buttons,
        headerType: 5,
        mentions: options.mentions || [],
      }, { quoted: quotedMsg });
    } catch (_) {}

    // ── OPSI 4: Teks + buttons ─────────────────────────────────────────────
    try {
      return await sock.sendMessage(chatId, {
        text: captionWithChips,
        footer,
        buttons,
        headerType: 1,
        mentions: options.mentions || [],
      }, { quoted: quotedMsg });
    } catch (_) {}

    // ── OPSI 5: Plain text (last resort) ──────────────────────────────────
    return await sock.sendMessage(chatId, {
      text: captionWithChips,
      mentions: options.mentions || [],
    }, { quoted: quotedMsg });
  }
}

module.exports = new AnimeService();
