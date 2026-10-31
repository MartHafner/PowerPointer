'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const { getLocalAddresses, isLocalClient } = require('./network');
const powerpoint = require('./powerpoint');

// Einstellungen laden (Umgebungsvariablen haben Vorrang)
const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'settings.json'), 'utf8')
);
const PORT = Number(process.env.PORT) || settings.port || 8787;
const HOST = settings.host || '0.0.0.0';           // 0.0.0.0 = im ganzen lokalen Netz erreichbar
const PIN = String(process.env.POWERPOINTER_PIN ?? settings.pin ?? '');  // leer = kein PIN
const POLL_MS = settings.pollIntervalMs || 1000;   // Abfrageintervall für den PowerPoint-Status
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Content-Types für die ausgelieferten Dateien
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
  // Nur Geräte aus privaten Netzen zulassen
  if (!isLocalClient(req.socket.remoteAddress)) {
    res.writeHead(403).end('Nur im lokalen Netzwerk erreichbar.');
    return;
  }
  // Nur lesende Anfragen erlaubt
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  let urlPath;
  try { urlPath = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { res.writeHead(400).end(); return; }
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, urlPath));
  // Schutz vor Pfad-Tricks wie ../
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

// Zeitkonstanter Vergleich, damit der PIN nicht über Laufzeiten erraten werden kann
function safeEqual(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Verbindungsaufbau: nur /ws, nur lokal, PIN prüfen
server.on('upgrade', (req, socket, head) => {
  if (!isLocalClient(socket.remoteAddress)) return socket.destroy();
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/ws') return socket.destroy();
  const authorized = !PIN || safeEqual(url.searchParams.get('pin') || '', PIN);
  wss.handleUpgrade(req, socket, head, (ws) => {
    if (!authorized) return ws.close(4001, 'PIN erforderlich');  // Client zeigt PIN-Dialog
    wss.emit('connection', ws);
  });
});

// Aktueller Zustand, der an alle Clients gesendet wird
let state = { connected: false, state: 'off', slide: 0, total: 0, blank: false, startedAt: null, error: null };
let polling = false;  // verhindert überlappende Abfragen

// Zustand an alle verbundenen Clients senden
function broadcast() {
  const msg = JSON.stringify({ type: 'state', data: state, serverTime: Date.now() });
  for (const ws of wss.clients) if (ws.readyState === 1) ws.send(msg);
}

// PowerPoint abfragen und bei Änderung senden
async function poll() {
  if (polling) return;
  polling = true;
  try {
    const s = await powerpoint.getStatus();
    const running = s.state === 'running';
    // Startzeit merken, der Client berechnet daraus den Timer
    const startedAt = running ? (state.startedAt || Date.now()) : null;
    const next = { connected: true, ...s, startedAt, error: null };
    // Änderung prüfen (startedAt nur als vorhanden/nicht vorhanden vergleichen)
    const changed = JSON.stringify({ ...next, startedAt: !!startedAt }) !==
                    JSON.stringify({ ...state, startedAt: !!state.startedAt });
    state = next;
    if (changed) broadcast();
  } catch (e) {
    // PowerPoint nicht erreichbar: Fehler nur einmal melden
    if (state.error !== e.message) {
      state = { ...state, connected: false, error: e.message };
      broadcast();
    }
  } finally {
    polling = false;
  }
}

wss.on('connection', (ws) => {
  // Neuer Client bekommt sofort den aktuellen Zustand
  ws.send(JSON.stringify({ type: 'state', data: state, serverTime: Date.now() }));
  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type !== 'command') return;
    try {
      await powerpoint.run(msg.command);  // nur Befehle aus der Whitelist
      await poll();                       // Zustand sofort aktualisieren
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
    }
  });
  ws.on('error', () => {});
});

// Regelmäßige Statusabfrage starten
setInterval(poll, POLL_MS);
poll();

// Server starten und erreichbare Adressen ausgeben
server.listen(PORT, HOST, () => {
  console.log(`\nPowerPointer läuft (Steuerung: ${powerpoint.platformName})`);
  console.log('Auf dem iPhone im Safari öffnen:');
  const addrs = getLocalAddresses();
  if (!addrs.length) console.log(`  http://localhost:${PORT}  (keine Netzwerkadresse gefunden)`);
  for (const a of addrs) console.log(`  http://${a.address}:${PORT}   (${a.name})`);
  console.log(PIN ? '\nVerbindungscode (PIN) ist aktiv.' : '\nHinweis: Kein PIN gesetzt (config/settings.json → "pin").');
});