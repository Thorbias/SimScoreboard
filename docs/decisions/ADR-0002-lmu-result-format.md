# ADR-0002: Result-Dateien des Spiels (XML) als Datenquelle

- **Status:** Angenommen (für die Result-XML; die Telemetrie bekommt ein eigenes ADR)
- **Datum:** 2026-11-01

## Kontext

Die erste Ausbaustufe von SimScoreboard liest die Session-Ergebnisse, die Le Mans
Ultimate selbst schreibt. Bisher beruhte das Bild der Dateiformate auf Recherche
([quellen/](../quellen/README.md)). Dieses ADR hält fest, was an **echten Dateien
verifiziert** wurde.

**Untersuchte Dateien (nur gelesen, nicht im Repository):**

- Ein Training aus Spielversion 0.5000 (Juni 2025, Einzelspieler, drei Klassen).
- Ein Training, ein Qualifying und ein Rennen aus Spielversion 1.4200
  (Oktober/November 2026, Mehrspieler, 20 Fahrer einer Klasse).
- Die Kanal-Konfiguration der Telemetrie.
- Verzeichnislisten des Spielordners (rund 400 Result-Dateien, 3 KB bis 540 KB).

Nicht untersucht ist ein Mehrklassen-Rennen der aktuellen Version, ein Rennen
mit Fahrerwechsel und eine echte Telemetrie-Aufzeichnung (siehe „Offen“).

## Entscheidung

SimScoreboard liest die **Result-XML-Dateien** des Spiels als Quelle für
Session-Kopf, Ergebnisse, Runden, Incidents, Strafen und Chat. Ein Parser
übersetzt sie in das normalisierte Domänenmodell
([ARCHITECTURE.md](../ARCHITECTURE.md)); die Oberfläche kennt das Dateiformat
nicht.

### Fundort und Dateiname

- Ordner `UserData/Log/Results` im Spielverzeichnis, eine Datei je Session.
- Name: `JJJJ_MM_TT_hh_mm_ss-NNxN.xml`. Der Zeitstempel ist der Zeitpunkt des
  Schreibens, also das **Ende** der Session. `x` ist `P` (Training), `Q`
  (Qualifying) oder `R` (Rennen), danach eine Ziffer (bisher immer `1`). Die
  zwei Ziffern vor dem Buchstaben wirken zufällig und tragen keine erkennbare
  Bedeutung.
- Im selben Ordner liegen `BatchTemplate*.ini` mit Klarnamen. Sie sind keine
  Result-Dateien und werden ignoriert.

### Aufbau

- Kodierung UTF-8, Zeilenende CRLF, Wurzel `rFactorXML > RaceResults`. Die Datei
  beginnt mit einem internen DOCTYPE (`<!ENTITY rFEnt …>`). Ob der Parser des
  Browsers diesen verträgt, ist beim Gerüst zu prüfen; Fallback ist das Entfernen
  der DOCTYPE-Zeile vor dem Parsen.
- **Kopf** (Kindelemente von `RaceResults`): Modus (`Setting`: `Multiplayer` oder
  `Race Weekend`), Strecke (`TrackVenue`, `TrackCourse`, `TrackEvent`),
  Streckenlänge in Metern, Spielversion, Startzeit des Events (`DateTime`, Unix),
  `TimeString`, Renndauer, Regeln. `TrackData` enthält einen lokalen
  Dateipfad und wird nicht verwendet. `VehiclesAllowed` ist unzuverlässig
  (in einem Mehrklassen-Training nannte es nur ein Auto).
- **Session-Abschnitt** als weiteres Kindelement mit dem Namen der Session
  (`Practice1`, `Qualify`, `Race`). Bisher enthielt jede Datei genau einen
  Abschnitt. Darin: Start (`DateTime`, `TimeString`), `Minutes`, `Laps`,
  `MostLapsCompleted`, `Stream` und je Fahrzeug ein `Driver`. Das Rennen hat
  zusätzlich `FormationAndStart`.
