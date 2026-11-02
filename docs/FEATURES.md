# Features — SimPaddock

> Was SimPaddock können soll und was offen ist. **Lebenszyklus der Fähigkeit**,
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

<!-- Nächste freie F-ID: F-019 — fortlaufend vergeben, nie wiederverwenden,
     auch nicht die IDs gelöschter Einträge (sonst zeigen alte Commits und
     Verweise auf die falsche Anforderung). -->

## F-001 — Session-Ordner einlesen

Prio M · Status fertig

Der Anwender gibt den Ordner mit den Spieldaten frei, und SimPaddock liest alle Sessions ein, ohne dass Dateien den Rechner verlassen.

- Akzeptiert wird der Spielordner, `UserData` oder `Results`; die Result-Dateien werden darunter gefunden.
- Chromium-Browser: Ordnerzugriff über die File System Access API; das Handle bleibt gespeichert, nach einem Neustart genügt ein Klick auf „Ordner neu verbinden“. Beim Verbinden werden neue und geänderte Dateien nachgelesen, verschwundene aus dem Index entfernt.
- Andere Browser: Ordner-Auswahl als Fallback; dort kennt die Seite die Dateien bis zum Neuladen.
- Das Einlesen läuft im Hintergrund (Web Worker) mit Fortschrittsanzeige; nicht lesbare Dateien werden gezählt und gemeldet.
- Technik: [ADR-0004](decisions/ADR-0004-datenhaltung-und-einlesen.md).

## F-002 — Session-Bibliothek

Prio M · Status fertig

Der Anwender durchsucht alle eingelesenen Sessions in einer Liste, neueste zuerst.

- Filter nach Session-Typ (Training, Qualifying, Rennen), Strecke, Zeitraum und Fahrzeugklasse.
- Sessions desselben Events (gleiche Strecke und Event-Start im Kopf der Datei) werden gruppiert angezeigt.
- Jede Zeile zeigt Session-Typ, Datum, beteiligte Klassen und das Ergebnis des eigenen Fahrers, bei einem Klassensieg mit Sieg-Marke.
- Die Anzahl der Sessions steht im Listenkopf.
- Land und Flagge der Strecke: F-018.

## F-003 — Eigener Fahrer markiert

Prio M · Status fertig

Der Anwender legt seine Fahrernamen fest, und SimPaddock markiert ihn in Liste und Ergebnissen mit einem eigenen Badge.

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
- Runden ohne gewertete Zeit erscheinen als Lücke; sehr langsame Runden (über 125 % des Medians) sind im Diagramm abgeschnitten. Die Bestrunde jedes Fahrers ist in der Tabelle hervorgehoben.
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
  lokal gespeichert; sie kann später als kleines Symbol je Variante in Bibliothek
  und Bestzeiten dienen. Eine Quelle aus öffentlichen Karten ist verworfen
  (uneinheitliche Lizenzen, Lücken bei den Varianten).
- Einfärbung wählbar nach Geschwindigkeit, Eingaben oder Sektoren.
- Kennzahlen: Höchstgeschwindigkeit, Durchschnittsgeschwindigkeit,
  Kraftstoffverbrauch der Runde. Der Verbrauch ist optional: `fuelUsed` fand sich
  nur in Dateien der Version 0.5000.

## F-014 — Persönliche Bestzeiten

Prio M · Status offen

Der Anwender sieht seine besten Runden geordnet nach Strecke, Fahrzeugklasse und
Fahrzeug. Die Zuordnung „eigener Fahrer" über mehrere Dateien beruht auf F-003.

- Linke Liste aller Strecken mit Layout-Anzahl, Session-Anzahl und der Bestzeit je
  Klasse.
- Detailansicht einer Strecke: beste Qualifying- und Rennrunde, gefahrene Runden
  gesamt, Fahrzeuge, Sessions.
- Je Klasse eine Tabelle der Rekorde pro Fahrzeug mit Session-Typ, Datum,
  Sektoren, Rundenzeit und Abstand zur Klassenbestzeit.
- Filter nach Klasse.
- Von jedem Rekord führt ein Sprung zur Session und, falls Telemetrie vorhanden
  ist, in den Telemetrie-Vergleich.

## F-015 — Favoriten

Prio K · Status offen

Der Anwender markiert Sessions als Favorit und filtert die Bibliothek danach.

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

Die App zeigt zu jeder Strecke Land und Flagge in Bibliothek, Session-Kopf und Bestzeiten.

- Die Result-Dateien nennen nur Venue, Course und Event; Land und Flagge kommen aus einer eigenen Streckentabelle im Projekt. Ist eine Strecke dort nicht bekannt, entfällt die Angabe.
