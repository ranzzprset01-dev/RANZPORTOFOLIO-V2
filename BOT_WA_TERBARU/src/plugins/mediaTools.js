const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');
const jsQR = require('jsqr');
const sharp = require('sharp');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const animeService = require('../services/animeService');
const db = require('../database/db');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const TEMP_DIR = path.resolve('./temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Bersihkan file temp lama yang lebih dari 10 menit
function cleanTempFolder() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 10 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (e) {}
}
setInterval(cleanTempFolder, 15 * 60 * 1000);

// Helper download media buffer dari Baileys
async function downloadMedia(mediaMessage, mediaType) {
  const stream = await downloadContentFromMessage(mediaMessage, mediaType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

// Helper ekstrak pesan View Once (Foto & Video 1x lihat)
function extractViewOnce(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const current = msg.message;

  // Unroll wrapper ephemeral / viewOnce recursively
  function findMediaInMsg(obj) {
    if (!obj) return null;
    if (obj.ephemeralMessage?.message) return findMediaInMsg(obj.ephemeralMessage.message);
    if (obj.viewOnceMessage?.message) return findMediaInMsg(obj.viewOnceMessage.message);
    if (obj.viewOnceMessageV2?.message) return findMediaInMsg(obj.viewOnceMessageV2.message);
    if (obj.viewOnceMessageV2Extension?.message) return findMediaInMsg(obj.viewOnceMessageV2Extension.message);

    if (obj.imageMessage) {
      return { media: obj.imageMessage, type: 'image', isViewOnce: Boolean(obj.imageMessage.viewOnce) };
    }
    if (obj.videoMessage) {
      return { media: obj.videoMessage, type: 'video', isViewOnce: Boolean(obj.videoMessage.viewOnce) };
    }
    return null;
  }

  // 1. Prioritaskan quoted message
  if (quoted) {
    const fromQuoted = findMediaInMsg(quoted);
    if (fromQuoted) return fromQuoted;
  }

  // 2. Direct message
  if (current) {
    const fromCurrent = findMediaInMsg(current);
    if (fromCurrent) return fromCurrent;
  }

  return null;
}

// Decode QR Code dari raw image buffer (PNG & JPEG)
function decodeQRFromBuffer(buffer) {
  try {
    const png = PNG.sync.read(buffer);
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    if (code && code.data) return code.data;
  } catch (e) {}

  try {
    const rawJpeg = jpeg.decode(buffer, { useTArray: true });
    const code = jsQR(new Uint8ClampedArray(rawJpeg.data), rawJpeg.width, rawJpeg.height);
    if (code && code.data) return code.data;
  } catch (e) {}

  return null;
}

module.exports = {
  downloadMedia,
  extractViewOnce,
  cleanTempFolder,

  // ==========================================================
  // 1. FITUR BUKA FOTO / VIDEO 1X LIHAT (VIEW ONCE DECRYPTOR)
  // ==========================================================
  async handleRevealViewOnce(sock, chatId, senderId, msg) {
    const found = extractViewOnce(msg);
    if (!found) {
      return animeService.sendAnimeReply(sock, chatId, `
⚠️ *[VIEW-ONCE REVEALER]*
Balas (quote/reply) pesan foto atau video *1x lihat (View-Once)* dengan perintah:
• \`.rvo\` atau \`.lihat\` : Membuka & mengunduh foto/video 1x lihat
• \`.stiker\` : Langsung jadikan foto 1x lihat menjadi stiker!
      `.trim(), msg);
    }

    try {
      await sock.sendPresenceUpdate('recording', chatId).catch(() => {});
      const buffer = await downloadMedia(found.media, found.type);

      const captionText = `
🔓 *[QUANTUM VIEW-ONCE DECRYPTED]* 🔓
═════════════════════════════════════
Media *1x Lihat (View-Once)* berhasil didekripsi & disimpan!
📁 *Tipe Media*: ${found.type.toUpperCase()}
💾 *Ukuran File*: ${(buffer.length / 1024).toFixed(1)} KB
👤 *Target*: @${senderId.split('@')[0]}
═════════════════════════════════════
_Gunakan .stiker untuk mengubah foto ini menjadi stiker WhatsApp._
      `.trim();

      if (found.type === 'image') {
        return await sock.sendMessage(chatId, {
          image: buffer,
          caption: captionText,
          mentions: [senderId]
        }, { quoted: msg });
      } else {
        return await sock.sendMessage(chatId, {
          video: buffer,
          caption: captionText,
          mentions: [senderId]
        }, { quoted: msg });
      }
    } catch (err) {
      console.error('[RVO-ERROR]', err.message);
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal membuka View-Once: Media mungkin telah kedaluwarsa di server WhatsApp atau koneksi terputus.`, msg);
    }
  },

  // ==========================================================
  // 2. FITUR FOTO / VIEW-ONCE KE STIKER (.stiker / .s)
  // ==========================================================
  async handleConvertToSticker(sock, chatId, senderId, msg) {
    const found = extractViewOnce(msg);
    if (!found || found.type !== 'image') {
      return animeService.sendAnimeReply(sock, chatId, `
🎨 *[CYBER STICKER MAKER]*
Kirim gambar atau balas pesan foto / foto *1x lihat (View-Once)* dengan perintah:
• \`.stiker\` atau \`.s\`
Foto akan langsung diproses menjadi stiker WhatsApp transparan & jernih!
      `.trim(), msg);
    }

    try {
      await sock.sendPresenceUpdate('composing', chatId).catch(() => {});
      const rawBuffer = await downloadMedia(found.media, 'image');

      // Konversi ke format WebP 512x512 via Sharp (Sangat Cepat & Ringan)
      const webpSticker = await sharp(rawBuffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 80 })
        .toBuffer();

      return await sock.sendMessage(chatId, {
        sticker: webpSticker
      }, { quoted: msg });
    } catch (err) {
      console.error('[STICKER-ERROR]', err.message);
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal membuat stiker: ${err.message}`, msg);
    }
  },

  // ==========================================================
  // 3. FITUR YOUTUBE DOWNLOAD LINK JADI MP3 (.ytmp3 / .yta)
  // ==========================================================
  async handleDownloadYouTubeAudio(sock, chatId, senderId, query, msg) {
    if (!query || !query.trim()) {
      return animeService.sendAnimeReply(sock, chatId, `
🎵 *[CYBER YOUTUBE TO MP3 DOWNLOADER]* 🎵
═════════════════════════════════════
Masukkan tautan link YouTube yang ingin diubah menjadi MP3 / Audio!
Contoh:
• \`.ytmp3 https://www.youtube.com/watch?v=dQw4w9WgXcQ\`
• \`.ytmp3 https://youtu.be/dQw4w9WgXcQ\`
═════════════════════════════════════
      `.trim(), msg);
    }

    const cleanUrl = query.trim();
    if (!cleanUrl.includes('youtube.com') && !cleanUrl.includes('youtu.be')) {
      return animeService.sendAnimeReply(sock, chatId, `⚠️ Tautan tidak valid! Masukkan URL YouTube resmi (youtube.com atau youtu.be).`, msg);
    }

    await animeService.sendAnimeReply(sock, chatId, `⚡ *[QUANTUM AUDIO CONVERTER]*\nSedang mengunduh dan mengonversi audio YouTube ke MP3/Audio... Harap tunggu sebentar!`, msg);

    const ytDlpPath = path.resolve('./yt-dlp.exe');
    const tempOutputId = 'yt_' + Date.now();
    const tempPattern = path.join(TEMP_DIR, `${tempOutputId}.%(ext)s`);

    try {
      if (fs.existsSync(ytDlpPath)) {
        await new Promise((resolve, reject) => {
          execFile(ytDlpPath, [
            '-f', 'ba[ext=m4a]/ba',
            '--max-filesize', '60M',
            '--no-playlist',
            '-o', tempPattern,
            cleanUrl
          ], { timeout: 60000 }, (error, stdout, stderr) => {
            if (error) return reject(error);
            resolve(stdout);
          });
        });

        // Cari file hasil download di folder temp
        const downloadedFiles = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(tempOutputId));
        if (downloadedFiles.length > 0) {
          const finalFile = path.join(TEMP_DIR, downloadedFiles[0]);
          const audioBuffer = fs.readFileSync(finalFile);

          // Hapus file dari disk segera agar tidak memakan penyimpanan
          try { fs.unlinkSync(finalFile); } catch (e) {}

          return await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: false,
            fileName: `CyberNova_${tempOutputId}.m4a`
          }, { quoted: msg });
        }
      }

      throw new Error('yt-dlp tidak dapat memproses file.');
    } catch (err) {
      console.warn('[YTDLP-FALLBACK-ATTEMPT]', err.message);
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mengunduh audio YouTube: Video mungkin berdurasi terlalu panjang (>60MB) atau dibatasi hak cipta regional.`, msg);
    }
  },

  // ==========================================================
  // 4. FITUR TIKTOK VIDEO DOWNLOADER (.tiktok / .tt)
  // ==========================================================
  async handleDownloadTikTok(sock, chatId, senderId, query, msg) {
    if (!query || !query.trim()) {
      return animeService.sendAnimeReply(sock, chatId, `
🎬 *[CYBER TIKTOK VIDEO DOWNLOADER]* 🎬
═════════════════════════════════════
Unduh video TikTok bersih tanpa watermark secara otomatis!
Contoh:
• \`.tiktok https://vt.tiktok.com/ZSjXg7Rk/\`
• \`.tt https://www.tiktok.com/@user/video/1234567890\`
═════════════════════════════════════
      `.trim(), msg);
    }

    const targetUrl = query.trim();
    if (!targetUrl.includes('tiktok.com')) {
      return animeService.sendAnimeReply(sock, chatId, `⚠️ Tautan tidak sah! Pastikan menyertakan tautan TikTok resmi.`, msg);
    }

    await animeService.sendAnimeReply(sock, chatId, `⚡ *[QUANTUM STREAM INGRESS]*\nSedang mengunduh video TikTok tanpa watermark... Harap tunggu sebentar!`, msg);

    // 1. Coba via API TikWM (Sangat Cepat & Tanpa Watermark)
    try {
      const res = await axios.post('https://www.tikwm.com/api/',
        new URLSearchParams({ url: targetUrl, hd: 1 }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          httpsAgent,
          timeout: 15000
        }
      );

      if (res.data?.data?.play) {
        const videoData = res.data.data;
        const playUrl = videoData.play.startsWith('http') ? videoData.play : `https://www.tikwm.com${videoData.play}`;

        const videoRes = await axios.get(playUrl, {
          responseType: 'arraybuffer',
          httpsAgent,
          timeout: 25000
        });

        const caption = `
🎬 *[TIKTOK NO-WATERMARK VIDEO]* 🎬
═════════════════════════════════════
📝 *Judul*: ${videoData.title || 'TikTok Video'}
👤 *Kreator*: @${videoData.author?.unique_id || 'creator'} (${videoData.author?.nickname || ''})
❤️ *Suka*: ${(videoData.digg_count || 0).toLocaleString('id-ID')}
💬 *Komentar*: ${(videoData.comment_count || 0).toLocaleString('id-ID')}
═════════════════════════════════════
_Diunduh menggunakan Quantum TikTok Ingress Engine._
        `.trim();

        return await sock.sendMessage(chatId, {
          video: Buffer.from(videoRes.data),
          caption
        }, { quoted: msg });
      }
    } catch (e) {
      console.warn('[TIKWM-API-ERR]', e.message);
    }

    // 2. Fallback: yt-dlp Native Engine
    const ytDlpPath = path.resolve('./yt-dlp.exe');
    const tempOutputId = 'tt_' + Date.now();
    const tempPattern = path.join(TEMP_DIR, `${tempOutputId}.%(ext)s`);

    try {
      if (fs.existsSync(ytDlpPath)) {
        await new Promise((resolve, reject) => {
          execFile(ytDlpPath, [
            '-f', 'mp4',
            '--max-filesize', '50M',
            '-o', tempPattern,
            targetUrl
          ], { timeout: 60000 }, (error, stdout) => {
            if (error) return reject(error);
            resolve(stdout);
          });
        });

        const downloadedFiles = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(tempOutputId));
        if (downloadedFiles.length > 0) {
          const finalFile = path.join(TEMP_DIR, downloadedFiles[0]);
          const videoBuffer = fs.readFileSync(finalFile);
          try { fs.unlinkSync(finalFile); } catch (e) {}

          return await sock.sendMessage(chatId, {
            video: videoBuffer,
            caption: `🎬 *[TIKTOK VIDEO DOWNLOADED]*\nBerhasil diunduh via Quantum yt-dlp Core.`
          }, { quoted: msg });
        }
      }
    } catch (err) {
      console.error('[TIKTOK-YTDLP-ERR]', err.message);
    }

    return animeService.sendAnimeReply(sock, chatId, `❌ Gagal mengunduh video TikTok: Pastikan tautan video bersifat publik dan tidak dikunci privasi.`, msg);
  },

  // ==========================================================
  // 5. FITUR GENERATOR QR CODE (.qrcode <teks>)
  // ==========================================================
  async handleGenerateQRCode(sock, chatId, text) {
    if (!text || text.trim().length === 0) {
      return animeService.sendAnimeReply(sock, chatId, '⚠️ Masukkan teks atau tautan link untuk dijadikan QR Code!\nContoh: `.qrcode https://google.com`');
    }

    try {
      const qrBuffer = await QRCode.toBuffer(text.trim(), {
        width: 600,
        margin: 2,
        color: {
          dark: '#00f2fe',
          light: '#0a0f1d'
        }
      });

      return await sock.sendMessage(chatId, {
        image: qrBuffer,
        caption: `
📱 *[CYBER QR CODE GENERATOR]* 📱
═════════════════════════════════════
🔗 *Isi Data*:
\`\`\`
${text.trim()}
\`\`\`
✨ *Gaya*: Neon Cyberpunk Matrix 2099
_Arahkan kamera atau scan untuk membaca isi kode._
═════════════════════════════════════
        `.trim()
      });
    } catch (err) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal membuat QR Code: ${err.message}`);
    }
  },

  // ==========================================================
  // 6. FITUR SCAN QR CODE DARI FOTO (.scanqr / .readqr)
  // ==========================================================
  async handleScanQRCode(sock, chatId, senderId, msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const current = msg.message;
    const imgObj = quoted?.imageMessage || current?.imageMessage;

    if (!imgObj) {
      return animeService.sendAnimeReply(sock, chatId, '📸 Kirim atau balas (quote) foto yang memiliki QR Code dengan perintah `.scanqr`!', msg);
    }

    try {
      await sock.sendPresenceUpdate('composing', chatId).catch(() => {});
      const buffer = await downloadMedia(imgObj, 'image');
      const decodedData = decodeQRFromBuffer(buffer);

      if (!decodedData) {
        return animeService.sendAnimeReply(sock, chatId, `⚠️ *[QR SCAN FAILED]*\nTidak ada QR Code yang dapat dibaca pada gambar ini. Pastikan gambar jelas dan tidak buram.`, msg);
      }

      const isUrl = decodedData.startsWith('http://') || decodedData.startsWith('https://') || decodedData.startsWith('wa.me/');

      const resultText = `
📸 *[CYBER QR CODE DECODER: SUCCESS]* 📸
═════════════════════════════════════
${isUrl ? '🌐 *Tautan URL Terdeteksi*:' : '📝 *Isi Teks QR Code*:'}
\`\`\`
${decodedData}
\`\`\`
═════════════════════════════════════
_Berhasil diproses secara lokal oleh RANZZXITER Vision._
      `.trim();

      return await animeService.sendAnimeReply(sock, chatId, resultText, msg);
    } catch (err) {
      return animeService.sendAnimeReply(sock, chatId, `❌ Gagal memindai QR Code: ${err.message}`, msg);
    }
  }
};
