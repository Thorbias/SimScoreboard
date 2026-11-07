# Features — SimScoreboard

> What SimScoreboard should be able to do and what is open. **Lifecycle of the
> capability**, not work status: whether someone is working on it right now is
> stated exclusively in [BACKLOG.md](BACKLOG.md) (`TODO`/`IN PROGRESS`) — there is
> deliberately no "in progress" here.
>
> Rules for entries (entry pattern, condensing rule, implementation brief, ID
> assignment): [GUIDELINES.md](GUIDELINES.md), section "Project organization".

Priority: **M**ust / **S**hould / **C**ould · Status: **open** / **done**.
The platform is the web everywhere (see [PRODUCT.md](PRODUCT.md)), so entries
carry no platform note.

**Data basis:** The result XML files are checked
([ADR-0002](decisions/ADR-0002-lmu-result-format.md)); the entries about them are
adapted to it. Telemetry (F-012, F-013) is **unverified** and waits for a real
recording. Events such as incidents, penalties and chat exist only in newer
multiplayer files and are optional everywhere. Implementation briefs are created
together with the project scaffold.

<!-- Next free F-ID: F-026 — assigned consecutively, never reuse,
     not even the IDs of deleted entries (otherwise old commits and
     references point to the wrong requirement). -->

## F-001 — Read the session folder

Prio M · Status done

The user grants access to the folder with the game data, and SimScoreboard reads all sessions without any file leaving the computer.

- The game folder, `UserData` or `Results` is accepted; the result files are found below it.
- Chromium browsers: folder access through the File System Access API; the handle stays stored, and after a restart one click on "Reconnect folder" is enough. On connecting, new and changed files are read again and vanished ones are removed from the index.
- Other browsers: folder picker as a fallback; there the page knows the files until it is reloaded.
- Reading runs in the background (web worker) with a progress indicator; unreadable files are counted and reported.
- Technology: [ADR-0004](decisions/ADR-0004-data-storage-and-reading.md).

## F-002 — Sessions

Prio M · Status done

The user browses all read sessions in a list, newest first. The list stands on the left and stays visible while the chosen session is open with its tabs on the right; this makes switching between sessions quick.

- Filters by session type (practice, qualifying, race), track, period, car class and favorites; they are collapsed in the list and show the number of active filters.
- Sessions of the same event (same track and event start in the file header) are shown grouped.
- Each row shows session type, date, the classes involved and the result of the own driver, with a win mark for a class win.
- The number of sessions is in the list header; the open session is highlighted in the list.
- On a narrow screen the app shows either the list or the session, with a way back to the list.
- Country and flag of the track: F-018.

## F-003 — Own driver marked

Prio M · Status done

The user sets their driver names, and SimScoreboard marks them in the list and in the results with a badge of its own.

- The names are maintained in the settings; suggestions from the most frequent names of the read sessions make the choice easier.
- The game provides no stable driver ID, and the "player" flag applies to all humans in multiplayer. Therefore there is a list of aliases; the comparison ignores upper and lower case and appended `#` suffixes.
- The marking in pit orange appears in the session list, in the result tables and in the charts (F-007, F-008); for F-012 it applies as soon as it exists.

## F-004 — Race result

Prio M · Status done

The app shows the results of a race by class or overall.

- Columns: position, car number, driver, car, tire compound of the last lap, best lap, gap, pit stops, laps, total time.
- The gap shows the time to the leader, "+n L" when lapped, "DNF" or "DQ" on retirement.
- The best lap of the class is highlighted.
- Toggle overall / per class; the row of the own driver is highlighted.

## F-005 — Qualifying result

Prio M · Status done

The app shows the results of a qualifying (and of a practice) with sector times and gaps.

- Columns: position, car number, driver, car, tire compound of the best lap, best sectors 1–3, best lap, gap to pole, laps.
- The fastest sectors and the best lap of the class are marked in color.
- Drivers without a scored lap appear at the end without times.
- Toggle overall / per class.

## F-006 — Session header

Prio M · Status done

Every session shows its key data in a header area.

- Session type, event, track and layout, date and time, length in minutes or laps, track length, number of drivers, mode and game version.
- The views of a session (result, lap chart, position chart, statistics, incidents, chat) are reachable as tabs; only those that make sense for the session type appear (position chart and statistics only in a race). Tabs: result, lap times, positions, statistics, incidents, chat.
- The flag of the track: F-018.

