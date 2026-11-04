# Features — SimScoreboard

> Was SimScoreboard können soll und was offen ist. **Lebenszyklus der Fähigkeit**,
> nicht Arbeitsstand: ob gerade jemand daran arbeitet, steht ausschließlich in
> [BACKLOG.md](BACKLOG.md) (`TODO`/`IN PROGRESS`) — ein „in Arbeit" gibt es hier
> bewusst **nicht**.
>
> Regeln für Einträge (Eintrags-Muster, Kondensier-Regel, Umsetzungsauftrag,
> ID-Vergabe): [GUIDELINES.md](GUIDELINES.md), Abschnitt „Projektorganisation".

Priorität: **M**uss / **S**oll / **K**ann · Status: **offen** / **fertig**.
Plattform ist überall Web (siehe [PRODUCT.md](PRODUCT.md)), deshalb ohne
Plattform-Angabe je Eintrag.

**Datenbasis:** Die Result-XML-Dateien sind geprüft
([ADR-0002](decisions/ADR-0002-lmu-result-format.md)); die Einträge dazu sind daran
angepasst. Die Telemetrie (F-012, F-013) ist **unverifiziert** und wartet auf eine
echte Aufzeichnung. Ereignisse wie Incidents, Strafen und Chat gibt es nur in
neueren Mehrspieler-Dateien und sind überall optional. Umsetzungsaufträge entstehen
mit dem Projektgerüst.

<!-- Nächste freie F-ID: F-024 — fortlaufend vergeben, nie wiederverwenden,
     auch nicht die IDs gelöschter Einträge (sonst zeigen alte Commits und
     Verweise auf die falsche Anforderung). -->

## F-001 — Session-Ordner einlesen

Prio M · Status fertig

Der Anwender gibt den Ordner mit den Spieldaten frei, und SimScoreboard liest alle Sessions ein, ohne dass Dateien den Rechner verlassen.

- Akzeptiert wird der Spielordner, `UserData` oder `Results`; die Result-Dateien werden darunter gefunden.
- Chromium-Browser: Ordnerzugriff über die File System Access API; das Handle bleibt gespeichert, nach einem Neustart genügt ein Klick auf „Ordner neu verbinden“. Beim Verbinden werden neue und geänderte Dateien nachgelesen, verschwundene aus dem Index entfernt.
- Andere Browser: Ordner-Auswahl als Fallback; dort kennt die Seite die Dateien bis zum Neuladen.
- Das Einlesen läuft im Hintergrund (Web Worker) mit Fortschrittsanzeige; nicht lesbare Dateien werden gezählt und gemeldet.
- Technik: [ADR-0004](decisions/ADR-0004-datenhaltung-und-einlesen.md).

## F-002 — Sessions

Prio M · Status fertig

Der Anwender durchsucht alle eingelesenen Sessions in einer Liste, neueste zuerst. Die Liste steht links und bleibt sichtbar, während rechts die gewählte Session mit ihren Reitern geöffnet ist; so lässt sich schnell zwischen Sessions wechseln.

- Filter nach Session-Typ (Training, Qualifying, Rennen), Strecke, Zeitraum, Fahrzeugklasse und Favoriten; sie sind in der Liste eingeklappt und zeigen die Zahl der aktiven Filter.
- Sessions desselben Events (gleiche Strecke und Event-Start im Kopf der Datei) werden gruppiert angezeigt.
- Jede Zeile zeigt Session-Typ, Datum, beteiligte Klassen und das Ergebnis des eigenen Fahrers, bei einem Klassensieg mit Sieg-Marke.
- Die Anzahl der Sessions steht im Listenkopf; die geöffnete Session ist in der Liste hervorgehoben.
- Auf einem schmalen Bildschirm zeigt die App entweder die Liste oder die Session, mit Rückweg zur Liste.
- Land und Flagge der Strecke: F-018.

## F-003 — Eigener Fahrer markiert

Prio M · Status fertig

