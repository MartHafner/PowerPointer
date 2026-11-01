'use strict';
const crypto = require('crypto');

// Erzeugt eine zufällige numerische PIN (Standard: 6 Stellen).
// crypto.randomInt ist kryptografisch sicher, Math.random() wäre es nicht.
function generatePin(length = 6) {
  return String(crypto.randomInt(0, 10 ** length)).padStart(length, '0');
}

module.exports = { generatePin };

// Direkter Aufruf: node server/pin.js
if (require.main === module) console.log(generatePin());