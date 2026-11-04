# SimScoreboard — Agent-Kontext

Diese Datei ist der universelle Einstiegspunkt für KI-Coding-Agenten auf allen
Entwicklungsrechnern (Windows-PC und MacBook Air). Der gesamte Projektkontext
lebt in diesem Repository, nicht im lokalen Sitzungsgedächtnis.

Tool-spezifische Ergänzungen liegen in eigenen Dateien am Repo-Root — z. B.
[CLAUDE.md](CLAUDE.md) für Claude Code.

## Projekt

Open-Source-Webanwendung (MIT), die **Le Mans Ultimate** (LMU) Sessions im Browser
auswertet: Ergebnisse, Rundenvergleiche, Telemetrie und persönliche Bestzeiten.
Später kommt eine **Custom-League-Funktion** dazu. Alles läuft **clientseitig** im
Browser, ohne Backend — die Dateien des Spiels verlassen den Rechner nicht.

Stack: **TypeScript + Vite** ([ADR-0001](docs/decisions/ADR-0001-typescript-vite.md)),
**React**, uPlot und eigenes SVG für Charts
([ADR-0003](docs/decisions/ADR-0003-ui-framework-und-charts.md)).
Schwesterprojekt in derselben Markenfamilie: SimPosture (eigenes Repo, KMP; es
wird nur das Branding geteilt, kein Code).

**Stand:** Die Ausbaustufen „Results“ und „Analyse“ sowie Bestzeiten stehen (Parser,
lokaler Index, Sessions-Seite mit Liste links und Details rechts, Rundenvergleich,
Statistiken). Die Result-XML ist an echten Dateien geprüft
([ADR-0002](docs/decisions/ADR-0002-lmu-result-format.md)); die Telemetrie wartet
auf eine echte Aufzeichnung. Die Übergabe mit dem nächsten Schritt steht oben in
[docs/BACKLOG.md](docs/BACKLOG.md).

**Befehle** (Node-Version in `.nvmrc`, Verwaltung mit fnm):

- `npm install` · `npm run dev` (Dev-Server)
- `npm run check` = Typecheck, Lint, Tests und Build — vor jedem Commit grün
- einzeln: `npm run typecheck` · `lint` · `test` · `build` · `format:check`
- Prettier gilt nur für Code; Markdown-Dateien sind von Hand formatiert und
  ausgenommen.

**Fremdtool-Regel:** Namen, Screenshots und Beschreibungen anderer
Auswertungstools gehören nirgends ins Repository (siehe GUIDELINES).

## Pflichtlektüre zu Beginn jeder Sitzung

