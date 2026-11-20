'use strict';
const crypto = require('crypto');

// generates a random PIN by a length of 4 digits and returns it as a string
function generatePin(length = 4) {
  return String(crypto.randomInt(0, 10 ** length)).padStart(length, '0');
}

module.exports = { generatePin };

// starting the script directly will print a new passcode to the console (npm run passcode) 
if (require.main === module){
  console.log(`Passcode: ${generatePin()}`);
}