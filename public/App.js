'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    dot: $('dot'), connText: $('connText'), slide: $('slide'), total: $('total'),
    timer: $('timer'), status: $('status'), startStop: $('startStop'), blank: $('blank'),
    pinDialog: $('pinDialog'), pinForm: $('pinForm'), pinInput: $('pinInput'), toast: $('toast')
  };

  let ws = null, state = null, clockOffset = 0, retry = 0, wakeLock = null;
  let pin = sessionStorage.getItem('pp-pin') || '';

  function connect() {
    // Das Protokoll der Seite bestimmt, ob die Verbindung ebenfalls verschlüsselt ist.
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws?pin=${encodeURIComponent(pin)}`);
    ws.onopen = () => { retry = 0; setConn('ok', 'Verbunden'); };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'state') {
        // Serverzeit ausgleichen, damit die Laufzeitanzeige nicht von der Geräteuhr abhängt.
        clockOffset = msg.serverTime - Date.now();
        state = msg.data;
        render();
      } else if (msg.type === 'error') {
        toast(msg.message);
      }
    };
    ws.onclose = (e) => {
      if (e.code === 4001) {
        sessionStorage.removeItem('pp-pin');
        setConn('bad', 'PIN erforderlich');
        els.pinDialog.hidden = false;
        els.pinInput.focus();
        return;
      }
      setConn('bad', 'Getrennt');
      // Bei vorübergehenden Verbindungsfehlern mit wachsendem Abstand erneut verbinden.
      setTimeout(connect, Math.min(5000, 500 * 2 ** retry++));
    };
  }

  function setConn(cls, text) {
    els.dot.className = 'dot ' + cls;
    els.connText.textContent = text;
  }

  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const p = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
  }

  function render() {
    if (!state) return;
    const running = state.state === 'running';
    // Bedienelemente und Folienanzeige an den aktuellen Präsentationsstatus anpassen.
    els.slide.textContent = running ? state.slide : '–';
    els.total.textContent = state.total || '–';
    els.startStop.textContent = running ? 'Beenden' : 'Starten';
    els.startStop.dataset.cmd = running ? 'stop' : 'start';
    els.startStop.classList.toggle('stop', running);
    els.blank.disabled = !running;
    els.blank.classList.toggle('on', running && state.blank);
    els.blank.textContent = state.blank ? 'Bildschirm einblenden' : 'Bildschirm ausblenden';
    document.querySelectorAll('.nav .btn').forEach((b) => (b.disabled = !running));

    let text = 'PowerPoint nicht erreichbar';
    if (state.connected) {
      text = { running: state.blank ? 'Bildschirm ausgeblendet' : 'Präsentation läuft',
               idle: 'Bereit – keine Präsentation aktiv',
               off: 'PowerPoint ist nicht geöffnet' }[state.state] || state.state;
    } else if (state.error) {
      text = 'Fehler: ' + state.error.slice(0, 80);
    }
    els.status.textContent = text;
    tick();
  }

  function tick() {
    // Die Laufzeit lokal aktualisieren, ohne für jede Sekunde einen Serverstatus zu benötigen.
    if (state && state.startedAt) els.timer.textContent = fmt(Date.now() + clockOffset - state.startedAt);
    else els.timer.textContent = '00:00';
  }
  setInterval(tick, 500);

  function send(command) {
    if (!ws || ws.readyState !== 1) return toast('Keine Verbindung zum Server');
    if (navigator.vibrate) navigator.vibrate(15);
    // Alle Aktionen verwenden dasselbe Nachrichtenformat über den WebSocket.
    ws.send(JSON.stringify({ type: 'command', command }));
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (b && !b.disabled) send(b.dataset.cmd);
  });

  // Tastatur / Bluetooth-Klicker
  document.addEventListener('keydown', (e) => {
    const map = { ArrowRight: 'next', PageDown: 'next', ' ': 'next', ArrowLeft: 'prev', PageUp: 'prev', b: 'blank', '.': 'blank' };
    if (map[e.key] && els.pinDialog.hidden) { e.preventDefault(); send(map[e.key]); }
  });

  els.pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    pin = els.pinInput.value.trim();
    // sessionStorage behält die PIN nur bis zum Schließen des Browser-Tabs.
    sessionStorage.setItem('pp-pin', pin);
    els.pinInput.value = '';
    els.pinDialog.hidden = true;
    connect();
  });

  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (els.toast.hidden = true), 3500);
  }

  // Display wach halten, solange die Fernbedienung offen ist.
  async function keepAwake() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      keepAwake();
      if (!ws || ws.readyState > 1) connect();
    }
  });
  document.addEventListener('click', keepAwake, { once: true });

  connect();
})();