Der Anwender legt seine Fahrernamen fest, und SimScoreboard markiert ihn in Liste und Ergebnissen mit einem eigenen Badge.

- Die Namen werden in den Einstellungen gepflegt; Vorschläge aus den häufigsten Namen der eingelesenen Sessions erleichtern die Wahl.
- Das Spiel liefert keine stabile Fahrer-ID, und das Kennzeichen „Spieler“ gilt im Mehrspieler für alle Menschen. Deshalb gibt es eine Liste von Aliassen; der Abgleich ignoriert Groß- und Kleinschreibung und angehängte `#`-Kennungen.
- Die Markierung in Pit-Orange erscheint in der Session-Liste, in den Ergebnistabellen und in den Diagrammen (F-007, F-008); für F-012 gilt sie, sobald es existiert.

## F-004 — Rennergebnis

Prio M · Status fertig

Die App zeigt die Ergebnisse eines Rennens nach Klasse oder gesamt.

- Spalten: Position, Startnummer, Fahrer, Fahrzeug, Reifenmischung der letzten Runde, Bestrunde, Abstand, Boxenstopps, Runden, Gesamtzeit.
- Der Abstand zeigt die Zeit zum Führenden, bei Überrundung „+n R“, bei Ausfall „DNF“ bzw. „DQ“.
- Die Bestrunde der Klasse ist hervorgehoben.
- Umschalter Gesamt / je Klasse; die Zeile des eigenen Fahrers ist hervorgehoben.

## F-005 — Qualifying-Ergebnis

Prio M · Status fertig

Die App zeigt die Ergebnisse eines Qualifyings (und eines Trainings) mit Sektorzeiten und Abständen.

- Spalten: Position, Startnummer, Fahrer, Fahrzeug, Reifenmischung der Bestrunde, beste Sektoren 1–3, Bestrunde, Abstand zur Pole, Runden.
- Die schnellsten Sektoren und die Bestrunde der Klasse sind farblich markiert.
- Fahrer ohne gewertete Runde erscheinen am Ende ohne Zeiten.
- Umschalter Gesamt / je Klasse.

## F-006 — Session-Kopf

Prio M · Status fertig

Jede Session zeigt in einem Kopfbereich ihre Eckdaten.

- Session-Typ, Event, Strecke und Layout, Datum und Uhrzeit, Länge in Minuten oder Runden, Streckenlänge, Fahrerzahl, Modus und Spielversion.
- Die Ansichten einer Session (Ergebnis, Lap Chart, Position Chart, Statistics, Incidents, Chat) sollen als Reiter erreichbar sein; nur die für den Session-Typ sinnvollen erscheinen (Position Chart und Statistics nur im Rennen). Reiter: Ergebnis, Rundenzeiten, Positionen, Statistik, Zwischenfälle, Chat.
- Die Flagge der Strecke: F-018.

## F-007 — Lap Chart

Prio S · Status fertig

Der Anwender vergleicht den Rundenzeiten-Verlauf von bis zu vier Fahrern Runde für Runde.

- Bis zu vier Fahrer (A bis D), je eine Linie in eigener Farbe: A orange (der eigene Fahrer), B cyan, C rosa, D limette. Vorgewählt sind der eigene Fahrer und der schnellste Fahrer seiner Klasse.
- Jeder Fahrer hat ein Dropdown und ein X zum Entfernen; die übrigen rücken auf (aus C wird B, aus D wird C). Mit „Fahrer hinzufügen“ kommt der schnellste noch freie Fahrer dazu. Auch der eigene Fahrer lässt sich entfernen.
- Ein Klick auf einen Fahrer in der Ergebnistabelle wechselt in diesen Reiter und setzt ihn auf den nächsten freien Platz (A, B, C, D; ist der eigene Fahrer schon A, beginnt es bei B). Sind alle vier belegt, ersetzt jeder weitere Klick Fahrer D.
- Runden ohne gewertete Zeit und sehr langsame Runden (über 125 % des Medians), die im Diagramm abgeschnitten sind, werden durch eine gestrichelte Linie zwischen den Nachbarrunden überbrückt, damit die Linie nicht abreißt. Die Bestrunde jedes Fahrers ist in der Tabelle hervorgehoben.
- Darunter eine Tabelle mit Runde, Sektoren 1–3 und Rundenzeit aller gewählten Fahrer sowie dem Delta jedes Fahrers zu A.
- Die Diagrammansicht lässt sich ausblenden, sodass nur die Tabelle bleibt.

