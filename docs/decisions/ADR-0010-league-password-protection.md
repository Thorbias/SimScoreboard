# ADR-0010: Password protection of the league file

- **Status:** Accepted and built (unchecked: behavior on the live site and Drive)
- **Date:** 2026-11-05

## Context

The league file ([ADR-0007](ADR-0007-league-file-and-formula.md)) contains the
names of the drivers. It lies in a file or in Google Drive and is passed on through a
link ([ADR-0009](ADR-0009-league-google-drive.md)). The app reads a Drive file only
when it is shared with "Anyone with the link" (retrieval with an API key, without
sign-in); restricted sharing does not work. The organizer still wants to protect the
file: whoever has the link should be able to read it only with a password.
Everything runs in the browser, without a backend.

## Decision

The league file can be **optionally encrypted with a password**.

- **Method:** AES-256-GCM (Web Crypto). The key comes from the password with
  PBKDF2-HMAC-SHA-256, 600,000 rounds, random salt of 16 bytes. Every save takes a
  new random IV of 12 bytes. GCM also checks whether the file was modified.
- **File format:** A protected file has `format`, `version`, `id` and `name`
  **readable**, plus an `encryption` block (`v`, `kdf`, `iterations`, `salt`, `iv`,
  Base64) and `data` (the encrypted rest of the league: formula, races, drivers,
  corrections, signature field). A file without `encryption` stays as before; the
  league version stays unchanged, because the content has not changed.
- **Name readable:** The league name and the league ID stay in plain text so that a
  list or a dialog can name the league before the password is entered.
- **Place of the encryption:** Only at the edges. In the app (IndexedDB) the league
  lies unencrypted as before; it is encrypted when the app writes it to a file or to
  Drive, and decrypted when it reads a file, an address or a Drive link.
- **Who needs what:** Everybody who opens the league needs the password, also when
  refreshing. Whoever edits and saves it needs it for saving.
- **Remember on the device (optional):** The dialog has a checkbox "Remember on this
  device". Then not the password but the derived key stays as a non-extractable
  `CryptoKey` in IndexedDB (on the link of the league, not in the file). Without the
  checkbox the key applies only for the visit (in memory). In the settings a
  remembered key can be forgotten.
- **Check value:** The link stores a small encrypted check value so that on saving
  the app recognizes a wrongly entered password and does not overwrite the file with
  another key.
- **Choosing a password:** At least 12 characters, entered twice. There is no
  recovery.
- **Changing and removing:** A new password creates a new salt. The change applies
  from the next save; the league counts as changed until then. Earlier versions in
  Drive stay readable with the old password.
- **Change of owner** (lock, [ADR-0009](ADR-0009-league-google-drive.md)) keeps the
  link to the password.

## Alternatives

- **Restricted Drive sharing with the Google Picker:** Works without a password, but
  needs sign-in and file choice for every player and an additional Google interface.
  Rejected for the start.
- **Encrypt everything, also the name:** Would be more confidential, but the list
  could name the league only after the password. Left readable on request.
- **Store the password itself:** Would be more convenient, but the password would
  then lie in the browser. The derived, non-extractable key is the smaller solution.
- **Argon2 or scrypt:** Better against graphics cards, but not in Web Crypto; they
  would need a library or WebAssembly. PBKDF2 with many rounds is enough here.

## Consequences

- The strength depends on the password: whoever has the file can try it offline as
  often as they like. The app demands at least 12 characters and recommends a
  sentence.
- A forgotten password cannot be recovered. The copy in the app stays readable
  because it lies there unencrypted.
- A remembered key opens the league for everybody who uses the browser of this device;
  the dialog says so.
- The password does not protect against writing; that is still governed by Drive and
  the organizer's Google account.
- Every opening and saving costs a key derivation (around half a second), the keys
  are kept in memory afterwards.
- The readability of league ID and name does not reveal who takes part, but it does
  reveal the name of the league. Whoever does not want that chooses a neutral name.

## Still open

- Check on the live site with a Drive file and a second browser profile (shared link,
  password dialog, refresh with a remembered key).
- Whether `CryptoKey` in IndexedDB persists in all browsers (Chrome and Edge yes;
  Firefox and Safari unchecked). If it does not, the app simply asks for the password.
