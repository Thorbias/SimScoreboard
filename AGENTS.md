# SimPaddock — Agent-Kontext

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

Stack: **TypeScript + Vite** ([ADR-0001](docs/decisions/ADR-0001-typescript-vite.md)).
Schwesterprojekt in derselben Markenfamilie: SimPosture (eigenes Repo, KMP; es
wird nur das Branding geteilt, kein Code).

**Stand:** Das Projekt ist angelegt, es gibt noch **keinen Code**. Der Start der
Implementierung wartet auf echte Beispieldateien des Spiels (Result- und
Telemetrie-Dateien), weil die Dateiformate noch nicht verifiziert sind — siehe
[docs/BACKLOG.md](docs/BACKLOG.md).

## Pflichtlektüre zu Beginn jeder Sitzung

**Ganz lesen** (klein, beantworten „wo stehen wir, was ist als Nächstes dran"):

1. [docs/BACKLOG.md](docs/BACKLOG.md) — Wo stehen wir? Was ist als Nächstes dran?
2. [docs/PRODUCT.md](docs/PRODUCT.md) — Was ist SimPaddock, für wen, was nicht?

**Outline, Details bei Bedarf:**

3. [docs/GUIDELINES.md](docs/GUIDELINES.md) — Wie arbeiten wir? Sprache,
   Datenschutz der Beispieldateien, Weg einer Idee, Git.
4. [docs/decisions/](docs/decisions/) — Architecture Decision Records.

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

## Umgebungsbesonderheiten

- **Windows-PC:** Hier läuft LMU, hier liegen die echten Dateien. Beispieldateien
  für die Parser kommen von hier.
- **MacBook Air:** Entwicklung ohne Spiel; Tests laufen gegen die Fixtures.
