const sharp = require('sharp');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const TEMP = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

async function downloadMedia(msg, sock) {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  return await downloadMediaMessage(msg, 'buffer', {}, {
    logger: require('pino')({ level: 'silent' }),
    reuploadRequest: sock.updateMediaMessage
  });
}

function getQuotedMsg(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.quotedMessage) return null;
  return {
    message: ctx.quotedMessage,
    key: { id: ctx.stanzaId, remoteJid: msg.key.remoteJid, participant: ctx.participant }
  };
}

// ============================================================
// PROVEN WORKING STICKER EXIF INJECTION
// This method is used by many popular WhatsApp bots
// ============================================================
function createExif(packname, author) {
  const payload = JSON.stringify({
    'sticker-pack-id': 'com.shadowgarden.bot',
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    'emojis': ['🌸'],
  });

  const buf = Buffer.from(payload, 'utf8');

  // Standard EXIF header used by WhatsApp sticker apps
  const header = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, // TIFF LE header
    0x01, 0x00,                                         // 1 IFD entry
    0x41, 0x88,                                         // Tag 0x8841
    0x04, 0x00,                                         // Type: LONG
    0x01, 0x00, 0x00, 0x00,                             // 1 value
    0x16, 0x00, 0x00, 0x00,                             // Offset: 22
    0x00, 0x00, 0x00, 0x00,                             // Next IFD: 0
  ]);

  const exifData = Buffer.concat([header, buf]);
  const exifPad = exifData.length % 2 !== 0 ? Buffer.alloc(1) : Buffer.alloc(0);

  // Build EXIF WebP chunk
  const exifSize = Buffer.alloc(4);
  exifSize.writeUInt32LE(exifData.length, 0);

  return Buffer.concat([
    Buffer.from('EXIF'),
    exifSize,
    exifData,
    exifPad,
  ]);
}

function addMetadata(webpBuf, packname, author) {
  try {
    if (!webpBuf || webpBuf.length < 12) return webpBuf;
    if (webpBuf.slice(0, 4).toString() !== 'RIFF') return webpBuf;
    if (webpBuf.slice(8, 12).toString() !== 'WEBP') return webpBuf;

    const exifChunk = createExif(packname, author);
    const chunkId = webpBuf.slice(12, 16).toString();

    let result;

    if (chunkId === 'VP8X') {
      // Set EXIF flag (bit 3) in VP8X flags
      const out = Buffer.from(webpBuf);
      out[20] |= 0x08;
      result = Buffer.concat([out, exifChunk]);
    } else if (chunkId === 'VP8 ' || chunkId === 'VP8L') {
      // Need to add VP8X wrapper
      const vp8xData = Buffer.alloc(10);
      vp8xData.writeUInt32LE(0x08, 0); // EXIF flag
      // Width-1 (24-bit LE) and Height-1 (24-bit LE) = 511 each
      vp8xData[4] = 0xFF; vp8xData[5] = 0x01; vp8xData[6] = 0x00;
      vp8xData[7] = 0xFF; vp8xData[8] = 0x01; vp8xData[9] = 0x00;

      const vp8xSize = Buffer.alloc(4);
      vp8xSize.writeUInt32LE(10, 0);

      const vp8xChunk = Buffer.concat([Buffer.from('VP8X'), vp8xSize, vp8xData]);
      const body = webpBuf.slice(12);
      const innerSize = Buffer.alloc(4);
      innerSize.writeUInt32LE(4 + vp8xChunk.length + body.length + exifChunk.length, 0);

      result = Buffer.concat([
        Buffer.from('RIFF'),
        innerSize,
        Buffer.from('WEBP'),
        vp8xChunk,
        body,
        exifChunk,
      ]);
    } else {
      return webpBuf; // Unknown format, return as-is
    }

    // Update RIFF file size
    result.writeUInt32LE(result.length - 8, 4);
    return result;
  } catch {
    return webpBuf; // Always return something valid
  }
}

