# Backlog

> The **prioritized backlog** and at the same time the handover document between
> the development machines: **all** work items are in one place. Contains **only
> open items** — no session logs, no "done" history (that is in Git:
> `git log docs/BACKLOG.md`). Finished items are struck.
>
> **Open ideations:** see [`docs/ideations/`](ideations/) — unprioritized and
> deliberately not in this table.

## Handover (as of 2026-11-07)

The project scaffold and the stages "Results" and "Analysis" are in place and
accepted (sessions, results, lap chart, position chart, statistics, incidents,
chat; ADR-0002 to ADR-0004). Next step: telemetry (item 1). It waits for a real
recording: switch on the automatic recording in the game, drive a session, put the
file into `samples/` (see [samples/README.md](../samples/README.md)). Built and
awaiting acceptance are personal bests, favorites and track country (items 5 and
8). The design with pit orange is in place
([ADR-0005](decisions/ADR-0005-design-tokens-and-brand-accent.md)). The league
(organizer, race factor, dropped results, corrections, password protection, CSV
export) and its cloud storage (file, address, Google Drive, share link, read-only
for players) are built, accepted and released; the checks in item 17 are open.
Without telemetry, item 13 (offline operation) is also a good candidate.

Not yet **decided**:

- Whether the brand "SimScoreboard" is free (DPMA, EUIPO, USPTO). Account, repos
  and domains are checked
  ([ADR-0006](decisions/ADR-0006-project-name-simscoreboard.md)), the trademark
  registers are not (item 10).

**Type:** `Feature` · `ARC` (architecture enabler → ADR) · `Design` · `Chore`.
**Status:** `TODO` · `IN PROGRESS`.

The order is the priority. A **dependency** is a precedence constraint above the
ranking: a blocked item starts only when its predecessor is done. Details of the
F items in [FEATURES.md](FEATURES.md).

| # | Type | Status | Item | Depends on |
|:-:|---|---|---|---|
| 1 | ARC | TODO | **Verify the telemetry format** (according to the changelog DuckDB, according to the wiki `.ld`/`.csv`): switch on recording in the game and drive a session, examine the data file, own ADR with schema and channel list, then check F-012 and F-013. The result XML is done ([ADR-0002](decisions/ADR-0002-lmu-result-format.md)). Sources: [sources/](sources/README.md) | real telemetry recording in `samples/` |
| 3 | ARC | TODO | ADR on telemetry data storage: whether DuckDB-WASM is used (index and reading are decided in [ADR-0004](decisions/ADR-0004-data-storage-and-reading.md)) | 1 |
| 5 | Feature | IN PROGRESS | Built, awaiting acceptance: F-015 favorites, F-018 track country and flag. Then condense FEATURES.md | – |
| 7 | Feature | TODO | Telemetry: F-012 comparison of two laps, F-013 track map and key figures | 1 |
| 8 | Feature | IN PROGRESS | Built, awaiting acceptance: F-014 personal bests, F-019 overview. Then condense FEATURES.md | – |
| 10 | Chore | TODO | Secure the name: trademark check "SimScoreboard" (DPMA, EUIPO, USPTO), register a domain (repo and `origin` are already named so) ([ADR-0006](decisions/ADR-0006-project-name-simscoreboard.md)) | – |
| 11 | Chore | TODO | Derive anonymized telemetry fixtures (the result fixtures exist, see `tools/anonymize-results.mjs`) | 1 |
| 13 | Chore | TODO | Offline operation: service worker that caches the static files (NF-002) | – |
| 14 | Feature | IN PROGRESS | Built, awaiting acceptance: F-020 demo data | – |
| 16 | Feature | TODO | F-022 pit stop times from telemetry (no estimate from lap times) | 7 |
| 17 | Chore | TODO | Check what is still open for the league in cloud storage ([ADR-0009](decisions/ADR-0009-league-google-drive.md)): file handle after a browser restart, behavior on a second computer of the organizer. Before a release: set the repository variables `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` and enter the origin `https://thorbias.github.io` in the Google console | – |
| 18 | Chore | TODO | Check the retrieval of shared Drive leagues for robustness ([ADR-0009](decisions/ADR-0009-league-google-drive.md)): after many requests Google temporarily answered the retrieval with an API key for one network address with a block page. Checking the revision first is built (saves downloads); still to clarify: how often the block hits players (auto-refresh on opening, clicks on "Refresh"), whether fewer requests are enough (for example a minimum interval or only one request per opening) and whether another route is needed; the download address of Drive does not work in the browser (403 on a cross-site request). Observe before a release | 17 |
