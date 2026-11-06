# Guidelines — SimScoreboard

> Wie wir arbeiten. Die Konventionen folgen bewusst dem Schwesterprojekt
> SimPosture, damit beide Projekte gleich bedient werden. Wächst mit dem Projekt.

## Sprache

- **Projektdokumentation** (`docs/`, `AGENTS.md`): Deutsch.
- **README, UI-Texte, Code, Bezeichner, Commit-Messages:** Englisch.
- UI-Texte kommen aus einer zentralen Übersetzungsschicht (i18n), nicht als
  Literale in Komponenten.
- **Begriffe:** Ein Wertungslauf einer Liga heißt auf Deutsch immer **Rennen** (nie
  „Lauf“ oder „Läufe“), im Englischen „race“. Das gilt für Oberfläche, Doku und Code.

## Datenschutz der Beispieldateien

Echte Result- und Telemetrie-Dateien enthalten Namen anderer Fahrer und dürfen nie
committet werden. Sie liegen in `samples/` (ignoriert). Tests nutzen
**anonymisierte Fixtures**. Beim Anonymisieren werden Fahrernamen, Teamnamen und
alle IDs ersetzt, die auf eine Person zurückführen.

**Einzige Ausnahme** sind die Demo-Sessions in `public/demo`: vollständige, aber
anonymisierte Result-Dateien, die mit der App ausgeliefert werden. Sie entstehen
nur mit `tools/anonymize-results.mjs --demo`, nie von Hand. Ein Test prüft sie auf
Namensreste, auf lokale Pfade und auf Server- und Verbindungsangaben. Neue Demo-
Dateien werden vor dem Commit mit `git diff` angesehen.

## Keine Fremdtool-Referenzen

Namen, Screenshots, Beschreibungstexte oder Links anderer Auswertungstools
kommen **nirgends** ins Repository: nicht in Docs, Code, Kommentaren, Fixtures,
Commit-Messages oder Branch-Namen. Funktionen werden eigenständig beschrieben,
das Design ist eigenständig.

## Testen

Befehle: `npm test` (Vitest), `npm run typecheck`, `npm run lint`,
`npm run build`; `npm run check` führt alles zusammen aus. Regeln:

- **Parser sind testpflichtig** und laufen gegen anonymisierte Fixtures.
- **Neue Logik** (Auswertung, Aggregation, Berechnung) bekommt Unit-Tests;
  UI-Komponenten zunächst ohne automatisierte Tests (manuelle Abnahme).
- **Vor jedem Commit:** Tests, Typecheck und Build laufen grün. Ein Commit mit
  roten Tests ist nicht erlaubt.
- **CSS-Klassen sind global.** Vor einem neuen Klassennamen prüfen, ob er schon
  vergeben ist (`grep -rn "\.name" src`), und beschreibende Namen wählen (`progress`
  führte dazu, dass ein Diagramm endlos wuchs: eine fremde Regel machte seinen
  Rahmen zur Box, die sich an den Inhalt anpasst). Diagramme messen ihre Breite an
  einem Element ohne eigenes Padding und passen sich nur bei geänderter Breite an.

## Oberfläche

- **Ladeanzeigen:** Wo eine Ladeanzeige sinnvoll ist, nehmen wir `SectorProgress`
  (`src/ui/SectorBar.tsx`): das Markenlogo, dessen drei Balken sich von unten nach
  oben füllen (Orange, Grün, Lila), im Schritt des Fortschritts und ohne
  Übergangsanimation. Keine anderen Spinner oder Balken.

## Projektorganisation

### Dokumentenlandschaft

Die Trennachse ist **Arbeit vs. Zustand**: Arbeit wird erledigt und verschwindet;
Zustand beschreibt, was das Projekt *ist*, und bleibt.