## F-008 — Position Chart

Prio S · Status fertig

Die App zeigt den Positionsverlauf aller Fahrer eines Rennens von der Startaufstellung bis ins Ziel.

- Eine Linie je Fahrer, Achse von „Start" über jede Runde bis „Ziel".
- Umschalter Gesamt / je Klasse; in der Klassenansicht sind die Positionen Ränge innerhalb der Klasse.
- Der eigene Fahrer ist hervorgehoben und der Rest zurückgenommen; ein Klick auf eine Linie oder die Legende hebt einen anderen Fahrer hervor, „Alle gleich anzeigen" hebt die Hervorhebung auf.
- Die Legende nennt Fahrer mit Endposition.

## F-009 — Statistiken je Klasse

Prio S · Status fertig

Die App hebt je Klasse die auffälligen Leistungen eines Rennens hervor.

- Schnellste Runde und schnellste Sektoren 1–3 mit Fahrer und Rundennummer.
- Konstanz: Fahrer mit der geringsten Standardabweichung der Rundenzeiten; gezählt werden nur saubere Runden (keine Boxenrunde, höchstens 107 % der eigenen Bestzeit, mindestens fünf Runden).
- Die meisten gewonnenen und die meisten verlorenen Plätze gegenüber der Startaufstellung der Klasse.
- Die meistgenutzte Reifenmischung mit Rundenzahl.

## F-010 — Incidents

Prio S · Status fertig

Der Anwender sieht alle Zwischenfälle einer Session als Zeitleiste.

- Spalten: Session-Zeit, Restzeit (bei zeitbegrenzter Session), Typ, Fahrer, Klasse, Runde, Detail.
- Typen: Kontakt (mit Fahrzeug oder Objekt, mit Stärke), Schaden, Track Limits (mit Verwarnpunkten) und Strafe (verhängt oder abgesessen).
- Filter nach Typ, Klasse und Fahrer.
- Gab es im Umkreis von zwei Minuten vor und nach einem Zwischenfall Chat-Nachrichten, zeigt die Zeile eine Sprechblase mit der Zahl der Nachrichten. Ein Klick öffnet ein kleines Chatfenster mit diesen Nachrichten und einer Markierung, wann der Zwischenfall war. Der Chat-Reiter (F-011) bleibt davon unberührt.
- Die Ereignisse stehen nur in neueren Mehrspieler-Dateien; fehlen sie, entfällt der Reiter.

## F-011 — Session-Chat

Prio K · Status fertig

Die App zeigt den Chat-Verlauf einer Session als eigenen Reiter. Chat gibt es nur in neueren Mehrspieler-Dateien; der Reiter erscheint nur, wenn Nachrichten vorhanden sind.

## F-012 — Telemetrie-Vergleich zweier Runden

Prio M · Status offen

Der Anwender legt eine Referenzrunde und eine Vergleichsrunde übereinander und
liest die Unterschiede an den Fahrer-Eingaben ab.

- Beide Runden sind aus Session, Fahrer und Rundennummer wählbar; die Bestrunde ist
  vorgeschlagen.
- Kanäle untereinander, gemeinsame Strecken-Achse: Geschwindigkeit, Gas, Bremse,
  Lenkwinkel, Virtual Energy. Der Gang ist in der Kanal-Konfiguration ein Ereignis,
  kein Kanal, und wird gegebenenfalls als Ereignis dargestellt (unverifiziert).
