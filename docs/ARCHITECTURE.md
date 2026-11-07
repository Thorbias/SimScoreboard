# Architecture — SimScoreboard

> Technical direction. Updated when the structure changes through new features or
> decisions (ADRs). **As of 2026-11-01:** The model of the result files is
> adapted to [ADR-0002](decisions/ADR-0002-lmu-result-format.md); whatever depends
> on telemetry is unverified.

## Technology stack

| Layer | Technology | Decision |
|---|---|---|
| Language | TypeScript | [ADR-0001](decisions/ADR-0001-typescript-vite.md) |
| Build / dev server | Vite | [ADR-0001](decisions/ADR-0001-typescript-vite.md) |
| UI framework | React | [ADR-0003](decisions/ADR-0003-ui-framework-and-charts.md) |
| Design | CSS tokens in `src/design/`, Inter bundled with the site, pit orange as accent, sector bar | [ADR-0005](decisions/ADR-0005-design-tokens-and-brand-accent.md) |
| Charts | uPlot (time series), own SVG (position chart; d3 not needed so far) | [ADR-0003](decisions/ADR-0003-ui-framework-and-charts.md) |
| Reading telemetry | open, probably DuckDB-WASM | [ADR-0008](decisions/ADR-0008-telemetry-duckdb.md), backlog 1 |
| Folder access | File System Access API, fallback folder picker/drag-and-drop | [F-001](FEATURES.md) |
| Local data | IndexedDB | [ADR-0004](decisions/ADR-0004-data-storage-and-reading.md) |
| Hosting | static (GitHub Pages) | backlog 8 |

## Basic principles

- **Everything client-side.** No backend, no upload of the game files
  ([PRODUCT.md](PRODUCT.md) NF-001). The commitment is enforced technically: a
  content security policy with a restricted `connect-src` keeps the page from
  sending data to foreign addresses.
- **Parsing in a worker.** Reading and evaluating the files runs in web workers,
  so that the interface stays smooth with more than 1,000 sessions (NF-003).
- **Index with metadata only.** The session list lives on the small index; the
  details (laps, telemetry) are read from the original file on demand.
- **Demo next to the library.** The anonymized demo sessions (`public/demo`) go
  through the same reading path as files from a game folder, but are never stored
  and do not touch the index, names or favorites.
- **One normalized domain model.** The parsers translate the file formats into
  this model; the interface knows no file formats. This also keeps the league
  aggregation ([IDEA-0001](ideations/IDEA-0001-custom-league.md)) simple.

## Data flow (draft)

```
folder/files ──► parser (worker) ──► domain model ──► index (IndexedDB, metadata only)
                                           │                       │
                                           ▼                       ▼
                                  details on demand         session list
                                  (result, laps,            statistics view
                                   incidents, telemetry)
```

## Domain model

Result files: verified (ADR-0002). Every field except the header and the basic
driver data is optional, because game version and mode influence it.

| Term | Content |
|---|---|
| Event | Group of sessions of the same weekend; key: track and `DateTime` from the header |
| Session | Key: file name. Type (practice, qualifying, race), track, layout, end (from the name), start, length in minutes, track length, game version, mode |
| Entry | Participation of a car: car number, car, class, team, position, class position, grid position, status (`None`, `Finished Normally`, `DNF`, `DQ`), lap count, number of pit stops, driving aids |
| Driver | Name as it appears in the file; **no stable ID**. "Own driver" results from an alias list and a comparison without the `#` suffix (F-003) |
| Lap | Time, sectors 1–3 as individual times (missing for unscored laps), position, session time at the end of the lap, top speed, tire compound, pit flag; optional wear, fuel, virtual energy |
| Incident | Session time, type (contact, track limits, penalty), drivers involved, severity; only newer multiplayer files |
| ChatMessage | Session time, sender, text; only newer multiplayer files |
| Track | Venue and course from the file; country and flag from a table of our own (F-002) |
| TelemetryLap | **Unverified.** Channels along the lap distance; candidates according to the configuration: speed, throttle, brake, steering, RPM, GPS, track position, virtual energy. The gear is an event |

## Open

- Data storage (index, DuckDB-WASM only for telemetry or for the index as well):
  backlog 3.
- Telemetry schema: backlog 1, waits for a real recording.
- Parser: version tolerant, ignore unknown elements, load aborted sessions; check
  DOCTYPE in the browser parser (ADR-0002).
