# ADR-0007: League file and points formula

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The first version of the league ([IDEA-0001](../ideations/IDEA-0001-custom-league.md),
[IDEA-0002](../ideations/IDEA-0002-league-storage-and-sharing.md)) works only with one
organizer who writes. Everybody else reads. The write protection is provided by the
storage (sharing rights of a cloud folder); the app does not check it. Two things
have to be settled now, because everything builds on them later: how the league is
stored and passed on, and how the organizer specifies the points.

The result files know no stable driver ID
([ADR-0002](ADR-0002-lmu-result-format.md)), and players as a rule do not own the
files of the races.

## Decision

### The league is a single JSON file

- One file per league, readable and versioned (`format: "simscoreboard-league"`,
  `version: 1`). Self-hosters and other tools can read it.
- It contains a **snapshot of the results** of every race (driver, class, position,
  laps, status, total time, best lap, class grid position), not the result file
  itself. That way every player can open the table without the game files, and only
  what the scoring needs is in it (no chat lines, no lap times, no server names).
- From the results, the aliases, the corrections and the formula the app calculates
  the table on opening. The table itself is not stored, so that it never differs from
  the raw data.
- The field `signature` exists and is always `null` in version 1. A signature
  follows later ([IDEA-0003](../ideations/IDEA-0003-league-signature.md)); the format
  does not break for it.
- **Storage location:** The app keeps the leagues locally in IndexedDB. For passing
  on there are **Save as file** and **Open a file**, with the File System Access API
  where available, otherwise as a download and file picker. A file in a folder that a
  cloud client synchronizes covers Drive, OneDrive and Dropbox without the app
  signing in or the CSP being opened.
- A file of somebody else that is opened is a copy that lies locally and does not
  synchronize with the source. Whoever gets a new version opens the file again.

### Corrections are entries of their own

The snapshot of the races is never changed. Corrections stand in a list of their own,
each with race, driver, kind, value and reason:

- `timePenalty`: seconds on the total time; the drivers of the class are ranked anew
  (more laps before more time).
- `disqualify`: The driver gets no points for the race and drops out of the ranking.
- `position`: fixed position in the class; the others move up.
- `points`: addition or deduction on the points of the race.
- `drop` (dropped result, without a reason): The race does not count for this
  driver. Their points are 0, even with a points correction; the table shows an `X`.
  The other drivers do not move up, a first place does not count as a win.

Corrected races are recognizable in the table.

### Assigning drivers

An alias list per league assigns several names to one person. Comparison is, as
everywhere in the app, without the online suffix (`#1234`) and regardless of
spelling (`normalizeName`). A name without an entry is a person under the name as it
stands in the race.

### Scoring

Drivers only, separately per class. The class is the scoring class; a multi-class
race yields one table per class. The total is the sum of the race points. Dropped
results exist only as a `drop` correction of a single race of a driver; there is no
automatic dropping of the worst result.

**Factor of a race:** A race can carry a whole-number `factor` from 2 up (if it is
missing, 1 applies). The whole result of the race is multiplied by it, for example for
a long race: the points of the formula and those of a `points` correction. A
disqualified driver gets no formula points, but their correction points are
multiplied. A dropped result stays 0.

**Version 2:** The factor and `drop` belong to version 2 of the league file. The app
writes version 2 and reads versions 1 and 2. An app that only knows version 1
refuses the file as "from a newer version" instead of showing wrong points.

### Points formula

The organizer gives an expression that is evaluated per driver and race. It runs in a
**small parser of our own** with a fixed vocabulary. There is no `eval` and no
`Function` call (the CSP forbids both, and a formula from a foreign file must not be
able to do anything but calculate).

- **Values:** numbers (`11`, `0.5`), truth values are numbers (`1` and `0`).
- **Operators:** `+ - * / %`, comparisons `< <= > >= == !=`, `and`, `or`, `not`,
  parentheses, minus as a sign.
- **Functions:** `min`, `max`, `round`, `floor`, `ceil`, `abs`, `if(condition, then, else)`.
- **Variables:**

| Name | Meaning |
|---|---|
| `position` | position in the scoring class, after corrections |
| `overallPosition` | overall position according to the game |
| `starters` | participants of the class in the race |
| `fastestLap` | 1 for the fastest lap of the class, else 0 |
| `pole` | 1 for the first grid position of the class, else 0 |
| `finished` | 1 on reaching the finish without retirement, else 0 |
| `laps` | laps driven by the driver |
| `leaderLaps` | laps of the class winner |

- **Errors:** The formula is checked before evaluation. An error names the message
  and the position in the text. Unknown names, wrong argument counts and division by
  zero are errors, no silent `NaN`.
- The result of a race is not rounded; whoever wants whole points writes `round`.
- Default of a new league: `floor(40 * (1 - (position - 1) / (starters - 1))) + 10`
  (winner 50, last 10, evenly by position, whole points). With a single starter in a
  class it divides by zero; the evaluation then reports the race as invalid (at
  least two participants needed).
- Second example: `if(position <= 10, 11 - position, 0) + fastestLap`

A league file can be encrypted with a password; then only format, version, ID and
name are readable and the rest lies in an encrypted block
([ADR-0010](ADR-0010-league-password-protection.md)). The content and the version of
the league stay unchanged.

Templates the organizer chooses from come later as texts for the same field.

## Alternatives

- **Formula in JavaScript (`eval`):** rejected, see above; a file must not execute
  code.
- **Fixed points tables or a table position→points:** simpler, but does not cover
  bonus points and formulas. Sensible as templates later.
- **Only references to the result files:** requires every player to have the files.
  Rejected.
- **Store the table in the file:** can deviate from the raw data. Rejected.

## Consequences

- The league file contains names of other drivers. The app points that out on saving.
- The parser must be tested (error cases, limits, no side effects).
- A change of formula or format raises `version`; older files have to stay readable.
- Privacy and signature are deliberately open; they depend on IDEA-0003.