## F-007 — Lap chart

Prio S · Status done

The user compares the lap time progression of up to four drivers lap by lap.

- Up to four drivers (A to D), one line each in a color of its own: A orange (the own driver), B cyan, C pink, D lime. The own driver and the fastest driver of their class are preselected.
- Each driver has a dropdown and an X to remove; the others move up (C becomes B, D becomes C). "Add driver" adds the fastest driver not yet shown. The own driver can be removed too.
- A click on a driver in the result table switches to this tab and puts them on the next free slot (A, B, C, D; if the own driver is already A, it starts at B). When all four are taken, every further click replaces driver D.
- Laps without a scored time and very slow laps (over 125 % of the median) that are cut off in the chart are bridged by a dashed line between the neighboring laps so that the line does not break. The best lap of each driver is highlighted in the table.
- Below, a table with lap, sectors 1–3 and lap time of all chosen drivers as well as the delta of each driver to A.
- The chart view can be hidden so that only the table remains.

## F-008 — Position chart

Prio S · Status done

The app shows the position progression of all drivers of a race from the starting grid to the finish.

- One line per driver, axis from "Start" over every lap to "Finish".
- Toggle overall / per class; in the class view the positions are ranks within the class.
- The own driver is highlighted and the rest toned down; a click on a line or the legend highlights another driver, "Show all equally" removes the highlighting.
- The legend names drivers with their final position.

## F-009 — Statistics per class

Prio S · Status done

The app highlights the notable performances of a race per class.

- Fastest lap and fastest sectors 1–3 with driver and lap number.
- Consistency: driver with the lowest standard deviation of lap times; only clean laps count (no pit lap, at most 107 % of the own best time, at least five laps).
- The most positions gained and the most positions lost compared with the starting grid of the class.
- The most used tire compound with lap count.

## F-010 — Incidents

Prio S · Status done

The user sees all incidents of a session as a timeline.

- Columns: session time, remaining time (for a timed session), type, driver, class, lap, detail.
- Types: contact (with a car or an object, with severity), damage, track limits (with warning points) and penalty (imposed or served).
- Filters by type, class and driver.
- If there were chat messages from the timestamp of a contact or damage until 30 seconds after it, the row shows a speech bubble with the number of messages. A click opens a small chat window with these messages and a mark when the incident happened. The chat tab (F-011) is not affected.
- The chat tab is a table (time, driver, message, incident). The "incident" column shows a lightning bolt when an incident matches the message: a contact or damage of the writing driver (the chat shows short names such as "V Deux" for "Vittorio Deux"; or a contact "with" this driver) that happened up to 30 seconds before the message (or at the same time). A click jumps to the incidents tab, scrolls to the row and highlights it; if several match, the last one before the message counts.
- The events exist only in newer multiplayer files; if they are missing, the tab is omitted.

## F-011 — Session chat

Prio C · Status done

The app shows the chat history of a session as a tab of its own. Chat exists only in newer multiplayer files; the tab appears only when messages are present.

## F-012 — Telemetry comparison of two laps

Prio M · Status open

The user lays a reference lap and a comparison lap on top of each other and reads
the differences from the driver inputs.

- Both laps are selectable from session, driver and lap number; the best lap is
  suggested.
- Channels stacked, common track axis: speed, throttle, brake, steering angle,
  virtual energy. In the channel configuration the gear is an event, not a
  channel, and is shown as an event where applicable (unverified).
- Per channel minimum, maximum and mean of the two laps.
- Time cursor with playback and speed choice; channels can be reordered and
  hidden.
- Display of the lap times, the difference and the sector times of both laps.

## F-013 — Track map and lap key figures

Prio S · Status open

Next to the telemetry comparison the app shows the track as a map and sums up the
lap in key figures.

- Track map from the position data of a lap (if the data contains them), with a
  cursor matching the time cursor of the comparison.
- The shape of each track variant is derived from the own telemetry and stored
  locally; later it can serve as a small symbol per variant in the session list
  and the personal bests. A source from public maps is rejected (inconsistent
  licenses, gaps in the variants).
- Coloring selectable by speed, inputs or sectors.
- Key figures: top speed, average speed, fuel consumption of the lap. The
  consumption is optional: `fuelUsed` was only found in files of version 0.5000.

