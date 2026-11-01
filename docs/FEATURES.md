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

<!-- Nächste freie F-ID: F-018 — fortlaufend vergeben, nie wiederverwenden,
     auch nicht die IDs gelöschter Einträge (sonst zeigen alte Commits und
     Verweise auf die falsche Anforderung). -->

## F-001 — Session-Ordner einlesen

Prio M · Status offen

Der Anwender gibt den Ordner mit den Spieldaten frei, und SimPaddock liest alle
Sessions ein, ohne dass Dateien den Rechner verlassen.

- Chromium-Browser: Ordnerzugriff über die File System Access API; die Freigabe
  bleibt gespeichert, beim Öffnen werden neue Dateien nachgelesen.
- Andere Browser: Ordner-Auswahl oder Drag-and-drop als Fallback.
- Das Einlesen läuft im Hintergrund (Web Worker) mit Fortschrittsanzeige.

## F-002 — Session-Bibliothek

Prio M · Status offen

Der Anwender durchsucht alle eingelesenen Sessions in einer Liste, neueste zuerst.

- Filter nach Session-Typ (Training, Qualifying, Rennen), Strecke, Zeitraum und
  Fahrzeugklasse.
- Sessions desselben Events (Training, Qualifying, Rennen am selben Wochenende)
  werden gruppiert angezeigt.
- Jede Zeile zeigt Strecke, Land, Datum, Session-Typ, beteiligte Klassen und ob der
  eigene Fahrer gewonnen hat. Das Land kommt aus einer eigenen Streckentabelle,
  weil die Dateien nur Venue, Course und Event nennen; ist die Strecke dort nicht
  bekannt, entfällt die Angabe.
- Anzahl der Sessions steht im Listenkopf.

## F-003 — Eigener Fahrer markiert

Prio M · Status offen

Der Anwender legt seinen Fahrernamen fest, und SimPaddock markiert ihn überall mit
einem eigenen Badge.

- Der Name wird in den Einstellungen gesetzt; ein Vorschlag aus den häufigsten
  Namen der eingelesenen Sessions erleichtert die Wahl.
- Das Spiel liefert keine stabile Fahrer-ID, und das Kennzeichen „Spieler" gilt im
  Mehrspieler für alle Menschen. Der Anwender pflegt deshalb eine Liste von Aliassen;
  der Abgleich ignoriert die angehängten `#`-Kennungen.
- Die Markierung erscheint in der Session-Liste, in Ergebnissen, Diagrammen und
  Statistiken.
- Der eigene Fahrer ist in Vergleichsansichten als Standard vorausgewählt.

## F-004 — Rennergebnis

Prio M · Status offen

Die App zeigt die Ergebnisse eines Rennens nach Klasse oder gesamt.

- Spalten: Position, Startnummer, Fahrer, Fahrzeug, Reifenmischung, Bestrunde,
  Rückstand auf den Führenden, Boxenstopps, Runden, Gesamtzeit.
- Überrundete Fahrer erscheinen mit „+n Runden", Ausfälle mit „DNF".
- Die Bestrunde der Klasse ist hervorgehoben.
- Umschalter Gesamt / je Klasse; die Klasse des eigenen Fahrers ist markiert.

## F-005 — Qualifying-Ergebnis

Prio M · Status offen

Die App zeigt die Qualifying-Ergebnisse mit Sektorzeiten und Abständen.

- Spalten: Position, Startnummer, Fahrer, Fahrzeug, Reifenmischung, Sektoren 1–3,
  Bestrunde, Abstand zur Pole, Rundenanzahl.
- Die schnellsten Sektoren und die Bestrunde der Klasse sind farblich markiert.
- Fahrer ohne gewertete Runde erscheinen am Ende ohne Zeiten.

## F-006 — Session-Kopf

Prio M · Status offen

Jede Session zeigt in einem Kopfbereich ihre Eckdaten.

- Strecke mit Flagge (aus der Streckentabelle, siehe F-002), Datum und Uhrzeit,
  Länge in Minuten, Gesamtrunden,
  Streckenlänge, Session-Typ.
- Die Ansichten einer Session (Ergebnis, Lap Chart, Position Chart, Statistics,
  Incidents, Chat) sind als Reiter erreichbar; nur die für den Session-Typ
  sinnvollen Reiter erscheinen (Position Chart und Statistics nur im Rennen).

## F-007 — Lap Chart

Prio S · Status offen

Der Anwender vergleicht den Rundenzeiten-Verlauf zweier Fahrer Runde für Runde.

- Zwei frei wählbare Fahrer, je eine Linie in eigener Farbe.
- Marker für die Bestrunde und für Runden ohne gewertete Zeit (die Dateien kennen
  kein Flag „ungültig"; es fehlen Sektorzeiten bzw. die Rundenzeit).
- Darunter je Fahrer eine Tabelle mit Runde, Rundenzeit, Sektoren 1–3 und Delta
  zum anderen Fahrer.
- Die Chart-Ansicht lässt sich ausblenden, sodass nur die Tabellen bleiben.

## F-008 — Position Chart

Prio S · Status offen

Die App zeigt den Positionsverlauf aller Fahrer von der Startaufstellung bis ins
Ziel.

- Eine Linie je Fahrer, Achse von „Grid" über jede Runde bis „Finish".
- Umschalter je Klasse; Legende mit Fahrern und Endposition.
- Ein Fokus-Modus hebt den eigenen Fahrer hervor und blendet den Rest zurück.

## F-009 — Statistiken je Klasse

Prio S · Status offen

Die App hebt je Klasse die auffälligen Leistungen eines Rennens hervor.

- Schnellste Runde und schnellste Sektoren 1–3 mit Fahrer und Rundennummer.
- Konstanz: Fahrer mit der geringsten Standardabweichung der Rundenzeiten.
- Die meisten gewonnenen und die meisten verlorenen Positionen.
- Die meistgenutzte Reifenmischung mit Rundenzahl.

## F-010 — Incidents

Prio S · Status offen

Der Anwender sieht alle Zwischenfälle einer Session als Zeitleiste.

- Spalten: Session-Zeit (Restzeit wird aus der Session-Länge berechnet), Typ,
  Fahrer, Klasse, Runde, Detail.
- Typen: Kontakt (mit Stärke und Gegner), Track Limits, Strafe.
- Filter nach Typ, Klasse und Fahrer.
- Track Limits und Strafen gibt es nur in neueren Mehrspieler-Dateien; fehlen sie,
  zeigt die Ansicht nur die Kontakte oder einen Hinweis.

## F-011 — Session-Chat

Prio K · Status offen

Die App zeigt den Chat-Verlauf einer Session als eigenen Reiter. Chat gibt es nur in
neueren Mehrspieler-Dateien; der Reiter erscheint nur, wenn Nachrichten vorhanden
sind.

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

Prio M · Status offen

Die App speichert den Metadaten-Index der Sessions und die Einstellungen lokal im
Browser, sodass sie nach dem ersten Einlesen schnell startet.

- Nur Metadaten im Index; die Details einer Session werden bei Bedarf aus der Datei
  gelesen.
- Der Speicher ist best-effort: Ist er nicht verfügbar (z. B. Privatmodus), arbeitet
  die App mit einem Index im Arbeitsspeicher weiter.
- Der Anwender kann den lokalen Index jederzeit löschen.

## F-017 — Mehrsprachige Oberfläche

Prio S · Status offen

Die Oberfläche gibt es auf Englisch und Deutsch; Englisch ist der Standard, Deutsch
wird bei deutschem Browser-Locale gewählt. Alle Texte kommen aus einer zentralen
Übersetzungsschicht.
