# PowerPointer

PowerPointer verwandelt ein iPhone oder einen anderen Browser in eine lokale Fernbedienung für Microsoft PowerPoint. Der Node.js-Server läuft auf dem Computer mit PowerPoint; das Mobilgerät öffnet die vom Server angezeigte Adresse im Browser. Eine zusätzliche App oder Cloud-Verbindung ist nicht erforderlich.

## Inhaltsverzeichnis

- [Funktionen](#funktionen)
- [Voraussetzungen](#voraussetzungen)
- [Projekt von GitHub herunterladen und installieren](#projekt-von-github-herunterladen-und-installieren)
  - [Anhängigkeiten](#anhängigkeiten)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Alternative: ZIP-Datei herunterladen](#alternative-zip-datei-herunterladen)
  - [Mit dem iPhone verbinden und Server beenden](#mit-dem-iphone-verbinden-und-server-beenden)
- [PowerPoint-Berechtigungen](#powerpoint-berechtigungen)
- [Bedienung](#bedienung)
- [Konfiguration](#konfiguration)
  - [Demo-Modus](#demo-modus)
- [Netzwerk und Sicherheit](#netzwerk-und-sicherheit)
- [Projektstruktur](#projektstruktur)
- [Lizenz](#lizenz)

## Funktionen

- Präsentation starten und beenden
- Zur vorherigen oder nächsten Folie wechseln
- Bildschirm der Präsentation schwarz schalten und wieder einblenden
- Aktuelle Folie, Folienanzahl und Laufzeit anzeigen
- Verbindung und PowerPoint-Status anzeigen
- Eingaben über Touch, Tastatur oder Bluetooth-Klicker
- Optionaler PIN zum Schutz der WebSocket-Steuerverbindung
- Demo-Modus, der PowerPoint durch eine simulierte Präsentation ersetzt

## Voraussetzungen

- Node.js 18 oder neuer und npm
- Microsoft PowerPoint für die tatsächliche Präsentationssteuerung
- Computer und Mobilgerät im selben lokalen Netzwerk
- macOS oder Windows für die plattformspezifische PowerPoint-Steuerung

PowerPointer kann auch ohne PowerPoint im Demo-Modus gestartet werden. Auf anderen Betriebssystemen verwendet der Server automatisch diesen Modus.

## Projekt von GitHub herunterladen und installieren

### Anhängigkeiten

- **Node.js 18 oder neuer**, einschließlich npm. Lade die aktuelle LTS-Version von [nodejs.org](https://nodejs.org/) herunter und installiere sie.
- **Git**, wenn du das Repository mit dem `git clone`-Befehl herunterladen möchtest. Git gibt es auf [git-scm.com](https://git-scm.com/downloads).
- Microsoft PowerPoint für die tatsächliche Präsentationssteuerung.
- Computer und Mobilgerät im selben lokalen Netzwerk.

Nach der Installation kannst du prüfen, ob Node.js und npm verfügbar sind:

```sh
node --version
npm --version
```

Beide Befehle sollten Versionsnummern ausgeben. Falls nicht, schließe das Terminal und öffne es erneut. Wenn die Befehle weiterhin nicht gefunden werden, überprüfe die Node.js-Installation.

### Windows

1. Installiere Node.js 18 oder neuer und Git (siehe Voraussetzungen).
2. Öffne **PowerShell**.
3. Wechsle in den Ordner, in dem das Projekt liegen soll, und klone das Repository:

   ```powershell
   cd $HOME\Documents
   git clone https://github.com/MartHafner/PowerPointer.git
   cd PowerPointer
   ```

4. Installiere die festgelegten Projektabhängigkeiten:

   ```powershell
   npm ci
   ```

5. Starte den Server:

   ```powershell
   npm start
   ```

6. Lass das PowerShell-Fenster geöffnet. Der Server zeigt eine oder mehrere lokale Adressen an. Öffne eine davon auf dem iPhone im Safari-Browser.

### macOS

1. Installiere Node.js 18 oder neuer. Git ist oft bereits vorhanden; falls macOS danach fragt, installiere die angebotenen Xcode Command Line Tools.
2. Öffne **Terminal**.
3. Wechsle in den gewünschten Speicherort und klone das Repository:

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

   Alternativ kann das mitgelieferte Skript `./install.command` zur Installation verwendet werden. Es installiert die Abhängigkeiten und bietet an, den Server direkt zu starten.

6. Lass das Terminal geöffnet. Öffne eine der vom Server angezeigten lokalen Adressen auf dem iPhone im Safari-Browser.

### Alternative: ZIP-Datei herunterladen

Du kannst das Projekt auch ohne Git herunterladen:

1. Öffne die [PowerPointer-Projektseite auf GitHub](https://github.com/MartHafner/PowerPointer).
2. Wähle **Code** und anschließend **Download ZIP**.
3. Entpacke die heruntergeladene ZIP-Datei an einen Speicherort deiner Wahl.
4. Öffne ein Terminal (macOS) oder PowerShell (Windows) im entpackten Projektordner. Der Ordner enthält die Datei `package.json`.
5. Führe dort die folgenden Befehle aus:

   ```sh
   npm ci
   npm start
   ```

   In PowerShell funktionieren dieselben Befehle.

### Mit dem iPhone verbinden und Server beenden

Der Computer zeigt nach dem Start erreichbare Netzwerkadressen an und, sofern verfügbar, einen QR-Code im Terminal. Verbinde iPhone und Computer mit demselben lokalen Netzwerk und öffne eine der angezeigten Adressen, zum Beispiel `http://192.168.1.23:8787`, in Safari. Wenn die Seite nicht erreichbar ist, erlaube Node.js in der Firewall den Zugriff auf das private Netzwerk.

Beende den Server über `Ctrl+C` im Terminal beziehungsweise PowerShell-Fenster, in dem er läuft.

### PowerPoint-Berechtigungen

- **macOS:** Erlaube der Anwendung, von der aus Node.js gestartet wurde (zum Beispiel Terminal), PowerPoint unter „Datenschutz & Sicherheit“ → „Automation“ zu steuern.
- **Windows:** PowerPoint muss installiert und gestartet werden können. PowerPointer steuert die laufende PowerPoint-Instanz über PowerShell und COM-Automatisierung.

## Bedienung

Die Schaltflächen steuern die Präsentation. Während sie läuft, zeigt die Oberfläche die aktuelle Folie, die Gesamtzahl der Folien und die Laufzeit an.

Tastaturbelegung:

| Taste | Aktion |
|---|---|
| Pfeil rechts, Bild ab oder Leertaste | Nächste Folie |
| Pfeil links oder Bild auf | Vorherige Folie |
| `b` oder `.` | Bildschirm schwarz schalten bzw. wieder einblenden |

Der Server prüft den PowerPoint-Status standardmäßig einmal pro Sekunde. Nach einem Verbindungsverlust versucht die Weboberfläche automatisch, die Verbindung wiederherzustellen.

## Konfiguration

Die Einstellungen stehen in [`config/settings.json`](config/settings.json):

| Einstellung | Standardwert | Bedeutung |
|---|---:|---|
| `port` | `8787` | HTTP- und WebSocket-Port |
| `host` | `0.0.0.0` | Netzwerkadresse, an der der Server lauscht |
| `pin` | `""` | Optionaler Verbindungscode; leer bedeutet: kein PIN |
| `pollIntervalMs` | `1000` | Abstand zwischen PowerPoint-Statusabfragen in Millisekunden |

`PORT` überschreibt den konfigurierten Port; `POWERPOINTER_PIN` überschreibt den konfigurierten PIN. Beispiel für PowerShell:

```powershell
$env:POWERPOINTER_PIN = "1234"
npm start
```

Beim ersten Verbindungsversuch fragt die Weboberfläche nach dem PIN. Er wird für die Sitzung des Browser-Tabs gespeichert.

### Demo-Modus

Der Demo-Modus simuliert eine Präsentation mit zehn Folien. Auf macOS und Windows lässt er sich über die Umgebungsvariable `POWERPOINTER_MOCK` aktivieren:

```sh
POWERPOINTER_MOCK=1 npm start
```

In PowerShell:

```powershell
$env:POWERPOINTER_MOCK = "1"
npm start
```

Das Skript `npm run dev` aktiviert denselben Modus auf Shells, die die Unix-Schreibweise für Umgebungsvariablen unterstützen.

## Netzwerk und Sicherheit

Die Weboberfläche und die Steuerverbindung sind für ein vertrauenswürdiges lokales Netzwerk vorgesehen. Der Server weist Verbindungen von nicht-lokalen IP-Adressen ab. Ohne konfigurierten PIN kann jeder Client im erlaubten Netzwerk die Präsentation steuern.

Ein PIN schützt die WebSocket-Steuerverbindung, verschlüsselt die Verbindung aber nicht. PowerPointer verwendet standardmäßig HTTP und WebSocket ohne TLS. Leite den Serverport daher nicht ins öffentliche Internet weiter und verwende PowerPointer nur in Netzwerken, denen du vertraust.

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

- `server/server.js` stellt die Weboberfläche bereit und verwaltet HTTP-, WebSocket- und Statusverbindungen.
- `server/network.js` ermittelt lokale IPv4-Adressen und prüft, ob ein Client aus einem lokalen Netz kommt.
- `server/powerpoint.js` stellt die gemeinsame Befehlsschnittstelle und den Demo-Modus bereit.
- `server/platforms/` enthält die PowerPoint-Steuerung über AppleScript (macOS) beziehungsweise PowerShell/COM (Windows).
- `public/` enthält die Bedienoberfläche.
- `config/settings.json` enthält die Servereinstellungen.
- `install.command` ist ein macOS-Installationsskript; der Server kann anschließend mit `npm start` gestartet werden.

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).
