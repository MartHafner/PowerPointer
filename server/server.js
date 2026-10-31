'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const { getLocalAddresses, isLocalClient } = require('./network');
const powerpoint = require('./powerpoint');

// QR-Code im Terminal (optional: ohne das Paket läuft der Server trotzdem)
let qrcode = null;
try { qrcode = require('qrcode-terminal'); } catch {}

const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'settings.json'), 'utf8')
);
const PORT = Number(process.env.PORT) || settings.port || 8787;
const HOST = settings.host || '0.0.0.0';
const PIN = String(process.env.POWERPOINTER_PIN ?? settings.pin ?? '');
const POLL_MS = settings.pollIntervalMs || 1000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8'
};

// ---------- HTTP: statische Weboberfläche ----------
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
  // Verhindert, dass Pfade wie „../…“ Dateien außerhalb der Weboberfläche erreichen.
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

// ---------- WebSocket: Befehle & Status ----------
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });

function safeEqual(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  // Erst gleiche Länge prüfen, damit timingSafeEqual sicher aufgerufen werden kann.
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

server.on('upgrade', (req, socket, head) => {
  if (!isLocalClient(socket.remoteAddress)) return socket.destroy();
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/ws') return socket.destroy();
  const authorized = !PIN || safeEqual(url.searchParams.get('pin') || '', PIN);
  wss.handleUpgrade(req, socket, head, (ws) => {
    // Die Verbindung wird erst nach dem WebSocket-Handshake mit Fehlercode abgewiesen.
    if (!authorized) return ws.close(4001, 'PIN erforderlich');
    wss.emit('connection', ws);
  });
});

let state = { connected: false, state: 'off', slide: 0, total: 0, blank: false, startedAt: null, error: null };
let polling = false;

function broadcast() {
  const msg = JSON.stringify({ type: 'state', data: state, serverTime: Date.now() });
  for (const ws of wss.clients) if (ws.readyState === 1) ws.send(msg);
}

async function poll() {
  // Überspringt überlappende Abfragen, falls PowerPoint langsamer als das Polling ist.
  if (polling) return;
  polling = true;
  try {
    const s = await powerpoint.getStatus();
    const running = s.state === 'running';
    // Startzeit während derselben laufenden Präsentation beibehalten.
    const startedAt = running ? (state.startedAt || Date.now()) : null;
    const next = { connected: true, ...s, startedAt, error: null };
    // Nur das Vorhandensein der Startzeit vergleichen; ihr Millisekundenwert ändert sich nicht.
    const changed = JSON.stringify({ ...next, startedAt: !!startedAt }) !==
                    JSON.stringify({ ...state, startedAt: !!state.startedAt });
    state = next;
    if (changed) broadcast();
  } catch (e) {
    if (state.error !== e.message) {
      state = { ...state, connected: false, error: e.message };
      broadcast();
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
  console.log(`\nPowerPointer läuft (Steuerung: ${powerpoint.platformName})`);
  console.log('Auf dem iPhone im Safari öffnen:');
  const addrs = getLocalAddresses();
  if (!addrs.length) console.log(`  http://localhost:${PORT}  (keine Netzwerkadresse gefunden)`);
  for (const a of addrs) console.log(`  http://${a.address}:${PORT}   (${a.name})`);
  // QR-Code für die erste (bevorzugt private) Adresse, zum Scannen mit der iPhone-Kamera
  if (qrcode && addrs.length) {
    console.log(`\nOder QR-Code mit der iPhone-Kamera scannen (${addrs[0].address}):\n`);
    qrcode.generate(`http://${addrs[0].address}:${PORT}`, { small: true });
  }
  console.log(PIN ? '\nVerbindungscode (PIN) ist aktiv.' : '\nHinweis: Kein PIN gesetzt (config/settings.json → "pin").');
});