# ADR-0003: React, uPlot und eigenes SVG für die Oberfläche

- **Status:** Angenommen
- **Datum:** 2026-11-01

## Kontext

[ADR-0001](ADR-0001-typescript-vite.md) legt TypeScript und Vite fest, lässt aber
das UI-Framework und die Chart-Bibliothek offen. Anforderungen an die Oberfläche:

- Große Listen: Bibliotheken mit über 1.000 Sessions bleiben flink (NF-003).
- Zeitreihen mit vielen Punkten: Telemetrie mit bis zu 100 Hz, mehrere
  synchronisierte Kanäle, Zoom und Zeit-Zeiger.
- Sonderformen: Positionsverlauf aller Fahrer, Streckenkarte, Lap Chart.
- Statisch ausgeliefert (GitHub Pages), offline nutzbar, mehrsprachig (NF-002,
  NF-004).

## Entscheidung

- **UI-Framework: React** mit TypeScript (strict).
- **Charts, zweigeteilt nach Aufgabe:**
  - **uPlot** für Zeitreihen mit vielen Punkten (Telemetrie-Vergleich, Verlauf der
    Rundenzeiten). Synchronisierte Zeiger über mehrere Charts sind eingebaut.
  - **Eigenes SVG** mit `d3-scale` und `d3-shape` für Positionsverlauf und
    Streckenkarte. Fokus, Hervorhebung und Sonderachsen („Grid“ bis „Finish“) bleiben
    dabei unter eigener Kontrolle.
- **Tabellen und Listen:** TanStack Table und TanStack Virtual.
- **Routing:** Hash-Router, weil GitHub Pages keine Weiterleitungen auf
  `index.html` kennt.
- **Zustand:** zunächst nur React-Bordmittel, kein globaler Store.
- **i18n:** eine schlanke Bibliothek (Englisch Default, Deutsch); die Wahl im
  Gerüst, solange sie Texte zentral hält.
- **Qualität:** Vitest, ESLint, Prettier.
- **Offline:** Service Worker, der die statischen Dateien zwischenspeichert.
- **Datenschutz technisch erzwungen:** Content-Security-Policy per `<meta>`-Tag mit
  `connect-src 'self'` (GitHub Pages erlaubt keine eigenen HTTP-Header).

## Alternativen

- **Svelte 5:** kleineres Bundle und weniger Code, aber ein dünneres Ökosystem für
  Tabellen und Virtualisierung, und die Runes sind noch jung.
- **Vue, Solid, Preact:** tragfähig, bringen hier aber keinen Vorteil, der die
  kleinere Verbreitung aufwiegt.
- **Ohne Framework:** machbar für die Charts, aber Listen, Filter und Zustand der
  vielen Ansichten würden viel eigenen Gerüstcode brauchen.
- **Chart.js, ECharts o. Ä.:** bei 100-Hz-Telemetrie langsamer und größer als uPlot,
  und die Sonderformen müssten trotzdem gebaut werden.

## Konsequenzen

- Größeres Bundle als bei Svelte. Weil die Seite nach dem ersten Laden offline
  läuft, ist das verkraftbar.
- Zwei Chart-Techniken im Projekt: uPlot imperativ in einer React-Hülle, eigene
  Charts deklarativ in SVG. Gemeinsame Hilfen (Farben, Achsen, Zeit-Zeiger) gehören
  in ein eigenes Modul, damit beide gleich aussehen.
- Die Meta-CSP schützt weniger streng als ein Header, genügt aber für
  `connect-src`. Sie muss die Anforderungen von DuckDB-WASM (Worker, WASM) erlauben,
  sobald dieses dazukommt.
- Die Wahl von DuckDB-WASM und der Datenhaltung folgt in einem eigenen ADR
  (Backlog 3).
