#!/usr/bin/env node
'use strict';

const { debugPollFailure, initDebug, DEBUG } = require('./debug');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const limiter = require('./ratelimit');

const { getLocalAddresses, isLocalClient } = require('./network');
const powerpoint = require('./powerpoint');

// The QR code package is optional; the server can run without terminal QR rendering.
let qrcode = null;
try { qrcode = require('qrcode-terminal'); } catch {}

// Load static server settings before initializing the HTTP and WebSocket transports.
const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'settings.json'), 'utf8')
);
const PORT = Number(process.env.PORT) || settings.port || 8787;
const HOST = settings.host || '0.0.0.0';
const { generatePin } = require('./pin');

// "auto" in settings.json or the POWERPOINTER_PIN environment variable generates a new PIN at startup.
const configuredPin = String(process.env.POWERPOINTER_PIN ?? settings.pin ?? '');
const PIN = configuredPin === 'auto' ? generatePin(4) : configuredPin;
if (PIN && !/^\d{4}$/.test(PIN)) { // The client UI expects a four-digit PIN.
  console.warn('Warning: the PIN must be exactly 4 digits, otherwise it cannot be entered on the phone.');
}
// Display terminal diagnostics in headless mode or when Electron debug mode is enabled.
const TERMINAL_UI = DEBUG || !process.versions.electron;
const configuredPollMs = Number(settings.pollIntervalMs);
const POLL_MS = Number.isFinite(configuredPollMs) && configuredPollMs > 0
  ? Math.max(250, configuredPollMs)
  : 1000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8'
};

// Serve the browser interface over HTTP and restrict file access to the public directory.
const server = http.createServer((req, res) => {
  if (!isLocalClient(req.socket.remoteAddress)) {
    res.writeHead(403).end('Nur im lokalen Netzwerk erreichbar.');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  let urlPath;
  try { urlPath = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { res.writeHead(400).end(); return; }
  if (urlPath.includes('\0')) { res.writeHead(400).end(); return; }
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, urlPath));
  // Prevent paths such as "../..." from accessing files outside the web interface.
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end('Nicht gefunden');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  });
});

// Accept WebSocket connections on an upgraded HTTP connection.
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
initDebug({ server, wss, isLocalClient });

// Compare credentials using a constant-time operation when both values have equal lengths.
function safeEqual(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Validate local-network access, origin, and PIN credentials before upgrading to WebSocket.
server.on('upgrade', (req, socket, head) => {
  socket.on('error', () => {});
  const ip = socket.remoteAddress;
  if (!isLocalClient(ip)) return socket.destroy();

  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return socket.destroy(); }
  if (url.pathname !== '/ws') return socket.destroy();

  // Block cross-site WebSocket hijacking: browsers always send Origin.
  const origin = req.headers.origin;
  if (origin) {
    let sameHost = false;
    try { sameHost = new URL(origin).host === req.headers.host; } catch {}
    if (!sameHost) return socket.destroy();
  }

  const supplied = url.searchParams.get('pin') || '';
  const authorized = !PIN || safeEqual(supplied, PIN);
  const locked = limiter.retryAfterMs(ip) > 0;

  if (!locked && PIN) {
    if (authorized) limiter.registerSuccess(ip);
    else if (supplied) limiter.registerFailure(ip);
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.on('error', () => {}); // Register an error handler before closing the upgraded socket.
    if (locked) return ws.close(4029, 'Zu viele Versuche');
    if (!authorized) return ws.close(4001, 'PIN erforderlich');
    wss.emit('connection', ws);
  });
});

let state = { connected: false, state: 'off', slide: 0, total: 0, blank: false, notes: '', startedAt: null, error: null };
let polling = false, failures = 0;

function broadcast() {
  const msg = JSON.stringify({ type: 'state', data: state, serverTime: Date.now() });
  for (const ws of wss.clients) if (ws.readyState === 1) ws.send(msg);
}

async function poll() {
  // Skip overlapping requests if PowerPoint responds more slowly than the polling interval.
  if (polling) return;
  polling = true;
  try {
    const s = await powerpoint.getSnapshot(state.state === 'running' ? state.slide : null);
    failures = 0;
    const running = s.state === 'running';
    // Preserve the start time while the same presentation remains active.
    const startedAt = running ? (state.startedAt || Date.now()) : null;
    const notes = running ? (s.notes ?? state.notes) : '';
    const next = { connected: true, ...s, notes, startedAt, error: null };
    // Compare whether a start time exists; its millisecond value itself does not change.
    const changed = JSON.stringify({ ...next, startedAt: !!startedAt }) !==
                    JSON.stringify({ ...state, startedAt: !!state.startedAt });
    state = next;
    if (changed) broadcast();
  } catch (e) {
    failures++;
    if (failures < 3) {
      debugPollFailure(failures, e);
      return;
    }
    if (state.error !== e.message || state.connected) {
      state = { ...state, connected: false, error: e.message };
      broadcast();
      debugPollFailure(failures, e);
    }
  } finally {
    polling = false;
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  poll(); // Immediately send the current state to the newly connected client.
  ws.send(JSON.stringify({ type: 'state', data: state, serverTime: Date.now() }));
  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object' || msg.type !== 'command') return;
    try {
      await powerpoint.run(msg.command);
      await poll();
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
    }
  });
  ws.on('error', () => {});
});

// Terminate WebSocket connections that do not respond to pings within 30 seconds.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 30000).unref();

// Poll less often when idle or no clients are connected, and back off after repeated errors.
const delay = () =>
  failures ? Math.min(5000, POLL_MS * 2 ** failures)
  : wss.clients.size === 0 ? 3000
  : state.state === 'running' ? POLL_MS
  : Math.max(POLL_MS, 1500);

async function loop() { await poll(); setTimeout(loop, delay()); }
loop().catch((e) => { console.error(e); process.exit(1); });

if (!process.versions.electron) {
  server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : e.message);
    process.exit(1);
  });
}

server.listen(PORT, HOST, () => {
  // Show the server info in the terminal only when run headless (node server/server.js) or with DEBUG.
  if (!TERMINAL_UI) return;
  console.log(`\nPowerPointer is working (Operating System: ${powerpoint.platformName})`);
  console.log('type following URL into your Phone browser:');
  const addrs = getLocalAddresses();
  if (!addrs.length) console.log(`  http://localhost:${PORT}  (no local network address found)`);
  for (const a of addrs) console.log(`  http://${a.address}:${PORT}   (${a.name})`);
  // Generate a QR code for the first (preferably private) address to scan with the iPhone camera.
  if (qrcode && addrs.length) {
    console.log(`\nor scan the QR code (${addrs[0].address}):\n`);
    qrcode.generate(`http://${addrs[0].address}:${PORT}`, { small: true });
  }
  console.log(
  !PIN ? '\nHinweis: Kein PIN gesetzt (config/settings.json → "pin").'
  : configuredPin === 'auto' ? `\nSession PIN: ${PIN} \n`
  : '\nVerbindungscode (PIN) ist aktiv.'
);
});
module.exports = { port: PORT, pin: PIN, configuredPin, server, wss, getState: () => state };