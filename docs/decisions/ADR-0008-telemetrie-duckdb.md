# ADR-0008: Telemetrie liest DuckDB-WASM, Streckenkarte aus den Spiel-Koordinaten

- **Status:** Angenommen
- **Datum:** 2026-11-02

## Kontext

Die erste echte Aufzeichnung liegt vor (Practice, Silverstone GP-Layout, GT3,
rund 300 s, eine volle Runde plus Outlap, 8 MB). Sie löst Backlog 1 und 3. Die
Datei bleibt in `samples/` (sie enthält den Fahrernamen aus den Metadaten);
Tests brauchen eine anonymisierte, kleine Fixture.

## Verifizierter Aufbau

- **Ablage:** `UserData/Telemetry/`, ein File je Aufzeichnung, Name
  `<Strecke>_<Sessiontyp>_<Zeitstempel>.duckdb` (`P` = Practice; weitere Kürzel
  sind unverifiziert). Daneben `config.json` mit den aktivierten Kanälen und
  ihrer Frequenz; sie beschreibt nur die Einstellung, die Datei selbst ist
  vollständig.
- **Format:** eine **DuckDB-Datenbank** (geschrieben mit DuckDB 1.4.0), kein
  Textformat. Ein Eigenbau-Leser kommt nicht in Frage (komprimiertes,
  versioniertes Speicherformat).
- **Tabellen:** eine je Kanal oder Ereignis (101 im Beispiel), dazu
  `metadata`, `channelsList`, `eventsList`.
  - `metadata` (Schlüssel/Wert): `DriverName`, `TrackName`, `TrackLayout`,
    `SessionType`, `SessionTime`, `RecordingTime`, `WeatherConditions`,
    `CarName`, `CarClass`, `CarSetup` (JSON), `Version`.
  - **Kanäle** (Spalte `value`, **ohne Zeitstempel**): gleichmäßig abgetastet mit
    der Frequenz aus `channelsList` (1–100 Hz). Die Zeit ergibt sich aus dem
    Index; die Aufnahmezeit beginnt bei 3,68 s Sessionzeit. Reifen-, Feder- und
    Raddaten haben `value1`…`value4`.
  - **Ereignisse** (`ts`, `value`): nur Zustandswechsel, zum Beispiel `Lap`,
    `Gear`, `Current Sector`, `In Pits`, `Lap Time`, `Last Sector1/2`.
  - Streckenposition: `Lap Dist` (Meter seit Start/Ziel, springt am Rundenende
    auf 0) und `Total Dist`.
- **Runden:** `Lap` liefert die Rundenwechsel mit `ts`; die Rundenzeit steht in
  `Lap Time` (Beispiel: 136,99 s).

## Entscheidung

- **Lesen mit DuckDB-WASM** im Web Worker, nur beim Öffnen einer Aufzeichnung
  (lazy geladen), nie beim Einlesen des Ordners. Der Index der Sessions bleibt
  ohne DuckDB (ADR-0004).
  - **Geprüft:** DuckDB-WASM 1.5.4 öffnet die 1.4.0-Datei schreibgeschützt
    (`ATTACH … (READ_ONLY)` auf einen Puffer) und liest Kanäle und `metadata`.
  - **Kosten:** Das WASM ist rund 36 MB groß (8 MB gzip) und kommt nur zum
    Einsatz, wenn jemand die Telemetrie öffnet. GitHub Pages liefert es
    komprimiert aus.
- **Aus der Datenbank wird eine schmale Rundenstruktur gebaut:** je Runde
  Kanäle über die Strecke (`Lap Dist`) auf ein festes Raster umgerechnet. Die
  Vergleiche (F-012) und die Karte (F-013) arbeiten nur darauf, nicht auf SQL.
- **Streckenkarte aus `GPS Latitude`/`GPS Longitude`.** Das sind keine echten
  Koordinaten (Beispiel: ca. 60,0° N und 0,0° E, Silverstone liegt bei 52° N),
  sondern ein flacher Entwurf um diesen Punkt. Mit Längengrad × cos(60°) und
  111 km je Breitengrad stimmt die Länge: 5.833 m gegen 5.863 m `Lap Dist`, der
  Verlauf bleibt über die ganze Runde innerhalb von 1 %, Start und Ende liegen 6 m
  auseinander. Die Umrechnung ist damit: x = Längengrad · 111 km · cos(60°), y = (Breitengrad − 60°) · 111 km.
  **Annahme:** der Mittelpunkt ist bei jeder Strecke 60° N / 0° E. Vor dem Bau
  gegen eine zweite Strecke prüfen.
- **Zuordnung zur Result-Session** über Strecke, Fahrername und Zeit
  (`RecordingTime`, `SessionTime`); eindeutig bestimmbar ist sie erst mit
  mehreren Aufzeichnungen. Telemetrie ohne passende Session bleibt öffnbar.

## Alternativen

- **Eigenen DuckDB-Leser schreiben:** zu aufwendig und bei jeder DuckDB-Version
  brüchig.
- **Datei vom Anwender vorab konvertieren lassen (CSV/Parquet):** bricht das
  „Ordner wählen, fertig“ der App.
- **Server-seitig lesen:** widerspricht „alles lokal“.

## Folgen

- Die CSP braucht für das WASM `'wasm-unsafe-eval'` in `script-src` (derzeit
  `'self'`, siehe `vite.config.ts`); `worker-src` erlaubt bereits `blob:`.
- Der Bundle der Hauptseite wächst nicht; das WASM ist eine eigene Datei.
- Die Fixture für Tests: wenige Sekunden aus einer Aufzeichnung, Fahrername
  ersetzt. Eine DuckDB-Datei ist binär; das Skript, das sie erzeugt, gehört mit
  ins Repo.

## Offen

- Mindestens eine Aufnahme mit **mehreren Runden** und eine **Rennaufnahme**
  (Rundenwechsel in der Box, Reifenwechsel, Mehrklassenfeld).
- Welche Kanäle für F-012/F-013 tragen (Vorschlag: Geschwindigkeit, Gas, Bremse,
  Lenkung, Gang, Drehzahl; dazu die Karte).
- Sessiontyp-Kürzel im Dateinamen außer `P`.
- Speicherbedarf der Aufnahme bei langen Rennen (Einlesen im Stück oder pro
  Kanal).
