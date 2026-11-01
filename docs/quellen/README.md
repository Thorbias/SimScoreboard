# Quellen

> Belegmaterial zu Dateiformaten und Technik. Stand 2026-11-01. **Alles hier ist
> Recherche, nicht Verifikation:** die Aussagen wurden nicht an echten Dateien
> geprüft (das ist Backlog 1). Wird nur ergänzt; Verifiziertes wandert in ein ADR
> oder in [ARCHITECTURE.md](../ARCHITECTURE.md).

## Dateien des Spiels

| Quelle | Aussage | Verifiziert |
|---|---|---|
| [LMU-Wiki: Telemetry](https://lemansultimate.wiki.gg/wiki/Telemetry) | Das Spiel schreibt `.ld`- und `.csv`-Logs nach `Documents/Le Mans Ultimate/Telemetry`; MoTeC i2 liest die `.ld`-Dateien. Genannte Kanäle u. a. Drehzahl, Gas, Bremse, Lenkwinkel, Gang, Reifen, Federung, Aero, Umgebung. Der Pfad der Session-Result-Dateien steht dort nicht. | nein |
| [Update V1.2 Changelog](https://www.bsimracing.com/le-mans-ultimate-update-v1-2-full-changelog/) | Mit V1.2 (Dezember 2025) kam „Telemetry Recording to DuckDB" und ein geändertes Dateinamen-Format der Telemetrie dazu. | nein |
| [pyLMUSharedMemory](https://github.com/blortle-dev/pyLMUSharedMemory) | Community-Bibliothek für den Shared-Memory-Zugriff des Spiels (`LMU_Data`). Relevant nur für eine mögliche Live-Funktion, die derzeit außerhalb des Umfangs liegt. | nein |

Offene Fragen an die echten Dateien:

- Wo liegen die Result-Dateien (vermutlich im `UserData`-Ordner des Spiels), und
  welches Format haben sie (vermutlich XML wie bei rFactor 2)?
- Welche Felder stehen drin: Runden, Sektoren, Stints, Reifen, Boxenstopps,
  Incidents, Chat, Fahrer-IDs?
- Welche Telemetrie-Formate schreibt die aktuelle Spielversion tatsächlich
  (`.duckdb`, `.ld`, `.csv`), und wie ist das DuckDB-Schema aufgebaut?
- Enthält die Telemetrie Positionsdaten für die Streckenkarte und einen Kanal für
  Virtual Energy?

## Technik

| Quelle | Aussage |
|---|---|
| [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) | Ordnerzugriff im Browser (`showDirectoryPicker`); volle Unterstützung nur in Chromium-Browsern. |
| [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) | DuckDB im Browser; kann Dateien lokal lesen und per SQL abfragen. |
