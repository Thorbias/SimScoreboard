# IDEA-0001 — Custom League

> **Status:** grob. Geplantes Alleinstellungsmerkmal; die Planung ist bewusst
> auf später verschoben. Diese Ideation hält nur fest, was schon absehbar ist.

## Idee

Eine Liga aus mehreren Sessions bilden: Punktesysteme definieren, Fahrer- und
Teamwertungen über Rennen hinweg berechnen, Tabellen und Verläufe anzeigen.

## Was jetzt schon wichtig ist

- Das Datenmodell (Session → Eintrag → Fahrer) wird von Anfang an so gebaut, dass
  eine Wertung darüber aggregieren kann. Die Liga ist dann eine Auswertung über
  vorhandene Sessions, kein Sonderfall im Parser.
- Ein Liga-Organisator hat die Result-Dateien der Rennen (Host oder Server).
  Naheliegend ist ein **local-first** Start: Organisator lädt die Dateien, die App
  berechnet die Tabelle, und ein statischer Export (z. B. JSON oder eine fertige
  Seite) wird geteilt. Das braucht noch kein Backend.

## Zu klären

- **Fahrer-Identität:** Namen in den Result-Dateien sind nicht zwingend eindeutig.
  Gibt es eine stabile ID in den Dateien? Hängt an der Formatprüfung
  (Backlog 1).
- **Widerspruch zu PRODUCT §5:** „kein Backend, keine Konten". Reicht der
  statische Export auf Dauer, oder braucht eine Liga mit Anmeldung und Live-
  Tabelle ein Backend? Das wäre eine Produktentscheidung.
- **Punktesysteme:** feste Vorlagen oder frei konfigurierbar? Streichergebnisse,
  Bonuspunkte, Strafen.
- **Mehrklassen-Rennen:** getrennte Wertung je Klasse.
- **Strafen und Nachträge:** Ergebnisse nach dem Rennen manuell korrigieren.
