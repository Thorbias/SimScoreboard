import { parseResultFileName } from './fileName';
import type {
  Entry,
  EntrySummary,
  Lap,
  Session,
  SessionSummary,
  SessionType,
} from './types';
import { parseStream } from './stream';
import { child, childText, parseXml, type XmlElement } from './xml';

/** The game writes this when a session has no lap limit. */
const NO_LIMIT = 2147483647;

function num(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function int(value: string | undefined): number | null {
  const n = num(value);
  return n === null ? null : Math.trunc(n);
}

function compound(value: string | undefined): string | null {
  if (!value) return null;
  const comma = value.indexOf(',');
  return (comma === -1 ? value : value.slice(comma + 1)).trim() || null;
}

function parseLap(el: XmlElement): Lap | null {
  const lapNum = int(el.attrs.num);
  if (lapNum === null) return null;
  return {
    num: lapNum,
    time: num(el.text),
    sectors: [num(el.attrs.s1), num(el.attrs.s2), num(el.attrs.s3)],
    position: int(el.attrs.p),
    endTime: num(el.attrs.et),
    topSpeed: num(el.attrs.topspeed),
    compound: compound(el.attrs.fcompound),
    pit: el.attrs.pit !== undefined && el.attrs.pit !== '0',
  };
}

function parseEntry(el: XmlElement): Entry {
  const text = (name: string) => childText(el, name) ?? '';
  return {
    driverName: text('Name'),
    isPlayer: text('isPlayer') === '1',
    carClass: text('CarClass'),
    carType: text('CarType'),
    carNumber: text('CarNumber'),
    teamName: text('TeamName'),
    position: int(text('Position')),
    classPosition: int(text('ClassPosition')),
    gridPosition: int(text('GridPos')),
    classGridPosition: int(text('ClassGridPos')),
    bestLap: num(text('BestLapTime')),
    lapCount: int(text('Laps')) ?? 0,
    pitstops: int(text('Pitstops')) ?? 0,
    finishStatus: text('FinishStatus'),
    finishTime: num(text('FinishTime')),
    laps: el.children
      .filter((c) => c.name === 'Lap')
      .flatMap((c) => parseLap(c) ?? []),
  };
}

function sessionType(
  section: string,
  fromFileName: SessionType | null,
): SessionType {
  if (/^qualify/i.test(section)) return 'qualifying';
  if (/^race/i.test(section)) return 'race';
  if (/^(practice|warmup)/i.test(section)) return 'practice';
  return fromFileName ?? 'practice';
}

/**
 * The session section is the child of `RaceResults` that holds the drivers
 * (`Practice1`, `Qualify`, `Race`, …). The names are not enumerated on purpose,
 * so unknown future sections still load.
 */
function findSection(results: XmlElement): XmlElement | undefined {
  return (
    results.children.find((c) => c.children.some((g) => g.name === 'Driver')) ??
    results.children.find((c) => child(c, 'Stream') !== undefined)
  );
}

/**
 * Parses one result file into a session. Unknown elements are ignored and
 * missing fields stay null, so files from other game versions and aborted
 * sessions load. Throws only if the text is not a result file at all.
 */
export function parseSession(xml: string, fileName: string): Session {
  const fromName = parseResultFileName(fileName);
  const root = parseXml(xml);
  const results = child(child(root, 'rFactorXML') ?? root, 'RaceResults');
  if (!results) throw new Error(`${fileName} is not a result file`);

  const section = findSection(results);
  const sectionName = section?.name ?? '';
  const header = (name: string) => childText(results, name) ?? '';
  const trackCourse = header('TrackCourse');
  const eventTime = header('DateTime');

  const limitLaps = int(section ? childText(section, 'Laps') : undefined);
  const minutes = int(section ? childText(section, 'Minutes') : undefined);
  const startUnix = num(section ? childText(section, 'DateTime') : undefined);

  return {
    id: fileName,
    type: sessionType(sectionName, fromName?.type ?? null),
    section: sectionName,
    endedAt: fromName?.endedAt ?? null,
    startedAt: startUnix === null ? null : startUnix * 1000,
    eventKey: eventTime ? `${trackCourse}|${eventTime}` : null,
    mode: header('Setting'),
    trackVenue: header('TrackVenue'),
    trackCourse,
    trackEvent: header('TrackEvent'),
    trackLength: num(header('TrackLength')),
    gameVersion: header('GameVersion'),
    minutes: minutes !== null && minutes > 0 ? minutes : null,
    scheduledLaps:
      limitLaps !== null && limitLaps > 0 && limitLaps < NO_LIMIT
        ? limitLaps
        : null,
    mostLapsCompleted: int(
      section ? childText(section, 'MostLapsCompleted') : undefined,
    ),
    entries: (section?.children ?? [])
      .filter((c) => c.name === 'Driver')
      .map(parseEntry),
    events: parseStream(section ? child(section, 'Stream') : undefined),
  };
}

/**
 * Fills the fields that records of an older index version lack, so the library
 * can show them until the files are read again.
 */
export function upgradeSummary(summary: SessionSummary): SessionSummary {
  return {
    ...summary,
    contacts: summary.contacts ?? [],
    entries: summary.entries.map((e) => ({
      ...e,
      carType: e.carType ?? '',
      bestLap: e.bestLap ?? null,
      bestLapSectors: e.bestLapSectors ?? [null, null, null],
      lapCount: e.lapCount ?? 0,
      classGridPosition: e.classGridPosition ?? null,
      finishStatus: e.finishStatus ?? '',
    })),
  };
}

export function summarize(session: Session): SessionSummary {
  const entries: EntrySummary[] = session.entries.map((e) => ({
    driverName: e.driverName,
    carClass: e.carClass,
    carType: e.carType,
    carNumber: e.carNumber,
    position: e.position,
    classPosition: e.classPosition,
    bestLap: e.bestLap,
    bestLapSectors: e.laps.find((l) => l.time !== null && l.time === e.bestLap)
      ?.sectors ?? [null, null, null],
    lapCount: e.lapCount,
    classGridPosition: e.classGridPosition,
    finishStatus: e.finishStatus,
  }));
  return {
    id: session.id,
    type: session.type,
    section: session.section,
    endedAt: session.endedAt,
    startedAt: session.startedAt,
    eventKey: session.eventKey,
    mode: session.mode,
    trackVenue: session.trackVenue,
    trackCourse: session.trackCourse,
    trackEvent: session.trackEvent,
    trackLength: session.trackLength,
    gameVersion: session.gameVersion,
    minutes: session.minutes,
    scheduledLaps: session.scheduledLaps,
    classes: [
      ...new Set(session.entries.map((e) => e.carClass).filter(Boolean)),
    ],
    entries,
    contacts: session.events.flatMap((e) =>
      e.kind === 'contact' && e.other !== null
        ? [{ time: e.time, driver: e.driver, other: e.other }]
        : [],
    ),
  };
}
