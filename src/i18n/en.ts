export const en = {
  'app.name': 'SimPaddock',
  'app.tagline':
    'Session analysis for Le Mans Ultimate, entirely in your browser.',
  'nav.library': 'Library',
  'nav.settings': 'Settings',

  'folder.choose': 'Choose folder',
  'folder.change': 'Change folder',
  'folder.reconnect': 'Reconnect folder',
  'folder.chooseResults': 'Choose results folder',
  'folder.hint':
    'Pick your Le Mans Ultimate folder, its UserData folder or the Results folder. Your files never leave this computer.',
  'folder.reconnectHint': 'Allow access to your folder again to open sessions.',
  'folder.noResults': 'No result files were found in that folder.',

  'scan.progress': 'Reading sessions… {done} / {total}',
  'scan.failed': '{n} files could not be read.',
  'scan.error': 'Reading the folder failed: {message}',

  'library.title': 'Sessions',
  'library.count': '{n} sessions',
  'library.empty': 'No sessions yet. Choose your folder to get started.',
  'library.noMatch': 'No sessions match the filters.',
  'library.memoryOnly':
    'Local storage is not available, so the index is kept in memory only.',

  'filter.type': 'Session type',
  'filter.track': 'Track',
  'filter.class': 'Class',
  'filter.from': 'From',
  'filter.to': 'To',
  'filter.all': 'All',
  'filter.reset': 'Reset filters',

  'type.practice': 'Practice',
  'type.qualifying': 'Qualifying',
  'type.race': 'Race',

  'row.win': 'Win',
  'row.you': 'You: P{pos}',

  'session.back': 'Back to library',
  'session.loading': 'Loading session…',
  'session.notConnected': 'Connect your folder to open this session.',
  'session.failed': 'This session could not be read.',
  'session.minutes': '{n} min',
  'session.laps': '{n} laps',
  'session.trackLength': 'Track length {km} km',
  'session.version': 'Game version {version}',
  'session.drivers': '{n} drivers',

  'results.title': 'Results',
  'results.overall': 'Overall',
  'results.empty': 'This session has no results.',
  'results.you': 'You',

  'col.pos': 'Pos',
  'col.number': '#',
  'col.driver': 'Driver',
  'col.car': 'Car',
  'col.tyre': 'Tyre',
  'col.best': 'Best lap',
  'col.gap': 'Gap',
  'col.gapPole': 'To pole',
  'col.stops': 'Stops',
  'col.laps': 'Laps',
  'col.time': 'Time',
  'col.s1': 'S1',
  'col.s2': 'S2',
  'col.s3': 'S3',

  'gap.laps': '+{n} L',
  'gap.dnf': 'DNF',
  'gap.dq': 'DQ',

  'settings.title': 'Settings',
  'settings.driver': 'Your driver names',
  'settings.driverHelp':
    'SimPaddock marks you in all lists. Add every name you have raced under. The online suffix after # is ignored.',
  'settings.driverPlaceholder': 'Driver name',
  'settings.add': 'Add',
  'settings.remove': 'Remove',
  'settings.suggestions': 'Suggestions from your sessions',
  'settings.language': 'Language',
  'settings.languageAuto': 'Automatic',
  'settings.index': 'Local index',
  'settings.indexHelp':
    'The index holds a short summary of every session so the library opens quickly. Deleting it does not touch your game files.',
  'settings.clearIndex': 'Delete local index',
  'settings.clearConfirm': 'Delete the local index?',
} as const;

export type MessageKey = keyof typeof en;
