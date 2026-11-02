# Architektur — SimScoreboard

> Technische Ausrichtung. Wird fortgeschrieben, wenn sich der Aufbau durch neue
> Features oder Entscheidungen (ADRs) ändert. **Stand 2026-11-01:** Das Modell der
> Result-Dateien ist an [ADR-0002](decisions/ADR-0002-lmu-result-format.md)
> angepasst; was an der Telemetrie hängt, ist unverifiziert.

## Technologie-Stack

| Ebene | Technologie | Entscheidung |
|---|---|---|
| Sprache | TypeScript | [ADR-0001](decisions/ADR-0001-typescript-vite.md) |
| Build / Dev-Server | Vite | [ADR-0001](decisions/ADR-0001-typescript-vite.md) |
| UI-Framework | React | [ADR-0003](decisions/ADR-0003-ui-framework-und-charts.md) |
| Design | CSS-Tokens in `src/design/`, Inter selbst eingebunden, Pit-Orange als Akzent, Sektor-Leiste | [ADR-0005](decisions/ADR-0005-design-tokens-und-markenakzent.md) |
| Charts | uPlot (Zeitreihen), eigenes SVG (Positionsverlauf; d3 bisher nicht nötig) | [ADR-0003](decisions/ADR-0003-ui-framework-und-charts.md) |
| Telemetrie lesen | offen, voraussichtlich DuckDB-WASM | Backlog 1 und 3 |
| Ordnerzugriff | File System Access API, Fallback Ordner-Auswahl/Drag-and-drop | [F-001](FEATURES.md) |
| Lokale Daten | IndexedDB | Backlog 3 |
| Hosting | statisch (GitHub Pages) | Backlog 8 |

## Grundprinzipien

- **Alles clientseitig.** Kein Backend, kein Upload der Spieldateien
  ([PRODUCT.md](PRODUCT.md) NF-001). Vorgesehen ist, die Zusage technisch zu
  erzwingen: eine Content-Security-Policy mit `connect-src 'self'` verhindert, dass
  die Seite Daten an Fremdadressen schickt.
- **Parsen im Worker.** Das Lesen und Auswerten der Dateien läuft in Web Workern,
  damit die Oberfläche auch bei über 1.000 Sessions flüssig bleibt (NF-003).
- **Index nur mit Metadaten.** Die Session-Liste lebt vom kleinen Index; die Details
  (Runden, Telemetrie) werden bei Bedarf aus der Originaldatei gelesen.
- **Demo neben der Bibliothek.** Die anonymisierten Demo-Sessions (`public/demo`)
  laufen durch denselben Lesepfad wie Dateien aus einem Spielordner, werden aber
  nie gespeichert und berühren Index, Namen und Favoriten nicht.
- **Ein normalisiertes Domänenmodell.** Die Parser übersetzen die Dateiformate in
  dieses Modell; die Oberfläche kennt keine Dateiformate. Das hält auch die
  League-Aggregation ([IDEA-0001](ideations/IDEA-0001-custom-league.md)) einfach.

## Datenfluss (Entwurf)

```
Ordner/Dateien ──► Parser (Worker) ──► Domänenmodell ──► Index (IndexedDB, nur Metadaten)
                                              │                       │
                                              ▼                       ▼
                                    Details bei Bedarf        Session-Liste     
                                    (Ergebnis, Runden,        Bestzeiten-Ansicht 
                                     Incidents, Telemetrie)
```

## Domänenmodell

Result-Dateien: verifiziert (ADR-0002). Jedes Feld außer dem Kopf und den
Fahrer-Eckdaten ist optional, weil Spielversion und Modus es beeinflussen.

| Begriff | Inhalt |
|---|---|
| Event | Gruppe von Sessions desselben Wochenendes; Schlüssel: Strecke und `DateTime` aus dem Kopf |
| Session | Schlüssel: Dateiname. Typ (Training, Qualifying, Rennen), Strecke, Layout, Ende (aus dem Namen), Start, Länge in Minuten, Streckenlänge, Spielversion, Modus |
| Entry | Teilnahme eines Fahrzeugs: Startnummer, Fahrzeug, Klasse, Team, Position, Klassenposition, Startplatz, Status (`None`, `Finished Normally`, `DNF`, `DQ`), Rundenzahl, Anzahl Boxenstopps, Fahrhilfen |
| Driver | Name, wie er in der Datei steht; **keine stabile ID**. „Eigener Fahrer" entsteht durch Alias-Liste und Abgleich ohne `#`-Kennung (F-003) |
| Lap | Zeit, Sektoren 1–3 als Einzelzeiten (fehlen bei nicht gewerteten Runden), Position, Session-Zeit am Rundenende, Höchstgeschwindigkeit, Reifenmischung, Box-Flag; optional Verschleiß, Kraftstoff, Virtual Energy |
| Incident | Session-Zeit, Typ (Kontakt, Track Limits, Strafe), beteiligte Fahrer, Stärke; nur neuere Mehrspieler-Dateien |
| ChatMessage | Session-Zeit, Absender, Text; nur neuere Mehrspieler-Dateien |
| Track | Venue und Course aus der Datei; Land und Flagge aus einer eigenen Streckentabelle (F-002) |
| TelemetryLap | **Unverifiziert.** Kanäle über die Rundenstrecke; Kandidaten laut Konfiguration: Geschwindigkeit, Gas, Bremse, Lenkung, Drehzahl, GPS, Streckenposition, Virtual Energy. Der Gang ist ein Ereignis |

## Offen

- Datenhaltung (Index, DuckDB-WASM nur für Telemetrie oder auch für den Index):
  Backlog 3.
- Schema der Telemetrie: Backlog 1, wartet auf eine echte Aufzeichnung.
- Parser: versionstolerant, unbekannte Elemente ignorieren, abgebrochene Sessions
  laden; DOCTYPE im Browser-Parser prüfen (ADR-0002).
