# ADR-0009: Liga im Cloud-Speicher — Datei-Handle, Adresse und optional Google Drive

- **Status:** Angenommen und gebaut (einzelne Annahmen siehe „Noch offen“)
- **Datum:** 2026-11-02

## Kontext

Die Liga ([ADR-0007](ADR-0007-liga-datei-und-formel.md)) ist eine JSON-Datei. Der
Organisator schreibt, alle anderen lesen; den Schreibschutz stellt der Speicher
her, nicht die App. Bisher fragt die App bei jedem Speichern nach dem Ziel, und
die Mitspieler müssen die Datei selbst besorgen und öffnen. Gewünscht ist: der
Organisator speichert mit einem Klick in seinen Cloud-Speicher (zuerst Google
Drive), die Mitspieler sehen über einen Link den neuesten Stand.

Randbedingungen:

- Kein Backend; alles läuft im Browser.
- SimScoreboard ist Open Source und läuft auch auf fremden Servern und in Forks.
  Zugangsdaten für einen Cloud-Dienst gelten nur für die Adresse, für die sie
  angelegt wurden (Google: erlaubte Herkunft, Referrer-Beschränkung des Keys).
- Dass der Nutzer bei Google angemeldet ist, gibt der Seite keinen Zugriff; ohne
  OAuth-Client-ID geht kein direkter Schreibzugriff auf Drive.

## Entscheidung

Zwei Stufen, die zusammen umgesetzt werden. Die erste braucht keine
Zugangsdaten und trägt allein.

### Stufe 1 — Datei-Handle und Adresse (ohne Zugangsdaten)

- **Organisator, Speichern:** Die App merkt sich das Datei-Handle der Liga
  (File System Access API, im Index in IndexedDB abgelegt, nicht in der
  Liga-Datei). „Speichern“ überschreibt dieselbe Datei; „Speichern unter“ wählt
  ein neues Ziel. Liegt die Datei in einem Ordner, den ein Cloud-Client
  synchronisiert (zum Beispiel Google Drive für Desktop), verteilt der Client sie.
  Nach einem Browser-Neustart fragt die App den Zugriff einmal erneut ab (wie beim
  Session-Ordner, [ADR-0004](ADR-0004-datenhaltung-und-einlesen.md)). Browser ohne
  die API laden die Datei herunter.
- **Mitspieler, Öffnen: Liga aus einer Adresse.** Die App lädt die Datei von einer
  beliebigen `https`-Adresse, die sie mit Cross-Origin-Freigabe ausliefert (eigener
  Server, Objektspeicher, Repository). Die Liga bleibt eine lokale Kopie mit
  gemerkter Quelle; „Aktualisieren“ holt den neuesten Stand. Das ist auch der Weg
  für Selbst-Hoster ohne Google.
- **Content-Security-Policy:** `connect-src` erhält `https:`. Das ist die einzige
  Öffnung nach außen, wenn Drive nicht konfiguriert ist; die Oberfläche benennt sie
  beim Laden aus einer Adresse. Skripte von fremden Servern bleiben ausgeschlossen.

### Stufe 2 — Google Drive (optional, konfigurierbar)

- **Nur aktiv, wenn konfiguriert.** Client-ID und API-Key stehen nicht im
  Quellcode, sondern kommen beim Bauen aus `VITE_GOOGLE_CLIENT_ID` und
  `VITE_GOOGLE_API_KEY`. Das offizielle Release bekommt sie als
  Repository-Variablen im Pages-Workflow, Forks und Selbst-Hoster tragen eigene ein.
  Fehlen sie, gibt es Drive in der Oberfläche nicht; die Policy erhält die
  Google-Adressen nur bei gesetzten Werten.
- **Organisator:** Anmeldung im Browser (Google Identity Services, Token-Modell)
  mit dem Scope **`drive.file`**: die App sieht nur Dateien, die sie selbst
  angelegt hat. „In Drive speichern“ legt die Datei an oder aktualisiert sie
  (Drive-API v3); die Datei-ID merkt sich die App lokal zur Liga. Vor dem
  Überschreiben prüft sie die Version in Drive und fragt, wenn sie neuer ist als
  die zuletzt geladene.
- **Mitspieler:** brauchen keine Anmeldung. Der Organisator gibt die Datei per
  „jeder mit dem Link kann ansehen“ frei; die App liest sie aus dem Drive-Link
  (Datei-ID) mit `files.get?alt=media` und dem API-Key.
- **Schreibschutz** liegt weiter bei Drive, nicht bei der App.
- **Zugangsdaten** sind öffentliche Werte; Geheimnisse (Client-Secret) gibt es im
  Token-Modell nicht. Vor dem ersten Speichern weist die App darauf hin, dass die
  Datei mit den Namen anderer Fahrer die Seite verlässt.

## Alternativen

- **Nur Drive-API:** zwingt jede Installation zu einem Cloud-Projekt und bindet
  die App an einen Anbieter; Stufe 1 deckt den Kern ohne das ab.
- **Nur Datei-Handle:** gibt den Mitspielern keinen Link und keinen aktuellen
  Stand.
- **Voller Drive-Scope (`drive`):** würde das ganze Drive freigeben; `drive.file`
  reicht und gilt als unkritisch.
- **Apps-Script-Endpunkt, eigenes Backend:** fragil beziehungsweise gegen die
  Ausrichtung der App.

