'use strict';
const os = require('os');

// Liefert alle lokalen IPv4-Adressen (ohne Loopback), private Netze zuerst.
function getLocalAddresses() {
  const result = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    // Ein Interface kann keine Adresse liefern, etwa wenn es nicht verbunden ist.
    for (const info of list || []) {
      if (info.family === 'IPv4' && !info.internal) {
        result.push({ name, address: info.address });
      }
    }
  }
  // RFC-1918-Adressen werden in der Anzeige vor anderen nicht-internen IPv4-Adressen sortiert.
  const isPrivate = (a) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a);
  return result.sort((a, b) => Number(isPrivate(b.address)) - Number(isPrivate(a.address)));
}

// Nur Anfragen aus privaten/lokalen Netzen zulassen.
function isLocalClient(remote) {
  if (!remote) return false;
  // Node.js kann IPv4-Verbindungen als IPv4-mapped IPv6-Adresse melden.
  const a = remote.replace(/^::ffff:/, '');
  return (
    a === '::1' || a === '127.0.0.1' ||
    // Erlaubt private IPv4-Netze sowie Link-Local-Adressen.
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(a) ||
    // fc00::/7 sind lokale IPv6-Adressen; fe80::/10 sind IPv6-Link-Local-Adressen.
    /^f[cd][0-9a-f]{2}:/i.test(a) || /^fe80:/i.test(a)
  );
}

module.exports = { getLocalAddresses, isLocalClient };