- Je Kanal Minimum, Maximum und Mittelwert der beiden Runden.
- Zeit-Zeiger mit Wiedergabe und Geschwindigkeitswahl; Kanäle lassen sich
  umsortieren und ausblenden.
- Anzeige der Rundenzeiten, der Differenz und der Sektorzeiten beider Runden.

## F-013 — Streckenkarte und Rundenkennzahlen

Prio S · Status offen

Neben dem Telemetrie-Vergleich zeigt die App die Strecke als Karte und fasst die
Runde in Kennzahlen zusammen.

- Streckenkarte aus den Positionsdaten einer Runde (sofern die Daten sie
  enthalten), mit Zeiger passend zum Zeit-Zeiger des Vergleichs.
- Die Form jeder Streckenvariante wird aus der eigenen Telemetrie gewonnen und
  lokal gespeichert; sie kann später als kleines Symbol je Variante in der Session-Liste
  und den Bestzeiten dienen. Eine Quelle aus öffentlichen Karten ist verworfen
  (uneinheitliche Lizenzen, Lücken bei den Varianten).
- Einfärbung wählbar nach Geschwindigkeit, Eingaben oder Sektoren.
- Kennzahlen: Höchstgeschwindigkeit, Durchschnittsgeschwindigkeit,
  Kraftstoffverbrauch der Runde. Der Verbrauch ist optional: `fuelUsed` fand sich
  nur in Dateien der Version 0.5000.

## F-014 — Persönliche Bestzeiten

Prio M · Status offen

Der Anwender sieht seine besten Runden geordnet nach Strecke, Fahrzeugklasse und
Fahrzeug. Die Zuordnung „eigener Fahrer" über mehrere Dateien beruht auf F-003.

- Links die Liste aller Strecken, jede Streckenvariante als eigener Eintrag (Zeiten
  verschiedener Layouts lassen sich nicht vergleichen) mit Land, Session-Anzahl und
  der Bestzeit je Klasse. Die Liste bleibt stehen, während rechts die Details der
  gewählten Strecke stehen; das Layout gleicht dem der Sessions (F-002).
- Detailansicht einer Strecke: beste Qualifying- und Rennrunde, gefahrene Runden
  gesamt, Fahrzeuge, Sessions.
- Je Klasse eine Tabelle der Rekorde pro Fahrzeug mit Session-Typ, Datum,
  Sektoren, Rundenzeit und Abstand zur Klassenbestzeit.
- Je Klasse ein Diagramm der Entwicklung: die beste Runde jeder Session als Punkt und die persönliche Bestzeit bisher als Stufenlinie.
- Filter nach Klasse.
- Von jedem Rekord führt ein Sprung zur Session und, falls Telemetrie vorhanden
  ist, in den Telemetrie-Vergleich.

## F-015 — Favoriten

Prio K · Status offen

Der Anwender markiert Sessions als Favorit und filtert die Session-Liste danach.

## F-016 — Lokaler Index und Einstellungen

Prio M · Status fertig

Die App speichert den Metadaten-Index der Sessions und die Einstellungen lokal im Browser, sodass sie nach dem ersten Einlesen schnell startet.

- Nur Metadaten im Index; die Details einer Session werden bei Bedarf aus der Datei gelesen.
- Gespeichert werden außerdem die eigenen Fahrernamen, Favoriten, die Sprache und der Ordnerzugriff. Die Darstellung (automatisch, hell oder dunkel) liegt als Komfortwert in `localStorage`, damit sie vor dem ersten Zeichnen gilt.
- Der Speicher ist best-effort: Ist er nicht verfügbar (z. B. Privatmodus), arbeitet die App mit einem Index im Arbeitsspeicher weiter und weist darauf hin.
- Der Anwender kann den lokalen Index jederzeit in den Einstellungen löschen.
- Technik: [ADR-0004](decisions/ADR-0004-datenhaltung-und-einlesen.md).

## F-017 — Mehrsprachige Oberfläche

Prio S · Status fertig

