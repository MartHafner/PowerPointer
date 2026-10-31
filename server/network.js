'use strict';
const os = require('os');

// Return all local IPv4 addresses except loopback, with private networks first.
function getLocalAddresses() {
  const result = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    // An interface may have no addresses, for example when it is disconnected.
    for (const info of list || []) {
      if (info.family === 'IPv4' && !info.internal) {
        result.push({ name, address: info.address });
      }
    }
  }
  // Sort RFC 1918 addresses before other non-internal IPv4 addresses for display.
  const isPrivate = (a) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a);
  return result.sort((a, b) => Number(isPrivate(b.address)) - Number(isPrivate(a.address)));
}

// Allow requests only from private or local networks.
function isLocalClient(remote) {
  if (!remote) return false;
  // Node.js may report IPv4 connections as IPv4-mapped IPv6 addresses.
  const a = remote.replace(/^::ffff:/, '');
  return (
    a === '::1' || a === '127.0.0.1' ||
    // Allow private IPv4 networks and link-local addresses.
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(a) ||
    // fc00::/7 covers unique local IPv6 addresses; fe80::/10 covers IPv6 link-local addresses.
    /^f[cd][0-9a-f]{2}:/i.test(a) || /^fe80:/i.test(a)
  );
}

module.exports = { getLocalAddresses, isLocalClient };