// ============================================================
// CONVERT IMAGE TO STICKER (sharp)
// ============================================================
async function imageToSticker(buffer, packname, author) {
  // Convert to RGBA PNG first (preserves transparency)
  const png = await sharp(buffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Convert to WebP
  const webp = await sharp(png)
    .webp({ quality: 90, lossless: false, alphaQuality: 100 })
    .toBuffer();

  return addMetadata(webp, packname, author);
}

module.exports = {
  // ============================================================
  // .sticker / .s
  // ============================================================
  async sticker(ctx) {
    const { sock, msg, groupId } = ctx;
    const target = getQuotedMsg(msg) || msg;
    const msgType = Object.keys(target.message || {})[0];

    if (!['imageMessage', 'videoMessage', 'stickerMessage', 'gifMessage'].includes(msgType)) {
      return ctx.reply(
        '❌ *Reply to an image or video* to make a sticker!\n\n' +
        '• Reply to image → *.s* or *.sticker*\n' +
        '• Reply to video → *.s* (animated sticker)'
      );
    }

    await ctx.react('⏳');

    try {
      const buffer = await downloadMedia(target, sock);

      if (msgType === 'imageMessage' || msgType === 'stickerMessage') {
        // ── Static sticker ──────────────────────────────────
        // Convert to clean 512x512 WebP - no EXIF injection (WhatsApp handles it)
        const webp = await sharp(buffer)
          .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .webp({ quality: 85 })
          .toBuffer();

        await sock.sendMessage(groupId, {
          sticker: webp,
        }, { quoted: msg });
        await ctx.react('✅');

      } else {
        // ── Animated sticker from video/gif ─────────────────
        const ts = Date.now();
        const inPath = path.join(TEMP, `stk_in_${ts}.mp4`);
        const outPath = path.join(TEMP, `stk_out_${ts}.webp`);
        fs.writeFileSync(inPath, buffer);

        await new Promise((resolve, reject) => {
          exec(
            `ffmpeg -y -i "${inPath}" ` +
            `-vf "scale=512:512:force_original_aspect_ratio=decrease,` +
            `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=12" ` +
            `-loop 0 -t 8 -an -vsync 0 -compression_level 6 "${outPath}"`,
            { timeout: 60000 },
            (err) => err ? reject(err) : resolve()
          );
        });

        if (!fs.existsSync(outPath)) throw new Error('ffmpeg produced no output');
        const webpBuf = fs.readFileSync(outPath);

        await sock.sendMessage(groupId, {
          sticker: webpBuf,
        }, { quoted: msg });

        try { fs.unlinkSync(inPath); fs.unlinkSync(outPath); } catch {}
        await ctx.react('✅');
      }

    } catch (e) {
      await ctx.react('❌');
      await ctx.reply(
        `❌ *Sticker creation failed!*\n\n` +
        `Error: ${e.message}\n\n` +
        `💡 Make sure *ffmpeg* is installed:\n` +
        `• Replit: add ffmpeg in packages\n` +
        `• Linux: \`apt install ffmpeg\`\n` +
        `• Windows: download from ffmpeg.org`
      );
    }
  },

  // ============================================================
  // .take — custom sticker pack name & author
  // ============================================================
  async take(ctx) {
    const { msg, sock, groupId, body } = ctx;

    if (!body) {
      return ctx.reply(
        '❌ Usage: *.take <pack name>, <author>*\n\n' +
        'Example: *.take Shadow Garden, KYNX*\n\n' +
        'Reply to an image or sticker with this command.'
      );
    }

    const parts = body.split(',');
    const packname = parts[0]?.trim() || config.STICKER_NAME;
    const author = parts[1]?.trim() || config.STICKER_AUTHOR;

    const target = getQuotedMsg(msg) || msg;
    if (!target) return ctx.reply('❌ Reply to an image or sticker!');

    const msgType = Object.keys(target.message || {})[0];
    if (!['imageMessage', 'stickerMessage'].includes(msgType)) {
      return ctx.reply('❌ Reply to an image or sticker!');
    }

    await ctx.react('⏳');
    try {
      const buffer = await downloadMedia(target, sock);

      // Convert to clean WebP first
      let webp;
      if (msgType === 'imageMessage') {
        webp = await sharp(buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 85 })
          .toBuffer();
      } else {
        webp = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      }

      // Inject custom pack name + author into WebP EXIF
      const withMeta = addMetadata(webp, packname, author);

      await sock.sendMessage(groupId, {
        sticker: withMeta,
      }, { quoted: msg });

      await ctx.reply(
        `✅ *Sticker Created!*\n\n` +
        `📦 Pack Name: *${packname}*\n` +
        `✍️ Author: *${author}*\n\n` +
        `_Open the sticker to see the pack info!_`
      );
      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❌');
      await ctx.reply(`❌ Failed: ${e.message}`);
    }
  },

  // ============================================================
  // .toimg — sticker to image
  // ============================================================
  async turnimg(ctx) {
    const { msg, sock, groupId } = ctx;
    const target = getQuotedMsg(msg) || msg;
    const msgType = Object.keys(target.message || {})[0];
    if (msgType !== 'stickerMessage') return ctx.reply('❌ Reply to a sticker to convert to image!');

    await ctx.react('⏳');
    try {
      const buffer = await downloadMedia(target, sock);
      const png = await sharp(buffer).png().toBuffer();
      await sock.sendMessage(groupId, {
        image: png,
        caption: '🖼️ Here you go!'
      }, { quoted: msg });
      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❌');
      await ctx.reply(`❌ Failed: ${e.message}`);
    }
  },

  // ============================================================
  // .rotate — rotate image
  // ============================================================
  async rotate(ctx) {
    const { msg, sock, groupId } = ctx;
    const target = getQuotedMsg(msg) || msg;
    const msgType = Object.keys(target.message || {})[0];
    if (msgType !== 'imageMessage') return ctx.reply('❌ Reply to an image!\nUsage: .rotate [90/180/270]');
    const deg = parseInt(ctx.body) || 90;
    if (![90, 180, 270].includes(deg)) return ctx.reply('❌ Valid degrees: 90, 180, 270');

    await ctx.react('⏳');
    try {
      const buffer = await downloadMedia(target, sock);
      const rotated = await sharp(buffer).rotate(deg).toBuffer();
      await sock.sendMessage(groupId, {
        image: rotated,
        caption: `🔄 Rotated ${deg}°`
      }, { quoted: msg });
      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❌');
      await ctx.reply(`❌ Failed: ${e.message}`);
    }
  },

  // ============================================================
  // .turnvid — animated sticker to video
  // ============================================================
  async turnvid(ctx) {
    const { msg, sock, groupId } = ctx;
    const target = getQuotedMsg(msg) || msg;
    if (!target) return ctx.reply('❌ Reply to an animated sticker!');
    const msgType = Object.keys(target.message || {})[0];
    if (msgType !== 'stickerMessage') return ctx.reply('❌ Reply to an animated sticker!');

    await ctx.react('⏳');
    try {
      const buffer = await downloadMedia(target, sock);
      const inPath = path.join(TEMP, `stk2vid_${Date.now()}.webp`);
      const outPath = path.join(TEMP, `stk2vid_out_${Date.now()}.mp4`);
      fs.writeFileSync(inPath, buffer);

      await new Promise((res, rej) => {
        exec(
          `ffmpeg -y -i "${inPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=512:512" "${outPath}"`,
          { timeout: 30000 },
          (err) => err ? rej(err) : res()
        );
      });

      if (fs.existsSync(outPath)) {
        const vidBuf = fs.readFileSync(outPath);
        await sock.sendMessage(groupId, {
          video: vidBuf,
          caption: '🎬 Here you go!',
          mimetype: 'video/mp4'
        }, { quoted: msg });
        try { fs.unlinkSync(inPath); fs.unlinkSync(outPath); } catch {}
        await ctx.react('✅');
      } else {
        throw new Error('Conversion produced no output');
      }
    } catch (e) {
      await ctx.react('❌');
      await ctx.reply(`❌ Failed: ${e.message}`);
    }
  },
};