## F-014 — Personal bests

Prio M · Status open

The user sees their best laps ordered by track, car class and car. The assignment
"own driver" across several files rests on F-003.

- On the left the list of all tracks, each track variant as an entry of its own
  (times of different layouts cannot be compared) with country, number of sessions
  and the best time per class. The list stays while the details of the chosen
  track stand on the right; the layout matches that of the sessions (F-002).
- Detail view of a track: best qualifying and race lap, laps driven in total,
  cars, sessions.
- Per class a table of the records per car with session type, date, sectors, lap
  time and gap to the class best time.
- Per class a chart of the development: the best lap of each session as a dot and
  the personal best so far as a step line.
- Filter by class.
- From every record a jump leads to the session and, if telemetry is present, to
  the telemetry comparison.

## F-015 — Favorites

Prio C · Status open

The user marks sessions as favorites and filters the session list by them.

## F-016 — Local index and settings

Prio M · Status done

The app stores the metadata index of the sessions and the settings locally in the browser, so that it starts quickly after the first read.

- Only metadata in the index; the details of a session are read from the file on demand.
- Also stored are the own driver names, favorites, the language and the folder access. The appearance (automatic, light or dark) is kept as a convenience value in `localStorage` so that it applies before the first paint.
- The storage is best effort: if it is not available (e.g. private mode), the app keeps working with an in-memory index and points that out.
- The user can delete the local index at any time in the settings.
- Technology: [ADR-0004](decisions/ADR-0004-data-storage-and-reading.md).

## F-017 — Multilingual interface

Prio S · Status done

The interface exists in English and German; English is the default, German is chosen for a German browser locale, and the language can be set in the settings. All texts come from a central translation layer; a test ensures that both languages have the same keys and placeholders.

## F-018 — Track country and flag

Prio C · Status open

The app shows country and flag for every track in the session list, in the session header and in the personal bests.

- The result files only name venue, course and event; country and flag come from a track table of our own in the project. If a track is not known there, the note is omitted.

## F-019 — Overview of the personal bests

Prio S · Status open

As the first entry of the statistics, the overview sums up everything the user has driven across all tracks.

- Key figures: sessions, laps driven, distance driven in kilometers, track variants, races, wins and podiums (in the class) with their share of the races.
- Per class the five most important cars: on how many track variants the car holds the fastest own lap of the class (count and share, for example 911 20 %, BMW 75 %, McLaren 5 %) and how many laps it was driven. Cars without a best time appear by laps.
- The most driven track variants as a table with their share of the laps driven, with a jump to the details of the track.
- Form: retirements (DNF and disqualification) in relation to the races, average finishing position and average positions gained of the last ten races as well as the list of these races with start, finish and change of position in the class.
- Records: number of class records of the last 30 days as well as the five newest and the five oldest class records with age in days.
- Multiplayer and single player: share of the sessions and of the laps per mode.
- Activity: laps driven per month of the last twelve months as columns.
- Who you drive with (multiplayer sessions only; nothing counts against the AI): the drivers you drove the most races with (races in which both drove at least one lap) and those you had the most collisions with (contacts between two drivers in all multiplayer sessions; both reports of a contact count once). Both lists show only drivers with at least two encounters and at most ten. The contacts are stored in the index (version 4) for this; the sessions are read again on the next scan.
- The page is called "Statistics" in the navigation (formerly "Personal bests"); "Statistics" in a session is a tab of its own.
- Only what belongs to the own driver counts (F-003); every track variant counts on its own (F-014).

## F-020 — Demo data

Prio S · Status open

The app can be tried without game files, with sample sessions in which all names are anonymized.

- Start: "Try the demo" in the session list (as long as no folder is connected) and in the settings; "End demo" in the banner and in the settings.
- Content: 14 complete sessions from five events (Bahrain, Spa in multiplayer, Algarve, Spa as a race weekend against the AI, a multi-class race) with practice, qualifying and race. Times, results, incidents and penalties are real; drivers are called "Driver 07", the own one "Demo Driver", teams "Team 03"; the chat consists of neutral sentences.
- The demo stands next to the real library: sessions, favorites and results of the demo are never stored, own sessions, driver names, favorites and the local index stay untouched. Own driver names and the index are locked during the demo.
- The files are produced with `tools/anonymize-results.mjs --demo` and tested for leftover names (see [GUIDELINES.md](GUIDELINES.md), privacy).

