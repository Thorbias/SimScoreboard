# ADR-0008: Telemetry is read with DuckDB-WASM, track map from the game's coordinates

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The first real recording is available (practice, Silverstone GP layout, GT3, around
300 s, one full lap plus out lap, 8 MB). It resolves backlog 1 and 3. The file stays
in `samples/` (it contains the driver name from the metadata); tests need a small,
anonymized fixture.

## Verified structure

- **Location:** `UserData/Telemetry/`, one file per recording, name
  `<track>_<session type>_<timestamp>.duckdb` (`P` = practice; further abbreviations
  are unverified). Next to it `config.json` with the enabled channels and their
  frequency; it describes only the setting, the file itself is complete.
- **Format:** a **DuckDB database** (written with DuckDB 1.4.0), not a text format. A
  home-grown reader is out of the question (compressed, versioned storage format).
- **Tables:** one per channel or event (101 in the example), plus `metadata`,
  `channelsList`, `eventsList`.
  - `metadata` (key/value): `DriverName`, `TrackName`, `TrackLayout`, `SessionType`,
    `SessionTime`, `RecordingTime`, `WeatherConditions`, `CarName`, `CarClass`,
    `CarSetup` (JSON), `Version`.
  - **Channels** (column `value`, **without a timestamp**): sampled evenly at the
    frequency from `channelsList` (1–100 Hz). The time results from the index; the
    recording time begins at 3.68 s session time. Tire, spring and wheel data have
    `value1`…`value4`.
  - **Events** (`ts`, `value`): only state changes, for example `Lap`, `Gear`,
    `Current Sector`, `In Pits`, `Lap Time`, `Last Sector1/2`.
  - Track position: `Lap Dist` (meters since start/finish, jumps to 0 at the end of
    the lap) and `Total Dist`.
- **Laps:** `Lap` delivers the lap changes with `ts`; the lap time is in `Lap Time`
  (example: 136.99 s).

## Decision

- **Reading with DuckDB-WASM** in a web worker, only when a recording is opened
  (lazy loaded), never when the folder is read. The session index stays without
  DuckDB (ADR-0004).
  - **Checked:** DuckDB-WASM 1.5.4 opens the 1.4.0 file read-only
    (`ATTACH … (READ_ONLY)` on a buffer) and reads channels and `metadata`.
  - **Cost:** The WASM is around 36 MB (8 MB gzip) and is used only when someone
    opens telemetry. GitHub Pages serves it compressed.
- **A slim lap structure is built from the database:** per lap channels over the
  track (`Lap Dist`) converted to a fixed grid. The comparisons (F-012) and the map
  (F-013) work only on that, not on SQL.
- **Track map from `GPS Latitude`/`GPS Longitude`.** These are not real coordinates
  (example: about 60.0° N and 0.0° E, Silverstone lies at 52° N), but a flat
  projection around this point. With longitude × cos(60°) and 111 km per degree of
  latitude the length is right: 5,833 m against 5,863 m `Lap Dist`, the course stays
  within 1 % over the whole lap, start and end are 6 m apart. The conversion is thus:
  x = longitude · 111 km · cos(60°), y = (latitude − 60°) · 111 km.
  **Assumption:** the center is 60° N / 0° E for every track. Check against a second
  track before building.
- **Assignment to the result session** through track, driver name and time
  (`RecordingTime`, `SessionTime`); it can be determined unambiguously only with
  several recordings. Telemetry without a matching session stays openable.

## Alternatives

- **Write a DuckDB reader of our own:** too costly and brittle with every DuckDB
  version.
- **Have the user convert the file beforehand (CSV/Parquet):** breaks the app's
  "choose folder, done".
- **Read server-side:** contradicts "everything local".

## Consequences

- The CSP needs `'wasm-unsafe-eval'` in `script-src` for the WASM (currently
  `'self'`, see `vite.config.ts`); `worker-src` already allows `blob:`.
- The bundle of the main page does not grow; the WASM is a file of its own.
- The fixture for tests: a few seconds from a recording, driver name replaced. A
  DuckDB file is binary; the script that produces it belongs in the repo.

## Open

- At least one recording with **several laps** and a **race recording** (lap change in
  the pit, tire change, multi-class field).
- Which channels carry F-012/F-013 (proposal: speed, throttle, brake, steering, gear,
  RPM; plus the map).
- Session type abbreviations in the file name besides `P`.
- Memory need of the recording in long races (read in one piece or per channel).
