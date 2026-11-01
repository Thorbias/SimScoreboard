# ADR-0001: TypeScript und Vite als Stack

- **Status:** Vorgeschlagen (wird mit Entwickler-Freigabe „Angenommen")
- **Datum:** 2026-11-01

## Kontext

SimPaddock wertet LMU-Dateien rein clientseitig im Browser aus. Kernaufgaben:
Ordnerzugriff über die File System Access API, Parsen großer Dateimengen in Web
Workern, voraussichtlich DuckDB-WASM für die Telemetrie, viele interaktive Charts
(Rundenzeiten, Positionsverlauf, überlagerte Telemetriekanäle mit Zoom).

Das Schwesterprojekt SimPosture nutzt Kotlin Multiplatform mit Compose
Multiplatform. Der Stack wäre für SimPaddock der naheliegende, weil gleiche
Werkzeuge.

## Entscheidung

SimPaddock wird mit **TypeScript** und **Vite** als reine Webanwendung gebaut.
Die Markenfamilie mit SimPosture läuft über Name, Farben und Design-Tokens, nicht
über geteilten Code.

## Alternativen

- **Kotlin Multiplatform / Compose Wasm** (wie SimPosture): gleicher Stack, aber
  die Anbindung von File-System-API, Web Workern und DuckDB-WASM aus Kotlin/Wasm
  ist umständlich, und alle Charts müssten in Compose selbst gezeichnet werden.
  Mobile-Apps bringen hier nichts, weil LMU nur am PC läuft.

## Konsequenzen

- Zugriff auf das JS-Ökosystem: uPlot oder D3 für Charts, DuckDB-WASM, fertige
  Parser-Bibliotheken.
- Zwei Stacks im Portfolio des Entwicklers; geteilt wird nur das Branding.
- Das UI-Framework (Vanilla, Svelte, React o. ä.) ist damit noch **nicht**
  entschieden und braucht ein eigenes ADR beim Projektgerüst (Backlog 2).
