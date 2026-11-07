# ADR-0002: The game's result files (XML) as the data source

- **Status:** Accepted (for the result XML; telemetry gets an ADR of its own)
- **Date:** 2026-11-01

## Context

The first stage of SimScoreboard reads the session results that Le Mans Ultimate
writes itself. So far the picture of the file formats rested on research
([sources/](../sources/README.md)). This ADR records what was **verified against
real files**.

**Files examined (only read, not in the repository):**

- One practice from game version 0.5000 (June 2025, single player, three classes).
- One practice, one qualifying and one race from game version 1.4200
  (October/November 2026, multiplayer, 20 drivers of one class).
- The channel configuration of the telemetry.
- Directory listings of the game folder (around 400 result files, 3 KB to 540 KB).

Not examined are a multi-class race of the current version, a race with a driver
swap and a real telemetry recording (see "Open").

## Decision

SimScoreboard reads the game's **result XML files** as the source for session
header, results, laps, incidents, penalties and chat. A parser translates them into
the normalized domain model ([ARCHITECTURE.md](../ARCHITECTURE.md)); the interface
does not know the file format.

### Location and file name

- Folder `UserData/Log/Results` in the game directory, one file per session.
- Name: `YYYY_MM_DD_hh_mm_ss-NNxN.xml`. The timestamp is the time of writing, that
  is the **end** of the session. `x` is `P` (practice), `Q` (qualifying) or `R`
  (race), followed by a digit (always `1` so far). The two digits before the letter
  look random and carry no recognizable meaning.
- The same folder holds `BatchTemplate*.ini` with real names. They are not result
  files and are ignored.

### Structure

- Encoding UTF-8, line ending CRLF, root `rFactorXML > RaceResults`. The file
  begins with an internal DOCTYPE (`<!ENTITY rFEnt …>`). Whether the browser's
  parser tolerates it is to be checked at the scaffold; the fallback is removing
  the DOCTYPE line before parsing.
- **Header** (child elements of `RaceResults`): mode (`Setting`: `Multiplayer` or
  `Race Weekend`), track (`TrackVenue`, `TrackCourse`, `TrackEvent`), track length
  in meters, game version, start time of the event (`DateTime`, Unix),
  `TimeString`, race duration, rules. `TrackData` contains a local file path and is
  not used. `VehiclesAllowed` is unreliable (in a multi-class practice it named
  only one car).
- **Session section** as a further child element named after the session
  (`Practice1`, `Qualify`, `Race`). So far every file contained exactly one
  section. In it: start (`DateTime`, `TimeString`), `Minutes`, `Laps`,
  `MostLapsCompleted`, `Stream` and one `Driver` per car. The race additionally has
  `FormationAndStart`.
- **Event grouping:** Qualifying and race of the same weekend carried the same
  `DateTime` in the header. That is a usable grouping key (together with the
  track); confirmed on one pair.

### Car entry (`Driver`)

- Driver: `Name`, `isPlayer`, `Connected`, `ServerScored`.
- Car: `VehName`, `Category`, `CarType`, `CarClass`, `CarNumber`, `TeamName`.
- Result: `Position`, `ClassPosition`, `BestLapTime`, `Laps`, `Pitstops`,
  `FinishStatus`. In the race additionally `GridPos`, `ClassGridPos`,
  `FinishTime`. Observed `FinishStatus` values: `None`, `Finished Normally`, `DNF`,
  `DQ`.
- `ControlAndAids` can occur **several times** (with `startLap`/`endLap`) when
  driving aids change during the session.
- A lap without a time appears as `--.----` in the text. A time is a decimal number
  in seconds.

### Laps (`Lap` below `Driver`)

- Text: lap time in seconds. Attributes: `num`, `p` (position), `et` (session time
  at the end of the lap), `topspeed`, `fcompound`, `rcompound`, `pit`.
- Sectors `s1`, `s2`, `s3` are **individual times**, not cumulative (checked: the
  sum gives the lap time up to one rounding digit). They are missing for laps that
  were not scored or ended in the pit.
