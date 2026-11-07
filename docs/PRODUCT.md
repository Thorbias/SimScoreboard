# Product — SimScoreboard

> The **frame** of the product: what SimScoreboard is, for whom, which quality
> requirements apply and what deliberately does **not** belong to it. A lasting
> document — it describes no individual features and no work status (that is in
> [BACKLOG.md](BACKLOG.md)).

## 1. Vision and purpose

SimScoreboard turns the files Le Mans Ultimate writes anyway into usable
insight: check results, compare laps, evaluate telemetry and organize your
personal best times — entirely in the browser, open source and without an
account.

It also brings a **custom league function** (points scoring and standings across
several sessions) — see [IDEA-0001](ideations/IDEA-0001-custom-league.md) for the
original idea; the first version is built.

## 2. Audience

LMU players on PC, from the occasional driver to the ambitious league racer, who
want to analyze their sessions afterwards, and league organizers.

## 3. Platform

- **Web**, modern desktop browsers. Full functionality (folder access to the game
  data) in Chromium browsers; Firefox and Safari get a fallback through
  drag-and-drop or a folder picker.
- Hosting as a static site (e.g. GitHub Pages), no backend.

## 4. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NF-001 | Privacy | The game's files are processed only locally in the browser and never uploaded |
| NF-002 | Offline | After the first load the application works without an internet connection |
| NF-003 | Scale | Collections of more than 1,000 sessions stay fast: parsing in web workers, list with metadata only, details on demand |
| NF-004 | Languages | UI ready for several languages (i18n); English is the default |
| NF-005 | License | MIT; no adoption of code, branding or assets of third parties |

## 5. Scope limits (out of scope)

- **No overlay and no live telemetry.** The game outputs live data through shared
  memory, which a browser cannot reach. Relaxing this would be a project of its
  own (local helper plus WebSocket) and an ideation of its own.
- **No backend and no user accounts** in the first stage. The league function has
  to show whether that stays sustainable (IDEA-0001, IDEA-0002).
- **Own design, no foreign assets.** Manufacturer logos and track photos are not
  shipped.
- **Unofficial:** Not a product of the game's maker and not connected to it.

## 6. Order of the stages

1. **Results:** session list, results by class, qualifying.
2. **Analysis:** lap chart, position chart, statistics, incidents.
3. **Telemetry:** compare two laps, delta, track map.
4. **Lap times:** personal best times per track, car and class.
5. **League:** standings from several race sessions (first version built).

The concrete work steps are in [BACKLOG.md](BACKLOG.md).
