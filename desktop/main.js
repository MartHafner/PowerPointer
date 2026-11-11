'use strict';
// Electron shell for the PowerPointer server: starts the existing server in-process
// and shows a server-side panel (status, addresses, QR code, PIN).
const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron');
const path = require('path');
const QRCode = require('qrcode');

let srv = null;   // exports of server/server.js
let panel = null;
let pushTimer = null;

function startServer() {
  srv = require('../server/server');
  // listen() errors arrive asynchronously, so this handler is attached in time.
  srv.server.on('error', (e) => {
    dialog.showErrorBox(
      'PowerPointer',
      e.code === 'EADDRINUSE'
        ? `Port ${srv.port} is already in use. Is PowerPointer already running?`
        : e.message
    );
    app.quit();
  });
}

function addresses() {
  const { getLocalAddresses } = require('../server/network');
  const list = getLocalAddresses().map((a) => ({ name: a.name, url: `http://${a.address}:${srv.port}` }));
  return list.length ? list : [{ name: 'localhost', url: `http://localhost:${srv.port}` }];
}

function createPanel() {
  panel = new BrowserWindow({
    width: 480, height: 640, minWidth: 420, minHeight: 560,
    title: 'PowerPointer', backgroundColor: '#0b0c12',
    webPreferences: {
      preload: path.join(__dirname, 'preload-panel.js'),
      contextIsolation: true, sandbox: true, nodeIntegration: false
    }
  });
  panel.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  panel.webContents.on('will-navigate', (e) => e.preventDefault());
  panel.loadFile(path.join(__dirname, 'panel.html'));
  panel.on('closed', () => { panel = null; });
}

const fromPanel = (e) => panel && e.sender === panel.webContents;
const currentStatus = () => ({ ...srv.getState(), clients: srv.wss.clients.size });

function registerIpc() {
  ipcMain.handle('info', (e) => {
    if (!fromPanel(e)) return null;
    return {
      port: srv.port,
      pin: srv.pin,
      pinAuto: srv.configuredPin === 'auto',
      addresses: addresses(),
      platform: require('../server/powerpoint').platformName
    };
  });
  ipcMain.handle('status', (e) => (fromPanel(e) ? currentStatus() : null));
  ipcMain.handle('qr', (e, url) => {
    if (!fromPanel(e) || !addresses().some((a) => a.url === url)) return '';
    return QRCode.toDataURL(url, { margin: 1, width: 240 });
  });
  ipcMain.handle('copy', (e, text) => { if (fromPanel(e)) clipboard.writeText(String(text).slice(0, 200)); });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!panel) return createPanel();
    if (panel.isMinimized()) panel.restore();
    panel.focus();
  });
  app.whenReady().then(() => {
    startServer();
    registerIpc();
    createPanel();
    pushTimer = setInterval(() => {
      if (panel && !panel.isDestroyed()) panel.webContents.send('status', currentStatus());
    }, 1000);
  });
  // macOS: closing the window keeps the server running; Cmd+Q stops it.
  app.on('activate', () => { if (app.isReady() && !panel) createPanel(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => clearInterval(pushTimer));
}