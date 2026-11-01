# Produkt — SimPaddock

> Der **Rahmen** des Produkts: was SimPaddock ist, für wen, welche Qualitäts-
> anforderungen gelten und was bewusst **nicht** dazugehört. Dauerhaftes
> Dokument — es beschreibt keine einzelnen Funktionen und keinen Arbeitsstand
> (der steht in [BACKLOG.md](BACKLOG.md)).

## 1. Vision & Zweck

SimPaddock macht aus den Dateien, die Le Mans Ultimate ohnehin schreibt,
verwertbare Erkenntnisse: Ergebnisse prüfen, Runden vergleichen, Telemetrie
auswerten und die eigenen Bestzeiten ordnen — komplett im Browser, Open Source
und ohne Konto.

Später kommt eine **Custom-League-Funktion** dazu (Punktewertung und Tabellen
über mehrere Sessions). Das ist das geplante Alleinstellungsmerkmal, aber noch
nicht ausgearbeitet ([IDEA-0001](ideations/IDEA-0001-custom-league.md)).

## 2. Zielgruppe

LMU-Spieler am PC, vom Gelegenheitsfahrer bis zum ambitionierten Liga-Fahrer, die
ihre Sessions nachträglich analysieren wollen. Später zusätzlich Liga-
Organisatoren.

## 3. Plattform

- **Web**, moderne Desktop-Browser. Voller Funktionsumfang (Ordnerzugriff auf die
  Spieledaten) in Chromium-Browsern; Firefox und Safari bekommen einen Fallback
  über Drag-and-drop bzw. Ordner-Auswahl.
- Hosting als statische Seite (z. B. GitHub Pages), kein Backend.

## 4. Nicht-funktionale Anforderungen

| ID | Kategorie | Anforderung |
|---|---|---|
| NF-001 | Datenschutz | Die Dateien des Spiels werden nur lokal im Browser verarbeitet und nie hochgeladen |
| NF-002 | Offline | Nach dem ersten Laden funktioniert die Anwendung ohne Internetverbindung |
| NF-003 | Skalierung | Bibliotheken mit über 1.000 Sessions bleiben flink: Parsen in Web Workern, Liste nur mit Metadaten, Details bei Bedarf |
| NF-004 | Sprachen | UI mehrsprachfähig (i18n); Englisch ist Default |
| NF-005 | Lizenz | MIT; keine Übernahme von Code, Branding oder Assets Dritter |

## 5. Abgrenzung (Out of Scope)

- **Kein Overlay und keine Live-Telemetrie.** Das Spiel gibt Live-Daten per Shared
  Memory aus, darauf kommt ein Browser nicht. Eine Lockerung wäre ein eigenes
  Projekt (lokaler Helfer plus WebSocket) und eine eigene Ideation.
- **Kein Backend und keine Nutzerkonten** in der ersten Ausbaustufe. Die League-
  Funktion muss zeigen, ob das haltbar bleibt (IDEA-0001).
- **Eigenes Design, keine fremden Assets.** Hersteller-Logos und Streckenfotos
  werden nicht mitgeliefert.
- **Inoffiziell:** Kein Produkt des Spielherstellers und nicht mit ihm verbunden.

## 6. Reihenfolge der Ausbaustufen

1. **Results:** Session-Bibliothek, Ergebnisse nach Klasse, Qualifying.
2. **Analyse:** Lap Chart, Position Chart, Statistics, Incidents.
3. **Telemetry:** Zwei Runden vergleichen, Delta, Streckenkarte.
4. **Lap Times:** Persönliche Bestzeiten pro Strecke, Auto und Klasse.
5. **League:** später, siehe IDEA-0001.

Die konkreten Arbeitsschritte stehen in [BACKLOG.md](BACKLOG.md).
