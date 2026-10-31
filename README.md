# PowerPointer

**Die lokale PowerPoint-Fernbedienung für iPhone, macOS und Windows.**

PowerPointer ermöglicht es, eine Microsoft-PowerPoint-Präsentation bequem über ein iPhone zu steuern. Dazu wird auf dem Computer ein lokaler Server gestartet, der eine browserbasierte Fernbedienung bereitstellt.

Das iPhone verbindet sich über ein lokales Netzwerk mit diesem Server. Über eine speziell entwickelte Weboberfläche können Präsentationen gesteuert und relevante Informationen wie die aktuelle Foliennummer oder die Präsentationsdauer angezeigt werden.

Eine Internetverbindung oder eine Installation einer zusätzlichen App auf dem iPhone ist nicht erforderlich.

---

## Inhaltsverzeichnis

- [Projektübersicht](#projektübersicht)
- [Ziel des Projekts](#ziel-des-projekts)
- [Funktionsweise](#funktionsweise)
- [Systemarchitektur](#systemarchitektur)
- [Funktionen](#funktionen)
- [Netzwerk und Verbindung](#netzwerk-und-verbindung)
- [Technologie](#technologie)
- [Projektstruktur](#projektstruktur)
- [Installation und Einrichtung](#installation-und-einrichtung)
- [Sicherheit](#sicherheit)
- [Geplante Erweiterungen](#geplante-erweiterungen)

---

## Projektübersicht

PowerPointer ist eine plattformübergreifende Fernbedienung für Microsoft PowerPoint.

Das Projekt verfolgt das Ziel, ein Smartphone als drahtlose Fernbedienung für Präsentationen einzusetzen, ohne auf externe Cloud-Dienste oder kostenpflichtige Anwendungen angewiesen zu sein.

Die Anwendung besteht aus zwei Hauptkomponenten:

1. **PowerPointer Server:** Eine lokale Anwendung, die auf dem Computer ausgeführt wird und die Kommunikation mit Microsoft PowerPoint übernimmt.
2. **PowerPointer Webinterface:** Eine für Smartphones optimierte Website, über die der Benutzer die Präsentation bedienen kann.

Der Server soll sowohl unter macOS als auch unter Windows funktionieren.

## Ziel des Projekts

PowerPointer soll eine einfache, zuverlässige und lokal funktionierende Möglichkeit bieten, PowerPoint-Präsentationen mit einem iPhone zu steuern.

Dabei stehen folgende Ziele im Vordergrund:

- Plattformübergreifende Unterstützung von macOS und Windows.
- Bedienung über den Webbrowser des iPhones.
- Keine zusätzliche iPhone-App erforderlich.
- Keine Internetverbindung erforderlich.
- Kommunikation ausschließlich über das lokale Netzwerk.
- Echtzeitübertragung von Steuerbefehlen und Statusinformationen.
- Moderne und übersichtliche Benutzeroberfläche.

## Funktionsweise

Die Kommunikation zwischen iPhone und Computer erfolgt über ein lokales Netzwerk.

Der Computer stellt einen Node.js-Server bereit, der gleichzeitig die Weboberfläche ausliefert und die Steuerbefehle des iPhones verarbeitet.

### Ablauf einer Verbindung

1. Der Benutzer startet PowerPointer auf seinem Computer.
2. Der Computer startet den lokalen Server.
3. Der Server stellt die Weboberfläche im Netzwerk bereit.
4. Das iPhone verbindet sich mit demselben Netzwerk wie der Computer.
5. Der Benutzer öffnet die angezeigte lokale IP-Adresse im Safari-Browser.
6. Die Weboberfläche wird geladen und verbindet sich mit dem Server.
7. Steuerbefehle werden an den Server übertragen.
8. Der Server führt die entsprechenden Aktionen in Microsoft PowerPoint aus.
9. Statusinformationen werden an das iPhone zurückgesendet.

**Beispiel:**

Der Benutzer drückt auf dem iPhone die Schaltfläche „Nächste Folie“.

- Das iPhone sendet einen Steuerbefehl.
- Der Server empfängt den Befehl.
- Die plattformspezifische Steuerung führt die entsprechende Aktion in PowerPoint aus.
- Die Präsentation wechselt zur nächsten Folie.
- Der Server aktualisiert die Statusinformationen auf dem iPhone.

### Vereinfachte Darstellung

```text
      PC (PowerPoint) ---> Lokaler Server (PC) ----> Iphone (Web-Controller)
```

## Systemarchitektur

PowerPointer ist modular aufgebaut.

Dadurch können die Netzwerkkommunikation, die Benutzeroberfläche und die eigentliche PowerPoint-Steuerung unabhängig voneinander entwickelt und erweitert werden.

### 1. Webinterface

Das Webinterface ist die Benutzeroberfläche von PowerPointer.

Es wird direkt vom lokalen Server bereitgestellt und kann über jeden kompatiblen Browser aufgerufen werden.

Die Oberfläche ist insbesondere für die Bedienung auf einem iPhone optimiert.

### 2. Lokaler Server

Der Server bildet die zentrale Schnittstelle zwischen dem Smartphone und dem Computer.

Seine Aufgaben:

- Bereitstellung der lokalen Website.
- Empfang und Verarbeitung von Steuerbefehlen.
- Verwaltung der Client-Verbindungen.
- Kommunikation mit der PowerPoint-Schnittstelle.
- Übertragung von Statusinformationen.

### 3. Plattform-Schnittstelle

Da macOS und Windows unterschiedliche Möglichkeiten zur Steuerung von Anwendungen bereitstellen, erfolgt die PowerPoint-Steuerung über plattformspezifische Module.

**macOS:**
- Steuerung beispielsweise über AppleScript und macOS-Systemfunktionen.
- Erforderliche Berechtigungen für die Automatisierung.

**Windows:**
- Steuerung beispielsweise über PowerShell, COM-Automatisierung oder geeignete Windows-Schnittstellen.

Beide Plattformen verwenden dieselbe grundlegende Steuerungslogik.

## Funktionen

Der geplante Funktionsumfang umfasst folgende Bereiche:

| Funktion | Beschreibung |
|---|---|
| Nächste Folie | Wechselt zur nächsten Folie. |
| Vorherige Folie | Wechselt zur vorherigen Folie. |
| Präsentation starten | Startet die PowerPoint-Präsentation. |
| Präsentation beenden | Beendet den Präsentationsmodus. |
| Folienanzeige | Zeigt die aktuelle Foliennummer an. |
| Gesamtfolien | Zeigt die Anzahl aller Folien an. |
| Präsentationstimer | Zeigt die bisherige Präsentationsdauer an. |
| Verbindungsstatus | Zeigt den Verbindungszustand zwischen iPhone und Server. |
| Bildschirm ausblenden | Ermöglicht einen schwarzen Präsentationsbildschirm. |

Die tatsächliche Verfügbarkeit einzelner Funktionen hängt von der jeweiligen PowerPoint-Schnittstelle und dem Betriebssystem ab.

## Netzwerk und Verbindung

PowerPointer ist für den lokalen Betrieb konzipiert.

Es gibt zwei vorgesehene Verbindungsmöglichkeiten:

### 1. Eigenes WLAN

Der Computer erstellt beziehungsweise stellt ein eigenes WLAN bereit.

Das iPhone verbindet sich direkt mit diesem Netzwerk.

Anschließend kann die lokale Website über die IP-Adresse des Computers aufgerufen werden.

Beispiel:

```text
http://192.168.137.1:8787
```

### 2. Bestehendes WLAN

Alternativ können Computer und iPhone mit demselben bestehenden WLAN verbunden werden.

Der Server erkennt seine lokale IP-Adresse und stellt die Weboberfläche über diese Adresse bereit.

### Keine Internetverbindung erforderlich

Die gesamte Kommunikation zwischen iPhone und Computer findet innerhalb des lokalen Netzwerks statt.

PowerPointer benötigt für seine grundlegenden Funktionen:

- Keine Cloud-Verbindung.
- Kein Benutzerkonto.
- Keine externe Serverinfrastruktur.
- Keine Internetverbindung.

## Technologie

Für die Entwicklung sind folgende Technologien vorgesehen:

| Technologie | Verwendung |
|---|---|
| Node.js | Lokaler Server |
| JavaScript | Anwendungslogik |
| HTML | Struktur der Weboberfläche |
| CSS | Gestaltung und responsives Design |
| WebSocket | Echtzeitkommunikation |
| HTTP | Bereitstellung der Website |
| AppleScript | macOS-Integration |
| PowerShell / COM | Windows-Integration |

Die konkrete technische Umsetzung kann im Laufe der Entwicklung erweitert oder angepasst werden.

## Projektstruktur

Die vorgesehene Projektstruktur:

```text
PowerPointer/
│
├── server/
│   ├── server.js
│   ├── network.js
│   ├── powerpoint.js
│   │
│   └── platforms/
│       ├── macos.js
│       └── windows.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── config/
│   └── settings.json
│
├── package.json
└── README.md
```

**Erläuterung:**

- `server.js`: Startet und verwaltet den lokalen Server.
- `network.js`: Übernimmt die Netzwerkerkennung und Verbindung.
- `powerpoint.js`: Stellt eine einheitliche Schnittstelle zur Steuerung bereit.
- `macos.js`: Enthält die Steuerungsfunktionen für macOS.
- `windows.js`: Enthält die Steuerungsfunktionen für Windows.
- `index.html`: Enthält die Struktur der Fernbedienung.
- `style.css`: Definiert das Design.
- `app.js`: Verarbeitet Benutzereingaben und Serverkommunikation.
- `settings.json`: Enthält anpassbare Einstellungen.

## Installation und Einrichtung

### Voraussetzungen

- Ein Computer mit macOS oder Windows.
- Installiertes Node.js.
- Installiertes Microsoft PowerPoint.
- Ein iPhone mit einem aktuellen Webbrowser.
- Eine lokale Netzwerkverbindung zwischen beiden Geräten.

### Installation

Repository herunterladen oder klonen:

```bash
git clone https://github.com/DEIN-USERNAME/PowerPointer.git
```

In das Projektverzeichnis wechseln:

```bash
cd PowerPointer
```

Abhängigkeiten installieren:

```bash
npm install
```

Server starten:

```bash
npm start
```

Anschließend wird die lokale Adresse des Servers angezeigt.

Diese Adresse kann im Safari-Browser des iPhones geöffnet werden.

*Hinweis: Die Befehle setzen voraus, dass die entsprechenden Startskripte und Projektdateien eingerichtet sind.*

## Sicherheit

PowerPointer ist für die Nutzung innerhalb eines vertrauenswürdigen lokalen Netzwerks vorgesehen.

Da der Server Steuerbefehle an PowerPoint weitergeben kann, sollte der Zugriff entsprechend geschützt werden.

Geplante Sicherheitsmaßnahmen:

- Beschränkung auf lokale Netzwerkverbindungen.
- Keine unnötige Freigabe des Servers ins Internet.
- Absicherung der Steuerbefehle.
- Optionaler Verbindungscode zwischen iPhone und Computer.
- Validierung eingehender Anfragen.
- Begrenzung der erlaubten Steuerbefehle.

Der Server sollte nicht ungeschützt über das öffentliche Internet erreichbar sein.

## Geplante Erweiterungen

PowerPointer soll langfristig um weitere Funktionen ergänzt werden.

Mögliche Erweiterungen:

- Direkte Auswahl bestimmter Folien.
- Anzeige von Präsentationsnotizen.
- Anzeige einer Folienvorschau.
- Erweiterte Präsentationsstatistiken.
- Mehrere verbundene Fernbedienungen.
- Automatische Netzwerkerkennung.
- Automatische Erkennung laufender PowerPoint-Präsentationen.
- Erweiterte Timer- und Erinnerungsfunktionen.
- Individuelle Gestaltung der Fernbedienung.

---

## Projektstatus

**PowerPointer befindet sich in der Entwicklung.**

Ziel ist eine stabile, plattformübergreifende und vollständig lokal arbeitende PowerPoint-Fernbedienung.

Die endgültige Funktionsverfügbarkeit und die Unterstützung der einzelnen Betriebssysteme werden im Verlauf der Entwicklung umgesetzt und getestet.

---

## Lizenz

Die Lizenzbedingungen werden im weiteren Projektverlauf festgelegt.

---

**PowerPointer – Your presentation. Your control.**