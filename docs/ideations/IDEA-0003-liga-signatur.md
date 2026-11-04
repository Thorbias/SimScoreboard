# IDEA-0003 — Liga: Schreibschutz durch Signatur

> **Status:** grob. Gehört zur Custom League ([IDEA-0001](IDEA-0001-custom-league.md)),
> für eine spätere Ausbaustufe. Die erste Version verlässt sich auf die
> Freigabe-Rechte des Speichers (nur der Organisator schreibt).

## Idee

Der Organisator vergibt beim Anlegen der Liga ein Master-Passwort. Es schützt einen
Signaturschlüssel, damit Mitspieler die Liga-Daten nur lesen und Manipulationen
auffallen.

## Ablauf

- **Anlegen:** Die App erzeugt ein Schlüsselpaar (ECDSA, im Browser eingebaut). Der
  öffentliche Schlüssel liegt in den Liga-Daten. Der private Schlüssel liegt dort
  nur verschlüsselt, mit einem aus dem Passwort abgeleiteten Schlüssel (PBKDF2 mit
  Salt, AES-GCM).
- **Schreiben:** Das Passwort entsperrt den privaten Schlüssel, die App signiert die
  Liga-Daten.
- **Lesen:** Jeder Leser prüft die Signatur mit dem öffentlichen Schlüssel und lehnt
  veränderte Daten ab, auch wenn jemand im Speicher geschrieben hat.
- Der Organisator kann das Passwort an Mitorganisatoren weitergeben.

## Warum nicht nur ein Passwort-Hash

Ein Hash neben den Daten schützt nichts: Wer schreiben kann, ändert auch den Hash,
und die Prüfung läuft nur im Browser des jeweiligen Nutzers. Außerdem kann jeder
Leser den Hash offline erraten. Die Signatur prüft die Daten selbst.

## Grenzen

- **Löschen und Zurückspielen:** Wer schreiben kann, kann Dateien löschen oder durch
  eine ältere, gültig signierte Version ersetzen. Eine Versionsnummer in der
  Signatur erkennt das teilweise; ein Backup bleibt nötig.
- **Vertraulichkeit:** Die Signatur schützt die Unverfälschtheit, nicht den Inhalt.
  Namen in den Liga-Daten sieht jeder mit Leserecht.
- **Passwort vergessen:** keine Wiederherstellung; die Liga bräuchte einen neuen
  Schlüssel. Die App muss das beim Anlegen deutlich sagen.
- Ein Passwort für alle Schreiber lässt sich nicht einzeln widerrufen.

## Zu klären

- Eine eigene ADR, bevor die Liga-Daten ein Format mit Signatur bekommen.
- Wie das Datenformat der ersten Version ein Signaturfeld schon vorsieht, damit
  später kein Bruch entsteht.
