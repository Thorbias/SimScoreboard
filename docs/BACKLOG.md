# Backlog

> Der **priorisierte Backlog** und zugleich Übergabedokument zwischen den
> Entwicklungsrechnern. Enthält **nur offene Punkte** — keine Sitzungsprotokolle,
> keine „Erledigt"-Historie (die steht in Git: `git log docs/BACKLOG.md`).
> Erledigte Punkte werden gestrichen.
>
> **Offene Ideations:** siehe [`docs/ideations/`](ideations/) — unpriorisiert und
> bewusst nicht in dieser Tabelle.

**Typ:** `Feature` · `ARC` (Architektur-Enabler → ADR) · `Chore`.
**Status:** `TODO` · `IN PROGRESS`.

Die Reihenfolge ist die Priorität. Eine **Abhängigkeit** steht als Vorrang-
Constraint über dem Ranking: ein blockierter Punkt startet erst, wenn sein
Vorgänger erledigt ist.

| # | Typ | Status | Punkt | Abhängig von |
|:-:|---|---|---|---|
| 1 | ARC | TODO | **Beispieldateien auswerten und die Dateiformate verifizieren:** Result-Dateien (vermutlich XML) und Telemetrie (laut Changelog DuckDB, laut Wiki `.ld`/`.csv`). Ergebnis: ADR mit Schema und Kanalliste | Beispieldateien vom Windows-PC in `samples/` |
| 2 | ARC | TODO | Projektgerüst: Vite + TypeScript, Lint, Typecheck, Unit-Test-Runner, Build (Doku-Befehle in AGENTS.md ergänzen) | ADR-0001 angenommen |
| 3 | ARC | TODO | ADR zur Datenhaltung: Metadaten-Index (IndexedDB), ob DuckDB-WASM nur für Telemetrie oder auch für den Index genutzt wird | 1 |
| 4 | Feature | TODO | Results: Ordner laden (File System Access API plus Fallback), Session-Liste mit Filtern, Ergebnistabelle nach Klasse, Qualifying | 1, 2, 3 |
| 5 | Feature | TODO | Analyse: Lap Chart, Position Chart, Statistics, Incidents | 4 |
| 6 | Feature | TODO | Telemetry: zwei Runden überlagern, Delta, Sektoren, Streckenkarte | 1, 4 |
| 7 | Feature | TODO | Lap Times: Bestzeiten-Bibliothek pro Strecke, Auto und Klasse | 4 |
| 8 | Chore | TODO | GitHub-Repo anlegen und GitHub Pages einrichten (nur nach ausdrücklicher Freigabe) | 2 |
| 9 | Chore | TODO | Anonymisierte Test-Fixtures aus den echten Beispieldateien ableiten | 1 |
