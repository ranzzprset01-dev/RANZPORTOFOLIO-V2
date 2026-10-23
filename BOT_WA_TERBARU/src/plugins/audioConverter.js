const { spawn } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 24 * 1024 * 1024;
const CONVERSION_TIMEOUT_MS = 45 * 1000;

function unwrapMessage(message) {
  let current = message;
  while (current) {
    const wrapper = current.ephemeralMessage ||
      current.viewOnceMessage ||
      current.viewOnceMessageV2 ||
      current.viewOnceMessageV2Extension;
    if (!wrapper?.message) return current;
    current = wrapper.message;
  }
  return null;
}

function getMediaMessage(msg) {
  const current = unwrapMessage(msg.message);
  const quoted = unwrapMessage(current?.extendedTextMessage?.contextInfo?.quotedMessage);
  for (const candidate of [quoted, current]) {
    if (candidate?.audioMessage) return { media: candidate.audioMessage, type: 'audio' };
    if (candidate?.videoMessage) return { media: candidate.videoMessage, type: 'video' };
  }
  return null;
}

async function downloadLimited(media, type) {
  if (Number(media.fileLength) > MAX_INPUT_BYTES) {
    throw new Error('Ukuran media maksimal 20 MB.');
  }

  const stream = await downloadContentFromMessage(media, type);
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_INPUT_BYTES) {
      stream.destroy?.();
      throw new Error('Ukuran media maksimal 20 MB.');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function convertAudio(buffer, asVoiceNote) {
  return new Promise((resolve, reject) => {
    const args = asVoiceNote
      ? ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn', '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', '-application', 'voip', '-f', 'ogg', 'pipe:1']
      : ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn', '-ac', '2', '-b:a', '128k', '-ar', '44100', '-f', 'mp3', 'pipe:1'];
    const child = spawn(ffmpegPath, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const output = [];
    let outputSize = 0;
    let errorOutput = '';
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(result);
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish(new Error('Konversi melewati batas waktu 45 detik.'));
    }, CONVERSION_TIMEOUT_MS);

    child.stdout.on('data', chunk => {
      outputSize += chunk.length;
      if (outputSize > MAX_OUTPUT_BYTES) {
        child.kill();
        finish(new Error('Hasil konversi melebihi batas 24 MB.'));
        return;
      }
      output.push(chunk);
    });
    child.stderr.on('data', chunk => {
      if (errorOutput.length < 4096) errorOutput += chunk.toString();
    });
    child.on('error', error => finish(error));
    child.on('close', code => {
      if (code !== 0) {
        return finish(new Error(errorOutput.trim() || `FFmpeg berhenti dengan kode ${code}.`));
      }
      if (!outputSize) return finish(new Error('FFmpeg tidak menghasilkan audio.'));
      finish(null, Buffer.concat(output, outputSize));
    });
    child.stdin.on('error', error => {
      if (error.code !== 'EPIPE') finish(error);
    });
    child.stdin.end(buffer);
  });
}

module.exports = {
  convertAudio,

  async handle(sock, chatId, msg, asVoiceNote) {
    const found = getMediaMessage(msg);
    if (!found) {
      return sock.sendMessage(chatId, {
        text: `Balas pesan audio/video, atau kirim audio/video dengan caption perintah.\n\n• \`.toaudio\` — ubah menjadi MP3\n• \`.tovn\` — ubah menjadi voice note`
      }, { quoted: msg });
    }

    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const input = await downloadLimited(found.media, found.type);
      const converted = await convertAudio(input, asVoiceNote);
      return sock.sendMessage(chatId, {
        audio: converted,
        mimetype: asVoiceNote ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
        ptt: asVoiceNote,
        ...(asVoiceNote ? {} : { fileName: 'ranzzxiter-audio.mp3' })
      }, { quoted: msg });
    } catch (error) {
      console.error('[AUDIO-CONVERTER]', error.message);
      return sock.sendMessage(chatId, { text: `❌ Gagal mengonversi audio: ${error.message}` }, { quoted: msg });
    }
  }
};
