# Architektur — SimPaddock

> Technische Ausrichtung. Wird fortgeschrieben, wenn sich der Aufbau durch neue
> Features oder Entscheidungen (ADRs) ändert. **Stand 2026-11-01: Entwurf vor der
> Formatprüfung** — alles, was an den Dateiformaten hängt, ist als solches
> markiert und wird nach Backlog 1 überarbeitet.

## Technologie-Stack

| Ebene | Technologie | Entscheidung |
|---|---|---|
| Sprache | TypeScript | [ADR-0001](decisions/ADR-0001-typescript-vite.md) |
| Build / Dev-Server | Vite | [ADR-0001](decisions/ADR-0001-typescript-vite.md) |
| UI-Framework | offen | Backlog 2 (eigenes ADR) |
| Charts | offen, Kandidaten uPlot und D3 | Backlog 2 |
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
- **Ein normalisiertes Domänenmodell.** Die Parser übersetzen die Dateiformate in
  dieses Modell; die Oberfläche kennt keine Dateiformate. Das hält auch die
  League-Aggregation ([IDEA-0001](ideations/IDEA-0001-custom-league.md)) einfach.

## Datenfluss (Entwurf)

```
Ordner/Dateien ──► Parser (Worker) ──► Domänenmodell ──► Index (IndexedDB, nur Metadaten)
                                              │                       │
                                              ▼                       ▼
                                    Details bei Bedarf        Session-Bibliothek
                                    (Ergebnis, Runden,        Bestzeiten-Bibliothek
                                     Incidents, Telemetrie)
```

## Domänenmodell (Entwurf, unverifiziert)

| Begriff | Inhalt |
|---|---|
| Session | Typ (Training, Qualifying, Rennen), Strecke, Layout, Datum, Länge, Streckenlänge |
| Entry | Teilnahme eines Fahrzeugs: Startnummer, Fahrzeug, Klasse, Endergebnis, Fahrer |
| Driver | Fahrername; eine stabile ID ist **unbekannt** (relevant für die League) |
| Lap | Rundenzeit, Sektoren 1–3, gültig/ungültig, Reifenmischung, Position |
| PitStop | Runde, Dauer |
| Incident | Zeitpunkt, Typ, beteiligte Fahrer, Schwere |
| ChatMessage | Zeitpunkt, Absender, Text (falls vorhanden) |
| TelemetryLap | Kanäle über die Rundenstrecke: Geschwindigkeit, Gas, Bremse, Lenkwinkel, Gang, Virtual Energy, Position |

## Offen

- UI-Framework und Charts: Backlog 2.
- Datenhaltung (Index, DuckDB-WASM nur für Telemetrie oder auch für den Index):
  Backlog 3.
- Schema der Result-Dateien und der Telemetrie: Backlog 1.