## F-021 — League (version 1, organizer only)

Prio S · Status done

An organizer combines sessions into a league, the app calculates the driver standings, and the league can be passed on as a file that the players only read. Starting points are [IDEA-0001](ideations/IDEA-0001-custom-league.md) and [IDEA-0002](ideations/IDEA-0002-league-storage-and-sharing.md).

- Roles: The organizer writes, everybody else reads. The write protection is provided by the storage (sharing rights of the folder); the app does not check it. A signature follows later ([IDEA-0003](ideations/IDEA-0003-league-signature.md)); the data format provides an empty field for it.
- League: name, class rule and points formula. The races of a league are sessions of type race that the organizer selects and puts in an order. A race can also be imported from a single result file (.xml) that is not in the session folder.
- Points formula: The organizer gives an expression that calculates the points per driver and race. Variables: `position` (position in the scoring class), `overallPosition`, `starters` (participants of the class), `fastestLap` (1 for the fastest lap of the class, else 0), `pole` (1 for pole in qualifying), `finished` (1 if scored), `laps`, `leaderLaps` (laps of the class winner). Functions: `min`, `max`, `round`, `floor`, `if(condition, then, else)`, plus `+ - * / %`, comparisons and `and`/`or`. The default is `floor(40 * (1 - (position - 1) / (starters - 1))) + 10` (winner 50, last 10; with a single starter in the class the race is invalid), and `if(position <= 10, 11 - position, 0) + fastestLap` is given as a second example in the help text.
- Safety of the formula: a small parser of our own with a fixed vocabulary, no `eval` (the content security policy does not allow it anyway). The app shows errors in the formula with their position in the text before it calculates.
- Templates for formulas (for example common points tables) come later; version 1 has only the input field.
- Standings: drivers only, separately per class. Table with rank, driver, points per race and total; plus the progression of the points over the races.
- The column headers of the races show the name and below it date and time. Name and time lead to the session if it exists on this computer; otherwise they are not a link.
- Merging drivers: Result files have no stable ID ([ADR-0002](decisions/ADR-0002-lmu-result-format.md)). The organizer assigns several names to one person (alias list per league).
- Corrections: Possible afterwards are time penalties, disqualifications, a manually changed position, points added or removed and the dropped result (the race does not count for this driver: 0 points, an X in the table; without a reason), each otherwise with a reason. The original data stays unchanged; the corrections are separate entries in the league and recognizable as such in the table.
- Tab "Races": Each row shows the name (editable), date and start time of the race, the buttons to move and remove, and at the very end the factor. The start time is in the file (`started`); older races keep showing the end time.
- Factor: On the tab "Races" every race carries a factor (whole number, default 1). The whole result of the race (formula and points corrections) is multiplied by it, for example 2 for a long race. In the table a factor above 1 stands below the race name (×2). The league file thus has version 2.
- Saving: readable, versioned JSON in a folder the organizer chooses (File System Access API; also a folder that a cloud client synchronizes). Without Chromium there is export and import as a file.
- Sharing: Players open the league file in the app and see the table without any way to write. They do not need the files of the races: the league file contains the evaluated results per race.
- Privacy: The league file contains names of other drivers. The app points that out on saving and sharing.

## F-022 — Pit stop times

Prio S · Status open · waits for telemetry (backlog 7)

The evaluation shows, per driver, the pit stops with their duration, measured from telemetry.

- The source is exclusively telemetry (event `In Pits` and track position, see ADR-0008). The result XML only knows the number of stops and the lap (`pit`), no standing time; estimated times from lap times are deliberately not provided.
- Without a recording for the session no value is shown, no approximation.
- Open: place of display (results or analysis), split into pit lane and standstill, assignment of the recording to the session. Whether a branch of its own is needed is clarified at the start.

## F-023 — League in cloud storage

Prio S · Status done

The organizer saves the league to their cloud storage with one click, the players open it by link and see the latest state ([ADR-0009](decisions/ADR-0009-league-google-drive.md)).

