'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// The marker is written only by the GitHub release workflow.
function isGithubRelease() {
  try {
    const f = path.join(__dirname, 'release.json');
    return JSON.parse(fs.readFileSync(f, 'utf8')).source === 'github-release';
  } catch { return false; }
}

// Auto-update only for the Windows app that was built and published by GitHub.
function initAutoUpdate() {
  if (process.platform !== 'win32' || !app.isPackaged || !isGithubRelease()) return;

  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', (e) => console.error('[update]', e.message));
  autoUpdater.checkForUpdates().catch(() => {});
}

module.exports = { initAutoUpdate };