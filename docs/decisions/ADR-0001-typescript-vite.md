# ADR-0001: TypeScript and Vite as the stack

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

SimScoreboard evaluates LMU files purely client-side in the browser. Core tasks:
folder access through the File System Access API, parsing large amounts of files
in web workers, probably DuckDB-WASM for telemetry, many interactive charts (lap
times, position progression, overlaid telemetry channels with zoom).

The sister project SimPosture uses Kotlin Multiplatform with Compose
Multiplatform. That stack would be the obvious one for SimScoreboard because of
the same tools.

## Decision

SimScoreboard is built with **TypeScript** and **Vite** as a pure web
application. The brand family with SimPosture runs through name, colors and design
tokens, not through shared code.

## Alternatives

- **Kotlin Multiplatform / Compose Wasm** (like SimPosture): same stack, but
  connecting the File System API, web workers and DuckDB-WASM from Kotlin/Wasm is
  cumbersome, and all charts would have to be drawn in Compose itself. Mobile apps
  bring nothing here because LMU only runs on PC.

## Consequences

- Access to the JS ecosystem: uPlot or D3 for charts, DuckDB-WASM, ready-made
  parser libraries.
- Two stacks in the developer's portfolio; only the branding is shared.
- The UI framework (vanilla, Svelte, React or the like) is therefore **not** yet
  decided and needs an ADR of its own at the project scaffold (backlog 2).