| Dokument | Art | Regel |
|---|---|---|
| `PRODUCT.md` | Zustand | Vision, Zielgruppe, Plattform, Abgrenzung, NF-Anforderungen |
| `FEATURES.md` | Zustand | F-IDs — bleibt, aber **kondensiert beim Abschluss** (s. u.) |
| `ARCHITECTURE.md` | Zustand | technische Ausrichtung |
| `decisions/` (ADR) | Zustand | langfristige Entscheidungen |
| `quellen/` | Zustand | Belegmaterial und Recherche, wird nur ergänzt |
| `GUIDELINES.md` | Zustand | diese Datei: Regeln, **nie im Backlog** |
| `BACKLOG.md` | Arbeit | nur offene Punkte; erledigt = entfernt; Übergabe zwischen Rechnern |
| `BUGS.md` | Arbeit | nur offene Bugs; behoben = entfernt |
| `ideations/` | Arbeit | nur offene Ideations; überführt/verworfen = gelöscht |

### Der Weg einer Idee

Neue Idee → Dokument in `docs/ideations/` (grob genügt, nummeriert
`IDEA-0001-kurz-slug.md`). Ideations haben **keine Prio** und stehen nicht im
Backlog. Beim Bearbeiten entscheidet sich, was es ist:

- **Feature** (neue Anwenderfähigkeit) → Eintrag in `FEATURES.md`. UI/UX-Gestaltung
  ist immer ein Feature.
- **Bug** → `BUGS.md`.
- **ARC** (Architektur-Enabler) → ADR und/oder Erweiterung von `ARCHITECTURE.md`.
- **Guideline** → diese Datei.

Ist die Ideation überführt, wird sie **gelöscht** — keine Historie, die steht in
Git. Eine Ideation darf auch verworfen werden.

### FEATURES.md: kondensieren statt löschen

Eine ausgelieferte Funktion ist eine dauerhafte Eigenschaft des Produkts, keine
erledigte Arbeit. Solange ein Eintrag offen ist, trägt er (nach der Formatprüfung)
den ausführlichen Umsetzungsauftrag; beim Abschluss schrumpft er auf die normative
Beschreibung im Präsens, wenige Zeilen.

Eintrags-Muster, ein Abschnitt je Eintrag, keine Tabelle:

```markdown
## F-XXX — Titel

Prio M · Status offen

<Beschreibung im Präsens: was die App tut.>
```

- **Erster Satz = eigenständige Zusammenfassung**, damit der Überflug
  „Überschrift + erster Satz" genügt (`grep '^## F-' docs/FEATURES.md`).
- **Aufzählung statt Bandwurmsatz**, sobald es mehrere Eigenschaften sind.
- **Keine Dateipfade und Klassennamen** in der Beschreibung (→ ARCHITECTURE/Code).
- **Nicht hinein** gehören Implementierungserzählungen und Post-Mortems.
- **Querverweise:** ADRs als Link, andere Features als blanke ID (F-004).
- **Verworfene Anforderungen werden gelöscht**; Ausnahme: gebaut und wieder
  verworfen, dann bleibt die Überschrift mit einem kurzen Vermerk.

### Backlog

`BACKLOG.md` ist der einheitliche, priorisierte Backlog: alle Arbeitspunkte an
einer Stelle. Die Tabelle enthält nur Ranking und Verweis, keine Prosa. Nur offene
Punkte (`TODO`, `IN PROGRESS`), kein `DONE`. `IN PROGRESS` nur, wenn wirklich
angefangen. Der Backlog sagt, ob jemand *arbeitet*; `FEATURES.md` sagt, ob die
*Fähigkeit im Produkt* ist. „Was wurde fertig?" beantwortet Git:
`git log -- docs/FEATURES.md`.

### IDs

- **F- und B-IDs werden fortlaufend vergeben und nie wiederverwendet**, auch nicht
  nach dem Entfernen eines Eintrags. Die nächste freie ID steht als Kommentar im
  Kopf von `FEATURES.md` bzw. `BUGS.md`; der Zähler geht nur aufwärts.
- **ADRs sind Momentaufnahmen** und referenzieren keine F-IDs (Sachverhalt in
  Prosa). `ARCHITECTURE.md` und Code dürfen F-IDs nennen.
- **Wiederkehrende Fallstricke** gehören als kurze Regel in diese Datei, nicht nur
  in einen Commit-Text.

