# SimScoreboard

Open-source, browser-based results and lap time overview for **Le Mans
Ultimate**: read the result files the game writes, browse your sessions, compare
laps, keep your personal bests organized, and run a league.

Everything runs locally in your browser. Your race files are never uploaded.

> SimScoreboard is an unofficial community project and is not affiliated with
> the makers of Le Mans Ultimate. It is built with AI-assisted agentic coding
> (see [Built with AI](#built-with-ai)).

## What it does today

- **Sessions:** reads the result files from your game folder and lists the
  sessions grouped by event, with filters for type, track layout, class and
  date, and favourites. The list stays on the left while the chosen session is
  open on the right.
- **Results:** race and qualifying results by class or overall, with gaps, best
  laps, fastest sectors, and your own driver highlighted.
- **Analysis:** lap time comparison of up to four drivers, position chart,
  statistics per class, incidents, penalties and chat.
- **Statistics:** your fastest laps per track layout, class and car, plus an overview of your races, cars, and the drivers you meet most often.
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
Ultimate `UserData` folder (for example
`SteamLibrary\steamapps\common\Le Mans Ultimate\UserData`). Other browsers can
pick the folder with a file dialog, but cannot remember it.

For the optional Google Drive connection, copy `.env.example` to `.env.local`
and fill in the two values (see [Google Drive in short](#google-drive-in-short)).
`.env.local` is not committed.

## Host it yourself

SimScoreboard is a static site: there is no server and no database, so you can
host it anywhere that serves files. The easiest way is your own fork on GitHub
with your own GitHub Pages site. It builds itself on every push.

1. **Fork** this repository on GitHub.
2. In your fork, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Open the **Actions** tab and enable workflows (GitHub switches them off in
   new forks).
4. Push to `main`, or run the workflow *Deploy to GitHub Pages* by hand
   (**Actions → Deploy to GitHub Pages → Run workflow**). After a minute the
   site is live at `https://<your-user>.github.io/<your-fork>/`.

The site works without any further setup, including leagues saved as files. Only
the Google Drive connection needs two values. Without them it is simply not
built in.

To turn Google Drive on, add two **repository variables** under
**Settings → Secrets and variables → Actions → Variables** (they are variables,
not secrets, because both values are public in the browser anyway):

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | the OAuth client ID, ends with `.apps.googleusercontent.com` |
| `GOOGLE_API_KEY` | the API key |

Run the workflow again afterwards, because the values are baked in when the site
is built. For any other server, run `npm run build` with the environment
variables `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` set and upload the
`dist` folder.

### Google Drive in short

Every installation needs its **own** Google Cloud project, because the values
are bound to the address of the site. It takes about ten minutes and costs
nothing. The full steps are in [docs/LEAGUE-DRIVE.md](docs/LEAGUE-DRIVE.md):
this is what has to be set:

1. In the [Google Cloud Console](https://console.cloud.google.com/) create a
   project and enable the **Google Drive API**.
2. **OAuth consent screen:** type *External*, add only the scope
   `.../auth/drive.file` (the app can then only touch files it created itself).
   While the app is in status *Testing*, only the test users you list can sign
   in. You, the organizer, are enough: players open the shared link without
   signing in.
3. **OAuth client ID** of type *Web application*. Under *Authorized JavaScript
   origins* enter the address of your site without a path, for example
   `https://<your-user>.github.io` (and `http://localhost:5173` for local
   development). This is `GOOGLE_CLIENT_ID`.
4. **API key**, restricted to *HTTP referrers* (for example
   `https://<your-user>.github.io/*`) and to the Drive API only. This is
   `GOOGLE_API_KEY`. Players use it to read a shared league file.

Neither value is a secret and there is no client secret; the restrictions are
the protection. Keep them out of the repository anyway and set them as described
above.

## Built with AI

This project is developed with **agentic coding**: most of the code, the tests
and the documentation are written by an AI coding agent (Claude Code), working
in dialogue with the maintainer, who sets the direction, decides, reviews and
tests the result in the browser. The agent's context lives in the repository
([AGENTS.md](AGENTS.md)), and the decisions behind the design are recorded in
[docs/decisions/](docs/decisions/). If you contribute with the help of an AI
tool, that is fine; you stay responsible for what you submit.

## Contribute

SimScoreboard is free software (MIT), and you are welcome to fork it, change it
and make it your own. If you build something that others could use too, a pull
request back to this project would be very welcome: a fix, a new view, another
language, support for another sim. You do not need to ask first; if the change is
big, an issue to talk it over is a nice start.

- Branch from `dev` and open the pull request against `dev`. `main` only holds
  releases.
- Run `npm run check` (typecheck, lint, tests, build) before you push.
- Never commit real result or telemetry files: they contain the names of other
  drivers. Use anonymized fixtures instead (see
  [docs/GUIDELINES.md](docs/GUIDELINES.md)).
- Everything in the repository is English: code, comments, UI source texts,
  documentation, commit messages and pull requests. Only the German UI
  translation lives in `src/i18n/de.ts`.

Found a bug or have an idea? Open an issue.

## Documentation

| Document | Content |
|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | Vision, audience, scope, non-goals |
| [docs/FEATURES.md](docs/FEATURES.md) | Features and their status |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical direction |
| [docs/BACKLOG.md](docs/BACKLOG.md) | What is next, handover notes |
| [docs/GUIDELINES.md](docs/GUIDELINES.md) | How we work |
| [docs/decisions/](docs/decisions/) | Architecture decision records |
| [docs/LEAGUE-DRIVE.md](docs/LEAGUE-DRIVE.md) | Setting up the optional Google Drive connection |
| [docs/ideations/](docs/ideations/) | Ideas in progress |
| [docs/sources/](docs/sources/README.md) | Research notes on the game file formats |
| [AGENTS.md](AGENTS.md) | Context for AI coding agents |

## License

[MIT](LICENSE). Third-party material that is bundled with the site is listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
