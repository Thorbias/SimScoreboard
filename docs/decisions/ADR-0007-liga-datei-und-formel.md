# ADR-0007: Liga-Datei und Punkteformel

- **Status:** Angenommen
- **Datum:** 2026-11-02

## Kontext

Die erste Version der Liga ([IDEA-0001](../ideations/IDEA-0001-custom-league.md),
[IDEA-0002](../ideations/IDEA-0002-liga-speicherort-und-teilen.md)) arbeitet nur mit
einem Organisator, der schreibt. Alle anderen lesen. Den Schreibschutz stellt der
Speicher her (Freigabe-Rechte eines Cloud-Ordners); die App prüft ihn nicht. Zwei
Dinge müssen jetzt feststehen, weil später alles darauf aufbaut: wie die Liga
gespeichert und weitergegeben wird, und wie der Organisator die Punkte vorgibt.

Die Result-Dateien kennen keine stabile Fahrer-ID
([ADR-0002](ADR-0002-lmu-result-format.md)), und Mitspieler besitzen die Dateien der
Rennen in der Regel nicht.

## Entscheidung

### Die Liga ist eine einzelne JSON-Datei

- Eine Datei je Liga, lesbar und versioniert (`format: "simscoreboard-league"`,
  `version: 1`). Selbst-Hoster und andere Werkzeuge können sie lesen.
- Sie enthält eine **Momentaufnahme der Ergebnisse** jedes Rennens (Fahrer, Klasse,
  Platz, Runden, Status, Gesamtzeit, beste Runde, Startplatz in der Klasse), nicht die
  Result-Datei selbst. So kann jeder Mitspieler die Tabelle ohne die Spieldateien
  öffnen, und es steht nur das darin, was die Wertung braucht (keine Chatzeilen, keine
  Rundenzeiten, keine Servernamen).
- Aus den Ergebnissen, den Aliassen, den Korrekturen und der Formel berechnet die App
  die Tabelle beim Öffnen. Die Tabelle selbst wird nicht gespeichert, damit sie sich
  nie von den Rohdaten unterscheidet.
- Das Feld `signature` ist vorhanden und in Version 1 immer `null`. Eine Signatur
  folgt später ([IDEA-0003](../ideations/IDEA-0003-liga-signatur.md)); das Format
  bricht dafür nicht.
- **Speicherort:** Die App hält die Ligen lokal in der IndexedDB. Zum Weitergeben gibt
  es **Speichern als Datei** und **Öffnen einer Datei**, mit der File System Access
  API wo vorhanden, sonst als Download und Dateiauswahl. Eine Datei in einem Ordner,
  den ein Cloud-Client synchronisiert, deckt Drive, OneDrive und Dropbox ab, ohne dass
  die App sich anmeldet oder die CSP geöffnet wird.
- Eine geöffnete Datei eines anderen ist eine Kopie, die lokal liegt und sich nicht
  mit der Quelle abgleicht. Wer eine neue Fassung bekommt, öffnet die Datei erneut.

### Korrekturen sind eigene Einträge

Die Momentaufnahme der Rennen wird nie verändert. Korrekturen stehen in einer eigenen
Liste, jeweils mit Rennen, Fahrer, Art, Wert und Begründung:

- `timePenalty`: Sekunden auf die Gesamtzeit; die Fahrer der Klasse werden neu
  gereiht (mehr Runden vor mehr Zeit).
- `disqualify`: Der Fahrer erhält für das Rennen keine Punkte und rückt aus der Reihung.
- `position`: fester Platz in der Klasse; die übrigen rücken nach.
- `points`: Zu- oder Abschlag auf die Punkte des Rennens.

In der Tabelle sind korrigierte Rennen erkennbar.

### Fahrer-Zuordnung

Eine Aliasliste je Liga ordnet mehrere Namen einer Person zu. Verglichen wird wie
überall in der App ohne Online-Suffix (`#1234`) und ohne Beachtung der Schreibweise
(`normalizeName`). Ein Name ohne Eintrag ist eine Person unter dem Namen, wie er im
Rennen steht.

### Wertung

