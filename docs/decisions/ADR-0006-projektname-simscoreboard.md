# ADR-0006: Projektname SimScoreboard

- **Status:** Angenommen
- **Datum:** 2026-11-02

## Kontext

Das Projekt hieß bis hierher SimPaddock. Die Prüfung vor der Veröffentlichung
(Backlog 10) ergab, dass der Name nicht zu halten ist:

- Unter derselben Bezeichnung läuft bereits ein kommerzielles Produkt im selben
  Umfeld (Software für Sim-Racing-Zentren). `.com` und `.app` sind vergeben.
- Es gibt seit 2018 eine GitHub-Organisation und ein weiteres Repository mit
  dem Namen.

Ein Name, der im selben Markt schon einem Produkt gehört, führt zu Verwechslung und
zu einem Markenrisiko, das sich nach der Veröffentlichung kaum noch beheben lässt.
Jetzt kostet die Umbenennung wenig, weil es noch keine Nutzer gibt.

Anforderungen an den neuen Namen:

- Familie mit SimPosture: „Sim“ plus ein Wort.
- Beschreibt, was die App tut: Zeiten und Ergebnisse als einfache Übersicht, später
  Liga und Cup.
- GitHub-Konto frei, keine gleichnamigen Repositories mit Gewicht, `.com`, `.app` und
  `.dev` frei, kein Treffer im Sim Racing.

## Entscheidung

Das Projekt heißt **SimScoreboard**. Die Anzeigetafel zeigt Zeiten und Ergebnisse
und ist zugleich das Bild für eine Liga- oder Cup-Tabelle. Die Wortmarke setzt
„Sim“ in Textfarbe und „Scoreboard“ kursiv in Pit-Orange
([ADR-0005](ADR-0005-design-tokens-und-markenakzent.md)).

Geprüft wurden 63 Namen im Stil „Sim“ plus Wort, jeweils auf GitHub (Konto und
Repositories), per Registrierungsabfrage für `.com`, `.app` und `.dev` und per
Websuche nach Sim-Racing-Produkten. SimScoreboard war als einer von wenigen
Namen in allen Punkten frei.

## Alternativen

- **SimTimesheet:** ebenfalls vollständig frei und die zweite Wahl; betont die
  Zeiten, die Liga ist weniger greifbar.
- **SimOverview, SimAnalyzer, SimLogbook, SimDossier, SimExtract:** frei bzw. mit
  Einschränkung, aber jeweils nur eine Seite der App (Übersicht, Analyse, Logbuch,
  Akte, Datenauszug).
- **SimCup und ähnliche Wörter:** SimCup ist im Sim Racing schon ein gängiger Name
  für Meisterschaften, das GitHub-Konto und die Domain sind vergeben. Als Funktion
  („Cup-Modus“) bleibt das Wort denkbar.
- **Namen mit belegter `.com`-Adresse:** möglich, weil die App unter einer
  GitHub-Pages-Adresse läuft, aber ein schlechteres Ausgangsbild.
- **Namen nahe an bestehenden Auswertungswerkzeugen** wurden verworfen, um
  Verwechslungen zu vermeiden.

## Konsequenzen

- **Lokale Daten:** Der Index und die Einstellungen lagen in der IndexedDB
  `simpaddock` und im `localStorage`-Schlüssel `simpaddock.theme`. Beim ersten Start
  werden sie in die neuen Namen übernommen (Aliasnamen, Favoriten, Ordnerzugriff,
  Index, Darstellung) und die alten Einträge entfernt. Ist die neue Datenbank
  schon befüllt oder der Browser kann Datenbanken nicht auflisten, bleibt die
  Migration aus; dann wird die Bibliothek neu eingelesen.
- **Wechsel des Ursprungs:** Speicher gilt je Adresse. Wer die Seite später unter
  einer anderen Domain öffnet, startet leer und muss die Daten neu einlesen.
- **Offen bleibt** die Markenprüfung (DPMA, EUIPO, USPTO), die Registrierung der
  Domain und das Umbenennen des GitHub-Repositories (Backlog 10). Ein Skript kann die
  Register nicht verlässlich abfragen; die Prüfung der Verfügbarkeit von Konto,
  Repositories und Domains beweist keine Markenfreiheit.
- **Verlauf:** Frühere Commits und ADRs nennen den alten Namen. Sie werden nicht
  umgeschrieben; die Dokumente im Repository tragen jetzt den neuen Namen.
- **SimPosture:** Wo die Dokumentation des Schwesterprojekts den alten Namen
  erwähnt, ist sie dort nachzuziehen.
