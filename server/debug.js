'use strict';
// Debug module: only active with DEBUG=1 (or DEBUG=true).
const DEBUG = !!process.env.DEBUG && !['0', 'false'].includes(process.env.DEBUG.toLowerCase());

const pad = (n, len = 2) => String(n).padStart(len, '0');

// Timestamp: date + time incl. seconds and milliseconds, local time (YYYY-MM-DD HH:MM:SS.mmm).
const timestamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

const log = (...a) => console.log(timestamp(), ...a);
const dbg = (...a) => { if (DEBUG) log('[debug]', ...a); };

// The PIN is part of the WebSocket URL and must not end up in the log.
const maskPin = (url = '') => url.replace(/([?&]pin=)[^&]*/i, '$1***');

function initDebug({ server, wss, isLocalClient }) {
  if (!DEBUG) return;

  const tag = (ip) => `${ip} (${isLocalClient(ip) ? 'local' : 'REJECTED'})`;
  let connId = 0;

  log('[debug] Debug mode active');

  // ---- Process ----
  process.on('warning', (w) => log('[PROC] Warning:', w.stack || w));

  // ---- Server lifecycle ----
  server.on('listening', () => log('[SERVER] Listening on', JSON.stringify(server.address())));
  server.on('close', () => log('[SERVER] Closed'));
  server.on('error', (e) => log('[SERVER] Error:', e.code || '', e.message));
  server.on('clientError', (e, socket) =>
    log(`[SERVER] Client error from ${socket.remoteAddress}:`, e.code || '', e.message));

  // ---- TCP ----
  server.on('connection', (s) => {
    const id = ++connId;
    const peer = `${s.remoteAddress}:${s.remotePort}`;
    log(`[TCP #${id}] Connection from ${peer} -> ${s.localAddress}:${s.localPort}`);
    s.on('error', (e) => log(`[TCP #${id}] Error:`, e.message));
    s.on('close', () => log(`[TCP #${id}] Closed: ${peer}`));
  });

  // ---- HTTP ----
  server.on('request', (req, res) => {
    const start = Date.now();
    log(`[HTTP] ${req.method} ${maskPin(req.url)} from ${tag(req.socket.remoteAddress)}`);
    res.on('finish', () =>
      log(`[HTTP] ${req.method} ${maskPin(req.url)} -> ${res.statusCode} (${Date.now() - start} ms)`));
  });

  // ---- WebSocket upgrade ----
  server.on('upgrade', (req, socket) => {
    log(`[WS] Upgrade ${maskPin(req.url)} from ${tag(socket.remoteAddress)}`);
  });

  // ---- WebSocket connections ----
  wss.on('connection', (ws) => {
    const ip = ws._socket ? ws._socket.remoteAddress : '?';
    log(`[WS] Client connected: ${ip} (active: ${wss.clients.size})`);
    ws.on('message', (raw) => log(`[WS] Message from ${ip}:`, raw.toString()));
    ws.on('close', (code, reason) =>
      log(`[WS] Client disconnected: ${ip} (code ${code} ${reason}) (active: ${wss.clients.size})`));
    ws.on('error', (e) => log(`[WS] Error for ${ip}:`, e.message));
  });
}

module.exports = { DEBUG, log, dbg, initDebug };