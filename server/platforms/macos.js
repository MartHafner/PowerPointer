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

const tell = (body) => osa(
  `if application "${APP}" is not running then error "PowerPoint is not open"\n` +
  `tell application "${APP}"\n${body}\nend tell`
);

module.exports = {
  next: () => tell(`go to next slide (${VIEW})`),
  prev: () => tell(`go to previous slide (${VIEW})`),
  start: () => tell(`run slide show (slide show settings of active presentation)`),
  stop: () => tell(`exit slide show (${VIEW})`),
  blank: () => tell(
    // Toggle between a black screen and the running presentation.
    `set v to ${VIEW}\n` +
    `if slide state of v is slide show state black screen then\n` +
    `set slide state of v to slide show state running\nelse\n` +
    `set slide state of v to slide show state black screen\nend if`
  ),
  async snapshot(previousSlide) {
    const previous = Number.isInteger(previousSlide) ? previousSlide : -1;
    const out = await osa(
      // Return status and changed-slide notes in one PowerPoint request.
      `if application "${APP}" is not running then return "off|0|0|0|1|"\n` +
      `tell application "${APP}"\n` +
      `if (count of presentations) = 0 then return "idle|0|0|0|1|"\n` +
      `set total to count of slides of active presentation\n` +
      `if (count of slide show windows) = 0 then return "idle|0|" & total & "|0|1|"\n` +
      `set v to ${VIEW}\n` +
      `set idx to slide index of slide of v\n` +
      `set blk to 0\n` +
      `if slide state of v is slide show state black screen then set blk to 1\n` +
      `set notesChanged to 0\n` +
      `set noteText to ""\n` +
      `if idx is not ${previous} then\n` +
      `set notesChanged to 1\n` +
      `try\n` +
      `set s to slide of v\n` +
      `repeat with sh in (get shapes of notes page of s)\n` +
      `try\n` +
      `if placeholder type of place holder format of sh is placeholder type body placeholder then\n` +
      `set noteText to content of text range of text frame of sh\n` +
      `exit repeat\n` +
      `end if\n` +
      `on error\n` +
      `set noteText to ""\n` +
      `end try\n` +
      `end repeat\n` +
      `on error\n` +
      `set noteText to ""\n` +
      `end try\n` +
      `end if\n` +
      `return "running|" & idx & "|" & total & "|" & blk & "|" & notesChanged & "|" & noteText\n` +
      `end tell`
    );
    const [state, idx, total, blk, notesChanged, ...notes] = out.split('|');
    const snapshot = {
      state,
      slide: +idx,
      total: +total,
      blank: blk === '1',
      notes: notesChanged === '1' ? notes.join('|').replace(/\r\n?|\u000b/g, '\n') : null
    };
    return snapshot;
  }
};