'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const STATUS = { running: 'Presentation running', idle: 'Ready – no presentation active', off: 'PowerPoint is not open' };
  let info = null, selected = 0;

  function statusText(s) {
    if (!s) return '…';
    if (s.connected) return s.state === 'running' && s.blank ? 'Screen hidden' : STATUS[s.state] || s.state;
    return s.error ? 'Error: ' + s.error.slice(0, 80) : 'PowerPoint not reachable';
  }

  function renderStatus(s) {
    $('statusText').textContent = statusText(s);
    $('dot').className = 'dot ' + (s && s.connected ? 'ok' : 'bad');
    $('slide').textContent = s && s.state === 'running' ? `${s.slide} / ${s.total}` : '–';
    $('clients').textContent = s ? s.clients : 0;
  }

  async function renderAddresses() {
    const box = $('addrs');
    box.textContent = '';
    info.addresses.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'addr' + (i === selected ? ' sel' : '');
      const url = document.createElement('span'); url.className = 'url'; url.textContent = a.url;
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = a.name;
      const cp = document.createElement('button'); cp.textContent = 'Copy';
      cp.onclick = (e) => { e.stopPropagation(); window.pp.copy(a.url); cp.textContent = 'Copied'; setTimeout(() => (cp.textContent = 'Copy'), 1200); };
      row.onclick = () => { selected = i; renderAddresses(); };
      row.append(url, nm, cp);
      box.appendChild(row);
    });
    $('qr').src = await window.pp.qr(info.addresses[selected].url);
  }

  async function init() {
    info = await window.pp.info();
    $('platform').textContent = info.platform;
    $('pin').textContent = info.pin || 'off';
    $('pinNote').textContent = !info.pin ? 'PIN protection is disabled (config/settings.json).'
      : info.pinAuto ? 'New code on every start.' : 'Fixed code from configuration.';
    await renderAddresses();
    renderStatus(await window.pp.status());
    window.pp.onStatus(renderStatus);
  }

  init();
})();