Die Oberfläche gibt es auf Englisch und Deutsch; Englisch ist der Standard, Deutsch wird bei deutschem Browser-Locale gewählt, die Sprache lässt sich in den Einstellungen festlegen. Alle Texte kommen aus einer zentralen Übersetzungsschicht; ein Test stellt sicher, dass beide Sprachen dieselben Schlüssel und Platzhalter haben.

## F-018 — Streckenland und Flagge

Prio K · Status offen

Die App zeigt zu jeder Strecke Land und Flagge in der Session-Liste, im Session-Kopf und in den Bestzeiten.

- Die Result-Dateien nennen nur Venue, Course und Event; Land und Flagge kommen aus einer eigenen Streckentabelle im Projekt. Ist eine Strecke dort nicht bekannt, entfällt die Angabe.

## F-019 — Gesamtüberblick der Bestzeiten

Prio S · Status offen

Als erster Eintrag der Bestzeiten fasst der Gesamtüberblick alles zusammen, was der Anwender über alle Strecken gefahren ist.

- Kennzahlen: Sessions, gefahrene Runden, gefahrene Strecke in Kilometern, Streckenvarianten, Rennen, Siege und Podien (in der Klasse) mit Anteil an den Rennen.
- Je Klasse die fünf wichtigsten Fahrzeuge: auf wie vielen Streckenvarianten das Fahrzeug die schnellste eigene Runde der Klasse hält (Anzahl und Anteil, zum Beispiel 911er 20 %, BMW 75 %, McLaren 5 %) und wie viele Runden es gefahren wurde. Fahrzeuge ohne Bestzeit erscheinen nach Runden.
- Die meistgefahrenen Streckenvarianten als Tabelle mit Anteil an den gefahrenen Runden, mit Sprung in die Details der Strecke.
- Form: Ausfälle (DNF und Disqualifikation) im Verhältnis zu den Rennen, durchschnittlicher Zielplatz und durchschnittlich gewonnene Plätze der letzten zehn Rennen sowie die Liste dieser Rennen mit Start, Ziel und Platzveränderung in der Klasse.
- Rekorde: Zahl der Klassenrekorde der letzten 30 Tage sowie die fünf neuesten und die fünf ältesten Klassenrekorde mit Alter in Tagen.
- Mehrspieler und Einzelspieler: Anteil der Sessions und der Runden je Modus.
- Aktivität: gefahrene Runden pro Monat der letzten zwölf Monate als Säulen.
- Gezählt wird nur, was zum eigenen Fahrer gehört (F-003); jede Streckenvariante zählt einzeln (F-014).

## F-020 — Demo-Daten

Prio S · Status offen

Die App lässt sich ohne Spieldateien ausprobieren, mit Beispiel-Sessions, in denen alle Namen anonymisiert sind.

- Start: „Demo ausprobieren“ in der Session-Liste (solange kein Ordner verbunden ist) und in den Einstellungen; „Demo beenden“ im Banner und in den Einstellungen.
- Inhalt: 14 vollständige Sessions aus fünf Events (Bahrain, Spa im Mehrspieler, Algarve, Spa als Rennwochenende gegen KI, ein Mehrklassen-Rennen) mit Training, Qualifying und Rennen. Zeiten, Ergebnisse, Zwischenfälle und Strafen sind echt; Fahrer heißen „Driver 07“, der eigene „Demo Driver“, Teams „Team 03“; der Chat besteht aus neutralen Sätzen.
- Die Demo steht neben der echten Bibliothek: Sessions, Favoriten und Ergebnisse der Demo werden nie gespeichert, eigene Sessions, Fahrernamen, Favoriten und der lokale Index bleiben unberührt. Eigene Fahrernamen und der Index sind während der Demo gesperrt.
- Die Dateien entstehen mit `tools/anonymize-results.mjs --demo` und werden auf Namensreste getestet (siehe [GUIDELINES.md](GUIDELINES.md), Datenschutz).

## F-021 — Liga (Version 1, nur Organisator)

