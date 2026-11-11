'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pp', {
  info: () => ipcRenderer.invoke('info'),
  status: () => ipcRenderer.invoke('status'),
  qr: (url) => ipcRenderer.invoke('qr', url),
  copy: (text) => ipcRenderer.invoke('copy', text),
  onStatus: (cb) => ipcRenderer.on('status', (_e, s) => cb(s))
});