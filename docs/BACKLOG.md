# Backlog

> Der **priorisierte Backlog** und zugleich Übergabedokument zwischen den
> Entwicklungsrechnern: **alle** Arbeitspunkte stehen hier an einer Stelle. Enthält
> **nur offene Punkte** — keine Sitzungsprotokolle, keine „Erledigt"-Historie (die
> steht in Git: `git log docs/BACKLOG.md`). Erledigte Punkte werden gestrichen.
>
> **Offene Ideations:** siehe [`docs/ideations/`](ideations/) — unpriorisiert und
> bewusst nicht in dieser Tabelle.

## Übergabe (Stand 2026-11-01)

Das Projekt ist angelegt und gepusht, es gibt noch **keinen Code**. Nächster Schritt
am Windows-PC:

1. Repo klonen oder `git pull`.
2. Echte Spieldateien nach `samples/` legen (Details in
   [samples/README.md](../samples/README.md)): 1–2 Result-Dateien und 1–2
   Telemetrie-Dateien, ideal ein Rennen und ein Qualifying, in denen der Entwickler
   selbst gefahren ist.
3. Sitzung starten und mit **Punkt 1** beginnen: die Dateien untersuchen, Schema und
   Kanäle dokumentieren, daraus das ADR schreiben.

Noch **nicht entschieden**:

- UI-Framework und Chart-Bibliothek (Punkt 2).
- Ob der Name „SimPaddock" frei ist (GitHub, Domain, Marke) — nicht geprüft
  (Punkt 10).
- Das gemeinsame Branding mit SimPosture (Farben, Typografie, Logo) ist noch nicht
  umgesetzt (Punkt 9).

**Typ:** `Feature` · `ARC` (Architektur-Enabler → ADR) · `Design` · `Chore`.
**Status:** `TODO` · `IN PROGRESS`.

Die Reihenfolge ist die Priorität. Eine **Abhängigkeit** steht als Vorrang-
Constraint über dem Ranking: ein blockierter Punkt startet erst, wenn sein
Vorgänger erledigt ist. Details der F-Punkte in [FEATURES.md](FEATURES.md).

| # | Typ | Status | Punkt | Abhängig von |
|:-:|---|---|---|---|
| 1 | ARC | TODO | **Beispieldateien auswerten und die Dateiformate verifizieren:** Result-Dateien (vermutlich XML) und Telemetrie (laut Changelog DuckDB, laut Wiki `.ld`/`.csv`). Ergebnis: ADR mit Schema und Kanalliste, danach [FEATURES.md](FEATURES.md) und [ARCHITECTURE.md](ARCHITECTURE.md) gegen die Realität prüfen. Quellen: [quellen/](quellen/README.md) | Beispieldateien vom Windows-PC in `samples/` |
| 2 | ARC | TODO | Projektgerüst: Vite + TypeScript, UI-Framework und Chart-Bibliothek wählen (ADR), Lint, Typecheck, Test-Runner, Build; Befehle in GUIDELINES „Testen" und AGENTS.md eintragen | ADR-0001 angenommen |
| 3 | ARC | TODO | ADR zur Datenhaltung: Metadaten-Index (IndexedDB), ob DuckDB-WASM nur für Telemetrie oder auch für den Index genutzt wird | 1 |
| 4 | Feature | TODO | Grundlage: F-001 Ordner einlesen, F-002 Session-Bibliothek, F-006 Session-Kopf, F-016 Lokaler Index, F-017 Mehrsprachigkeit | 1, 2, 3 |
| 5 | Feature | TODO | Ergebnisse: F-003 Eigener Fahrer, F-004 Rennergebnis, F-005 Qualifying, F-015 Favoriten | 4 |
| 6 | Feature | TODO | Analyse: F-007 Lap Chart, F-008 Position Chart, F-009 Statistiken, F-010 Incidents, F-011 Chat | 5 |
| 7 | Feature | TODO | Telemetry: F-012 Vergleich zweier Runden, F-013 Streckenkarte und Kennzahlen | 1, 5 |
| 8 | Feature | TODO | Lap Times: F-014 Persönliche Bestzeiten | 5 |
| 9 | Design | TODO | Branding mit SimPosture abstimmen: Farben, Typografie, Logo als Design-Tokens; eigenes Design ([PRODUCT.md](PRODUCT.md) §5) | 2 |
| 10 | Chore | TODO | Namensprüfung „SimPaddock": GitHub, Domain, Marken- und Namenskonflikte | – |
| 11 | Chore | TODO | Anonymisierte Test-Fixtures aus den echten Beispieldateien ableiten (Namen, Teams, IDs ersetzen) | 1 |
| 12 | Chore | TODO | GitHub Pages einrichten (nur nach ausdrücklicher Freigabe) | 2 |
