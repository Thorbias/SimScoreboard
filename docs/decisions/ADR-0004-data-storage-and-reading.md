# ADR-0004: Local index in IndexedDB, reading in a worker

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

The session library should stay fast with more than 1,000 sessions (NF-003) and
start quickly after the first read (F-016). The result files are up to 540 KB
([ADR-0002](ADR-0002-lmu-result-format.md)); the list needs only the header and the
basic driver data of them. Telemetry is not yet verified and determines the choice
of DuckDB-WASM (backlog 1).

## Decision

- **Index in IndexedDB.** One small record per session (header, classes, drivers
  with position and car number) plus size and modification time of the file. Next to
  it a store for settings (own driver names, language, folder access).
- **Details on demand.** Laps and results of a session are read from the original
  file when it is opened, not stored.
- **Reading in a web worker.** The worker reads the files, parses them and delivers
  summaries in packages; the interface shows the progress. On a repeated read only
  new or changed files (size, modification time) are processed, vanished files leave
  the index.
- **Own, tolerant XML reader** instead of `DOMParser`. The latter is missing in web
  workers and in the test environment. The reader skips the internal DOCTYPE (which
  settles the open question from ADR-0002) and also loads truncated files.
- **Folder access:** In Chromium the index remembers the folder handle; after a
  restart the user has to allow access again with one click. Other browsers use a
  folder picker; there the page knows the files only until it is reloaded.
- **Best effort.** If IndexedDB is not available, the app keeps working with an
  in-memory index and points that out.
- **DuckDB-WASM is not part of this decision.** It is considered only for telemetry
  and gets an ADR of its own as soon as the format is verified.

## Alternatives

- **Keep everything in memory:** simple, but 465+ files parsed anew on every start
  and several hundred MB of memory.
- **Laps in the index as well:** faster detail views, but a multiple of the memory
  and schema maintenance that can change with every game update.
- **DuckDB-WASM for the index as well:** powerful queries, but a large download and
  additional complexity, without the library needing it.

## Consequences

- The list starts from the index without reading the folder. Details of a session
  open only once the folder is connected.
- If the shape of the index records changes, the index has to be rebuilt; for that
  there is "Delete local index" in the settings and the version number of the
  database.
- Drivers are recognized only by their name (no stable key in the game); the
  assignment to the own driver is a setting.
