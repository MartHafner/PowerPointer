# PowerPointer

PowerPointer verwandelt ein iPhone oder einen anderen Browser in eine lokale Fernbedienung für Microsoft PowerPoint. Der Node.js-Server läuft auf dem Computer mit PowerPoint; das mobile Gerät öffnet die vom Server angezeigte Adresse in seinem Browser. Es sind weder eine zusätzliche App noch eine Cloud-Verbindung erforderlich.

## Inhaltsverzeichnis

- [Funktionen](#funktionen)
- [Voraussetzungen](#voraussetzungen)
- [Von GitHub herunterladen und installieren](#von-github-herunterladen-und-installieren)
  - [Erforderliche Software installieren](#erforderliche-software-installieren)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Alternative: ZIP-Archiv herunterladen](#alternative-zip-archiv-herunterladen)
  - [Aktualisieren](#aktualisieren)
- [iPhone verbinden und Server beenden](#iphone-verbinden-und-server-beenden)
- [Persönlichen Hotspot verwenden](#persönlichen-hotspot-verwenden)
- [PowerPoint-Berechtigungen](#powerpoint-berechtigungen)
- [Die Fernbedienung verwenden](#die-fernbedienung-verwenden)
- [Konfiguration](#konfiguration)
  - [Demo-Modus](#demo-modus)
- [Netzwerk und Sicherheit](#netzwerk-und-sicherheit)
- [Projektstruktur](#projektstruktur)
- [Lizenz](#lizenz)

## Funktionen
### iPad-Ansicht
<p align="center">
   <img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_0137.jpg" width="300" alt="PowerPointer">
   <img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_0138.jpg" width="300" alt="PowerPointer">
</p>

### iPhone-Ansicht
<p align="center">
   <img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_6761.jpg" width="300" alt="PowerPointer">
</p>

- Präsentation starten und beenden
- Zur vorherigen oder nächsten Folie wechseln
- Den Präsentationsbildschirm schwarz schalten und wiederherstellen
- Aktuelle Folie, Gesamtzahl der Folien und verstrichene Zeit anzeigen
- Verbindungs- und PowerPoint-Status anzeigen
- Die Präsentation per Touch, Tastatur oder Bluetooth-Klicker steuern
- Die WebSocket-Steuerverbindung standardmäßig mit einer zufällig erzeugten Sitzungs-PIN schützen
- Einen Demo-Modus nutzen, der eine Präsentation ohne PowerPoint simuliert

## Voraussetzungen

- Node.js 18 oder neuer und npm
- Microsoft PowerPoint für die tatsächliche Steuerung der Präsentation
- Computer und mobiles Gerät im selben lokalen Netzwerk
- macOS oder Windows für die plattformspezifische PowerPoint-Steuerung

PowerPointer kann auch ohne PowerPoint im Demo-Modus laufen. Auf anderen Betriebssystemen verwendet der Server diesen Modus automatisch.

## Von GitHub herunterladen und installieren

### Erforderliche Software installieren

- **Node.js 18 oder neuer** inklusive npm. Lade die aktuelle LTS-Version von [nodejs.org](https://nodejs.org/) herunter und installiere sie.
- **Git**, wenn du das Repository mit `git clone` klonen möchtest. Download unter [git-scm.com](https://git-scm.com/downloads).
- Microsoft PowerPoint für die tatsächliche Steuerung der Präsentation.
- Computer und mobiles Gerät im selben lokalen Netzwerk.

Prüfe nach der Installation, ob Node.js und npm verfügbar sind:

```sh
node --version
npm --version
```

Beide Befehle sollten eine Versionsnummer ausgeben. Falls nicht, schließe das Terminal und öffne es erneut. Werden die Befehle dann immer noch nicht gefunden, überprüfe deine Node.js-Installation.

### Windows

1. Installiere Node.js 18 oder neuer und Git (siehe oben).
2. Öffne **PowerShell**.
3. Wechsle in den Ordner, in dem du das Projekt ablegen möchtest, und klone das Repository:

   ```powershell
   cd $HOME\Documents
   git clone https://github.com/MartHafner/PowerPointer.git
   cd PowerPointer
   ```

4. Installiere die exakten Projektabhängigkeiten:

   ```powershell
   npm ci
   ```

5. Starte den Server:

   ```powershell
   npm start
   ```

6. Lass das PowerShell-Fenster geöffnet. Der Server gibt eine oder mehrere lokale Adressen aus. Öffne eine davon in Safari auf deinem iPhone.

### macOS

1. Installiere Node.js 18 oder neuer. Git ist oft bereits vorhanden; falls macOS dazu auffordert, installiere die angebotenen Xcode Command Line Tools.
2. Öffne das **Terminal**.
3. Wechsle in den Ordner, in dem du das Projekt ablegen möchtest, und klone das Repository:

   ```sh
   cd ~/Documents
   git clone https://github.com/MartHafner/PowerPointer.git
   cd PowerPointer
   ```

4. Installiere die Projektabhängigkeiten:

   ```sh
   npm ci
   ```

5. Starte den Server:

   ```sh
   npm start
   ```

6. Lass das Terminal-Fenster geöffnet. Öffne eine der vom Server ausgegebenen lokalen Adressen in Safari auf deinem iPhone.

### Alternative: ZIP-Archiv herunterladen

Du kannst das Projekt auch ohne Git herunterladen:

1. Öffne auf GitHub das [neueste Release von PowerPointer](https://github.com/MartHafner/PowerPointer/releases/latest).
2. Lade unter **Assets** die Datei **Source code (zip)** herunter.
3. Entpacke das heruntergeladene ZIP-Archiv in einen Ordner deiner Wahl.
4. Öffne das Terminal (macOS) oder PowerShell (Windows) im entpackten Projektordner. Dieser Ordner enthält die Datei `package.json`.
5. Führe die folgenden Befehle aus:

   ```sh
   npm ci
   npm start
   ```

   Dieselben Befehle funktionieren in PowerShell.

### Aktualisieren

- **Git:** Führe im Projektordner `git pull` und `npm ci` aus und starte den Server anschließend neu.
- **ZIP:** Lade das [neueste Release](https://github.com/MartHafner/PowerPointer/releases/latest) herunter, entpacke es in einen neuen Ordner, kopiere deine `config/settings.json` aus dem alten Ordner dorthin und führe `npm ci` und `npm start` aus.

### iPhone verbinden und Server beenden

Nach dem Start gibt der Computer die verfügbaren Netzwerkadressen und, wenn möglich, einen QR-Code im Terminal aus. Verbinde iPhone und Computer mit demselben lokalen Netzwerk und öffne dann eine der ausgegebenen Adressen in Safari, zum Beispiel `http://192.168.1.23:8787`. Falls die Seite nicht erreichbar ist, erlaube Node.js in deiner Firewall den Zugriff auf das private Netzwerk.

Beende den Server mit `Strg+C` (macOS: `Ctrl+C`) in dem Terminal- oder PowerShell-Fenster, in dem er läuft.

### Persönlichen Hotspot verwenden

In einem nicht vertrauenswürdigen oder gemeinsam genutzten Netzwerk (zum Beispiel auf einer Konferenz) kannst du stattdessen den Persönlichen Hotspot deines iPhones verwenden:

1. Aktiviere auf dem iPhone **Einstellungen → Persönlicher Hotspot**.
2. Verbinde den Computer mit dem WLAN des iPhones.
3. Starte PowerPointer und öffne die im Terminal ausgegebene Adresse auf dem iPhone. In einem Hotspot-Netzwerk beginnt sie normalerweise mit `172.20.10.`.

Hat der Computer mehrere Netzwerkverbindungen, listet das Terminal mehrere Adressen auf. Verwende die Adresse, die zum Hotspot-Netzwerk passt, da der QR-Code nur die erste Adresse verwendet.

## PowerPoint-Berechtigungen

- **macOS:** Erlaube der Anwendung, die Node.js gestartet hat (zum Beispiel dem Terminal), PowerPoint unter **Systemeinstellungen → Datenschutz & Sicherheit → Automation** zu steuern.
- **Windows:** PowerPoint muss installiert und startbar sein. PowerPointer steuert die laufende PowerPoint-Instanz über PowerShell und COM-Automatisierung.

## Die Fernbedienung verwenden

Steuere die Präsentation mit den Schaltflächen. Während sie läuft, zeigt die Oberfläche die aktuelle Folie, die Gesamtzahl der Folien und die verstrichene Zeit an.

Tastenkürzel:

| Taste | Aktion |
|---|---|
| Pfeil rechts, Bild ab oder Leertaste | Nächste Folie |
| Pfeil links oder Bild auf | Vorherige Folie |
| `b` oder `.` | Bildschirm schwarz schalten oder wiederherstellen |

Der Server fragt den Status von PowerPoint standardmäßig einmal pro Sekunde ab. Bei Verbindungsverlust versucht die Weboberfläche automatisch, die Verbindung wiederherzustellen.

## Konfiguration

Die Einstellungen befinden sich in [`config/settings.json`](config/settings.json):

| Einstellung | Standard | Beschreibung |
|---|---:|---|
| `port` | `8787` | HTTP- und WebSocket-Port |
| `host` | `0.0.0.0` | Netzwerkadresse, auf der der Server lauscht |
| `pin` | `"auto"` | Erzeugt beim Serverstart eine zufällige vierstellige PIN; mit `""` wird der PIN-Schutz deaktiviert |
| `pollIntervalMs` | `1000` | Intervall zwischen den PowerPoint-Statusabfragen in Millisekunden |

Die erzeugte PIN wird im Server-Terminal ausgegeben und bleibt gültig, bis der Server beendet wird. Setze `pin` auf einen festen Wert, um eine eigene PIN zu verwenden. `PORT` überschreibt den konfigurierten Port; `POWERPOINTER_PIN` überschreibt die konfigurierte PIN, auch mit `auto` oder einem leeren Wert. Beispiel für PowerShell:

```powershell
$env:POWERPOINTER_PIN = "1234"
npm start
```

Die Weboberfläche fragt beim Verbinden nach der PIN. Sie wird für die aktuelle Browser-Tab-Sitzung gespeichert.

### Demo-Modus

Der Demo-Modus simuliert eine Präsentation mit zehn Folien. Unter macOS und Windows aktivierst du ihn mit der Umgebungsvariable `POWERPOINTER_MOCK`:

```sh
POWERPOINTER_MOCK=1 npm start
```

In PowerShell:

```powershell
$env:POWERPOINTER_MOCK = "1"
npm start
```

Das Skript `npm run dev` aktiviert denselben Modus in Shells, die Umgebungsvariablen im Unix-Stil unterstützen.

## Netzwerk und Sicherheit

Die Weboberfläche und die Steuerverbindung sind für den Einsatz in einem vertrauenswürdigen lokalen Netzwerk gedacht. Der Server lehnt Verbindungen von nicht lokalen IP-Adressen ab. Die Standard-PIN ist zufällig und ändert sich bei jedem Serverstart, hat aber nur vier Stellen und wird im Server-Terminal angezeigt. Der PIN-Schutz ersetzt keine Netzwerksicherheit.

Eine PIN schützt die WebSocket-Steuerverbindung, verschlüsselt sie aber nicht. Standardmäßig verwendet PowerPointer HTTP und WebSocket ohne TLS, sodass jemand, der den lokalen Netzwerkverkehr mitlesen kann, die PIN und die Präsentationsdaten erfassen könnte. Gib den Server-Port nicht ins öffentliche Internet frei und nutze PowerPointer nur in Netzwerken, denen du vertraust. Wird `pin` auf einen leeren Wert gesetzt, ist der PIN-Schutz deaktiviert.

## Projektstruktur

```text
PowerPointer/
├── config/
│   └── settings.json
├── public/
│   ├── App.js
│   ├── Index.html
│   └── Style.css
├── server/
│   ├── platforms/
│   │   ├── macos.js
│   │   └── windows.js
│   ├── network.js
│   ├── powerpoint.js
│   └── server.js
├── install.command
├── package.json
└── package-lock.json
```

- `server/server.js` liefert die Weboberfläche aus und verwaltet die HTTP-, WebSocket- und Statusverbindungen.
- `server/network.js` ermittelt lokale IPv4-Adressen und prüft, ob sich ein Client in einem lokalen Netzwerk befindet.
- `server/powerpoint.js` stellt die gemeinsame Befehlsschnittstelle und den Demo-Modus bereit.
- `server/platforms/` enthält die PowerPoint-Anbindungen über AppleScript (macOS) und PowerShell/COM (Windows).
- `public/` enthält die Oberfläche der Fernbedienung.
- `config/settings.json` enthält die Servereinstellungen.
- `install.command` ist ein Installationsskript für macOS.

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).