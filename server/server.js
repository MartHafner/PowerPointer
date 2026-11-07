#!/usr/bin/env node
'use strict';

const { log, dbg, initDebug } = require('./debug');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const limiter = require('./ratelimit');

const { getLocalAddresses, isLocalClient } = require('./network');
const powerpoint = require('./powerpoint');

// Terminal QR code (optional; the server still works if the package is unavailable).
let qrcode = null;
try { qrcode = require('qrcode-terminal'); } catch {}

const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'settings.json'), 'utf8')
);
const PORT = Number(process.env.PORT) || settings.port || 8787;
const HOST = settings.host || '0.0.0.0';
const { generatePin } = require('./pin');

// "auto" in settings.json (or POWERPOINTER_PIN=auto) generates a new PIN on every startup.
const configuredPin = String(process.env.POWERPOINTER_PIN ?? settings.pin ?? '');
const PIN = configuredPin === 'auto' ? generatePin(4) : configuredPin;
const POLL_MS = settings.pollIntervalMs || 1000; // Polling interval for PowerPoint status and notes if Settings.json have no args.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8'
};

// ---------- HTTP: static web interface ----------
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

// ---------- WebSocket: commands and status ----------
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
initDebug({ server, wss, isLocalClient });

function safeEqual(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  // Check lengths first because timingSafeEqual requires buffers of equal length.
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

server.on('upgrade', (req, socket, head) => {
  const ip = socket.remoteAddress;
  if (!isLocalClient(ip)) return socket.destroy();
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/ws') return socket.destroy();

  const supplied = url.searchParams.get('pin') || '';
  const authorized = !PIN || safeEqual(supplied, PIN);
  // During a lockout, even the correct PIN is rejected to prevent further guessing.
  const locked = limiter.retryAfterMs(ip) > 0;

  if (!locked && PIN) {
    // A connection attempt without a PIN (the initial page load) does not count as a failed attempt.
    if (authorized) limiter.registerSuccess(ip);
    else if (supplied) limiter.registerFailure(ip);
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    if (locked) return ws.close(4029, 'Zu viele Versuche');
    if (!authorized) return ws.close(4001, 'PIN erforderlich');
    wss.emit('connection', ws);
  });
});

let state = { connected: false, state: 'off', slide: 0, total: 0, blank: false, notes: '', startedAt: null, error: null };
let polling = false;

function broadcast() {
  const msg = JSON.stringify({ type: 'state', data: state, serverTime: Date.now() });
  for (const ws of wss.clients) if (ws.readyState === 1) ws.send(msg);
}

// Notes must never break the status poll.
async function loadNotes() {
  try { return await powerpoint.getNotes(); } catch { return ''; }
}

async function poll() {
  // Skip overlapping requests if PowerPoint responds more slowly than the polling interval.
  if (polling) return;
  polling = true;
  try {
    const s = await powerpoint.getStatus();
    const running = s.state === 'running';
    // Preserve the start time while the same presentation remains active.
    const startedAt = running ? (state.startedAt || Date.now()) : null;
    // Only query the notes when the slide changed or the show just started.
    let notes = '';
    if (running) {
      const slideChanged = s.slide !== state.slide || state.state !== 'running';
      notes = slideChanged ? await loadNotes() : state.notes;
    }
    const next = { connected: true, ...s, notes, startedAt, error: null };
    // Compare whether a start time exists; its millisecond value itself does not change.
    const changed = JSON.stringify({ ...next, startedAt: !!startedAt }) !==
                    JSON.stringify({ ...state, startedAt: !!state.startedAt });
    state = next;
    if (changed) broadcast();
  } catch (e) {
    if (state.error !== e.message) {
      state = { ...state, connected: false, error: e.message };
      broadcast();
      dbg('[POLL] Fehler:', e.message);
    }
  } finally {
    polling = false;
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', data: state, serverTime: Date.now() }));
  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type !== 'command') return;
    try {
      await powerpoint.run(msg.command);
      await poll();
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
    }
  });
  ws.on('error', () => {});
});

setInterval(poll, POLL_MS);
poll();

server.listen(PORT, HOST, () => {

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