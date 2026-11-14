#!/bin/bash
# PowerPointer installer for macOS. Double-click to run.
cd "$(dirname "$0")" || exit 1
pause() { read -n 1 -s -r -p "Press any key to exit …"; echo; }

echo "=== PowerPointer Installer ==="

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found (required: version 22.12 or later)."
  echo "Install it from https://nodejs.org or run: brew install node"
  open "https://nodejs.org/en/download" 2>/dev/null
  pause; exit 1
fi
if ! node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1)"; then
  echo "Node.js $(node -v) is too old. Please install version 22.12 or later."
  pause; exit 1
fi
echo "Node.js $(node -v) found."

# 2. Install dependencies
echo "Installing dependencies …"
if ! npm install --no-audit --no-fund; then
  echo "Installation failed. Please review the message above."
  pause; exit 1
fi
echo
echo "Installation complete."
echo "To start later, run 'npm start'."
echo
read -r -p "Start PowerPointer now? [Y/n] " ANSWER
case "$ANSWER" in
  n|N) ;;
  *) npm start ;;
esac