- **Event-Gruppierung:** Qualifying und Rennen desselben Wochenendes trugen im
  Kopf denselben `DateTime`. Das ist ein brauchbarer Gruppierungsschlüssel
  (mit der Strecke); bestätigt an einem Paar.

### Fahrzeug-Eintrag (`Driver`)

- Fahrer: `Name`, `isPlayer`, `Connected`, `ServerScored`.
- Auto: `VehName`, `Category`, `CarType`, `CarClass`, `CarNumber`, `TeamName`.
- Ergebnis: `Position`, `ClassPosition`, `BestLapTime`, `Laps`, `Pitstops`,
  `FinishStatus`. Im Rennen zusätzlich `GridPos`, `ClassGridPos`, `FinishTime`.
  Beobachtete `FinishStatus`-Werte: `None`, `Finished Normally`, `DNF`, `DQ`.
- `ControlAndAids` kann **mehrfach** vorkommen (mit `startLap`/`endLap`), wenn
  sich Fahrhilfen während der Session ändern.
- Eine Runde ohne Zeit steht als `--.----` im Text. Eine Zeit ist eine
  Dezimalzahl in Sekunden.

### Runden (`Lap` unter `Driver`)

- Text: Rundenzeit in Sekunden. Attribute: `num`, `p` (Position), `et`
  (Session-Zeit am Ende der Runde), `topspeed`, `fcompound`, `rcompound`, `pit`.
- Sektoren `s1`, `s2`, `s3` sind **Einzelzeiten**, nicht kumuliert (geprüft: die
  Summe ergibt die Rundenzeit bis auf eine Rundungsstelle). Sie fehlen bei
  Runden, die nicht gewertet oder in der Box beendet wurden.
- Reifenangaben: in der Datei der Version 0.5000 `twfl`, `twfr`, `twrl`, `twrr` (Verschleiß)
  und `fuel`, `fuelUsed`, `ve`, `veUsed`; in den Dateien der Version 1.4200 im
  Mehrspieler stattdessen `FL`, `FR`, `RL`, `RR` (Mischung je Rad), ohne Sprit
  und Virtual Energy. Ob der Unterschied an Version oder Modus liegt, ist **nicht
  geklärt**.

### Stream (`Stream` im Session-Abschnitt)

Zeitlich geordnete Ereignisse, jeweils mit `et` (Sekunden seit Sessionstart):

| Element | Inhalt |
|---|---|
| `Score` | Durchgang eines Fahrzeugs durch eine Messlinie: Text `Name(ID) lap=N point=P t=… et=…`. `point` 0 scheint die Ziellinie, 1 und 2 die Sektorgrenzen zu sein (Beobachtung, nicht bestätigt) |
| `Sector` | neue Sektor-Bestzeit; ab Version 1.4200 auch Schadensmeldungen („new suspension damage“), dann mit Attributen `Driver`, `ID`, `Class` |
| `Incident` | Kontakt mit Objekt (`Immovable`, `Post`, `Sign`, `Wheel`) oder anderem Fahrzeug, mit Stärke und Gegner (Name und ID im Text) |
| `TrackLimits` | Verwarnpunkte: Attribute `Driver`, `ID`, `Lap`, `WarningPoints`, `CurrentPoints`, `Resolution`; Text `No Further Action`, `Warning` oder eine Strafe |
| `Penalty` | Strafe mit Attributen `Driver`, `ID`, `Penalty`, `Time`, `Laps`, `Reason` |
| `ChatMessage` | Chat-Nachricht, Text `Absender: Nachricht` |

In der Datei der Version 0.5000 kamen nur `Score`, `Sector` und `Incident` vor.

### Fahrer-Identität

- Es gibt **keine stabile Fahrer-ID**. Innerhalb einer Datei waren die Namen
  eindeutig; die Zuordnung im Stream läuft über `Name(ID)` mit einer
  sessionlokalen Nummer.
- Derselbe Fahrer erschien in verschiedenen Dateien unter **verschiedenen
  Namen** (ältere Datei mit angehängter Kennung, neuere ohne). Einzelne Namen
  tragen eine oder zwei `#`-Kennungen.
