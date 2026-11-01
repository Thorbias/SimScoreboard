import type { MessageKey } from './en';

export const de: Record<MessageKey, string> = {
  'app.name': 'SimPaddock',
  'app.tagline':
    'Session-Auswertung für Le Mans Ultimate, komplett in deinem Browser.',
  'nav.library': 'Bibliothek',
  'nav.settings': 'Einstellungen',

  'folder.choose': 'Ordner wählen',
  'folder.change': 'Ordner wechseln',
  'folder.reconnect': 'Ordner neu verbinden',
  'folder.chooseResults': 'Results-Ordner wählen',
  'folder.hint':
    'Wähle den Ordner von Le Mans Ultimate, den Ordner UserData oder den Ordner Results. Deine Dateien verlassen diesen Rechner nie.',
  'folder.reconnectHint':
    'Erlaube den Zugriff auf deinen Ordner erneut, um Sessions zu öffnen.',
  'folder.noResults': 'In diesem Ordner wurden keine Result-Dateien gefunden.',

  'scan.progress': 'Sessions werden gelesen… {done} / {total}',
  'scan.failed': '{n} Dateien konnten nicht gelesen werden.',
  'scan.error': 'Das Lesen des Ordners ist fehlgeschlagen: {message}',

  'library.title': 'Sessions',
  'library.count': '{n} Sessions',
  'library.empty': 'Noch keine Sessions. Wähle deinen Ordner, um zu starten.',
  'library.noMatch': 'Keine Session passt zu den Filtern.',
  'library.memoryOnly':
    'Der lokale Speicher ist nicht verfügbar, der Index liegt nur im Arbeitsspeicher.',

  'filter.type': 'Session-Typ',
  'filter.track': 'Strecke',
  'filter.class': 'Klasse',
  'filter.from': 'Von',
  'filter.to': 'Bis',
  'filter.all': 'Alle',
  'filter.reset': 'Filter zurücksetzen',

  'type.practice': 'Training',
  'type.qualifying': 'Qualifying',
  'type.race': 'Rennen',

  'row.win': 'Sieg',
  'row.you': 'Du: P{pos}',

  'session.back': 'Zurück zur Bibliothek',
  'session.loading': 'Session wird geladen…',
  'session.notConnected': 'Verbinde deinen Ordner, um diese Session zu öffnen.',
  'session.failed': 'Diese Session konnte nicht gelesen werden.',
  'session.minutes': '{n} Min.',
  'session.laps': '{n} Runden',
  'session.trackLength': 'Streckenlänge {km} km',
  'session.version': 'Spielversion {version}',
  'session.drivers': '{n} Fahrer',

  'results.title': 'Ergebnis',
  'results.overall': 'Gesamt',
  'results.empty': 'Diese Session hat kein Ergebnis.',
  'results.you': 'Du',

  'col.pos': 'Pos',
  'col.number': '#',
  'col.driver': 'Fahrer',
  'col.car': 'Fahrzeug',
  'col.tyre': 'Reifen',
  'col.best': 'Bestrunde',
  'col.gap': 'Abstand',
  'col.gapPole': 'Zur Pole',
  'col.stops': 'Stopps',
  'col.laps': 'Runden',
  'col.time': 'Zeit',
  'col.s1': 'S1',
  'col.s2': 'S2',
  'col.s3': 'S3',

  'gap.laps': '+{n} R',
  'gap.dnf': 'DNF',
  'gap.dq': 'DQ',

  'settings.title': 'Einstellungen',
  'settings.driver': 'Deine Fahrernamen',
  'settings.driverHelp':
    'SimPaddock markiert dich in allen Listen. Trage jeden Namen ein, unter dem du gefahren bist. Die Online-Kennung nach # wird ignoriert.',
  'settings.driverPlaceholder': 'Fahrername',
  'settings.add': 'Hinzufügen',
  'settings.remove': 'Entfernen',
  'settings.suggestions': 'Vorschläge aus deinen Sessions',
  'settings.language': 'Sprache',
  'settings.languageAuto': 'Automatisch',
  'settings.index': 'Lokaler Index',
  'settings.indexHelp':
    'Der Index speichert eine kurze Zusammenfassung jeder Session, damit die Bibliothek schnell öffnet. Das Löschen berührt deine Spieldateien nicht.',
  'settings.clearIndex': 'Lokalen Index löschen',
  'settings.clearConfirm': 'Den lokalen Index löschen?',
};