Nur Fahrer, getrennt je Klasse. Die Klasse ist die Wertungsklasse; ein Mehrklassen-
Rennen ergibt eine Tabelle je Klasse. Die Summe ist die Summe der Rennpunkte; Streich-
ergebnisse und Bonuspunkte außerhalb der Formel gibt es in Version 1 nicht.

### Punkteformel

Der Organisator gibt einen Ausdruck vor, der je Fahrer und Rennen ausgewertet wird. Er
läuft in einem **eigenen kleinen Parser** mit festem Wortschatz. Es gibt kein `eval`
und keinen `Function`-Aufruf (die CSP verbietet beides, und eine Formel aus einer
fremden Datei darf nichts anderes können als rechnen).

- **Werte:** Zahlen (`11`, `0.5`), Wahrheitswerte sind Zahlen (`1` und `0`).
- **Operatoren:** `+ - * / %`, Vergleiche `< <= > >= == !=`, `and`, `or`, `not`,
  Klammern, Minus als Vorzeichen.
- **Funktionen:** `min`, `max`, `round`, `floor`, `ceil`, `abs`, `if(Bedingung, dann, sonst)`.
- **Variablen:**

| Name | Bedeutung |
|---|---|
| `position` | Platz in der Wertungsklasse, nach Korrekturen |
| `overallPosition` | Gesamtplatz laut Spiel |
| `starters` | Teilnehmer der Klasse im Rennen |
| `fastestLap` | 1 für die schnellste Runde der Klasse, sonst 0 |
| `pole` | 1 für den ersten Startplatz der Klasse, sonst 0 |
| `finished` | 1 bei Zielankunft ohne Ausfall, sonst 0 |
| `laps` | gefahrene Runden des Fahrers |
| `leaderLaps` | Runden des Klassensiegers |

- **Fehler:** Die Formel wird vor der Auswertung geprüft. Ein Fehler nennt Meldung und
  Position im Text. Unbekannte Namen, falsche Argumentzahlen und Division durch null
  sind Fehler, kein stilles `NaN`.
- Das Ergebnis eines Rennens wird nicht gerundet; wer ganze Punkte will, schreibt `round`.
- Voreinstellung einer neuen Liga: `floor(40 * (1 - (position - 1) / (starters - 1))) + 10`
  (Sieger 50, Letzter 10, gleichmäßig nach Platz, ganze Punkte). Bei einem einzelnen
  Starter in einer Klasse teilt sie durch null; die Auswertung meldet dann das Rennen als
  ungültig (mindestens zwei Teilnehmer nötig).
- Zweites Beispiel: `if(position <= 10, 11 - position, 0) + fastestLap`

Eine Liga-Datei kann mit einem Passwort verschlüsselt sein; dann sind nur Format,
Version, ID und Name lesbar und der Rest liegt in einem verschlüsselten Block
([ADR-0010](ADR-0010-liga-passwortschutz.md)). Der Inhalt und die Version der Liga
bleiben unverändert.

Vorlagen, aus denen der Organisator wählt, kommen später als Texte für dasselbe Feld.

## Alternativen

- **Formel in JavaScript (`eval`):** abgelehnt, siehe oben; eine Datei darf keinen Code
  ausführen.
- **Feste Punktetabellen oder eine Tabelle Platz→Punkte:** einfacher, deckt aber
  Bonuspunkte und Formeln nicht ab. Als Vorlagen später sinnvoll.
- **Nur Verweise auf die Result-Dateien:** verlangt, dass jeder Mitspieler die Dateien
  hat. Abgelehnt.
- **Tabelle in der Datei speichern:** kann von den Rohdaten abweichen. Abgelehnt.

## Konsequenzen

- Die Liga-Datei enthält Namen anderer Fahrer. Die App weist beim Speichern darauf hin.
- Der Parser ist testpflichtig (Fehlerfälle, Grenzen, keine Seiteneffekte).
- Eine Formel- oder Formatänderung hebt `version` an; ältere Dateien müssen lesbar bleiben.
- Datenschutz und Signatur sind bewusst offen; sie hängen an IDEA-0003.
