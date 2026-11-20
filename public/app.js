'use strict';
//v2.1.1
(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    dot: $('dot'), connText: $('connText'), host: $('host'), slide: $('slide'), total: $('total'),
    timer: $('timer'), status: $('status'), start: $('start'), stop: $('stop'), blank: $('blank'),
    notes: $('notes'),
    pinDialog: $('pinDialog'), pinForm: $('pinForm'), pinInput: $('pinInput'), toast: $('toast')
  };

  let ws = null, state = null, clockOffset = 0, retry = 0, wakeLock = null;
  let pin = sessionStorage.getItem('pp-pin') || '';
  let retryTimer = null;
  els.host.textContent = location.hostname;

  function connect() {
    if (ws && ws.readyState <= 1) return;          // already connected/connecting
    clearTimeout(retryTimer);
    retryTimer = null;

    const usedPin = pin;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const sock = new WebSocket(`${proto}://${location.host}/ws?pin=${encodeURIComponent(usedPin)}`);
    ws = sock;
    setConn('warn', 'Connecting …');

    sock.onmessage = (e) => {
      if (sock !== ws) return;                     // ignore stale sockets
      const msg = JSON.parse(e.data);
      if (msg.type === 'state') {
        retry = 0;
        setConn('ok', 'Connected');                // only now, after successful auth
        if (usedPin) sessionStorage.setItem('pp-pin', usedPin);
        els.pinDialog.hidden = true;
        clockOffset = msg.serverTime - Date.now();
        state = msg.data;
        render();
      } else if (msg.type === 'error') {
        toast(msg.message);
      }
    };

    sock.onclose = (e) => {
      if (sock !== ws) return;
      if (e.code === 4001 || e.code === 4029) {
        sessionStorage.removeItem('pp-pin');
        pin = '';
        if (e.code === 4029) {
          setConn('bad', 'Locked');
          toast('Too many wrong PINs. Please wait a minute and try again.');
        } else {
          setConn('bad', 'PIN required');
          if (usedPin) toast('Wrong PIN');
        }
        showPinDialog();
        return;
      }
      setConn('bad', 'Disconnected');
      retryTimer = setTimeout(connect, Math.min(5000, 500 * 2 ** retry++));
    };
  }

  function showPinDialog() {
    els.pinInput.disabled = false;
    els.pinInput.value = '';
    els.pinDialog.hidden = false;
    els.pinInput.focus();
  }

  function setConn(cls, text) {
    els.dot.className = 'dot ' + cls;
    document.body.dataset.conn = cls;
    els.connText.textContent = text;
  }

  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const p = (n) => String(n).padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(sec)}`;
  }

  function render() {
    if (!state) return;
    const running = state.connected && state.state === 'running';
    els.slide.textContent = running ? state.slide : '–';
    els.total.textContent = state.total || '–';
    els.start.disabled = !(state.connected && state.state === 'idle');
    els.stop.disabled = !running;
    els.blank.disabled = !running;
    els.blank.classList.toggle('on', running && state.blank);
    els.blank.textContent = state.blank ? 'Show Screen' : 'Hide Screen';
    document.querySelectorAll('.nav .btn').forEach((b) => (b.disabled = !running));

    // textContent (not innerHTML): notes may contain arbitrary text.
    const note = running ? (state.notes || '').trim() : '';
    els.notes.textContent = note || (running ? 'No notes for this slide.' : '');
    els.notes.classList.toggle('empty', !note);
    els.notes.scrollTop = 0;

    let text = 'PowerPoint not reachable';
    if (state.connected) {
      text = { running: state.blank ? 'Screen hidden' : 'Presentation running',
               idle: 'Ready – no presentation active',
               off: 'PowerPoint is not open' }[state.state] || state.state;
    } else if (state.error) {
      text = 'Error: ' + state.error.slice(0, 60);
    }
    els.status.textContent = text;
    tick();
  }

  function tick() {
    if (state && state.startedAt) els.timer.textContent = fmt(Date.now() + clockOffset - state.startedAt);
    else els.timer.textContent = '00:00:00';
  }
  setInterval(tick, 500);

  function send(command) {
    if (!ws || ws.readyState !== 1) return toast('No connection to server');
    if (navigator.vibrate) navigator.vibrate(15);
    ws.send(JSON.stringify({ type: 'command', command }));
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (b && !b.disabled) send(b.dataset.cmd);
  });

  document.addEventListener('keydown', (e) => {
    const map = { ArrowRight: 'next', PageDown: 'next', ' ': 'next', ArrowLeft: 'prev', PageUp: 'prev', b: 'blank', '.': 'blank' };
    if (map[e.key] && els.pinDialog.hidden) { e.preventDefault(); send(map[e.key]); }
  });

  // Only digits, max. 4. As soon as the fourth digit is entered, connect automatically.
  els.pinInput.addEventListener('input', () => {
    const v = els.pinInput.value.replace(/\D/g, '').slice(0, 4);
    els.pinInput.value = v;
    if (v.length === 4) {
      pin = v;
      els.pinInput.disabled = true; // prevent double submit while connecting
      connect();
    }
  });
  els.pinForm.addEventListener('submit', (e) => e.preventDefault());

  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (els.toast.hidden = true), 3500);
  }

  async function keepAwake() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      keepAwake();
        if (els.pinDialog.hidden) connect();   // connect() guards against duplicates itself
    }
  });
  document.addEventListener('click', keepAwake, { once: true });

  connect();
})();