# IDEA-0001 — Custom League

> **Status:** rough. Planned unique selling point; the planning is deliberately
> postponed. This ideation only records what is already foreseeable.

## Idea

Form a league from several sessions: define points systems, calculate driver and
team standings across races, show tables and progressions.

## What is already important now

- The data model (session → entry → driver) is built from the start so that a
  scoring can aggregate over it. The league is then an evaluation over existing
  sessions, not a special case in the parser.
- A league organizer has the result files of the races (host or server). A
  **local-first** start is obvious: the organizer loads the files, the app
  calculates the table, and a static export (e.g. JSON or a finished page) is shared.
  That needs no backend yet.

## To clarify

- **Storage location and sharing of the league data** (GitHub Pages, local,
  self-hosted, cloud storage): see
  [IDEA-0002](IDEA-0002-league-storage-and-sharing.md).

- **Driver identity:** Names in the result files are not necessarily unique. Is there
  a stable ID in the files? Depends on the format check (backlog 1).
- **Contradiction with PRODUCT §5:** "no backend, no accounts". Is the static export
  enough in the long run, or does a league with sign-in and a live table need a
  backend? That would be a product decision.
- **Points systems:** fixed templates or freely configurable? Dropped results, bonus
  points, penalties.
- **Multi-class races:** separate scoring per class.
- **Penalties and amendments:** correct results manually after the race.
