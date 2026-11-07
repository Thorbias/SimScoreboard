# Sources

> Evidence on file formats and technology. As of 2026-11-01. **Everything here is
> research, not verification:** the statements were not checked against real files
> (that is backlog 1). Only added to; verified findings move into an ADR or into
> [ARCHITECTURE.md](../ARCHITECTURE.md).

## Game files

| Source | Statement | Verified |
|---|---|---|
| [LMU wiki: Telemetry](https://lemansultimate.wiki.gg/wiki/Telemetry) | The game writes `.ld` and `.csv` logs to `Documents/Le Mans Ultimate/Telemetry`; MoTeC i2 reads the `.ld` files. Channels named include RPM, throttle, brake, steering angle, gear, tires, suspension, aero, environment. The path of the session result files is not given there. | no |
| [Update V1.2 changelog](https://www.bsimracing.com/le-mans-ultimate-update-v1-2-full-changelog/) | V1.2 (December 2025) added "Telemetry Recording to DuckDB" and a changed file name format for telemetry. | no |
| [pyLMUSharedMemory](https://github.com/blortle-dev/pyLMUSharedMemory) | Community library for the game's shared memory access (`LMU_Data`). Relevant only for a possible live function, which is currently out of scope. | no |

Open questions for the real files:

- Where are the result files (probably in the game's `UserData` folder), and what
  format do they have (probably XML as with rFactor 2)?
- Which fields do they contain: laps, sectors, stints, tires, pit stops, incidents,
  chat, driver IDs?
- Which telemetry formats does the current game version actually write
  (`.duckdb`, `.ld`, `.csv`), and how is the DuckDB schema built?
- Does the telemetry contain position data for the track map and a channel for
  virtual energy?

## Technology

| Source | Statement |
|---|---|
| [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) | Folder access in the browser (`showDirectoryPicker`); full support only in Chromium browsers. |
| [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) | DuckDB in the browser; can read files locally and query them with SQL. |