### Architekturentscheidungen

Jede grundlegende Entscheidung wird als ADR unter `docs/decisions/` festgehalten
(`ADR-NNNN-kurzer-titel.md`: Kontext, Entscheidung, Alternativen, Konsequenzen).
Status: `Vorgeschlagen` bis zur Freigabe des Entwicklers, dann `Angenommen`.

### Namenskonvention

- **Wurzel-Dokumente:** `SCREAMING.md` (`PRODUCT.md`, `FEATURES.md`, …).
- **Dateien in Unterordnern:** `kebab-case.md`, bei nummerierten Reihen mit Präfix
  (`ADR-0002-persistenz.md`, `IDEA-0002-kurz-slug.md`).

## Umsetzungsauftrag-Vorlage

Zu jedem **offenen** Feature in `FEATURES.md` gehört nach der Formatprüfung ein
ausführungsreifer Auftrag, damit eine Sitzung ohne Kontext-Neuaufbau starten kann.
Er steht beim Eintrag und wird beim Abschluss entfernt. Aufbau:

1. **Ziel** in ein bis zwei Sätzen.
2. **Arbeitsregeln-Verweis:** Sitzungsziel bestätigen, Review als Dialog, Tests vor
   dem Commit, GUIDELINES beachten.
3. **Nummerierte Schritte** mit konkreten Dateipfaden und, wo nötig, einer kurzen
   Signatur-Skizze.
4. **Verifikation und Abschluss:** exakte Test- und Build-Befehle, welche
   Sichtprüfung der Entwickler macht, wann `FEATURES.md` kondensiert und der
   Backlog-Punkt entfernt wird.
5. **Stolpersteine** dieses Rechners oder dieser Plattform.

## Git

### Branches

- **`main` ist der Release-Stand.** Aus `main` baut der Workflow
  [pages.yml](../.github/workflows/pages.yml) die Seite auf GitHub Pages: Ein Push
  auf `main` veröffentlicht. Hier landen nur Releases, immer lauffähig, `npm run
  check` grün, vom Entwickler abgenommen.
- **`dev` ist der Entwicklungsstand.** Von `dev` zweigen die Feature-Branches ab
  und kehren dorthin zurück. `dev` wird in der Regel auf den Entwicklungsrechnern
  gepusht. Ein Release ist der Merge von `dev` nach `main` (ohne Fast-Forward,
  `git merge --no-ff`, damit das Release in der Historie sichtbar bleibt).
- **Auf `dev` direkt** werden gepflegt und gemacht: `BACKLOG.md`, `FEATURES.md`,
  `BUGS.md`, ADRs, Ideations und sonstige Dokumentation sowie kleine Features und
  Korrekturen, die kaum Code berühren.
- **Feature-Branches** (`feature/<thema>`, für Fehler `fix/<thema>`) tragen den
  Code größerer Vorhaben. Ob ein Vorhaben einen eigenen Branch bekommt, wird beim
  Anlegen des Features entschieden — nicht jedes Feature braucht einen. Ein
  Feature-Branch wird gepusht und nach der Abnahme mit `--no-ff` nach `dev`
  gemerged. Dokumentation, die er braucht (ADR, Backlog), kommt zuerst auf `dev`
  und wird in den Branch hineingeholt, nicht umgekehrt.
- **Abhängigkeiten:** Ein Feature, das auf ein anderes wartet, bekommt seinen Branch
  erst, wenn die Voraussetzung auf `dev` steht. Bis dahin steht es im Backlog mit
  „Abhängig von“.

### Regeln

- Branch `main` ist immer lauffähig; `dev` soll es auch sein.
- Kleine, thematisch fokussierte Commits; Commit-Format: kurze imperative
  Zusammenfassung auf Englisch, bei Bedarf Details im Body.
- Keine Commits und keine Pushes ohne ausdrückliche Freigabe.
- **Vor dem Rechnerwechsel:** committen und pushen — `BACKLOG.md` (Übergabe) nicht
  vergessen.
