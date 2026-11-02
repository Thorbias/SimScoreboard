# ADR-0005: Design-Tokens, Pit-Orange als Akzent und die Sektor-Leiste

- **Status:** Angenommen
- **Datum:** 2026-11-01

## Kontext

SimScoreboard gehört zur Markenfamilie von SimPosture ([PRODUCT.md](../PRODUCT.md)).
Geteilt wird nur das Branding, kein Code. SimPosture beschreibt sein Design im
eigenen Repository: Material Design 3 als Grundlage, Graphit-Flächen, Electric Cyan
(`#22C7F2`) als Akzent für „Analyse“, Inter als Schrift, ein 4/8/16/24-Raster und die
Prinzipien „Precision over Decoration“, „Data first“ und „Calm Experience“. Das
Markenmotiv dort ist das Analyse-Overlay (Messlinien und Winkel auf dem Foto).

SimScoreboard zeigt Ergebnisse und Zeiten. Motorsport-Zeitenanzeigen haben feste
Farbbedeutungen (Violett für schnellste, Grün für persönliche Bestzeit), und die App
muss Daten zweier Fahrer gegenüberstellen. Der Markenakzent darf diesen Bedeutungen
nicht in die Quere kommen.

## Entscheidung

**Gleiche Familie, eigene Handschrift.**

- **Übernommen von SimPosture:** neutrale Flächen und Textfarben (`#15181C`,
  `#181C21`, Linien `#262B32`; hell `#F8F9FA`, `#FFFFFF`), Inter, Radien 4/8/12/16 px
  plus Pille, 8-px-Raster, die Statusfarben (Erfolg, Warnung, Fehler, Info) und die
  Prinzipien.
- **Markenakzent und „du“: Pit-Orange `#FF7A2F`** (hell `#B3470A`). Er steht für
  Aktionen (Primärknopf), den aktiven Reiter und die Wortmarke und zugleich für
  den eigenen Fahrer in Listen, Tabellen und Diagrammen (`--you`). Er ist
  komplementär zu SimPostures Cyan und liegt rotstichiger als das Warn-Amber, es
  entsteht also kein Konflikt. Die Marke und „du“ teilen sich die Farbe, weil das
  Wichtigste auf der Seite die eigene Leistung ist.
- **Vergleichsfarben für die übrigen Fahrer** im Rundenzeiten-Diagramm: Fahrer A
  (der eigene) orange, B cyan `#22C7F2`, C rosa `#FF6FB1`, D limette `#C6E84A`
  (jeweils mit dunklerer Variante im hellen Modus). Cyan bleibt damit als Farbe
  der Familie erhalten, bedeutet aber „Gegner B“ statt „du“. Der Wechsel von
  Cyan auf Orange für „du“ kam am 2026-11-02 auf Wunsch des Entwicklers: Cyan
  wirkte weniger präsent als der Markenakzent.
- **Rollenfarben** behalten je eine Bedeutung: Violett `#C58BFF` schnellste (der
  Klasse), Grün `#4FD36A` persönliche Bestzeit, Gold `#F2C14E` Sieg, Amber
  `#FFB84D` Warnung, Rot `#E85D5D` Ausfall und Fehler. Jede Rolle hat eine dunklere
  Variante für den hellen Modus.
- **Markenmotiv: die Sektor-Leiste.** Drei schräge Segmente (S1, S2, S3) in der
  Neigung des SimPosture-Logos. Sie ist Funktion, keine Dekoration: Als
  Wortmarken-Begleiter in Violett, Grün und Orange, im Qualifying je Fahrer mit
  den schnellsten Sektoren der Klasse und als Fortschrittsbalken beim Einlesen.
- **Wortmarke statt Monogramm.** Beide Apps hätten „SP“; SimScoreboard führt „Sim“ in
  Textfarbe und „Scoreboard“ kursiv in Orange. Das Favicon ist die Sektor-Leiste.
- **Schrift:** Inter als Variable Font, lokal eingebunden (`@fontsource-variable/
  inter`, Lizenz OFL), nicht von einem Fremdserver. Zeiten stehen mit
  tabellarischen Ziffern.
- **Technik:** Die Tokens sind CSS-Variablen in `src/design/tokens.css` (dunkel als
  Standard, hell über die Wahl des Anwenders oder `prefers-color-scheme`). Die
  Einstellung „Automatisch / Hell / Dunkel“ steht in den Einstellungen und setzt
  `data-theme` auf `<html>`. Ein Test prüft den Kontrast aller
  Textfarben und Rollenfarben gegen beide Flächen (WCAG AA, 4,5:1).

## Alternativen

- **Apex-Magenta (`#FF3D8F`):** der stärkste Kontrast zu SimPosture, liegt aber
  farblich neben dem Violett für „schnellste“ und wirkt lauter als das Prinzip
  „Calm Experience“.
- **Ultramarin (`#6C84FF`):** am ruhigsten und am nächsten an SimPosture, aber zu
  nah an Cyan und Info-Blau; „du“ und „Gegner“ wären in Diagrammen schwerer zu
  trennen.
- **Signal-Lime:** liegt nahe am Grün der persönlichen Bestzeit.
- **Cyan als gemeinsamer Akzent:** hätte beide Apps ununterscheidbar gemacht.

## Konsequenzen

- Die Farben haben je eine feste Bedeutung. Neue Ansichten dürfen sie nicht für
  etwas anderes verwenden; ein Farbwechsel läuft über die Tokens.
- Die Position-Chart-Palette für die übrigen Fahrer meidet den Orange-Bereich, damit
  „du“ nie mit einem anderen verwechselt wird.
- Gleiche Neutrale auf beiden Seiten heißt: Ändert SimPosture seine Flächen, sollte
  SimScoreboard nachziehen. Es gibt dafür keinen geteilten Code, nur diese Tabelle.
- Inter ist im Bundle enthalten; das erhöht die Ladegröße um einige Dutzend KB.
- Die Flaggen kommen als SVG aus dem Paket `flag-icons` (MIT). Nur die Länder der
  Streckentabelle gelangen ins Bundle. Emoji-Flaggen wären unter Windows nur zwei
  Buchstaben. Die Lizenzhinweise stehen in `THIRD-PARTY-NOTICES.md`.
