'use strict';
// Electron shell for the PowerPointer server: starts the existing server in-process
// and shows a server-side panel (status, addresses, QR code, PIN).
const { app, BrowserWindow, ipcMain, clipboard, dialog, Menu, screen } = require('electron');
const path = require('path');
const QRCode = require('qrcode');
const { initAutoUpdate } = require('./updater'); // updater only for Windows
const { checkForUpdateNotice } = require('./update-notice'); // update notice only for macOS
let srv = null;   // exports of server/server.js
let panel = null;
let splash = null;
let pushTimer = null;
let startupStarted = false;

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
    width: 480, height: 640, minWidth: 420, minHeight: 300,
    useContentSize: true,
    show: false,
    title: 'PowerPointer', backgroundColor: '#0b0c12',
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-panel.js'),
      contextIsolation: true, sandbox: true, nodeIntegration: false
    }
  });
  panel.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  panel.webContents.on('will-navigate', (e) => e.preventDefault());
  panel.loadFile(path.join(__dirname, 'panel.html')).catch((error) => {
    dialog.showErrorBox('PowerPointer', `Unable to load the dashboard: ${error.message}`);
    app.quit();
  });
  panel.on('closed', () => { panel = null; });
}

function startApplication() {
  if (startupStarted) return;
  startupStarted = true;

  startServer();
  registerIpc();
  createPanel();
  initAutoUpdate();
  checkForUpdateNotice();
  pushTimer = setInterval(() => {
    if (panel && !panel.isDestroyed()) panel.webContents.send('status', currentStatus());
  }, 1000);
}

function createSplash() {
  splash = new BrowserWindow({
    width: 380, height: 190,
    frame: false, resizable: false, center: true, show: false,
    backgroundColor: '#0b0c12',
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  splash.on('closed', () => { splash = null; });
  splash.once('ready-to-show', () => {
    splash.show();
    setImmediate(startApplication);
  });
  splash.loadFile(path.join(__dirname, 'splash.html')).catch((error) => {
    console.error('[startup] Unable to load splash screen:', error);
    if (splash && !splash.isDestroyed()) splash.close();
    startApplication();
  });
}

const fromPanel = (e) => panel && e.sender === panel.webContents;
const currentStatus = () => ({ ...srv.getState(), clients: srv.wss.clients.size });

function registerIpc() {
  ipcMain.on('panel-ready', (e) => {
    if (!fromPanel(e)) return;
    if (splash && !splash.isDestroyed()) splash.close();
    if (panel && !panel.isDestroyed()) panel.show();
  });
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
  ipcMain.handle('fit', (e, height) => {
    if (!fromPanel(e) || !panel || !Number.isFinite(height)) return;
    // Never grow beyond the usable screen area.
    const max = screen.getDisplayMatching(panel.getBounds()).workArea.height;
    const [w] = panel.getContentSize();
    panel.setContentSize(w, Math.min(Math.ceil(height), max));
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
    if (!panel) {
      if (splash && !splash.isDestroyed()) {
        if (splash.isMinimized()) splash.restore();
        splash.focus();
        return;
      }
      return createPanel();
    }
    if (panel.isMinimized()) panel.restore();
    panel.focus();
  });
  app.whenReady().then(() => {

    // Windows/Linux: remove the default File/Edit/View/Window menu bar.
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);

    createSplash();
  });
  // macOS: closing the window keeps the server running; Cmd+Q stops it.
  app.on('activate', () => { if (app.isReady() && !panel) createPanel(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => clearInterval(pushTimer));
}