Prio S · Status fertig

Ein Organisator fasst Sessions zu einer Liga zusammen, die App berechnet die Fahrerwertung, und die Liga lässt sich als Datei weitergeben, die Mitspieler nur lesen. Ausgangspunkt sind [IDEA-0001](ideations/IDEA-0001-custom-league.md) und [IDEA-0002](ideations/IDEA-0002-liga-speicherort-und-teilen.md).

- Rollen: Der Organisator schreibt, alle anderen lesen. Den Schreibschutz stellt der Speicher her (Freigabe-Rechte des Ordners); die App prüft ihn nicht. Eine Signatur folgt später ([IDEA-0003](ideations/IDEA-0003-liga-signatur.md)); das Datenformat sieht dafür ein leeres Feld vor.
- Liga: Name, Klassen-Regel und Punkteformel. Die Rennen einer Liga sind Sessions des Typs Rennen, die der Organisator auswählt und in eine Reihenfolge bringt. Ein Rennen lässt sich auch aus einer einzelnen Result-Datei (.xml) importieren, die nicht im Session-Ordner liegt.
- Punkteformel: Der Organisator gibt einen Ausdruck vor, der pro Fahrer und Rennen die Punkte berechnet. Variablen: `position` (Platz in der Wertungsklasse), `overallPosition`, `starters` (Teilnehmer der Klasse), `fastestLap` (1 für schnellste Runde der Klasse, sonst 0), `pole` (1 bei Pole in der Qualifikation), `finished` (1 wenn gewertet), `laps`, `leaderLaps` (Runden des Klassensiegers). Funktionen: `min`, `max`, `round`, `floor`, `if(Bedingung, dann, sonst)`, dazu `+ - * / %`, Vergleiche und `and`/`or`. Voreingestellt ist `floor(40 * (1 - (position - 1) / (starters - 1))) + 10` (Sieger 50, Letzter 10; bei einem einzelnen Starter in der Klasse ist das Rennen ungültig), als zweites Beispiel steht `if(position <= 10, 11 - position, 0) + fastestLap` im Hilfetext.
- Sicherheit der Formel: ein eigener kleiner Parser mit festem Wortschatz, kein `eval` (die Content-Security-Policy erlaubt es ohnehin nicht). Fehler in der Formel zeigt die App mit Position im Text an, bevor sie rechnet.
- Vorlagen für Formeln (zum Beispiel gängige Punktetabellen) kommen später; Version 1 hat nur das Eingabefeld.
- Wertung: nur Fahrer, getrennt je Klasse. Tabelle mit Platz, Fahrer, Punkten je Rennen und Summe; dazu der Verlauf der Punkte über die Rennen.
- Fahrer zusammenführen: Result-Dateien haben keine stabile ID ([ADR-0002](decisions/ADR-0002-lmu-result-format.md)). Der Organisator ordnet mehrere Namen einer Person zu (Aliasliste je Liga).
- Korrekturen: Nachträglich möglich sind Zeitstrafen, Disqualifikationen, ein manuell geänderter Platz und Punkte-Zu- oder Abschläge, jeweils mit Begründung. Die Originaldaten bleiben unverändert; die Korrekturen liegen als eigene Einträge in der Liga und sind in der Tabelle als solche erkennbar.
- Speichern: lesbares, versioniertes JSON in einem Ordner, den der Organisator wählt (File System Access API; auch ein Ordner, den ein Cloud-Client synchronisiert). Ohne Chromium gibt es Export und Import als Datei.
- Teilen: Mitspieler öffnen die Liga-Datei in der App und sehen die Tabelle ohne Schreibmöglichkeit. Dateien der Rennen müssen sie nicht haben: die Liga-Datei enthält die ausgewerteten Ergebnisse je Rennen.
- Datenschutz: Die Liga-Datei enthält Namen anderer Fahrer. Beim Speichern und Teilen weist die App darauf hin.

## F-022 — Boxenstoppzeiten

