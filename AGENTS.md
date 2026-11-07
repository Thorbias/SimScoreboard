# SimScoreboard — Agent context

This file is the universal entry point for AI coding agents on all development
machines (Windows PC and MacBook Air). The whole project context lives in this
repository, not in local session memory.

Tool-specific additions live in files of their own at the repo root — e.g.
[CLAUDE.md](CLAUDE.md) for Claude Code.

## Language

**Everything in the repository is English**: docs, code, comments, UI source
texts, commit messages, issues and pull requests (see
[docs/GUIDELINES.md](docs/GUIDELINES.md), section Language). The only German text
is the German UI translation in `src/i18n/de.ts`. The maintainer may talk to you
in German; write every artifact in English anyway.

## Project

Open-source web application (MIT) that evaluates **Le Mans Ultimate** (LMU)
sessions in the browser: results, lap comparisons, telemetry and personal best
times, plus a **custom league function**. Everything runs **client-side** in the
browser, without a backend — the game's files do not leave the computer.

Stack: **TypeScript + Vite** ([ADR-0001](docs/decisions/ADR-0001-typescript-vite.md)),
**React**, uPlot and own SVG for charts
([ADR-0003](docs/decisions/ADR-0003-ui-framework-and-charts.md)).
Sister project in the same brand family: SimPosture (own repo, KMP; only the
branding is shared, no code).

**State:** The stages "Results" and "Analysis" as well as personal bests are in
place (parser, local index, sessions page with list on the left and details on the
right, lap comparison, statistics), and so is the league (standings from a
formula, corrections, race factor, dropped results, Google Drive, password
protection, CSV export). The result XML is checked against real files
([ADR-0002](docs/decisions/ADR-0002-lmu-result-format.md)); telemetry waits for a
real recording. The handover with the next step is at the top of
[docs/BACKLOG.md](docs/BACKLOG.md).

**Commands** (Node version in `.nvmrc`, managed with fnm):

- `npm install` · `npm run dev` (dev server)
- `npm run check` = typecheck, lint, tests and build — green before every commit
- individually: `npm run typecheck` · `lint` · `test` · `build` · `format:check`
- Prettier applies to code only; Markdown files are formatted by hand and
  excluded.

**Rule on other tools:** Names, screenshots and descriptions of other analysis
tools belong nowhere in the repository (see GUIDELINES).

## Required reading at the start of every session

**Read completely** (small, they answer "where do we stand, what is next"):

1. [docs/BACKLOG.md](docs/BACKLOG.md) — Where do we stand? What is next?
2. [docs/PRODUCT.md](docs/PRODUCT.md) — What is SimScoreboard, for whom, what not?

**Outline, details when needed:**

3. [docs/GUIDELINES.md](docs/GUIDELINES.md) — How do we work? Language, privacy
   of the sample files, document landscape, path of an idea, IDs, Git. Read the
   section that fits the session goal completely before working.
4. [docs/FEATURES.md](docs/FEATURES.md) — What should SimScoreboard be able to do?
   Outline with `grep '^## F-' docs/FEATURES.md`; read the entries the session
   goal touches completely.
5. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical direction.
6. [docs/BUGS.md](docs/BUGS.md) — Open bugs.
7. [docs/decisions/](docs/decisions/) — Architecture decision records.
8. [docs/sources/](docs/sources/README.md) — Research on the file formats
   (unverified).

Get an outline with `grep '^#' <file>`. Read whole large files only when the
session goal requires it.

## Opening a session

After the required reading, present the developer with **both** of the following,
so they can choose what to work on:

1. The **open ideations** from `docs/ideations/` — if an idea should mature.
2. The **top 10 of the backlog** — if an implementation is due.

Then agree on a session goal together and agree on a step-by-step plan **before**
implementing.

## Working rules

- **Reviews are dialogues:** For a review, deliver a summary and get the
  developer's opinion. Only when the developer concludes the review, start the
  next step.
- **Git only with approval:** No commits (and pushes) without the developer's
  explicit consent. Prepare changes, then ask. "Release" with the developer's
  approval means merging `dev` into `main` with `--no-ff` and pushing.
- **Branches:** `main` = release (builds GitHub Pages, releases only), `dev` =
  development, feature branches branch off from there. Backlog, features, ADRs and
  small changes directly on `dev`; larger code work on `feature/<topic>` (whether a
  feature gets a branch is clarified when it is created). Never push or merge to
  `main` without explicit approval. Details:
  [docs/GUIDELINES.md](docs/GUIDELINES.md), section Git.
- **Question ideas critically, do not just agree:** Check suggestions on their
  merits before they are implemented. If an idea contains errors or gaps, or there
  are better alternatives, point that out and discuss the trade-off **before**
  implementing.
- **Bring in your own suggestions for improvement:** If something stands out while
  working, raise the suggestion actively and decide together — do not silently
  pass over it and do not implement it on your own.
- **No assumptions about file formats:** Parsers are built only against real
  sample files. What is unverified about the formats is in
  [docs/BACKLOG.md](docs/BACKLOG.md); verified findings then belong in an ADR or
  in the architecture docs.
- **No automated UI tests by the agent:** After the implementation run only
  non-visual checks (unit tests, typecheck, build). No browser UI verification by
  screenshot or simulated clicks — the developer accepts the UI themself. For
  acceptance, start the dev server and give the address.
- **Ideas belong in an ideation, not straight into a requirement:** New thoughts
  land first as a document under `docs/ideations/`. Only when working on it is it
  decided whether it becomes a feature, an architecture enabler or a guideline.

## Privacy of the sample files

Result and telemetry files of the game contain **names of other drivers**. They
must **never** go into the repository. Real files live only in `samples/` (excluded
by `.gitignore`). For tests, **anonymized fixtures** are built. For the demo,
completely anonymized sessions live in `public/demo` (see GUIDELINES).

## Environment specifics

- **Windows PC:** LMU runs here, the real files are here. Sample files for the
  parsers come from here.
- **MacBook Air:** Development without the game; tests run against the fixtures.
