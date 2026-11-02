# ADR-0009: Liga im Cloud-Speicher — Datei-Handle, Adresse und optional Google Drive

- **Status:** Vorgeschlagen (die Annahmen zum Abruf sind noch zu prüfen)
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

## Offen (vor der Umsetzung zu prüfen)

- Liefert Drive eine per Link freigegebene Datei per `alt=media` und API-Key aus
  dem Browser (CORS, Kontingent)? Sonst brauchen Mitspieler über Drive eine
  Anmeldung, und Stufe 1 bleibt ihr Weg.
- Erreicht `drive.file` die vom selben Projekt angelegte Datei auf einem zweiten
  Rechner?
- Verhalten, wenn die Datei in Drive gelöscht oder verschoben wird.
- Ob ein Datei-Handle mit Zugriff nach einem Neustart bei jedem Browser trägt;
  sonst bleibt „Speichern unter“.
