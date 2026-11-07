# ADR-0009: League in cloud storage — file handle, address and optionally Google Drive

- **Status:** Accepted and built (individual assumptions see "Still open")
- **Date:** 2026-11-02

## Context

The league ([ADR-0007](ADR-0007-league-file-and-formula.md)) is a JSON file. The
organizer writes, everybody else reads; the write protection is provided by the
storage, not by the app. So far the app asks for the target on every save, and the
players have to get and open the file themselves. What is wanted: the organizer
saves with one click to their cloud storage (Google Drive first), the players see
the latest state through a link.

Constraints:

- No backend; everything runs in the browser.
- SimScoreboard is open source and also runs on foreign servers and in forks.
  Credentials for a cloud service apply only to the address they were created for
  (Google: allowed origin, referrer restriction of the key).
- That the user is signed in to Google gives the page no access; without an OAuth
  client ID there is no direct write access to Drive.

## Decision

Two stages, implemented together. The first needs no credentials and stands on its
own.

### Stage 1 — file handle and address (without credentials)

- **Organizer, saving:** The app remembers the file handle of the league (File
  System Access API, stored in the index in IndexedDB, not in the league file).
  "Save" overwrites the same file; "Save as" chooses a new target. If the file lies
  in a folder that a cloud client synchronizes (for example Google Drive for
  desktop), the client distributes it. After a browser restart the app asks for
  access once more (as with the session folder,
  [ADR-0004](ADR-0004-data-storage-and-reading.md)). Browsers without the API
  download the file.
- **Players, opening: league from an address.** The app loads the file from any
  `https` address that serves it with cross-origin permission (own server, object
  storage, repository). The league stays a local copy with a remembered source;
  "Refresh" fetches the latest state. This is also the way for self-hosters without
  Google.
- **Content security policy:** `connect-src` gets `https:`. That is the only opening
  to the outside when Drive is not configured; the interface names it when loading
  from an address. Scripts from foreign servers stay excluded.

### Stage 2 — Google Drive (optional, configurable)

- **Only active when configured.** Client ID and API key are not in the source code
  but come from `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` at build time. The
  official release gets them as repository variables in the Pages workflow, forks
  and self-hosters enter their own. If they are missing, there is no Drive in the
  interface; the policy gets the Google addresses only when the values are set.
- **Organizer:** Sign-in in the browser (Google Identity Services, token model) with
  the scope **`drive.file`**: the app sees only files it created itself. "Save to
  Drive" creates or updates the file (Drive API v3); the app remembers the file ID
  locally for the league. Before overwriting it checks the version in Drive and asks
  when it is newer than the one last loaded.
- **Players:** need no sign-in. The organizer shares the file with "anyone with the
  link can view"; the app reads it from the Drive link (file ID) with
  `files.get?alt=media` and the API key.
- **Write protection** stays with Drive, not with the app.
- **Credentials** are public values; secrets (client secret) do not exist in the
  token model. Before the first save the app points out that the file with the names
  of other drivers leaves the site.

## Alternatives

- **Drive API only:** forces every installation to have a cloud project and binds
  the app to one provider; stage 1 covers the core without it.
- **File handle only:** gives the players no link and no current state.
- **Full Drive scope (`drive`):** would release the whole Drive; `drive.file` is
  enough and is regarded as uncritical.
- **Apps Script endpoint, own backend:** fragile or against the direction of the app,
  respectively.

## Consequences

- The app opens connections to the outside for the first time (address; with Drive
  additionally Google); the interface points that out.
- The Google token is valid for a short time (around an hour, no refresh in the token
  model).
- Provider access lies behind a small interface (read, write, version); tests run
  against a fake. A real run against Drive is part of the acceptance.

## Added during implementation

- **Link to the league:** "Share by link" shares the file and shows a link to
  SimScoreboard (`#/league/open/<file ID>`, for other addresses
  `#/league/open?u=<address>`). The file ID is short and random, compression or
  obfuscation brings nothing and was deliberately not built. A link never loads on
  its own: a confirmation page names the server first.
- **Shared leagues are read-only.** A league that comes from a link or an address
  cannot be edited, is refreshed from the source on every opening (on errors the
  last copy stays) and carries a lock symbol.
- **Edit as owner:** The lock of a read-only league (in the list and in the league
  header) is a button. After a confirmation it signs the user in to Google and asks
  Drive whether the account may change the file (`capabilities.canEdit`). If so, the
  league loses the source address and is linked to the Drive file; it is then
  editable and is saved to the same file. The proof of ownership is the Google
  account, not a signature. With `drive.file` the app sees files that the same
  client ID created, also from another site (for example `localhost` and GitHub
  Pages); this has not yet been checked on the live site.
- **No duplicate leagues:** The same league (same ID) is never listed twice. A league
  of the organizer (file, Drive or unsaved changes) is not overwritten when the link
  is opened.
- **Comparison before overwriting** through the revision of the content
  (`headRevisionId`), not through Drive's counter `version`, which also rises on
  sharing.
- **Deleted file:** If the file in Drive is deleted or in the trash, saving creates a
  new one (new ID, the sharing is needed anew).
- **Demo:** The links of the demo leagues (file, Drive) stay in memory, otherwise
  every save creates a new Drive file.
- **Consent:** The Google window has a checkbox of its own for the Drive files. If it
  is missing, the app reports that and asks again next time.

- **Only "Anyone with the link" (checked 2026-11-03):** Drive serves a file shared
  that way through `alt=media` and the API key without sign-in. With restricted
  sharing (specific people only) Google answers with 404, even when the player is
  signed in to Google: the page does not see this sign-in, and even a token with
  `drive.file` does not reach a foreign file. The app reports that in an
  understandable way and points it out when sharing. Whoever does not want to share
  publicly by link shares the file with specific people, and the players get it
  themselves (for example through Drive synchronization) and open it locally. That is
  accepted.

- **Google blocks the retrieval temporarily (2026-11-03):** After many requests for the
  same file from one network address, `files.get?alt=media` answered with an HTML
  block page ("automated queries", 403, without permission for other sites); the
  browser saw only a network error. The metadata with the same key continued to work,
  and after some time the retrieval worked again, too. The app now reports that with
  the possible causes (not shared, deleted, block). Tried as a way out and
  **rejected**: the download address of Drive
  (`drive.usercontent.google.com/download?id=…`) does serve with
  `Access-Control-Allow-Origin: *`, but answers a request from another site
  (`Sec-Fetch-Site: cross-site`) with 403; it cannot be used in the browser. Still
  open is how robust the retrieval with a key is for many players (the block applies
  per network address).

- **Revision first, then the content (2026-11-05):** The block came back. The metadata
  with the same key continued to work meanwhile (`headRevisionId`). On opening and
  refreshing the app therefore asks for the revision of the file first and loads the
  content only if it differs from the remembered one. That saves most downloads and,
  for protected files, also the password prompt. If the revision is not readable,
  loading happens as before. The first request after a block still fails until Google
  lifts it.

## Still open

- **Secured files through the Google Picker:** Only on real demand. The player signs
  in in the app and chooses the file in the Picker (scope `drive.file` then applies
  to this file). Effort: Picker API in the cloud project, project number as a further
  configuration value, `apis.google.com` in the content security policy, test users
  in test status; unclear whether the permission stays without choosing again.
- **Second computer:** The app remembers the file ID only in the browser. A second
  computer of the organizer creates a new file as long as the league there does not
  come from the file or the folder. Whether `drive.file` would reach the file there
  is unchecked.
- **File handle after a restart:** Whether the access holds in every browser;
  otherwise "Save as" remains.