- `isPlayer` ist im Mehrspieler bei **allen menschlichen Fahrern** gesetzt und
  kennzeichnet damit nicht den Nutzer. Der eigene Fahrer muss eingestellt
  werden, mit Alias-Liste oder Abgleich ohne die `#`-Kennung.

### Datenschutz

Die Dateien enthalten Namen anderer Fahrer, Online-Kennungen und
Dateipfade. Sie bleiben im Spielordner bzw. in `samples/` und gelangen nie
ins Repository (siehe [GUIDELINES.md](../GUIDELINES.md)). Fixtures werden
anonymisiert: Namen, Teams, Kennungen, IDs im Stream und Pfade ersetzen.

## Alternativen

- **Replay-Dateien (`.Vcr`):** Ordner `UserData/Replays`, 5 bis 500 MB je
  Session, proprietäres Format. Nicht untersucht und nicht dokumentiert; würde
  ein Reverse Engineering ohne Spezifikation bedeuten.
- **Real-Time-Logging (CSV):** Die vorhandene Datei enthält nur Frame-Zeiten des
  Spiels, keine Fahrdaten. Ungeeignet.
- **Nur Telemetrie als Quelle:** Telemetrie liefert keine Ergebnisse, Strafen
  oder Gegner. Die Result-Dateien bleiben die Grundlage.

## Konsequenzen

- Ergebnisse, Qualifying, Lap Chart, Position Chart, Statistiken, Incidents,
  Strafen und Chat lassen sich aus den Result-Dateien aufbauen. Chat, Strafen und
  Kontakte zwischen Fahrern gibt es nur in neueren Mehrspieler-Dateien; der Parser
  behandelt jedes Ereignis als optional.
- Der Parser ist **versionstolerant** zu bauen: unbekannte Elemente und Attribute
  ignorieren, fehlende Felder als „nicht vorhanden“ modellieren, nie raten.
  Zusätzlich müssen abgebrochene oder fast leere Sessions (wenige KB) ohne Fehler
  laden.
- Die Eigenschaften, die an `fuel`, `ve` und Reifenverschleiß hängen, sind nicht
  für alle Dateien verfügbar und dürfen nicht vorausgesetzt werden.
- Die Custom League (IDEA-0001) kann sich nicht auf Namen verlassen; eine
  Zuordnung von Namen zu Personen muss manuell oder per Regel erfolgen.
- Für den Index genügen Kopf und Fahrer-Eckdaten; die Details stehen im Stream und
  in den Runden und werden bei Bedarf gelesen. Bei rund 400 Dateien und bis zu
  540 KB je Datei ist das Parsen im Worker unkritisch.

## Offen

- **Telemetrie:** Auf dem Entwicklungsrechner ist die automatische Aufzeichnung
  ausgeschaltet, im Ordner liegt nur die Kanal-Konfiguration (rund 55 Kanäle mit
  Abtastraten von 1 bis 100 Hz, darunter Geschwindigkeit, Gas, Bremse, Lenkung,
  Motordrehzahl, GPS-Position, Streckenposition und Virtual Energy; der Gang
  ist ein Ereignis, kein Kanal). Format der Datendatei, Schema und Zuordnung zu
  den Result-Dateien sind **unverifiziert**. Ein eigenes ADR folgt nach einer
  echten Aufzeichnung.
- Mehrklassen-Rennen der aktuellen Version, Rennen mit Fahrerwechsel,
  Sessions ohne Kopf-Felder und Dateien anderer Spielversionen.
- Ob `fuel`/`ve` im Einzelspieler der aktuellen Version vorhanden sind.
- Bedeutung der Zeichenfolge `NN` im Dateinamen, Zuordnung der Mess-Punkte im
  `Score` und Bedeutung der Felder `Resolution` und `LapRankIncludingDiscos`.
- Verhalten des Browser-Parsers mit dem internen DOCTYPE.
