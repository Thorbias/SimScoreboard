# Guidelines — SimScoreboard

> How we work. The conventions deliberately follow the sister project
> SimPosture so that both projects are handled the same way. Grows with the
> project.

## Language

- **Everything in the repository is English:** documentation (`docs/`, `README.md`,
  `AGENTS.md`, `CLAUDE.md`), UI texts, code, identifiers, comments, commit
  messages, issues and pull requests. The project is open source, so every
  artifact must be readable for any contributor.
- The only German text is the German translation of the UI in
  `src/i18n/de.ts`. A maintainer may talk to a coding agent in any language; what
  ends up in the repository is English.
- UI texts come from a central translation layer (i18n), not as literals in
  components.
- **Terms:** A scoring round of a league is always called a **race** in English
  and **Rennen** in German (never "Lauf" or "Läufe"). This applies to the UI,
  the documentation and the code.

## Privacy of sample files

Real result and telemetry files contain the names of other drivers and must never
be committed. They live in `samples/` (ignored). Tests use **anonymized
fixtures**. Anonymizing replaces driver names, team names and every ID that leads
back to a person.

**The only exception** are the demo sessions in `public/demo`: complete but
anonymized result files that ship with the app. They are produced only with
`tools/anonymize-results.mjs --demo`, never by hand. A test checks them for
leftover names, local paths and server and connection data. New demo files are
looked at with `git diff` before the commit.

## No references to other tools

Names, screenshots, descriptions or links of other analysis tools do **not**
belong anywhere in the repository: not in docs, code, comments, fixtures, commit
messages or branch names. Features are described on their own terms, and the
design is our own.

## Testing

Commands: `npm test` (Vitest), `npm run typecheck`, `npm run lint`,
`npm run build`; `npm run check` runs everything together. Rules:

- **Parsers must be tested** and run against anonymized fixtures.
- **New logic** (evaluation, aggregation, calculation) gets unit tests; UI
  components first without automated tests (manual acceptance).
- **Before every commit:** tests, typecheck and build pass. A commit with
  failing tests is not allowed.
- **CSS classes are global.** Before a new class name, check whether it is
  already taken (`grep -rn "\.name" src`) and choose descriptive names (`progress`
  once made a chart grow endlessly: a foreign rule turned its frame into a box
  that adapts to its content). Charts measure their width on an element without
  padding of its own and only adapt when the width changes.

## User interface

- **Loading indicators:** Wherever a loading indicator makes sense we use
  `SectorProgress` (`src/ui/SectorBar.tsx`): the brand logo whose three bars fill
  from bottom to top (orange, green, purple), in steps of the progress and
  without a transition animation. No other spinners or bars.

## Project organization

### Document landscape

The dividing line is **work vs. state**: work gets done and disappears; state
describes what the project *is* and stays.

| Document | Kind | Rule |
|---|---|---|
| `PRODUCT.md` | State | Vision, audience, platform, scope, non-functional requirements |
| `FEATURES.md` | State | F-IDs — stays, but **condenses on completion** (see below) |
| `ARCHITECTURE.md` | State | technical direction |
| `decisions/` (ADR) | State | long-term decisions |
| `sources/` | State | evidence and research, only added to |
| `GUIDELINES.md` | State | this file: rules, **never in the backlog** |
| `BACKLOG.md` | Work | open items only; done = removed; handover between machines |
| `BUGS.md` | Work | open bugs only; fixed = removed |
| `ideations/` | Work | open ideations only; turned into something or dropped = deleted |

### The path of an idea

New idea → document in `docs/ideations/` (rough is enough, numbered
`IDEA-0001-short-slug.md`). Ideations have **no priority** and are not in the
backlog. Working on one decides what it is:

- **Feature** (new user capability) → entry in `FEATURES.md`. UI/UX design is
  always a feature.
- **Bug** → `BUGS.md`.
- **ARC** (architecture enabler) → ADR and/or extension of `ARCHITECTURE.md`.
- **Guideline** → this file.

Once the ideation has been turned into something, it is **deleted** — no history,
that is what Git is for. An ideation may also be dropped.

### FEATURES.md: condense instead of delete

A shipped capability is a lasting property of the product, not finished work.
While an entry is open it carries (after the format check) the detailed
implementation brief; on completion it shrinks to the normative description in
the present tense, a few lines.

