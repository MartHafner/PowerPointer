'use strict';
// Einheitliche Schnittstelle zur PowerPoint-Steuerung, unabhängig vom Betriebssystem.

// Simulierte Präsentation für Tests ohne PowerPoint
function createMock() {
  const m = { state: 'idle', slide: 1, total: 10, blank: false };
  return {
    // Die Demo hält dieselbe Statusform wie die Plattform-Implementierungen bereit.
    next: async () => { if (m.state === 'running') m.slide = Math.min(m.total, m.slide + 1); },
    prev: async () => { if (m.state === 'running') m.slide = Math.max(1, m.slide - 1); },
    start: async () => { m.state = 'running'; m.slide = 1; m.blank = false; },
    stop: async () => { m.state = 'idle'; m.blank = false; },
    blank: async () => { if (m.state === 'running') m.blank = !m.blank; },
    status: async () => ({ ...m })
  };
}

// Passendes Plattform-Modul wählen
function loadPlatform() {
  if (process.env.POWERPOINTER_MOCK) return { name: 'Demo-Modus', impl: createMock() };
  if (process.platform === 'darwin') return { name: 'macOS', impl: require('./platforms/macos') };
  if (process.platform === 'win32') return { name: 'Windows', impl: require('./platforms/windows') };
  // Auf anderen Systemen bleibt der Server mit der Simulation nutzbar.
  console.warn('Nicht unterstütztes Betriebssystem – starte im Demo-Modus.');
  return { name: 'Demo-Modus', impl: createMock() };
}

const { name: platformName, impl } = loadPlatform();

// Nur diese Befehle dürfen von Clients ausgelöst werden.
const COMMANDS = ['next', 'prev', 'start', 'stop', 'blank'];

async function run(command) {
  // Allowlist verhindert, dass beliebige Methoden der Plattform-Implementierung aufgerufen werden.
  if (!COMMANDS.includes(command)) throw new Error('Unbekannter Befehl');
  await impl[command]();
}

const getStatus = () => impl.status();

module.exports = { run, getStatus, platformName, COMMANDS };