Prio S · Status offen · wartet auf die Telemetrie (Backlog 7)

Die Auswertung zeigt je Fahrer die Boxenstopps mit ihrer Dauer, gemessen aus der Telemetrie.

- Quelle ist ausschließlich die Telemetrie (Ereignis `In Pits` und Streckenposition, siehe ADR-0008). Die Result-XML kennt nur die Zahl der Stopps und die Runde (`pit`), keine Standzeit; geschätzte Zeiten aus Rundenzeiten gibt es bewusst nicht.
- Ohne Aufzeichnung zur Session steht kein Wert da, keine Näherung.
- Offen: Anzeigeort (Ergebnisse oder Analyse), Aufteilung in Boxengasse und Stillstand, Zuordnung der Aufzeichnung zur Session. Wird beim Start geklärt, ob ein eigener Branch nötig ist.

## F-023 — Liga im Cloud-Speicher

Prio S · Status fertig

Der Organisator speichert die Liga mit einem Klick in seinen Cloud-Speicher, die Mitspieler öffnen sie per Link und sehen den neuesten Stand ([ADR-0009](decisions/ADR-0009-liga-google-drive.md)).

- Ohne Zugangsdaten: „Speichern“ überschreibt dieselbe Datei (das Datei-Handle der Liga wird gemerkt, nach einem Neustart fragt der Browser einmal nach Zugriff); liegt sie in einem synchronisierten Ordner (zum Beispiel Google Drive für Desktop), verteilt der Cloud-Client sie. Eine Liga lässt sich auch aus einer `https`-Adresse öffnen und von dort aktualisieren.
- Google Drive direkt, nur wenn Client-ID und API-Key beim Bauen gesetzt sind (Einrichtung in [LIGA-DRIVE.md](LIGA-DRIVE.md)): Anmeldung mit Google (nur Zugriff auf Dateien, die die App selbst anlegt), „In Google Drive speichern“ legt die Datei an oder aktualisiert sie, fragt vor dem Überschreiben einer geänderten Version und legt eine gelöschte Datei neu an. „Per Link freigeben“ zeigt einen Link auf SimScoreboard, den die Mitspieler öffnen.
- Mitspieler: Der Link fragt vor dem Laden nach. Die Liga ist eine Kopie mit gemerkter Quelle, **nur lesbar** (Schloss-Symbol) und wird bei jedem Öffnen aktualisiert; sie erscheint nie doppelt.
- Hinweis „noch nicht gespeichert“ (Banner, Punkte) für neue und geänderte Ligen; eine neue Liga öffnet in den Einstellungen. Löschen entfernt die Liga nur aus dem Browser, nie gespeicherte Dateien.
- **Grenze, bewusst so entschieden:** Die App liest eine Drive-Datei nur, wenn sie für „Jeder mit dem Link“ freigegeben ist (Abruf mit API-Key, ohne Anmeldung). Eingeschränkt freigegebene Dateien (nur bestimmte Personen) liefert Google mit 404 aus, auch wenn der Mitspieler bei Google angemeldet ist; die App meldet das verständlich. Wer die Liga nicht öffentlich per Link teilen will, gibt sie bestimmten Personen frei, und die Mitspieler holen sich die Datei selbst (zum Beispiel per Drive-Synchronisation) und öffnen sie lokal; das liegt außerhalb der App und ist akzeptiert. Erst bei echtem Bedarf wird geprüft, wie gesicherte Dateien zugänglich werden: Mitspieler melden sich in der App an und wählen die Datei über den Google Picker aus (Scope `drive.file`; offen sind Picker-API, Projektnummer als Konfigurationswert, Skript von `apis.google.com` in der Content-Security-Policy, Testnutzer und ob die Berechtigung bleibt).
- Den Schreibschutz stellt der Speicher her (Freigabe: nur der Organisator darf bearbeiten). Die Liga-Datei enthält Namen anderer Fahrer; die App weist beim Speichern in die Cloud und beim Freigeben darauf hin.
