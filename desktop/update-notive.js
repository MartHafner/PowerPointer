'use strict';
const { app, dialog, shell } = require('electron');

const REPO = 'MartHafner/PowerPointer';
const REPO_URL = `https://github.com/${REPO}`;

const parse = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

function isNewer(remote, local) {
  const a = parse(remote), b = parse(local);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

// macOS only: tell the user that a newer release exists and offer the link.
async function checkForUpdateNotice() {
  if (process.platform !== 'darwin') return;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { 'User-Agent': 'PowerPointer', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) return;
    const rel = await r.json();
    if (!rel.tag_name || !isNewer(rel.tag_name, app.getVersion())) return;

    // Open only links that point into this repository.
    const url = String(rel.html_url || '').startsWith(`${REPO_URL}/`) ? rel.html_url : REPO_URL;

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'PowerPointer',
      message: `Update available: ${rel.tag_name}`,
      detail: `You are using version ${app.getVersion()}.\n\n${url}`,
      buttons: ['Open download page', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    if (response === 0) shell.openExternal(url);
  } catch {
    // No network or GitHub unreachable: stay silent.
  }
}

module.exports = { checkForUpdateNotice };