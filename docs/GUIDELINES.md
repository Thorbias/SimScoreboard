# Guidelines — SimPaddock

> Wie wir arbeiten. Kurz gehalten; wächst mit dem Projekt.

## Sprache

- **Projektdokumentation** (`docs/`, `AGENTS.md`): Deutsch.
- **README, UI-Texte, Code, Bezeichner, Commit-Messages:** Englisch.
- UI-Texte kommen aus einer zentralen Übersetzungsschicht (i18n), nicht als
  Literale in Komponenten.

## Datenschutz der Beispieldateien

Echte Result- und Telemetrie-Dateien enthalten Namen anderer Fahrer und dürfen nie
committet werden. Sie liegen in `samples/` (ignoriert). Tests nutzen
**anonymisierte Fixtures**. Beim Anonymisieren werden Fahrernamen, Teamnamen und
alle IDs ersetzt, die auf eine Person zurückführen.

## Keine Fremdtool-Referenzen

Namen, Screenshots, Beschreibungstexte oder Links anderer Auswertungstools
kommen **nirgends** ins Repository: nicht in Docs, Code, Kommentaren, Fixtures,
Commit-Messages oder Branch-Namen. Funktionen werden eigenständig beschrieben.

## Der Weg einer Idee

Neue Idee → Dokument in `docs/ideations/` (grob genügt) → beim Bearbeiten
entscheidet sich, ob daraus ein Backlog-Punkt, ein ADR oder eine Guideline wird.
Eine Ideation hat keine Priorität.

## Architekturentscheidungen

Jede grundlegende Entscheidung wird als ADR unter `docs/decisions/` festgehalten
(`ADR-NNNN-kurzer-titel.md`: Kontext, Entscheidung, Alternativen, Konsequenzen).
Status: `Vorgeschlagen` bis zur Freigabe des Entwicklers, dann `Angenommen`.

## Backlog

Nur offene Punkte, nur Verweise statt Prosa, nach jeder erledigten Aufgabe
aufräumen. Die Historie steht in Git.

## Git

- Keine Commits und keine Pushes ohne ausdrückliche Freigabe.
- Ein Commit pro logischer Änderung; Commit-Messages im Imperativ, Englisch.