- Without credentials: "Save" overwrites the same file (the file handle of the league is remembered, after a restart the browser asks once for access); if it lies in a synchronized folder (for example Google Drive for desktop), the cloud client distributes it. A league can also be opened from an `https` address and refreshed from there.
- Google Drive directly, only when client ID and API key are set at build time (setup in [LEAGUE-DRIVE.md](LEAGUE-DRIVE.md)): sign-in with Google (access only to files the app creates itself), "Save to Google Drive" creates or updates the file, asks before overwriting a changed version and recreates a deleted file. "Share by link" shows a link to SimScoreboard that the players open.
- Players: The link asks before loading. The league is a copy with a remembered source, **read-only** (lock symbol) and is refreshed on every opening; it never appears twice.
- Edit as owner: The lock of a read-only league is a button. After a confirmation (works only if the file in Google Drive belongs to the signed-in account) the league switches to edit mode and is saved to the same Drive file, also on another computer or another site (for example GitHub Pages instead of `localhost`).
- Notice "not saved yet" (banner, dot) for new and changed leagues; a new league opens in the settings. Deleting removes the league only from the browser, never saved files.
- **Limit, deliberately decided:** The app reads a Drive file only when it is shared with "Anyone with the link" (retrieval with an API key, without sign-in). Files with restricted sharing (specific people only) are answered by Google with 404, even when the player is signed in to Google; the app reports that in an understandable way. Whoever does not want to share the league publicly by link shares it with specific people, and the players fetch the file themselves (for example through Drive synchronization) and open it locally; that lies outside the app and is accepted. Only on real demand will it be checked how secured files can become accessible: players sign in in the app and pick the file through the Google Picker (scope `drive.file`; open are the Picker API, project number as a configuration value, script from `apis.google.com` in the content security policy, test users and whether the permission stays).
- The write protection is provided by the storage (sharing: only the organizer may edit). The league file contains names of other drivers; the app points that out on saving to the cloud and on sharing.

## F-024 — Password protection of the league file

Prio S · Status built, awaiting acceptance

The organizer can optionally encrypt the league file with a password ([ADR-0010](decisions/ADR-0010-league-password-protection.md)). This makes it possible to share a file in Google Drive with "Anyone with the link" without every holder of the link being able to read the results and driver names.

- Settings of the league: set, change, remove a password. At least 12 characters, entered twice; there is no recovery. The change applies from the next save.
- Encrypted when writing (file and Google Drive), decrypted when reading (file, address, Drive link, refresh). The league name stays readable, the rest is encrypted (AES-256-GCM, key from the password with PBKDF2).
- A dialog asks for the password and, on request (checkbox "Remember on this device"), remembers it as a non-extractable key in the browser; the settings can forget it again. Without the checkbox the key applies for the visit.
- A wrong password is detected and asked for again; a modified file is noticed.
- The password does not protect against writing; that is still governed by Drive and the Google account.

## F-025 — CSV export of the league table

Prio S · Status built, awaiting acceptance

In the settings of the league the current table can be downloaded as CSV, to check it or pass it on in a spreadsheet. Built directly on `dev`, without a branch of its own.

- **"Export table (.csv)":** matches the display. One row per driver with class, rank, driver, points and one column per race (header: name, date and time, factor). The cells are numbers; a dropped result is written as `X`, a disqualification as `DSQ` (with the points, if there are any). The asterisk for "corrected" is omitted so that the numbers stay computable; the corrections are in the points export.
- **"Export points (.csv)":** one row per driver and race with everything the points are made of: grid position, position according to the game, counted position, starters, fastest lap, pole, finished, laps (the inputs of the formula), points of the formula, points from corrections, factor, dropped result, disqualified, points, the corrections in plain text with reason, and the formula. The rule is: points = (formula points + correction points) × factor, 0 for a dropped result.
- Both exports use the same calculation as the table (the calculation delivers a detail per cell), so they cannot deviate.
- Format: semicolon as separator, UTF-8 with BOM for German spreadsheet programs, date as `YYYY-MM-DD hh:mm`. Texts that begin with `=`, `+`, `-` or `@` (driver names, reasons) get an apostrophe in front so that the spreadsheet does not run them as a formula.
- The file is offered only as a download, is **not encrypted** (also for a password-protected league) and contains the names of the drivers; the settings point that out. Players with a read-only league can export as well.
- Without a valid table (formula error, only one driver in a class, no races) the buttons are disabled.
