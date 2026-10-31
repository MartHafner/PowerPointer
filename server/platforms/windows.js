'use strict';
const { execFile } = require('child_process');

// Get the running PowerPoint instance; return a valid "off" status if it is unavailable.
const PRELUDE =
  `$ErrorActionPreference='Stop';` +
  `try { $ppt=[Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application') } ` +
  `catch { Write-Output '{"state":"off","slide":0,"total":0,"blank":false}'; exit 0 };`;

function ps(body) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      // Skip the PowerShell profile and set a timeout so a stalled COM call cannot block the server.
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', PRELUDE + body],
      { timeout: 10000, windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(new Error((stderr || err.message).trim()));
        resolve(stdout.trim());
      }
    );
  });
}

// Use the first open slide show window for navigation commands.
const WIN = `$w=$ppt.SlideShowWindows.Item(1);`;

module.exports = {
  next: () => ps(`${WIN}$w.View.Next()`),
  prev: () => ps(`${WIN}$w.View.Previous()`),
  start: () => ps(`$ppt.ActivePresentation.SlideShowSettings.Run() | Out-Null`),
  stop: () => ps(`${WIN}$w.View.Exit()`),
  // ppSlideShowRunning = 1; ppSlideShowBlackScreen = 3.
  blank: () => ps(`${WIN}if($w.View.State -eq 3){$w.View.State=1}else{$w.View.State=3}`),
  async status() {
    const out = await ps(
      // There is no active slide when no presentation or slide show is open.
      `if($ppt.Presentations.Count -eq 0){Write-Output '{"state":"idle","slide":0,"total":0,"blank":false}';exit 0};` +
      `$total=$ppt.ActivePresentation.Slides.Count;` +
      `if($ppt.SlideShowWindows.Count -eq 0){` +
      `([pscustomobject]@{state='idle';slide=0;total=$total;blank=$false}|ConvertTo-Json -Compress);exit 0};` +
      `$v=$ppt.SlideShowWindows.Item(1).View;` +
      `([pscustomobject]@{state='running';slide=[int]$v.CurrentShowPosition;total=$total;blank=($v.State -eq 3)}|ConvertTo-Json -Compress)`
    );
    return JSON.parse(out);
  }
};