## Folgen

- Die App öffnet erstmals Verbindungen nach außen (Adresse; mit Drive zusätzlich
  Google); die Oberfläche weist darauf hin.
- Das Google-Token gilt kurz (rund eine Stunde, kein Refresh im Token-Modell).
- Anbieter-Zugriff liegt hinter einer kleinen Schnittstelle (lesen, schreiben,
  Version); Tests laufen gegen einen Fake. Ein echter Lauf gegen Drive ist Teil
  der Abnahme.

## Bei der Umsetzung ergänzt

- **Link zur Liga:** „Per Link freigeben“ gibt die Datei frei und zeigt einen Link
  auf SimScoreboard (`#/league/open/<Datei-ID>`, für andere Adressen
  `#/league/open?u=<Adresse>`). Die Datei-ID ist kurz und zufällig, eine
  Komprimierung oder Verschleierung bringt nichts und wurde bewusst nicht gebaut.
  Ein Link lädt nie von selbst: eine Bestätigungsseite nennt zuerst den Server.
- **Geteilte Ligen sind nur lesbar.** Eine Liga, die aus einem Link oder einer
  Adresse kommt, kann nicht bearbeitet werden, wird bei jedem Öffnen von der Quelle
  aktualisiert (bei Fehlern bleibt die letzte Kopie) und trägt ein Schloss-Symbol.
- **Keine doppelten Ligen:** Dieselbe Liga (gleiche ID) wird nie zweimal gelistet.
  Eine Liga des Organisators (Datei, Drive oder ungespeicherte Änderungen) wird
  beim Öffnen des Links nicht überschrieben.
- **Vergleich vor dem Überschreiben** über die Revision des Inhalts
  (`headRevisionId`), nicht über Drives Zähler `version`, der auch beim Freigeben
  steigt.
- **Gelöschte Datei:** Ist die Datei in Drive gelöscht oder im Papierkorb, legt das
  Speichern eine neue an (neue ID, die Freigabe ist neu nötig).
- **Demo:** Die Verknüpfungen der Demo-Ligen (Datei, Drive) bleiben im
  Arbeitsspeicher, sonst legt jedes Speichern eine neue Drive-Datei an.
- **Zustimmung:** Das Google-Fenster hat ein eigenes Häkchen für die Drive-Dateien.
  Fehlt es, meldet die App das und fragt beim nächsten Mal erneut.

- **Nur „Jeder mit dem Link“ (geprüft 2026-11-03):** Drive liefert eine so
  freigegebene Datei per `alt=media` und API-Key ohne Anmeldung aus. Bei einer
  eingeschränkten Freigabe (nur bestimmte Personen) antwortet Google mit 404, auch
  wenn der Mitspieler bei Google angemeldet ist: die Seite sieht diese Anmeldung
  nicht, und selbst ein Token mit `drive.file` erreicht keine fremde Datei. Die App
  meldet das verständlich und weist beim Freigeben darauf hin. Wer nicht öffentlich
  per Link teilen will, gibt die Datei bestimmten Personen frei, und die Mitspieler
  besorgen sie sich selbst (zum Beispiel per Drive-Synchronisation) und öffnen sie
  lokal. Das ist akzeptiert.

- **Google sperrt den Abruf zeitweise (2026-11-03):** Nach vielen Abrufen derselben
  Datei von einer Netzwerkadresse antwortete `files.get?alt=media` mit einer
  HTML-Sperrseite („automated queries“, 403, ohne Freigabe für andere Seiten); der
  Browser sah nur einen Netzwerkfehler. Die Metadaten mit demselben Schlüssel gingen
  weiter, und nach einiger Zeit ging auch der Abruf wieder. Die App meldet das
  jetzt mit den möglichen Ursachen (nicht freigegeben, gelöscht, Sperre). Als
  Ausweg getestet und **verworfen**: die Download-Adresse von Drive
  (`drive.usercontent.google.com/download?id=…`) liefert zwar mit
  `Access-Control-Allow-Origin: *`, antwortet aber auf einen Abruf von einer
  anderen Seite (`Sec-Fetch-Site: cross-site`) mit 403; im Browser ist sie nicht
  nutzbar. Offen bleibt, wie belastbar der Abruf mit Schlüssel für viele
  Mitspieler ist (die Sperre gilt je Netzwerkadresse).

## Noch offen

- **Gesicherte Dateien über den Google Picker:** Nur bei echtem Bedarf. Der
  Mitspieler meldet sich in der App an und wählt die Datei im Picker aus (Scope
  `drive.file` gilt dann für diese Datei). Aufwand: Picker-API im Cloud-Projekt,
  Projektnummer als weiterer Konfigurationswert, `apis.google.com` in der
  Content-Security-Policy, Testnutzer im Teststatus; ungeklärt, ob die Berechtigung
  ohne erneute Auswahl bleibt.
- **Zweiter Rechner:** Die Datei-ID merkt sich die App nur im Browser. Ein zweiter
  Rechner des Organisators legt eine neue Datei an, solange die Liga dort nicht aus
  der Datei oder dem Ordner stammt. Ob `drive.file` die Datei dort erreichen würde,
  ist ungeprüft.
- **Datei-Handle nach einem Neustart:** Ob der Zugriff bei jedem Browser trägt;
  sonst bleibt „Speichern unter“.