Entry pattern, one section per entry, no table:

```markdown
## F-XXX — Title

Prio M · Status open

<Description in the present tense: what the app does.>
```

- **First sentence = self-contained summary**, so that skimming "heading + first
  sentence" is enough (`grep '^## F-' docs/FEATURES.md`).
- **A list instead of a run-on sentence** as soon as there are several properties.
- **No file paths and class names** in the description (→ ARCHITECTURE/code).
- **Not in it:** implementation stories and post-mortems.
- **Cross-references:** ADRs as a link, other features as a bare ID (F-004).
- **Rejected requirements are deleted**; exception: built and rejected again, then
  the heading stays with a short note.

### Backlog

`BACKLOG.md` is the single, prioritized backlog: all work items in one place. The
table contains only ranking and reference, no prose. Only open items (`TODO`,
`IN PROGRESS`), no `DONE`. `IN PROGRESS` only when really started. The backlog
says whether someone is *working*; `FEATURES.md` says whether the *capability is
in the product*. "What got done?" is answered by Git:
`git log -- docs/FEATURES.md`.

### IDs

- **F- and B-IDs are assigned consecutively and never reused**, not even after
  an entry is removed. The next free ID is a comment at the top of `FEATURES.md`
  or `BUGS.md`; the counter only goes up.
- **ADRs are snapshots** and do not reference F-IDs (describe the matter in
  prose). `ARCHITECTURE.md` and code may name F-IDs.
- **Recurring pitfalls** belong in this file as a short rule, not only in a
  commit message.

### Architecture decisions

Every fundamental decision is recorded as an ADR under `docs/decisions/`
(`ADR-NNNN-short-title.md`: context, decision, alternatives, consequences).
Status: `Proposed` until the developer approves, then `Accepted`.

### Naming convention

- **Root documents:** `SCREAMING.md` (`PRODUCT.md`, `FEATURES.md`, …).
- **Files in subfolders:** `kebab-case.md`, with a prefix for numbered series
  (`ADR-0002-persistence.md`, `IDEA-0002-short-slug.md`). File names are English.

## Implementation brief template

Every **open** feature in `FEATURES.md` gets, after the format check, a brief that
is ready to execute, so that a session can start without rebuilding context. It
stands with the entry and is removed on completion. Structure:

1. **Goal** in one or two sentences.
2. **Pointer to the working rules:** confirm the session goal, review as a
   dialogue, tests before the commit, follow the GUIDELINES.
3. **Numbered steps** with concrete file paths and, where needed, a short
   signature sketch.
4. **Verification and completion:** exact test and build commands, which visual
   check the developer does, when `FEATURES.md` condenses and the backlog item is
   removed.
5. **Pitfalls** of this machine or platform.

## Git

### Branches

- **`main` is the release state.** The workflow
  [pages.yml](../.github/workflows/pages.yml) builds the site on GitHub Pages from
  `main`: a push to `main` publishes. Only releases land here, always runnable,
  `npm run check` green, accepted by the developer.
- **`dev` is the development state.** Feature branches branch off `dev` and return
  to it. `dev` is usually pushed from the development machines. A release is the
  merge of `dev` into `main` (without fast-forward, `git merge --no-ff`, so that
  the release stays visible in the history).
- **Directly on `dev`** go: `BACKLOG.md`, `FEATURES.md`, `BUGS.md`, ADRs,
  ideations and other documentation, as well as small features and fixes that
  hardly touch code.
- **Feature branches** (`feature/<topic>`, for bugs `fix/<topic>`) carry the code
  of larger undertakings. Whether an undertaking gets a branch of its own is
  decided when the feature is created — not every feature needs one. A feature
  branch is pushed and, after acceptance, merged into `dev` with `--no-ff`.
  Documentation it needs (ADR, backlog) goes to `dev` first and is pulled into the
  branch, not the other way round.
- **Dependencies:** A feature that waits for another gets its branch only when the
  prerequisite is on `dev`. Until then it stays in the backlog with "Depends on".
- **Contributors** work in their own fork and open pull requests against `dev`.

### Rules

- Branch `main` is always runnable; `dev` should be as well.
- Small, thematically focused commits; commit format: short imperative summary in
  English, details in the body when needed.
- No commits and no pushes without explicit approval.
- **Before switching machines:** commit and push — do not forget `BACKLOG.md`
  (handover).