**Ganz lesen** (klein, beantworten „wo stehen wir, was ist als Nächstes dran"):

1. [docs/BACKLOG.md](docs/BACKLOG.md) — Wo stehen wir? Was ist als Nächstes dran?
2. [docs/PRODUCT.md](docs/PRODUCT.md) — Was ist SimScoreboard, für wen, was nicht?

**Outline, Details bei Bedarf:**

3. [docs/GUIDELINES.md](docs/GUIDELINES.md) — Wie arbeiten wir? Sprache,
   Datenschutz der Beispieldateien, Dokumentenlandschaft, Weg einer Idee, IDs,
   Git. Den zum Sitzungsziel passenden Abschnitt vor dem Arbeiten ganz lesen.
4. [docs/FEATURES.md](docs/FEATURES.md) — Was soll SimScoreboard können? Outline mit
   `grep '^## F-' docs/FEATURES.md`; die vom Sitzungsziel berührten Einträge ganz
   lesen.
5. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technische Ausrichtung
   (derzeit Entwurf vor der Formatprüfung).
6. [docs/BUGS.md](docs/BUGS.md) — Offene Fehler.
7. [docs/decisions/](docs/decisions/) — Architecture Decision Records.
8. [docs/quellen/](docs/quellen/README.md) — Recherche zu den Dateiformaten
   (unverifiziert).

Outline holen mit `grep '^#' <datei>`. Ganze große Dateien nur lesen, wenn das
Sitzungsziel es verlangt.

## Sitzungseröffnung

Nach der Pflichtlektüre dem Entwickler **beides** präsentieren, damit er wählen
kann, woran gearbeitet wird:

1. Die **offenen Ideations** aus `docs/ideations/` — falls eine Idee weiterreifen
   soll.
2. Die **Top 10 des Backlogs** — falls eine Umsetzung ansteht.

Danach gemeinsam ein Sitzungsziel festlegen und einen schrittweisen Plan
abstimmen, **bevor** implementiert wird.

## Arbeitsweise

- **Reviews sind Dialoge:** Bei einem Review eine Zusammenfassung liefern und die
  Meinung des Entwicklers einholen. Erst wenn der Entwickler das Review
  abschließt, mit dem nächsten Schritt beginnen.
- **Git nur mit Freigabe:** Keine Commits (und Pushes) ohne vorherige explizite
  Zustimmung des Entwicklers. Änderungen vorbereiten, dann fragen. Das GitHub-Repo
  wird erst nach ausdrücklicher Freigabe angelegt.
- **Branches:** `main` = Release (baut GitHub Pages, nur Releases), `dev` =
  Entwicklung, von dort zweigen Feature-Branches ab. Backlog, Features, ADRs und
  kleine Änderungen direkt auf `dev`; größere Codearbeit auf `feature/<thema>`
  (ob ein Feature einen Branch bekommt, wird beim Anlegen geklärt). Nie nach
  `main` pushen oder mergen ohne ausdrückliche Freigabe. Einzelheiten:
  [docs/GUIDELINES.md](docs/GUIDELINES.md), Abschnitt Git.
- **Ideen kritisch hinterfragen, nicht einfach zustimmen:** Vorschläge fachlich
  prüfen, bevor sie umgesetzt werden. Enthält eine Idee Fehler oder Lücken oder
  gibt es bessere Alternativen, darauf hinweisen und die Abwägung **vor** der
  Implementierung besprechen.
- **Eigene Verbesserungsvorschläge einbringen:** Fällt beim Arbeiten etwas auf,
  den Vorschlag aktiv ansprechen und gemeinsam entscheiden — nicht still
  übergehen und nicht eigenmächtig umsetzen.
- **Keine Annahmen über Dateiformate:** Parser werden nur gegen echte
  Beispieldateien gebaut. Was an den Formaten unverifiziert ist, steht in
  [docs/BACKLOG.md](docs/BACKLOG.md); verifizierte Erkenntnisse gehören danach in
  ein ADR oder in die Architektur-Doku.
- **Keine automatisierten UI-Tests durch den Agent:** Nach der Implementierung nur
  nicht-visuelle Prüfungen ausführen (Unit-Tests, Typecheck, Build). Keine
  Browser-UI-Verifikation per Screenshot oder simulierten Klicks — der Entwickler
  nimmt die UI selbst ab. Für die Abnahme den Dev-Server starten und die Adresse
  nennen.
- **Ideen gehören in eine Ideation, nicht sofort in eine Anforderung:** Neue
  Gedanken landen zuerst als Dokument unter `docs/ideations/`. Erst beim
  Bearbeiten entscheidet sich, ob daraus ein Feature, ein Architektur-Enabler oder
  eine Guideline wird.

## Datenschutz der Beispieldateien

Result- und Telemetrie-Dateien des Spiels enthalten **Namen anderer Fahrer**. Sie
dürfen **nie** ins Repository. Echte Dateien liegen nur in `samples/` (per
`.gitignore` ausgeschlossen). Für Tests werden **anonymisierte Fixtures** gebaut.
Für die Demo liegen vollständig anonymisierte Sessions in `public/demo` (siehe
GUIDELINES).

## Umgebungsbesonderheiten

- **Windows-PC:** Hier läuft LMU, hier liegen die echten Dateien. Beispieldateien
  für die Parser kommen von hier.
- **MacBook Air:** Entwicklung ohne Spiel; Tests laufen gegen die Fixtures.
