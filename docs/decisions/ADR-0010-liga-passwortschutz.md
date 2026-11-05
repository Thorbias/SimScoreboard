# ADR-0010: Passwortschutz der Liga-Datei

- **Status:** Angenommen und gebaut (ungeprüft: Verhalten auf Live-Seite und Drive)
- **Datum:** 2026-11-05

## Kontext

Die Liga-Datei ([ADR-0007](ADR-0007-liga-datei-und-formel.md)) enthält die Namen
der Fahrer. Sie liegt in einer Datei oder in Google Drive und wird über einen Link
weitergegeben ([ADR-0009](ADR-0009-liga-google-drive.md)). Die App liest eine
Drive-Datei nur, wenn sie für „Jeder mit dem Link“ freigegeben ist (Abruf mit
API-Key, ohne Anmeldung); eine eingeschränkte Freigabe geht nicht. Der Organisator
möchte die Datei trotzdem schützen: wer den Link hat, soll sie nur mit einem
Passwort lesen können. Alles läuft im Browser, ohne Backend.

## Entscheidung

Die Liga-Datei lässt sich **optional mit einem Passwort verschlüsseln**.

- **Verfahren:** AES-256-GCM (Web Crypto). Der Schlüssel kommt aus dem Passwort mit
  PBKDF2-HMAC-SHA-256, 600 000 Runden, zufälliger Salt von 16 Byte. Jedes Speichern
  nimmt einen neuen zufälligen IV von 12 Byte. GCM prüft zugleich, ob die Datei
  verändert wurde.
- **Dateiformat:** Eine geschützte Datei hat `format`, `version`, `id` und `name`
  **lesbar**, dazu einen Block `encryption` (`v`, `kdf`, `iterations`, `salt`, `iv`,
  Base64) und `data` (der verschlüsselte Rest der Liga: Formel, Rennen, Fahrer,
  Korrekturen, Signaturfeld). Eine Datei ohne `encryption` bleibt wie bisher; die
  Version der Liga bleibt 1, denn der Inhalt hat sich nicht geändert.
- **Name lesbar:** Der Liganame und die Liga-ID bleiben im Klartext, damit eine Liste
  oder ein Dialog die Liga nennen kann, bevor das Passwort eingegeben ist.
- **Ort der Verschlüsselung:** Nur an den Rändern. In der App (IndexedDB) liegt die
  Liga wie bisher unverschlüsselt; verschlüsselt wird, wenn die App sie in eine
  Datei oder nach Drive schreibt, und entschlüsselt, wenn sie eine Datei, eine
  Adresse oder einen Drive-Link liest.
- **Wer was braucht:** Das Passwort braucht jeder, der die Liga öffnet, auch beim
  Aktualisieren. Wer sie bearbeitet und speichert, braucht es zum Speichern.
- **Merken auf dem Gerät (optional):** Der Dialog hat ein Häkchen „Auf diesem Gerät
  merken“. Dann bleibt nicht das Passwort, sondern der abgeleitete Schlüssel als
  nicht auslesbarer `CryptoKey` in IndexedDB (an der Verknüpfung der Liga, nicht in
  der Datei). Ohne Häkchen gilt der Schlüssel nur für den Besuch (im Speicher). In
  den Einstellungen lässt sich ein gemerkter Schlüssel vergessen.
- **Prüfwert:** Die Verknüpfung speichert einen kleinen verschlüsselten Prüfwert,
  damit die App beim Speichern ein falsch eingegebenes Passwort erkennt und die
  Datei nicht mit einem anderen Schlüssel überschreibt.
- **Passwort wählen:** Mindestens 12 Zeichen, zweimal eingeben. Es gibt keine
  Wiederherstellung.
- **Ändern und Entfernen:** Ein neues Passwort erzeugt einen neuen Salt. Die Änderung
  gilt ab dem nächsten Speichern; die Liga gilt bis dahin als geändert. Frühere
  Versionen in Drive bleiben mit dem alten Passwort lesbar.
- **Besitzerwechsel** (Schloss, [ADR-0009](ADR-0009-liga-google-drive.md)) behält
  die Verknüpfung zum Passwort.

## Alternativen

- **Eingeschränkte Drive-Freigabe mit Google Picker:** Geht ohne Passwort, braucht aber
  Anmeldung und Dateiauswahl für jeden Mitspieler und eine zusätzliche
  Google-Schnittstelle. Verworfen für den Anfang.
- **Alles verschlüsseln, auch den Namen:** Wäre vertraulicher, die Liste könnte die
  Liga aber erst nach dem Passwort benennen. Auf Wunsch lesbar gelassen.
- **Passwort selbst speichern:** Wäre bequemer, aber das Passwort liegt dann im
  Browser. Der abgeleitete, nicht auslesbare Schlüssel ist die kleinere Lösung.
- **Argon2 oder scrypt:** Besser gegen Grafikkarten, aber nicht in Web Crypto; sie
  bräuchten eine Bibliothek oder WebAssembly. PBKDF2 mit vielen Runden genügt hier.

## Folgen

- Die Stärke hängt am Passwort: Wer die Datei hat, kann es offline beliebig oft
  versuchen. Die App verlangt mindestens 12 Zeichen und rät zu einem Satz.
- Ein vergessenes Passwort ist nicht wiederherstellbar. Die Kopie in der App bleibt
  lesbar, weil sie dort unverschlüsselt liegt.
- Ein gemerkter Schlüssel öffnet die Liga für jeden, der den Browser dieses Geräts
  benutzt; der Dialog sagt das.
- Das Passwort schützt nicht vor dem Schreiben; das regelt weiter Drive und das
  Google-Konto des Organisators.
- Jedes Öffnen und Speichern kostet eine Schlüsselableitung (rund eine halbe
  Sekunde), die Schlüssel werden danach im Speicher gehalten.
- Die Lesbarkeit von Liga-ID und -Name verrät nicht, wer teilnimmt, aber den Namen
  der Liga. Wer das nicht will, wählt einen neutralen Namen.

## Noch offen

- Prüfung auf der Live-Seite mit einer Drive-Datei und einem zweiten Browser-Profil
  (geteilter Link, Passwortdialog, Aktualisieren mit gemerktem Schlüssel).
- Ob `CryptoKey` in IndexedDB in allen Browsern bleibt (Chrome und Edge ja; Firefox
  und Safari ungeprüft). Geht es nicht, fragt die App eben nach dem Passwort.
