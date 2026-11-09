'use strict';
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
  els.host.textContent = location.hostname;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws?pin=${encodeURIComponent(pin)}`);
    ws.onopen = () => { retry = 0; setConn('ok', 'Connected'); };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'state') {
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
        setConn('bad', 'PIN required');
        pin = '';
        if (e.code === 4029) {
          setConn('bad', 'Locked');
          toast('Too many wrong PINs. Please wait a minute and try again.');
        } else {
          setConn('bad', 'PIN required');
        }
        els.pinDialog.hidden = false;
        els.pinInput.focus();
        return;
      }
      setConn('bad', 'Disconnected');
      // Retry transient connection failures with an increasing delay.
      setTimeout(connect, Math.min(5000, 500 * 2 ** retry++));
    };
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
    const running = state.state === 'running';
    els.slide.textContent = running ? state.slide : '–';
    els.total.textContent = state.total || '–';
    els.start.disabled = running;
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

  els.pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    pin = els.pinInput.value.trim();
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
