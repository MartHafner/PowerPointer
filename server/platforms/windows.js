'use strict';
const { execFile } = require('child_process');

// Get the running PowerPoint instance; return a valid fallback output if it is unavailable.
const prelude = (offOutput) =>
  // Emit UTF-8 without BOM so that umlauts survive the trip to Node.js.
  `[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding $false;` +
  `$ErrorActionPreference='Stop';` +
  `try { $ppt=[Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application') } ` +
  `catch { Write-Output '${offOutput}'; exit 0 };`;

const OFF_STATUS = '{"state":"off","slide":0,"total":0,"blank":false,"notes":""}';

function ps(body, offOutput = OFF_STATUS) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      // Skip the PowerShell profile and set a timeout so a stalled COM call cannot block the server.
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', prelude(offOutput) + body],
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
  async snapshot(previousSlide) {
    const previous = Number.isInteger(previousSlide) ? previousSlide : -1;
    const out = await ps(
      // There is no active slide when no presentation or slide show is open.
      `if($ppt.Presentations.Count -eq 0){Write-Output '{"state":"idle","slide":0,"total":0,"blank":false,"notes":""}';exit 0};` +
      `$total=$ppt.ActivePresentation.Slides.Count;` +
      `if($ppt.SlideShowWindows.Count -eq 0){` +
      `([pscustomobject]@{state='idle';slide=0;total=$total;blank=$false;notes=''}|ConvertTo-Json -Compress);exit 0};` +
      `$v=$ppt.SlideShowWindows.Item(1).View;` +
      `$slide=[int]$v.CurrentShowPosition;$notes=$null;` +
      `if($slide -ne ${previous}){$notes='';try{foreach($sh in $v.Slide.NotesPage.Shapes){` +
      `if($sh.Type -eq 14 -and $sh.PlaceholderFormat.Type -eq 2 -and $sh.HasTextFrame){$notes=$sh.TextFrame.TextRange.Text}}}catch{$notes=''}};` +
      `([pscustomobject]@{state='running';slide=$slide;total=$total;blank=($v.State -eq 3);notes=$notes}|ConvertTo-Json -Compress)`
    );
    const snapshot = JSON.parse(out);
    // PowerPoint separates paragraphs with \r; normalize for the browser.
    if (typeof snapshot.notes === 'string') {
      snapshot.notes = snapshot.notes.replace(/\r\n?|\u000b/g, '\n');
    }
    return snapshot;
  }
};