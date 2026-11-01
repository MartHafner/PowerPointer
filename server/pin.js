'use strict';
const crypto = require('crypto'); // crypto.randomInt ist kryptografisch sicher.

// Erzeugt eine zufällige numerische PIN (Standard: 4 Stellen).
function generatePin(length = 4) {
  return String(crypto.randomInt(0, 10 ** length)).padStart(length, '0');
}

module.exports = { generatePin };

// Direkter Aufruf: node server/pin.js
if (require.main === module) console.log(generatePin());