- Tire data: in the file of version 0.5000 `twfl`, `twfr`, `twrl`, `twrr` (wear) and
  `fuel`, `fuelUsed`, `ve`, `veUsed`; in the files of version 1.4200 in
  multiplayer instead `FL`, `FR`, `RL`, `RR` (compound per wheel), without fuel and
  virtual energy. Whether the difference is due to version or mode is **not
  clarified**.

### Stream (`Stream` in the session section)

Chronologically ordered events, each with `et` (seconds since session start):

| Element | Content |
|---|---|
| `Score` | A car passing a timing line: text `Name(ID) lap=N point=P t=… et=…`. `point` 0 seems to be the finish line, 1 and 2 the sector boundaries (observation, not confirmed) |
| `Sector` | new sector best time; from version 1.4200 also damage reports ("new suspension damage"), then with attributes `Driver`, `ID`, `Class` |
| `Incident` | contact with an object (`Immovable`, `Post`, `Sign`, `Wheel`) or another car, with severity and opponent (name and ID in the text) |
| `TrackLimits` | warning points: attributes `Driver`, `ID`, `Lap`, `WarningPoints`, `CurrentPoints`, `Resolution`; text `No Further Action`, `Warning` or a penalty |
| `Penalty` | penalty with attributes `Driver`, `ID`, `Penalty`, `Time`, `Laps`, `Reason` |
| `ChatMessage` | chat message, text `Sender: message` |

In the file of version 0.5000 only `Score`, `Sector` and `Incident` occurred.

### Driver identity

- There is **no stable driver ID**. Within a file the names were unique; the
  assignment in the stream runs through `Name(ID)` with a session-local number.
- The same driver appeared in different files under **different names** (older file
  with an appended suffix, newer without). Some names carry one or two `#`
  suffixes.
- `isPlayer` is set in multiplayer for **all human drivers** and thus does not
  identify the user. The own driver has to be configured, with an alias list or a
  comparison without the `#` suffix.

### Privacy

The files contain names of other drivers, online identifiers and file paths. They
stay in the game folder or in `samples/` and never reach the repository (see
[GUIDELINES.md](../GUIDELINES.md)). Fixtures are anonymized: names, teams,
identifiers, IDs in the stream and paths are replaced.

## Alternatives

- **Replay files (`.Vcr`):** folder `UserData/Replays`, 5 to 500 MB per session,
  proprietary format. Not examined and not documented; would mean reverse
  engineering without a specification.
- **Real-time logging (CSV):** The existing file contains only frame times of the
  game, no driving data. Unsuitable.
- **Telemetry only as a source:** Telemetry provides no results, penalties or
  opponents. The result files remain the basis.

## Consequences

- Results, qualifying, lap chart, position chart, statistics, incidents, penalties
  and chat can be built from the result files. Chat, penalties and contacts between
  drivers exist only in newer multiplayer files; the parser treats every event as
  optional.
- The parser is to be built **version tolerant**: ignore unknown elements and
  attributes, model missing fields as "not present", never guess. In addition,
  aborted or almost empty sessions (a few KB) must load without error.
- The properties that depend on `fuel`, `ve` and tire wear are not available for all
  files and must not be assumed.
- The custom league (IDEA-0001) cannot rely on names; assigning names to persons
  has to happen manually or by rule.
- For the index, header and basic driver data are enough; the details are in the
  stream and in the laps and are read on demand. With around 400 files and up to
  540 KB per file, parsing in a worker is uncritical.

## Open

- **Telemetry:** On the development machine the automatic recording is switched
  off, the folder holds only the channel configuration (around 55 channels with
  sample rates of 1 to 100 Hz, among them speed, throttle, brake, steering, engine
  RPM, GPS position, track position and virtual energy; the gear is an event, not a
  channel). Format of the data file, schema and assignment to the result files are
  **unverified**. An ADR of its own follows after a real recording.
- Multi-class race of the current version, race with a driver swap, sessions
  without header fields and files of other game versions.
- Whether `fuel`/`ve` exist in single player of the current version.
- Meaning of the character string `NN` in the file name, assignment of the
  measuring points in `Score` and meaning of the fields `Resolution` and
  `LapRankIncludingDiscos`.
- Behavior of the browser's parser with the internal DOCTYPE.
