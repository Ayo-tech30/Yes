const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { messageHandler, handleGroupUpdate } = require('./src/handlers/messageHandler');

// Folders
const SESSION_FOLDER = path.join(__dirname, 'sessions');
const TEMP_FOLDER = path.join(__dirname, 'temp');
const ASSETS_FOLDER = path.join(__dirname, 'assets');
[SESSION_FOLDER, TEMP_FOLDER, ASSETS_FOLDER].forEach(f => {
  if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
});

// Completely silent logger - no spam ever
const logger = pino({ level: 'silent' });

// In-memory store for message caching
const store = makeInMemoryStore({ logger });

let sock = null;
let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let isStarting = false; // Prevent duplicate startBot calls

// ============================================================
// START BOT
// ============================================================
async function startBot() {
  if (isStarting) return;
  isStarting = true;

  try {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    // ── Create socket ─────────────────────────────────────────
    sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      // Chrome browser — most compatible
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      // Replit-specific: keepalive settings
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 3000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg?.message || undefined;
        }
        return { conversation: '' };
      },
    });

    store?.bind(sock.ev);

    // ── Connection events ─────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'close') {
        isConnected = false;
        isStarting = false;
        const err = new Boom(lastDisconnect?.error);
        const statusCode = err?.output?.statusCode;

        // Logged out — need fresh pairing
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('\n🔴 Logged out! Clearing session...');
          // Clear session so re-pairing works
          try {
            const files = fs.readdirSync(SESSION_FOLDER);
            for (const file of files) {
              fs.unlinkSync(path.join(SESSION_FOLDER, file));
            }
          } catch {}
          console.log('🔄 Session cleared. Restarting for fresh pairing...\n');
          reconnectTimer = setTimeout(startBot, 3000);
          return;
        }

        // Connection replaced (new device linked)
        if (statusCode === DisconnectReason.connectionReplaced) {
          console.log('\n⚠️ Connection replaced by another device.\n');
          reconnectTimer = setTimeout(startBot, 5000);
          return;
        }

        // All other disconnects — reconnect automatically
        reconnectAttempts++;
        const delay = Math.min(3000 * reconnectAttempts, 20000);
        console.log(`🔄 Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts})`);
        reconnectTimer = setTimeout(() => {
          isStarting = false;
          startBot();
        }, delay);

      } else if (connection === 'open') {
        isConnected = true;
        isStarting = false;
        reconnectAttempts = 0;

        // ── Bot number is automatically the paired WhatsApp number ──
        // No need to configure it — sock.user.id IS the bot number
        const rawId = sock.user?.id || '';
        const botNum = rawId.split(':')[0] || rawId.split('@')[0];
        console.log('\n✅ ════════════════════════════════════');
        console.log('   🌸 Shadow Garden Bot is ONLINE!');
        console.log(`   📱 Bot number: ${botNum}`);
        console.log('════════════════════════════════════\n');

      } else if (connection === 'connecting') {
        console.log('🔄 Connecting to WhatsApp...');
      }
    });

    // ── Pairing code — only when session doesn't exist ────────
    if (!state.creds.registered) {
      await new Promise(resolve => setTimeout(resolve, 2500));

      console.log('\n┌────────────────────────────────┐');
      console.log('│   🌸 SHADOW GARDEN BOT SETUP   │');
      console.log('└────────────────────────────────┘\n');
      console.log('Enter your WhatsApp number (with country code, no + sign)');
      console.log('Example: 2348012345678\n');

      const phoneNumber = await new Promise(resolve => {
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('📱 Number: ', (num) => {
          rl.close();
          resolve(num.trim().replace(/[^0-9]/g, ''));
        });
      });

      if (!phoneNumber || phoneNumber.length < 7) {
        console.log('❌ Invalid number! Restart and try again.');
        process.exit(1);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const code = await sock.requestPairingCode(phoneNumber);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log('\n┌────────────────────────────────┐');
        console.log(`│   🔑 PAIRING CODE: ${formatted.padEnd(11)}│`);
        console.log('└────────────────────────────────┘\n');
        console.log('Steps:');
        console.log('  1. Open WhatsApp on your phone');
        console.log('  2. Settings → Linked Devices → Link a Device');
        console.log('  3. Tap "Link with phone number instead"');
        console.log(`  4. Enter: ${formatted}`);
        console.log('\n⏳ Waiting for pairing...\n');
      } catch (e) {
        console.log('❌ Pairing code error:', e.message);
        console.log('💡 Restart and try again.\n');
        isStarting = false;
      }
    }

    // ── Save credentials whenever they update ─────────────────
    sock.ev.on('creds.update', saveCreds);

    // ── Message handler ───────────────────────────────────────
    // KEY FIX FOR REPLIT: Re-register handler every reconnect
    // and handle messages even after connection drops/restores
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      // Process both 'notify' and 'append' for reliability
      if (type !== 'notify' && type !== 'append') return;

      for (const msg of messages) {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue; // Skip bot's own messages
        if (!isConnected) continue;   // Don't process if not connected

        try {
          await messageHandler(sock, msg);
        } catch (e) {
          // Silent - never crash on message errors
        }
      }
    });

    // ── Group events ──────────────────────────────────────────
    sock.ev.on('group-participants.update', async (update) => {
      try { await handleGroupUpdate(sock, update); } catch {}
    });

  } catch (err) {
    console.error('⚠️ Start error:', err.message);
    isStarting = false;
    reconnectTimer = setTimeout(startBot, 5000);
  }
}

// ============================================================
// BOOT
// ============================================================
console.log('\n🌸 Starting Shadow Garden Bot...\n');
startBot();

// ============================================================
// ERROR HANDLERS — Never crash, always recover
// ============================================================
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  // Don't exit — let the bot keep running
});

process.on('unhandledRejection', (reason) => {
  // Silent — prevents crashes from promise rejections
});

// Replit keepalive — prevent idle shutdown
setInterval(() => {
  if (!isConnected && !isStarting && !reconnectTimer) {
    console.log('🔄 Keepalive: restarting bot...');
    startBot();
  }
}, 1000 * 60 * 5); // Check every 5 minutes
