# Liga in Google Drive einrichten

Die Verbindung zu Google Drive ist optional ([ADR-0009](decisions/ADR-0009-liga-google-drive.md)).
Ohne die beiden Werte unten wird die Seite ohne Drive gebaut; die Liga arbeitet dann
mit Datei, Ordner und „Von Adresse öffnen“. Jede Installation (das offizielle
Release, ein Fork, ein eigener Server) braucht ihr **eigenes** Google-Cloud-Projekt,
weil die Werte an die Adresse der Seite gebunden sind.

## Google-Cloud-Projekt anlegen

1. In der [Google Cloud Console](https://console.cloud.google.com/) ein Projekt
   anlegen.
2. **APIs und Dienste → Bibliothek:** die „Google Drive API“ aktivieren.
3. **OAuth-Zustimmungsbildschirm:** Typ „Extern“, Name und Support-Adresse eintragen,
   als Scope nur `.../auth/drive.file` hinzufügen. Solange die App im Status „Test“
   ist, dürfen nur eingetragene Testnutzer sich anmelden (der Organisator genügt);
   die Mitspieler lesen ohne Anmeldung.
4. **Anmeldedaten → OAuth-Client-ID** vom Typ „Webanwendung“. Unter „Autorisierte
   JavaScript-Quellen“ die Adresse der Seite eintragen, ohne Pfad (zum Beispiel
   `https://thorbias.github.io`) und für die Entwicklung `http://localhost:5173`.
   Das Ergebnis ist die **Client-ID**.
5. **Anmeldedaten → API-Schlüssel** anlegen. Unter „Anwendungseinschränkungen“ auf
   „HTTP-Verweis-URLs“ stellen und die Seite eintragen (zum Beispiel
   `https://thorbias.github.io/*`, für die Entwicklung `http://localhost:5173/*`),
   unter „API-Einschränkungen“ nur die Drive API erlauben.

Client-ID und Schlüssel sind öffentliche Werte (sie stehen im Browser); die
Einschränkungen sind der Schutz. Ein Client-Secret gibt es hier nicht und braucht
es nicht.

## Werte setzen

- **Entwicklung:** `.env.local` im Projektordner anlegen (wird nicht committet),
  Vorlage ist `.env.example`:

  ```
  VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
  VITE_GOOGLE_API_KEY=...
  ```

  Den Dev-Server danach neu starten.
- **GitHub Pages:** im Repository unter *Settings → Secrets and variables →
  Actions → Variables* die beiden Variablen `GOOGLE_CLIENT_ID` und
  `GOOGLE_API_KEY` anlegen. Der Pages-Workflow reicht sie beim Bauen weiter.
- **Eigener Server:** beim Bauen (`npm run build`) die beiden Umgebungsvariablen
  `VITE_GOOGLE_CLIENT_ID` und `VITE_GOOGLE_API_KEY` setzen.

Mit gesetzten Werten erlaubt die Content-Security-Policy zusätzlich Googles
Anmelde-Skript (`accounts.google.com`); ohne sie bleibt sie wie bisher.

## Ablauf in der App

- **Organisator:** Liga → Einstellungen → „In Google Drive speichern“ (Anmeldung mit
  Google, nur für die Dateien, die die App selbst anlegt). Danach „Per Link
  freigeben“ und den angezeigten Link an die Mitspieler schicken. Die Freigabe
  gilt für jeden mit dem Link und nur zum Lesen. Nur diese Freigabe funktioniert
  in der App: Gibst du die Datei in Drive nur bestimmten Personen frei, meldet die
  App beim Öffnen, dass die Datei nicht per Link freigegeben ist (Google antwortet
  mit 404). Dann müssen die Mitspieler die Datei selbst besorgen (zum Beispiel
  per Drive-Synchronisation) und lokal öffnen.
- **Mitspieler:** Liga → Adresse oder Drive-Link einfügen → „Von Adresse öffnen“.
  „Von der Adresse aktualisieren“ in den Einstellungen holt den neuesten Stand.
- Die Datei-ID merkt sich die App nur in diesem Browser. Ein zweiter Rechner des
  Organisators legt beim ersten Speichern eine **neue** Datei an, solange die Liga
  dort nicht aus der Datei oder dem Ordner stammt (offen, siehe ADR-0009).
  Auf demselben Rechner fragt die App vor dem Überschreiben, wenn die Datei in
  Drive neuer ist.
