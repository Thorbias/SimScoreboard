# Setting up a league in Google Drive

The connection to Google Drive is optional
([ADR-0009](decisions/ADR-0009-league-google-drive.md)). Without the two values
below the site is built without Drive; the league then works with a file, a
folder and "Open from address". Every installation (the official release, a fork,
a server of your own) needs its **own** Google Cloud project, because the values
are bound to the address of the site.

## Create a Google Cloud project

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. **APIs & Services → Library:** enable the "Google Drive API".
3. **OAuth consent screen:** type "External", enter a name and a support address,
   add only `.../auth/drive.file` as scope. While the app is in status "Testing",
   only listed test users may sign in (the organizer is enough); the players read
   without signing in.
4. **Credentials → OAuth client ID** of type "Web application". Under "Authorized
   JavaScript origins" enter the address of the site, without a path (for example
   `https://thorbias.github.io`) and for development `http://localhost:5173`.
   The result is the **client ID**.
5. **Credentials → API key**: create one. Under "Application restrictions" choose
   "HTTP referrers" and enter the site (for example
   `https://thorbias.github.io/*`, for development `http://localhost:5173/*`),
   under "API restrictions" allow only the Drive API.

Client ID and key are public values (they are visible in the browser); the
restrictions are the protection. There is no client secret and none is needed.

## Set the values

- **Development:** create `.env.local` in the project folder (not committed), the
  template is `.env.example`:

  ```
  VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
  VITE_GOOGLE_API_KEY=...
  ```

  Restart the dev server afterwards.
- **GitHub Pages:** in the repository under *Settings → Secrets and variables →
  Actions → Variables* create the two variables `GOOGLE_CLIENT_ID` and
  `GOOGLE_API_KEY`. The Pages workflow passes them on when building.
- **Own server:** set the two environment variables `VITE_GOOGLE_CLIENT_ID` and
  `VITE_GOOGLE_API_KEY` when building (`npm run build`).

With the values set, the content security policy additionally allows Google's
sign-in script (`accounts.google.com`); without them it stays as before.

## File with a password

If you do not want to make the league readable for everyone with the link, set a
password in the settings of the league
([ADR-0010](decisions/ADR-0010-league-password-protection.md)). The file in Drive
may still be shared with "Anyone with the link": without the password it is
unreadable, only the league name is in plain text. You give the password to the
players by a different route than the link.

## Flow in the app

- **Organizer:** League → Settings → "Save to Google Drive" (sign in with Google,
  only for the files the app creates itself). Then "Share by link" and send the
  displayed link to the players. The sharing applies to everyone with the link and
  to reading only. Only this sharing works in the app: if you share the file in
  Drive with specific people only, the app reports on opening that the file is
  not shared by link (Google answers with 404). The players then have to get the
  file themselves (for example through Drive synchronization) and open it
  locally.
- **Players:** League → paste address or Drive link → "Open from address".
  "Refresh from address" in the settings fetches the latest state.
- The app remembers the file ID only in this browser. A second computer of the
  organizer creates a **new** file on the first save as long as the league does
  not come from the file or the folder there (open, see ADR-0009). On the same
  computer the app asks before overwriting when the file in Drive is newer.
