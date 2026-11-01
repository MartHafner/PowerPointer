# Sicherheitsanalyse

## Zusammenfassung

Die Prüfung des gesamten Projekts ergab einen bestätigten Befund mittlerer Schwere: Die Kommunikation zwischen Browser und Server ist standardmäßig unverschlüsselt. Ein Angreifer mit Zugriff auf den Netzwerkverkehr kann dadurch den WebSocket-PIN und Präsentationsdaten, einschließlich Notizen, mitlesen. Mit dem PIN kann er die Präsentation steuern.

Es wurde keine bestätigte Schwachstelle festgestellt, durch die ein Angreifer beliebigen Zugriff auf das Betriebssystem oder das Gerät erhält. Eine direkte Offenlegung der Identität wurde ebenfalls nicht nachgewiesen; Präsentationsnotizen können jedoch personenbezogene oder identifizierende Informationen enthalten.

## Befund

| # | Schweregrad | Datei / Zeilen | Schwachstelle | Vertrauen |
|---|---|---|---|---:|
| 1 | 🟡 MEDIUM | `server/server.js:38,84,96,137`; `public/App.js:17`; `README.md:196` | Unverschlüsselte HTTP-/WebSocket-Kommunikation kann den PIN und Präsentationsdaten offenlegen. | 9/10 |

### 1. Unverschlüsselte Kommunikation

Der Server verwendet HTTP und WebSocket ohne TLS. Der PIN wird beim WebSocket-Verbindungsaufbau übertragen; Zustandsnachrichten können Präsentationsnotizen enthalten. Die Dokumentation bestätigt, dass TLS standardmäßig nicht aktiviert ist.

**Auswirkung und Voraussetzung:** Ein Angreifer, der den lokalen Netzwerkverkehr beobachten oder abfangen kann – etwa über einen kompromittierten Zugangspunkt oder eine lokale Man-in-the-Middle-Position – kann PIN und Notizen auslesen. Mit dem abgefangenen PIN kann er sich verbinden und die Präsentation steuern. Der Befund ermöglicht für sich genommen keinen beliebigen Zugriff auf das Betriebssystem.

**Empfehlung:** TLS für Weboberfläche und WebSocket-Verbindung einsetzen oder beide Verbindungen ausschließlich über einen geschützten, verschlüsselnden Tunnel führen.

## Umfang und Einschränkungen

- Geprüft wurden laut Prüfergebnis der gesamte First-Party-Quellcode, Konfigurationen, Dokumentation, Installer sowie Dependency-Manifeste und Lockfile.
- Die Anwendung wurde nicht ausgeführt; PowerPoint-Automatisierung auf macOS/Windows wurde nicht getestet.
- Es fand keine separate Schwachstellenanalyse der Drittanbieter-Abhängigkeiten statt.
