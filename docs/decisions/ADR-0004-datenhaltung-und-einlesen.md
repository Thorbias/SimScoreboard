# ADR-0004: Lokaler Index in IndexedDB, Einlesen im Worker

- **Status:** Vorgeschlagen (wird mit Entwickler-Freigabe „Angenommen“)
- **Datum:** 2026-11-01

## Kontext

Die Session-Bibliothek soll bei über 1.000 Sessions flink bleiben (NF-003) und nach
dem ersten Einlesen schnell starten (F-016). Die Result-Dateien sind bis zu 540 KB
groß ([ADR-0002](ADR-0002-lmu-result-format.md)); die Liste braucht davon nur den
Kopf und die Fahrer-Eckdaten. Die Telemetrie ist noch nicht verifiziert und
bestimmt die Wahl von DuckDB-WASM (Backlog 1).

## Entscheidung

- **Index in IndexedDB.** Je Session ein kleiner Datensatz (Kopf, Klassen, Fahrer
  mit Position und Startnummer) plus Größe und Änderungszeit der Datei. Daneben ein
  Speicher für Einstellungen (eigene Fahrernamen, Sprache, Ordner-Zugriff).
- **Details bei Bedarf.** Runden und Ergebnisse einer Session werden beim Öffnen
  aus der Originaldatei gelesen, nicht gespeichert.
- **Einlesen im Web Worker.** Der Worker liest die Dateien, parst sie und liefert
  Zusammenfassungen in Paketen; die Oberfläche zeigt den Fortschritt. Beim erneuten
  Einlesen werden nur neue oder geänderte Dateien (Größe, Änderungszeit)
  verarbeitet, verschwundene Dateien verlassen den Index.
- **Eigener, toleranter XML-Leser** statt `DOMParser`. Letzterer fehlt in Web
  Workern und in der Testumgebung. Der Leser überspringt den internen DOCTYPE
  (damit ist die offene Frage aus ADR-0002 geklärt) und lädt auch abgeschnittene
  Dateien.
- **Ordner-Zugriff:** In Chromium merkt sich der Index das Ordner-Handle; nach einem
  Neustart muss der Anwender den Zugriff mit einem Klick erneut erlauben. Andere
  Browser nutzen eine Ordner-Auswahl; dort kennt die Seite die Dateien nur bis zum
  Neuladen.
- **Best effort.** Ist IndexedDB nicht verfügbar, arbeitet die App mit einem Index im
  Arbeitsspeicher weiter und weist darauf hin.
- **DuckDB-WASM ist nicht Teil dieser Entscheidung.** Es wird nur für die Telemetrie
  erwogen und bekommt ein eigenes ADR, sobald das Format verifiziert ist.

## Alternativen

- **Alles im Speicher halten:** einfach, aber bei jedem Start 465+ Dateien neu
  parsen und mehrere hundert MB Speicher.
- **Auch Runden im Index:** schnellere Detailansichten, aber ein Vielfaches an
  Speicher und eine Schema-Pflege, die sich mit jedem Spiel-Update ändern kann.
- **DuckDB-WASM auch für den Index:** mächtige Abfragen, aber ein großer
  Download und zusätzliche Komplexität, ohne dass die Bibliothek sie braucht.

## Konsequenzen

- Die Liste startet aus dem Index, ohne den Ordner zu lesen. Details einer Session
  öffnen erst, wenn der Ordner verbunden ist.
- Ändert sich die Form der Index-Datensätze, muss der Index neu aufgebaut werden;
  dafür gibt es „Lokalen Index löschen“ in den Einstellungen und die Versionsnummer
  der Datenbank.
- Fahrer werden nur über ihren Namen erkannt (kein stabiler Schlüssel im Spiel);
  die Zuordnung zum eigenen Fahrer ist eine Einstellung.
