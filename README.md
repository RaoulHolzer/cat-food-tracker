# Katzenfutter-Tracker

Eine Web-Anwendung zum Verfolgen der Fütterungszeiten Ihrer Katzen.

## Installation

1. Node.js installieren (>=20)
2. Beispiel-Umgebungsdatei kopieren und anpassen:
```bash
cp .env.example .env
```

Werte in `.env` für Benutzer, Passwort und Session-Secret anpassen.

3. Abhängigkeiten installieren:
```bash
npm install
```

## Starten

Server starten:
```bash
npm start
```

Die Anwendung läuft dann auf http://localhost:3000

Empfehlung: Setzen Sie produktive Secrets (SESSION_SECRET, APP_USERNAME, APP_PASSWORD) als App Service Konfiguration (Application Settings) statt in einer Datei. Die `.env` wird durch `.gitignore` ausgeschlossen.

## Funktionen

- Katzen hinzufügen und löschen
- Fütterungen mit Menge und Zeit aufzeichnen
- Statistiken anzeigen (heute gefüttert, gesamt)
- Daten werden in SQLite-Datenbank gespeichert
- Spezielle Icons für Lilly ❤️ und Mimi ❤️❤️🐱

## Technologie

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js mit Express
- Datenbank: SQLite
- Tests: Playwright
- Infrastruktur: Azure Bicep Templates

## Tests

Ende-zu-Ende Tests ausführen:
```bash
npm test
```

Report anzeigen:
```bash
npm run test:report
```

## Deployment (Azure)

Infrastruktur-Definitionen befinden sich im Ordner `infra` mit Bicep-Dateien.

## Lizenz

MIT License - siehe `LICENSE`
