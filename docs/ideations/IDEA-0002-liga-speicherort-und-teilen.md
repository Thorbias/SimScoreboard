# IDEA-0002 — Liga: Speicherort und Teilen

> **Status:** grob. Idee des Entwicklers (2026-11-01), gehört zur Custom League
> ([IDEA-0001](IDEA-0001-custom-league.md)). Die kritischen Anmerkungen unten sind
> Material für die Besprechung, keine Entscheidung.

## Idee

- **Die Seite liegt auf GitHub Pages**, für alle Nutzer erreichbar. Die **Liga-Daten
  liegen nicht dort**, sondern an einem Speicherort, den die Liga wählt. Der
  Standard ist **lokal**.
- **Das Repository ist klonbar und selbst hostbar.** Wer will, betreibt SimScoreboard
  auf einem eigenen Server, und dort können dann auch die Liga-Daten liegen.
- **Teilen über Cloud-Speicher.** Google Drive, OneDrive und weitere Anbieter
  lassen sich als Speicherort der Liga-Daten anbinden, damit alle Mitspieler auf
  dieselben Daten zugreifen können.

## Speicherorte (Skizze)

Die App spricht den Speicher über eine austauschbare Schnittstelle an („Storage
Provider“). Die Liga-Logik kennt nur diese Schnittstelle.

| Speicherort | Gedanke |
|---|---|
| Lokal im Browser | Standard, nichts verlässt den Rechner |
| Ordner auf der Platte (File System Access API) | auch ein Ordner, den ein Cloud-Client synchronisiert |
| Eigener Server | selbst gehostet, z. B. über WebDAV oder einen kleinen Datendienst |
| Cloud-Speicher (Drive, OneDrive, weitere) | direkte Anbindung per Anmeldung im Browser |

## Kritische Anmerkungen

1. **Die Datenschutz-Zusage und die CSP.** Heute erzwingt `connect-src 'self'`
   (NF-001, [ADR-0005](../decisions/ADR-0005-design-tokens-und-markenakzent.md) nennt
   die Technik), dass die Seite keine Daten an Fremdadressen schickt. Eine
   Cloud-Anbindung bricht das für die Adressen des Anbieters. Zu klären ist, wie die
   Zusage erhalten bleibt: Spieldateien werden nie hochgeladen, nur Liga-Daten. Ein
   Ansatz wäre ein **eigener Einstieg für den Liga-Modus** mit eigener, aufgeweiteter
   CSP; die übrige App behält `'self'`. Die CSP gilt je Seite, das wäre also machbar.
2. **Anmeldung ohne Backend.** Drive und OneDrive lassen sich im Browser per OAuth
   (mit PKCE) ansprechen. Dafür braucht das Projekt je Anbieter eine **registrierte
   Client-ID** (öffentlich, ohne Geheimnis), samt Weiterleitungsadressen und je nach
   Berechtigung einer Prüfung durch den Anbieter. Wer selbst hostet, trägt eigene
   Client-IDs ein. Mit eng gefassten Berechtigungen (nur eigene App-Dateien) bleibt
   die Prüfung leichter.
3. **Mehrere Schreibende.** Eine gemeinsame Gesamtdatei, die alle ändern, erzeugt
   Überschreib-Konflikte, und ohne Server gibt es keine Sperre. Robuster ist: **Jede
   Person schreibt nur eigene Dateien** (je Rennen eine Ergebnisdatei, Korrekturen
   als eigene Einträge), und die Tabelle wird beim Laden berechnet. Noch einfacher:
   **Nur der Organisator schreibt**, die Mitspieler lesen.
4. **Lesen ohne Konto.** Mitspielern genügt oft Lesen. Freigabelinks von Drive und
   OneDrive lassen sich aber nicht ohne Weiteres per `fetch` aus einer fremden
   Seite lesen (CORS). Das ist vor der Entscheidung zu prüfen; sonst bräuchten auch
   Mitspieler eine Anmeldung.
5. **Der einfachste erste Schritt.** Die Liga-Daten liegen in einem **Ordner auf der
   Platte**, den ein Cloud-Client (Drive, OneDrive, Dropbox) ohnehin
   synchronisiert. Das deckt alle Anbieter ab, braucht keine Anmeldung in der App
   und lässt die CSP unberührt. Nachteile: nur Chromium, und jeder Mitspieler
   braucht den Client und Zugriff auf den Ordner. Eine direkte Anbindung wäre dann
   ein Komfort-Ausbau.
6. **Selbst hosten und „kein Backend“.** Die App selbst ist statisch und überall
   hostbar. Ein Server, der Liga-Daten ablegt, ist dagegen ein Backend und
   widerspricht [PRODUCT.md](../PRODUCT.md) §5 (gilt für die erste Ausbaustufe).
   Eine Möglichkeit ist, **WebDAV** als vorhandene, standardisierte Schnittstelle zu
   nutzen (NAS, Nextcloud), statt eine eigene zu erfinden. Der Server muss dann
   CORS für die App erlauben.
7. **Personenbezug.** Liga-Daten enthalten Namen anderer Fahrer. Beim Teilen landen
   sie in fremden Clouds. Es braucht einen Hinweis, wer was sieht, und die
   Möglichkeit, Daten zu entfernen.
8. **Der Speicher hängt am Ursprung der Seite.** Lokale Daten gelten nur für die
   Adresse, unter der sie entstanden sind (GitHub Pages, eigener Server, `localhost`
   sind getrennte Welten). Wer die Seite wechselt, braucht Export und Import.

## Zu klären

- **Rollen:** Organisator schreibt, Mitspieler lesen? Oder dürfen alle Ergebnisse
  eintragen?
- **Reihenfolge:** Erst Ordner-Speicher (Anmerkung 5), dann WebDAV und Cloud-
  Anbieter? Welche Anbieter zuerst?
- **Format der Liga-Daten:** versioniertes, menschenlesbares JSON, damit Selbst-
  Hoster und Tools sie lesen können.
- **CSP im Liga-Modus** (Anmerkung 1) und was die Zusage dann genau verspricht.
- **Selbst-Hosting dokumentieren:** statisches Verzeichnis, optionaler Datendienst,
  Konfiguration der Client-IDs.
- **Fahrer-Identität:** die Zuordnung von Namen zu Personen aus IDEA-0001 gilt auch
  hier.
