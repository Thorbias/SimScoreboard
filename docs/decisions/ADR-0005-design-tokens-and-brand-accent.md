# ADR-0005: Design tokens, pit orange as the accent and the sector bar

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

SimScoreboard belongs to the brand family of SimPosture ([PRODUCT.md](../PRODUCT.md)).
Only the branding is shared, no code. SimPosture describes its design in its own
repository: Material Design 3 as the basis, graphite surfaces, Electric Cyan
(`#22C7F2`) as the accent for "analysis", Inter as the typeface, a 4/8/16/24 grid and
the principles "Precision over Decoration", "Data first" and "Calm Experience". The
brand motif there is the analysis overlay (measuring lines and angles on the photo).

SimScoreboard shows results and times. Motorsport timing displays have fixed color
meanings (purple for fastest, green for personal best), and the app has to put the
data of two drivers side by side. The brand accent must not get in the way of these
meanings.

## Decision

**Same family, own handwriting.**

- **Taken over from SimPosture:** neutral surfaces and text colors (`#15181C`,
  `#181C21`, lines `#262B32`; light `#F8F9FA`, `#FFFFFF`), Inter, radii 4/8/12/16 px
  plus pill, 8 px grid, the status colors (success, warning, error, info) and the
  principles.
- **Brand accent and "you": pit orange `#FF7A2F`** (light `#B3470A`). It stands for
  actions (primary button), the active tab and the wordmark and at the same time for
  the own driver in lists, tables and charts (`--you`). It is complementary to
  SimPosture's cyan and has a redder tone than the warning amber, so there is no
  conflict. The brand and "you" share the color because the most important thing on
  the page is the own performance.
- **Comparison colors for the other drivers** in the lap time chart: driver A (the
  own one) orange, B cyan `#22C7F2`, C pink `#FF6FB1`, D lime `#C6E84A` (each with a
  darker variant in light mode). Cyan thus stays as a color of the family but means
  "opponent B" instead of "you". The switch from cyan to orange for "you" came on
  2026-11-02 at the developer's request: cyan looked less present than the brand
  accent.
- **Role colors** each keep one meaning: purple `#C58BFF` fastest (of the class),
  green `#4FD36A` personal best, gold `#F2C14E` win, amber `#FFB84D` warning, red
  `#E85D5D` retirement and error. Every role has a darker variant for light mode.
- **Brand motif: the sector bar.** Three slanted segments (S1, S2, S3) at the slant
  of the SimPosture logo. It is function, not decoration: as a companion of the
  wordmark in purple, green and orange, in qualifying per driver with the fastest
  sectors of the class and as a progress bar while reading.
- **Wordmark instead of monogram.** Both apps would have "SP"; SimScoreboard sets
  "Sim" in text color and "Scoreboard" in italics in orange. The favicon is the
  sector bar.
- **Typeface:** Inter as a variable font, bundled locally (`@fontsource-variable/
  inter`, license OFL), not from a foreign server. Times use tabular figures.
- **Technology:** The tokens are CSS variables in `src/design/tokens.css` (dark as
  the default, light through the user's choice or `prefers-color-scheme`). The
  setting "Automatic / Light / Dark" is in the settings and sets `data-theme` on
  `<html>`. A test checks the contrast of all text colors and role colors against
  both surfaces (WCAG AA, 4.5:1).

## Alternatives

- **Apex magenta (`#FF3D8F`):** the strongest contrast to SimPosture, but its color
  lies next to the purple for "fastest" and feels louder than the principle "Calm
  Experience".
- **Ultramarine (`#6C84FF`):** calmest and closest to SimPosture, but too close to
  cyan and info blue; "you" and "opponent" would be harder to tell apart in charts.
- **Signal lime:** lies close to the green of the personal best.
- **Cyan as a shared accent:** would have made both apps indistinguishable.

## Consequences

- The colors each have a fixed meaning. New views must not use them for something
  else; a color change runs through the tokens.
- The position chart palette for the other drivers avoids the orange range so that
  "you" is never confused with another.
- Same neutrals on both sides means: if SimPosture changes its surfaces,
  SimScoreboard should follow. There is no shared code for it, only this table.
- Inter is included in the bundle; that increases the load size by a few dozen KB.
- The flags come as SVG from the package `flag-icons` (MIT). Only the countries of
  the track table get into the bundle. Emoji flags would be only two letters on
  Windows. The license notices are in `THIRD-PARTY-NOTICES.md`.
