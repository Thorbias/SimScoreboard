# samples/

Local-only folder for real Le Mans Ultimate files (session results, telemetry)
used while developing the parsers.

Everything here except this README is ignored by git. Real files contain other
drivers' names, so they must never be committed. Tests use anonymized fixtures
instead.

Expected files:

- 1–2 session result files from the game's `UserData` folder (ideally one race
  and one qualifying session you drove yourself)
- 1–2 telemetry files from `Documents/Le Mans Ultimate/Telemetry`
