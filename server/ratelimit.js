'use strict';

// Simple in-memory rate limit against PIN guessing, per client IP.
const MAX_FAILS = 5;                 // Failed attempts before lockout
const BASE_LOCK_MS = 60 * 1000;      // First lockout: 1 minute, then doubles
const MAX_LOCK_MS = 15 * 60 * 1000;  // Maximum: 15 minutes

const entries = new Map(); // ip -> { fails, locks, lockedUntil, last }
const norm = (ip) => String(ip || '').replace(/^::ffff:/, '');

// Remaining lockout time in ms (0 = not locked out).
function retryAfterMs(ip) {
  const e = entries.get(norm(ip));
  return e ? Math.max(0, e.lockedUntil - Date.now()) : 0;
}

function registerFailure(ip) {
  const key = norm(ip);
  const e = entries.get(key) || { fails: 0, locks: 0, lockedUntil: 0, last: 0 };
  e.fails++;
  e.last = Date.now();
  if (e.fails >= MAX_FAILS) {
    e.locks++;
    e.fails = 0;
    e.lockedUntil = Date.now() + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** (e.locks - 1));
  }
  entries.set(key, e);
}

function registerSuccess(ip) {
  entries.delete(norm(ip));
}

// Clean up old entries so the map does not grow indefinitely.
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of entries) {
    if (e.lockedUntil < now && now - e.last > 60 * 60 * 1000) entries.delete(ip);
  }
}, 10 * 60 * 1000).unref();

module.exports = { retryAfterMs, registerFailure, registerSuccess };