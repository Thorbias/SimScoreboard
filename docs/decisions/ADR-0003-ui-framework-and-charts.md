# ADR-0003: React, uPlot and own SVG for the interface

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

[ADR-0001](ADR-0001-typescript-vite.md) fixes TypeScript and Vite but leaves the UI
framework and the chart library open. Requirements on the interface:

- Large lists: libraries with more than 1,000 sessions stay fast (NF-003).
- Time series with many points: telemetry at up to 100 Hz, several synchronized
  channels, zoom and time cursor.
- Special forms: position progression of all drivers, track map, lap chart.
- Delivered statically (GitHub Pages), usable offline, multilingual (NF-002,
  NF-004).

## Decision

- **UI framework: React** with TypeScript (strict).
- **Charts, split by task:**
  - **uPlot** for time series with many points (telemetry comparison, progression
    of lap times). Synchronized cursors across several charts are built in.
  - **Own SVG** with `d3-scale` and `d3-shape` for position progression and track
    map. Focus, highlighting and special axes ("Grid" to "Finish") stay under our
    own control.
- **Tables and lists:** TanStack Table and TanStack Virtual.
- **Routing:** Hash router, because GitHub Pages does not know redirects to
  `index.html`.
- **State:** At first only React's built-in means, no global store.
- **i18n:** a slim library (English default, German); chosen at the scaffold, as
  long as it keeps texts central.
- **Quality:** Vitest, ESLint, Prettier.
- **Offline:** Service worker that caches the static files.
- **Privacy technically enforced:** Content security policy through a `<meta>` tag
  with `connect-src 'self'` (GitHub Pages does not allow custom HTTP headers).

## Alternatives

- **Svelte 5:** smaller bundle and less code, but a thinner ecosystem for tables
  and virtualization, and the runes are still young.
- **Vue, Solid, Preact:** viable, but bring no advantage here that outweighs the
  smaller adoption.
- **No framework:** feasible for the charts, but lists, filters and the state of the
  many views would need a lot of scaffolding code of our own.
- **Chart.js, ECharts or the like:** slower and larger than uPlot at 100 Hz
  telemetry, and the special forms would have to be built anyway.

## Consequences

- Larger bundle than with Svelte. Because the site runs offline after the first
  load, that is bearable.
- Two chart techniques in the project: uPlot imperatively in a React shell, own
  charts declaratively in SVG. Shared helpers (colors, axes, time cursor) belong in
  a module of their own so that both look the same.
- The meta CSP protects less strictly than a header, but is enough for
  `connect-src`. It must allow the requirements of DuckDB-WASM (worker, WASM) as
  soon as that is added.
- The choice of DuckDB-WASM and of data storage follows in an ADR of its own
  (backlog 3).
