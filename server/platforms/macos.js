'use strict';
const { execFile } = require('child_process');

const APP = 'Microsoft PowerPoint';
// Use AppleScript to address the first PowerPoint slide show window.
const VIEW = 'slide show view of slide show window 1';

function osa(script) {
  return new Promise((resolve, reject) => {
    // Set a timeout so an unresponsive PowerPoint process cannot block the server.
    execFile('osascript', ['-e', script], { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message).trim()));
      resolve(stdout.trim());
    });
  });
}

const tell = (body) => osa(`tell application "${APP}"\n${body}\nend tell`);

module.exports = {
  next: () => tell(`go to next slide (${VIEW})`),
  prev: () => tell(`go to previous slide (${VIEW})`),
  start: () => tell(`run slide show (slide show settings of active presentation)`),
  stop: () => tell(`exit slide show (${VIEW})`),
  blank: () => tell(
    // Toggle between a black screen and the running presentation.
    `set v to ${VIEW}\n` +
    `if state of v is slide show state black screen then\n` +
    `set state of v to slide show state running\nelse\n` +
    `set state of v to slide show state black screen\nend if`
  ),
  async status() {
    const out = await osa(
      // Return status fields as a compact pipe-delimited string.
      `if application "${APP}" is not running then return "off|0|0|0"\n` +
      `tell application "${APP}"\n` +
      `if (count of presentations) = 0 then return "idle|0|0|0"\n` +
      `set total to count of slides of active presentation\n` +
      `if (count of slide show windows) = 0 then return "idle|0|" & total & "|0"\n` +
      `set v to ${VIEW}\n` +
      `set idx to slide index of slide of v\n` +
      `set blk to 0\n` +
      `if state of v is slide show state black screen then set blk to 1\n` +
      `return "running|" & idx & "|" & total & "|" & blk\n` +
      `end tell`
    );
    // Convert the text response into the shared status structure used by the server.
    const [state, idx, total, blk] = out.split('|');
    return { state, slide: +idx, total: +total, blank: blk === '1' };
  }
};
