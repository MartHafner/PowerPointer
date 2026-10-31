#!/bin/bash
# PowerPointer installer for macOS. Double-click to run.
cd "$(dirname "$0")" || exit 1
pause() { read -n 1 -s -r -p "Beliebige Taste zum Beenden …"; echo; }

echo "=== PowerPointer – Installation ==="

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js wurde nicht gefunden (benötigt: Version 18 oder neuer)."
  echo "Bitte installieren: https://nodejs.org  oder  brew install node"
  open "https://nodejs.org/en/download" 2>/dev/null
  pause; exit 1
fi
MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$MAJOR" -lt 18 ]; then
  echo "Node.js $(node -v) ist zu alt. Bitte Version 18 oder neuer installieren."
  pause; exit 1
fi
echo "Node.js $(node -v) gefunden."

# 2. Install dependencies
echo "Installiere Abhängigkeiten …"
if ! npm install --no-audit --no-fund; then
  echo "Installation fehlgeschlagen. Bitte Meldung oben prüfen."
  pause; exit 1
fi
chmod +x start.command 2>/dev/null

echo
echo "Installation abgeschlossen."
echo "Später starten: Doppelklick auf start.command oder 'npm start'."
echo
read -r -p "Jetzt starten? [J/n] " ANSWER
case "$ANSWER" in
  n|N) ;;
  *) npm start ;;
esac
