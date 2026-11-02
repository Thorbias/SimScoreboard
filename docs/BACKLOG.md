# Backlog

> Der **priorisierte Backlog** und zugleich Übergabedokument zwischen den
> Entwicklungsrechnern: **alle** Arbeitspunkte stehen hier an einer Stelle. Enthält
> **nur offene Punkte** — keine Sitzungsprotokolle, keine „Erledigt"-Historie (die
> steht in Git: `git log docs/BACKLOG.md`). Erledigte Punkte werden gestrichen.
>
> **Offene Ideations:** siehe [`docs/ideations/`](ideations/) — unpriorisiert und
> bewusst nicht in dieser Tabelle.

## Übergabe (Stand 2026-11-02)

Das Projektgerüst sowie die Ausbaustufen „Results“ und „Analyse“ stehen und sind
abgenommen (Sessions, Ergebnisse, Lap Chart, Position Chart, Statistiken,
Incidents, Chat; ADR-0002 bis ADR-0004). Nächster Schritt: die Telemetrie
(Punkt 1). Sie wartet auf eine echte Aufzeichnung: im Spiel die automatische
Aufzeichnung einschalten, eine Session fahren, die Datei nach `samples/` legen
(siehe [samples/README.md](../samples/README.md)). Gebaut und in Abnahme sind
Bestzeiten, Favoriten und Streckenland (Punkte 5 und 8). Das Design mit
Pit-Orange steht ([ADR-0005](decisions/ADR-0005-design-tokens-und-markenakzent.md)).
Ohne Telemetrie bietet sich danach Punkt 13 (Offline-Betrieb) an.

Noch **nicht entschieden**:

- Ob die Marke „SimScoreboard" frei ist (DPMA, EUIPO, USPTO). Konto, Repos und
  Domains sind geprüft ([ADR-0006](decisions/ADR-0006-projektname-simscoreboard.md)),
  die Markenregister nicht (Punkt 10).

**Typ:** `Feature` · `ARC` (Architektur-Enabler → ADR) · `Design` · `Chore`.
**Status:** `TODO` · `IN PROGRESS`.

Die Reihenfolge ist die Priorität. Eine **Abhängigkeit** steht als Vorrang-
Constraint über dem Ranking: ein blockierter Punkt startet erst, wenn sein
Vorgänger erledigt ist. Details der F-Punkte in [FEATURES.md](FEATURES.md).

| # | Typ | Status | Punkt | Abhängig von |
|:-:|---|---|---|---|
| 1 | ARC | TODO | **Telemetrie-Format verifizieren** (laut Changelog DuckDB, laut Wiki `.ld`/`.csv`): Aufzeichnung im Spiel einschalten und eine Session fahren, Datendatei untersuchen, eigenes ADR mit Schema und Kanalliste, danach F-012 und F-013 prüfen. Die Result-XML ist erledigt ([ADR-0002](decisions/ADR-0002-lmu-result-format.md)). Quellen: [quellen/](quellen/README.md) | echte Telemetrie-Aufzeichnung in `samples/` |
| 3 | ARC | TODO | ADR zur Telemetrie-Datenhaltung: ob DuckDB-WASM genutzt wird (Index und Einlesen sind in [ADR-0004](decisions/ADR-0004-datenhaltung-und-einlesen.md) entschieden) | 1 |
| 5 | Feature | IN PROGRESS | Gebaut, wartet auf Abnahme: F-015 Favoriten, F-018 Streckenland und Flagge. Danach FEATURES.md kondensieren | – |
| 7 | Feature | TODO | Telemetry: F-012 Vergleich zweier Runden, F-013 Streckenkarte und Kennzahlen | 1 |
| 8 | Feature | IN PROGRESS | Gebaut, wartet auf Abnahme: F-014 Persönliche Bestzeiten, F-019 Gesamtüberblick. Danach FEATURES.md kondensieren | – |
| 10 | Chore | TODO | Namen absichern: Markenprüfung „SimScoreboard" (DPMA, EUIPO, USPTO), Domain registrieren (Repo und `origin` heißen schon so) ([ADR-0006](decisions/ADR-0006-projektname-simscoreboard.md)) | – |
| 11 | Chore | TODO | Anonymisierte Telemetrie-Fixtures ableiten (die Result-Fixtures gibt es, siehe `tools/anonymize-results.mjs`) | 1 |
| 13 | Chore | TODO | Offline-Betrieb: Service Worker, der die statischen Dateien zwischenspeichert (NF-002) | – |
| 14 | Feature | IN PROGRESS | Gebaut, wartet auf Abnahme: F-020 Demo-Daten | – |
| 15 | Feature | IN PROGRESS | Gebaut, wartet auf Abnahme: Liga Version 1 (nur Organisator), F-021, [ADR-0007](decisions/ADR-0007-liga-datei-und-formel.md) | – |
| 16 | Feature | TODO | F-022 Boxenstoppzeiten aus der Telemetrie (keine Schätzung aus Rundenzeiten) | 7 |
