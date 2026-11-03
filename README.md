# SimScoreboard

Open-source, browser-based results and lap time overview for **Le Mans
Ultimate**: read the result files the game writes, browse your sessions, compare
laps, keep your personal bests organized, and later run a league or cup.

Everything runs locally in your browser. Your race files are never uploaded.

> **Status:** early development. The results, analysis and personal best views
> work; telemetry and the league function are planned. SimScoreboard is an
> unofficial community project and is not affiliated with the makers of Le Mans
> Ultimate.

## What it does today

- **Sessions:** reads the result files from your game folder and lists the
  sessions grouped by event, with filters for type, track layout, class and
  date, and favourites. The list stays on the left while the chosen session is
  open on the right.
- **Results:** race and qualifying results by class or overall, with gaps, best
  laps, fastest sectors, and your own driver highlighted.
- **Analysis:** lap time comparison of up to four drivers, position chart,
  statistics per class, incidents, penalties and chat.
- **Personal bests:** your fastest laps per track layout, class and car.
- **League:** build a league from race sessions, with standings per class from
  a points formula you write, merged driver names and corrections. The
  organizer saves the league as a file or to Google Drive and shares a link;
  the players see it read-only and up to date.
- **Demo:** try the app without game files, with anonymized sample sessions
  ("Try the demo"). Your own sessions and settings are not touched.
- **Local only:** the index and your settings stay in your browser. English and
  German, light and dark.

Planned: telemetry comparison of two laps, track maps from your own telemetry,
and cups, signed league files and more cloud storage providers.

## Use it online

The app is hosted on GitHub Pages: <https://thorbias.github.io/SimScoreboard/>.
Open it in a Chromium browser (Chrome, Edge), choose your folder, or try the
demo. The files are read in your browser and never uploaded.

## Run it locally

You need [Node.js](https://nodejs.org) 26 (the version is in `.nvmrc`; a version
manager such as [fnm](https://github.com/Schniz/fnm) picks it up).

```bash
npm install
npm run dev     # development server
npm run check   # typecheck, lint, tests and build
```

Open the page in a Chromium browser (Chrome, Edge) and choose your Le Mans
Ultimate `UserData` folder (for example `SteamLibrarysteamappsmmone mans ultimateSERDATA`). OTHER BROWSERS
can pick the folder with a file dialog, but cannot remember it.

The Google Drive connection for leagues is optional and off by default. To turn
it on for your own build or server, create a Google Cloud project and set
`VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` when you build (see
[docs/LIGA-DRIVE.md](docs/LIGA-DRIVE.md)). The values never belong in the
repository.

## Documentation

| Document | Content |
|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | Vision, audience, scope, non-goals |
| [docs/FEATURES.md](docs/FEATURES.md) | Features and their status |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical direction |
| [docs/BACKLOG.md](docs/BACKLOG.md) | What is next, handover notes |
| [docs/GUIDELINES.md](docs/GUIDELINES.md) | How we work |
| [docs/decisions/](docs/decisions/) | Architecture decision records |
| [docs/LIGA-DRIVE.md](docs/LIGA-DRIVE.md) | Setting up the optional Google Drive connection |
| [docs/ideations/](docs/ideations/) | Ideas in progress |
| [AGENTS.md](AGENTS.md) | Context for AI coding agents |

The project documentation is in German; code, UI texts and this file are in
English.

## License

[MIT](LICENSE). Third-party material that is bundled with the site is listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
