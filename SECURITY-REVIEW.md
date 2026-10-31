# Sicherheitsprüfung

## Zusammenfassung

Bei der Prüfung wurde eine mittelgradige Zugriffskontrollschwäche in der Standardkonfiguration festgestellt. Es wurden keine Zugangsdaten, PINs oder anderen sensiblen fest codierten Werte gefunden.

## Befunde

| # | Schweregrad | Datei / Zeilen | Befund | Vertrauen |
|---|---|---|---|---:|
| 1 | Mittel | `config/settings.json:3-4`; `server/server.js:19-20, 77-83, 121-129` | Der Server lauscht standardmäßig auf allen Netzwerkschnittstellen und hat standardmäßig keinen PIN aktiviert. Clients aus zugelassenen lokalen Netzen können dadurch ohne Authentifizierung den Präsentationsstatus lesen und PowerPoint-Befehle ausführen. | 9/10 |

### 1. Steuerung ohne Authentifizierung im lokalen Netzwerk

Die Standardkonfiguration setzt `host` auf `0.0.0.0` und `pin` auf einen leeren Wert. Bei leerem PIN überspringt der Server die PIN-Prüfung für WebSocket-Verbindungen. Da verbundene Clients Befehle an PowerPoint senden können, kann jedes Gerät in einem zugelassenen lokalen Netz die Präsentation steuern und deren Status abrufen.

**Voraussetzung:** Ein Angreifer muss Zugriff auf ein vom Server zugelassenes lokales oder Link-Local-Netz haben. Die README weist darauf hin, dass der Server nur in vertrauenswürdigen Netzwerken verwendet und nicht ins öffentliche Internet exponiert werden soll.

**Empfehlung:** Einen PIN standardmäßig erzwingen oder den Server standardmäßig nur an Loopback binden und den Netzwerkzugriff explizit aktivieren.

## Umfang und Einschränkungen

- Die Prüfung umfasste Anwendungscode, Konfiguration, Dokumentation und Abhängigkeitsdateien.
- Es wurden keine sensiblen Zugangsdaten oder anderen vertraulichen hartcodierten Werte gefunden.
- Dieser Bericht dokumentiert den Befund; die empfohlene Verhaltensänderung wurde nicht umgesetzt.
