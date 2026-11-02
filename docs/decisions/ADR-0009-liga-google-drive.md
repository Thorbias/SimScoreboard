# ADR-0009: Liga-Datei in Google Drive, Mitspieler lesen per Link

- **Status:** Vorgeschlagen (die Annahmen zum Abruf sind noch an Google Drive zu prüfen)
- **Datum:** 2026-11-02

## Kontext

Die Liga ([ADR-0007](ADR-0007-liga-datei-und-formel.md)) ist eine JSON-Datei.
Der Organisator schreibt, alle anderen lesen; den Schreibschutz stellt der Speicher
her, nicht die App. Bisher geht das nur über eine Datei, die per Hand in einen
Ordner gelegt und von jedem Mitspieler selbst geöffnet wird. Google Drive soll
das ersetzen: Der Organisator speichert aus der App heraus, die Mitspieler öffnen
einen Link und sehen immer den neuesten Stand.

Die App hat kein Backend und soll keines bekommen. Alles Folgende läuft im Browser.

## Entscheidung

- **Organisator:** meldet sich im Browser mit Google an (Google Identity Services,
  Token-Modell) und verwendet nur den Scope **`drive.file`**. Die App sieht damit
  nur Dateien, die sie selbst angelegt hat, nicht das übrige Drive. „Speichern in
  Drive“ legt die Liga-Datei an oder aktualisiert sie (Drive-API v3, Upload per
  `files.create` und `files.update`). Die Datei-ID merkt sich die App lokal zur Liga
  (nicht in der Liga-Datei). Kein Google Picker.
- **Mitspieler:** brauchen keine Anmeldung. Der Organisator gibt die Datei in
  Drive als „jeder mit dem Link kann ansehen“ frei. Die App liest die Datei mit
  `files.get?alt=media` und einem API-Key (öffentlich, auf die Seiten-Adresse
  beschränkt). Eingabe ist der Drive-Link; die App liest die Datei-ID daraus. Die
  Liga bleibt eine lokale Kopie mit gemerkter Quelle; „Aktualisieren“ holt den
  neuesten Stand.
- **Schreibschutz** liegt weiter bei Drive: Wer die Datei nicht bearbeiten darf,
  kann sie nicht überschreiben. Die App prüft es nicht.
- **Konflikte:** Vor dem Speichern liest die App die Version der Datei in Drive.
  Ist sie neuer als die zuletzt geladene, fragt die App, bevor sie überschreibt.
- **Datenschutz:** Die Liga enthält Namen anderer Fahrer. Vor dem ersten Speichern
  in Drive weist die App darauf hin, dass die Datei die Seite verlässt (der Satz
  „Dateien verlassen den Rechner nicht“ gilt für Ligen in Drive nicht). Ohne
  Anmeldung und ohne Drive-Link bleibt alles lokal wie bisher.
- **Zugangsdaten:** Client-ID und API-Key gehören dem Betreiber des Projekts
  (Google-Cloud-Projekt, OAuth-Zustimmungsbildschirm, API-Key auf die
  GitHub-Pages-Adresse beschränkt). Sie sind öffentliche Werte und stehen als
  Konfiguration im Build; Geheimnisse (Client-Secret) gibt es im Token-Modell
  nicht. Die Schritte zum Anlegen stehen in der Doku beim Feature.
- **Content-Security-Policy:** Freigabe nur für Google Identity Services
  (`https://accounts.google.com` in `script-src`, `connect-src`, `frame-src`) und
  `https://www.googleapis.com` (`connect-src`). Alles übrige bleibt wie in der
  Seite.

## Alternativen

- **Ordner-Weg (Google Drive für Desktop):** funktioniert heute über den
  Speichern-Dialog, aber ohne Link und ohne aktuellen Stand für die Mitspieler.
  Bleibt als Rückfall, auch ohne Google-Konto.
- **Beide Rollen mit Anmeldung:** zwingt jeden Mitspieler zu einem Google-Konto;
  für ein Lesen unnötig.
- **Voller Scope (`drive`):** würde das ganze Drive des Organisators freigeben;
  `drive.file` reicht, und der Scope ist unkritisch (keine Google-Prüfung nötig).
- **Eigenes Backend:** widerspricht der Ausrichtung der App.

## Folgen

- Die App öffnet erstmals Verbindungen nach außen, daher Anpassung der CSP und
  ein Hinweis in der Oberfläche.
- Das Token gilt kurz (rund eine Stunde, kein Refresh im Token-Modell); der
  Organisator meldet sich beim Speichern bei Bedarf erneut an.
- Tests der Drive-Anbindung laufen gegen eine abgebildete Schnittstelle
  (Fake); ein echter Lauf gegen Drive ist Teil der Abnahme.

## Offen (vor der Umsetzung zu prüfen)

- Liefert Drive eine per Link freigegebene Datei per `alt=media` und API-Key aus
  dem Browser (CORS, Kontingent)? Sonst bleibt nur der Abruf mit Anmeldung.
- Verhalten von `drive.file`, wenn der Organisator auf einem zweiten Rechner
  weiterarbeitet: Die vom selben Projekt angelegte Datei sollte erreichbar sein.
- Verhalten, wenn der Organisator die Datei in Drive löscht oder verschiebt.
