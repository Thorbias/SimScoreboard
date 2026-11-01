# Backlog

> Der **priorisierte Backlog** und zugleich Übergabedokument zwischen den
> Entwicklungsrechnern: **alle** Arbeitspunkte stehen hier an einer Stelle. Enthält
> **nur offene Punkte** — keine Sitzungsprotokolle, keine „Erledigt"-Historie (die
> steht in Git: `git log docs/BACKLOG.md`). Erledigte Punkte werden gestrichen.
>
> **Offene Ideations:** siehe [`docs/ideations/`](ideations/) — unpriorisiert und
> bewusst nicht in dieser Tabelle.

## Übergabe (Stand 2026-11-01)

Das Projektgerüst steht (React, uPlot, Vite;
[ADR-0003](decisions/ADR-0003-ui-framework-und-charts.md)), Fachcode gibt es noch
nicht. Die Result-XML ist an echten Dateien geprüft
([ADR-0002](decisions/ADR-0002-lmu-result-format.md)). Nächster Schritt: **Punkt 3**
(ADR Datenhaltung), danach Punkt 4. Die Telemetrie (Punkt 1) wartet auf eine echte
Aufzeichnung: im Spiel die automatische Aufzeichnung einschalten, eine Session
fahren, die Datei nach `samples/` legen (siehe
[samples/README.md](../samples/README.md)).

Noch **nicht entschieden**:

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
| 1 | ARC | TODO | **Telemetrie-Format verifizieren** (laut Changelog DuckDB, laut Wiki `.ld`/`.csv`): Aufzeichnung im Spiel einschalten und eine Session fahren, Datendatei untersuchen, eigenes ADR mit Schema und Kanalliste, danach F-012 und F-013 prüfen. Die Result-XML ist erledigt ([ADR-0002](decisions/ADR-0002-lmu-result-format.md)). Quellen: [quellen/](quellen/README.md) | echte Telemetrie-Aufzeichnung in `samples/` |
| 3 | ARC | TODO | ADR zur Telemetrie-Datenhaltung: ob DuckDB-WASM genutzt wird (Index und Einlesen sind in [ADR-0004](decisions/ADR-0004-datenhaltung-und-einlesen.md) entschieden) | 1 |
| 4 | Feature | IN PROGRESS | MVP gebaut, wartet auf Abnahme durch den Entwickler: F-001 Ordner einlesen, F-002 Session-Bibliothek (ohne Land/Flagge), F-006 Session-Kopf (nur Reiter „Ergebnis"), F-016 Lokaler Index, F-017 Mehrsprachigkeit. Danach FEATURES.md kondensieren | – |
| 5 | Feature | IN PROGRESS | MVP gebaut, wartet auf Abnahme: F-003 Eigener Fahrer, F-004 Rennergebnis, F-005 Qualifying. Offen: F-015 Favoriten | 4 |
| 6 | Feature | TODO | Analyse: F-007 Lap Chart, F-008 Position Chart, F-009 Statistiken, F-010 Incidents, F-011 Chat | 5 |
| 7 | Feature | TODO | Telemetry: F-012 Vergleich zweier Runden, F-013 Streckenkarte und Kennzahlen | 1, 5 |
| 8 | Feature | TODO | Lap Times: F-014 Persönliche Bestzeiten | 5 |
| 9 | Design | TODO | Branding mit SimPosture abstimmen: Farben, Typografie, Logo als Design-Tokens; eigenes Design ([PRODUCT.md](PRODUCT.md) §5) | – |
| 10 | Chore | TODO | Namensprüfung „SimPaddock": GitHub, Domain, Marken- und Namenskonflikte | – |
| 11 | Chore | TODO | Anonymisierte Test-Fixtures aus den echten Result-Dateien ableiten (Namen, Teams, Kennungen, Stream-IDs, Pfade ersetzen); Telemetrie-Fixtures später | – |
| 12 | Chore | TODO | GitHub Pages einrichten (nur nach ausdrücklicher Freigabe) | – |
