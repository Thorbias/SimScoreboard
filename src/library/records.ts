import type { SessionSummary, SessionType } from '../results/types';
import { sessionTime } from './filters';
import { isOwnDriver } from './names';
import { buildRivals, type DriverCount } from './rivals';

export interface LapRecord {
  sessionId: string;
  sessionType: SessionType;
  /** When the session ended, epoch ms. */
  time: number;
  carClass: string;
  carType: string;
  lap: number;
  sectors: [number | null, number | null, number | null];
}

/** The best own lap of one session, for the progress over time. */
export interface LapPoint {
  /** When the session ended, epoch ms. */
  time: number;
  lap: number;
  carType: string;
  sessionId: string;
}

export interface ClassRecords {
  carClass: string;
  /** Fastest own lap in this class on this layout. */
  best: number;
  /** One record per car, fastest first. */
  records: LapRecord[];
  /** The best lap of every session in this class on this layout, oldest first. */
  history: LapPoint[];
}

/** The best lap so far after each session: the line of the personal record. */
export function runningBest(
  points: readonly LapPoint[],
): { time: number; best: number }[] {
  let best = Infinity;
  return points.map((p) => {
    best = Math.min(best, p.lap);
    return { time: p.time, best };
  });
}

/**
 * The records on one track layout. Lap times of different layouts of the same
 * venue are not comparable, so every layout stands on its own.
 */
export interface TrackRecords {
  venue: string;
  /** The layout as the game names it. */
  course: string;
  classes: ClassRecords[];
  sessionCount: number;
  totalLaps: number;
  cars: string[];
  bestQualifying: LapRecord | null;
  bestRace: LapRecord | null;
  lastDriven: number;
}

function faster(a: LapRecord | null, b: LapRecord): LapRecord {
  return a && a.lap <= b.lap ? a : b;
}

/**
 * The own driver's best laps, grouped by layout, class and car. Only sessions
 * in which one of the aliases took part count.
 */
export function buildRecords(
  sessions: readonly SessionSummary[],
  aliases: readonly string[],
): TrackRecords[] {
  interface Track {
    venue: string;
    course: string;
    sessionCount: number;
    totalLaps: number;
    cars: Set<string>;
    bestQualifying: LapRecord | null;
    bestRace: LapRecord | null;
    lastDriven: number;
    // class -> car -> record
    classes: Map<string, Map<string, LapRecord>>;
    // class -> best lap of every session
    history: Map<string, LapPoint[]>;
  }
  const tracks = new Map<string, Track>();

  for (const session of sessions) {
    const own = session.entries.filter((e) =>
      isOwnDriver(e.driverName, aliases),
    );
    if (own.length === 0) continue;

    const venue = session.trackVenue || session.trackCourse;
    const course = session.trackCourse || venue;
    const key = `${venue}\u0000${course}`;
    let track = tracks.get(key);
    if (!track) {
      track = {
        venue,
        course,
        sessionCount: 0,
        totalLaps: 0,
        cars: new Set(),
        bestQualifying: null,
        bestRace: null,
        lastDriven: 0,
        classes: new Map(),
        history: new Map(),
      };
      tracks.set(key, track);
    }
    track.sessionCount += 1;
    track.lastDriven = Math.max(track.lastDriven, sessionTime(session));

    for (const entry of own) {
      track.totalLaps += entry.lapCount;
      if (entry.carType) track.cars.add(entry.carType);
      if (entry.bestLap === null) continue;

      const record: LapRecord = {
        sessionId: session.id,
        sessionType: session.type,
        time: sessionTime(session),
        carClass: entry.carClass,
        carType: entry.carType,
        lap: entry.bestLap,
        sectors: entry.bestLapSectors,
      };
      if (session.type === 'qualifying') {
        track.bestQualifying = faster(track.bestQualifying, record);
      }
      if (session.type === 'race') {
        track.bestRace = faster(track.bestRace, record);
      }

      const cars = track.classes.get(entry.carClass) ?? new Map();
      cars.set(entry.carType, faster(cars.get(entry.carType) ?? null, record));
      track.classes.set(entry.carClass, cars);

      const points = track.history.get(entry.carClass) ?? [];
      points.push({
        time: record.time,
        lap: record.lap,
        carType: record.carType,
        sessionId: record.sessionId,
      });
      track.history.set(entry.carClass, points);
    }
  }

  return [...tracks.values()]
    .map((t): TrackRecords => ({
      venue: t.venue,
      course: t.course,
      classes: [...t.classes.entries()]
        .map(([carClass, cars]): ClassRecords => {
          const records = [...cars.values()].sort((a, b) => a.lap - b.lap);
          const history = [...(t.history.get(carClass) ?? [])].sort(
            (a, b) => a.time - b.time,
          );
          return { carClass, best: records[0]?.lap ?? 0, records, history };
        })
        .sort((a, b) => a.carClass.localeCompare(b.carClass)),
      sessionCount: t.sessionCount,
      totalLaps: t.totalLaps,
      cars: [...t.cars].sort((a, b) => a.localeCompare(b)),
      bestQualifying: t.bestQualifying,
      bestRace: t.bestRace,
      lastDriven: t.lastDriven,
    }))
    .sort((a, b) => b.lastDriven - a.lastDriven);
}

export interface CarShare {
  carType: string;
  /** On how many track layouts this car holds the fastest own lap of the class. */
  bests: number;
  /** Completed laps in this car. */
  laps: number;
  sessions: number;
}

export interface ClassOverview {
  carClass: string;
  /** Track layouts with a timed lap in this class. */
  layouts: number;
  totalLaps: number;
  /** Most successful car first. */
  cars: CarShare[];
}

export interface TrackUse {
  venue: string;
  course: string;
  laps: number;
  sessions: number;
}

export interface ModeShare {
  sessions: number;
  laps: number;
}

export interface MonthActivity {
  /** `YYYY-MM` in local time. */
  month: string;
  laps: number;
  sessions: number;
}

export interface RecentRace {
  sessionId: string;
  venue: string;
  course: string;
  carClass: string;
  carType: string;
  time: number;
  /** Finishing position within the class. */
  position: number | null;
  /** Starting position within the class. */
  grid: number | null;
  status: string;
}

export interface Form {
  /** Races in which the own driver completed at least one lap. */
  races: number;
  /** Races ended with a DNF or a disqualification. */
  dnfs: number;
  /** The latest races, newest first. */
  recent: RecentRace[];
  /** Average finishing position in the latest races. */
  averageFinish: number | null;
  /** Average places gained from the grid to the finish in the latest races. */
  averageGain: number | null;
}

/** The fastest lap of a class on a layout, with the day it was set. */
export interface RecordAge {
  venue: string;
  course: string;
  carClass: string;
  carType: string;
  lap: number;
  /** When the session ended, epoch ms. */
  time: number;
}

export interface Overview {
  sessionCount: number;
  totalLaps: number;
  /** Distance of all completed laps, in kilometres. */
  distanceKm: number;
  /** Track layouts driven. */
  layoutCount: number;
  /** Races in which the own driver completed at least one lap. */
  races: number;
  wins: number;
  /** Class podiums, wins included. */
  podiums: number;
  classes: ClassOverview[];
  /** The layouts with the most laps. */
  topTracks: TrackUse[];
  modes: { multiplayer: ModeShare; other: ModeShare };
  /** Laps per month, oldest first, only months with sessions. */
  activity: MonthActivity[];
  form: Form;
  /** The most recently set class records. */
  newestRecords: RecordAge[];
  /** The class records that have stood the longest. */
  oldestRecords: RecordAge[];
  /** Class records set within the last 30 days. */
  recentRecordCount: number;
  /** The drivers raced with and collided with most often (two or more). */
  rivals: { sharedRaces: DriverCount[]; collisions: DriverCount[] };
}

const TOP_TRACKS = 5;
const RECENT_RACES = 10;
const RECORD_LIST = 5;
const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function average(values: number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((a, b) => a + b, 0) / values.length;
}

function monthKey(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * The last `count` months up to the latest month with a session, months
 * without a session included as zero.
 */
export function recentMonths(
  activity: readonly MonthActivity[],
  count = 12,
): MonthActivity[] {
  const last = activity.at(-1);
  if (!last) return [];
  const byMonth = new Map(activity.map((a) => [a.month, a]));
  let [year, month] = last.month.split('-').map(Number) as [number, number];
  const months: MonthActivity[] = [];
  for (let i = 0; i < count; i++) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    months.unshift(byMonth.get(key) ?? { month: key, laps: 0, sessions: 0 });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return months;
}

/**
 * Totals over all sessions of the own driver: which cars set the best times per
 * class, how much was driven, how the races went and how old the records are.
 * `tracks` can be passed in when the records were built already; `now` is the
 * moment the age of the records is measured against.
 */
export function buildOverview(
  sessions: readonly SessionSummary[],
  aliases: readonly string[],
  tracks: readonly TrackRecords[] = buildRecords(sessions, aliases),
  now: number = Date.now(),
): Overview {
  let sessionCount = 0;
  let totalLaps = 0;
  let distanceKm = 0;
  let races = 0;
  let wins = 0;
  let podiums = 0;
  let dnfs = 0;
  const modes = {
    multiplayer: { sessions: 0, laps: 0 },
    other: { sessions: 0, laps: 0 },
  };
  const months = new Map<string, MonthActivity>();
  const raceList: RecentRace[] = [];
  const layouts = new Map<string, TrackUse>();
  const cars = new Map<
    string,
    { carClass: string; carType: string; laps: number; sessions: number }
  >();

  for (const session of sessions) {
    const own = session.entries.filter((e) =>
      isOwnDriver(e.driverName, aliases),
    );
    if (own.length === 0) continue;
    sessionCount += 1;

    const time = sessionTime(session);
    const ownLaps = own.reduce((sum, e) => sum + e.lapCount, 0);
    const mode =
      session.mode === 'Multiplayer' ? modes.multiplayer : modes.other;
    mode.sessions += 1;
    mode.laps += ownLaps;
    if (time > 0) {
      const key = monthKey(time);
      const month = months.get(key) ?? { month: key, laps: 0, sessions: 0 };
      month.sessions += 1;
      month.laps += ownLaps;
      months.set(key, month);
    }

    const venue = session.trackVenue || session.trackCourse;
    const course = session.trackCourse || venue;
    const layoutKey = `${venue}\u0000${course}`;
    const layout = layouts.get(layoutKey) ?? {
      venue,
      course,
      laps: 0,
      sessions: 0,
    };
    layout.sessions += 1;
    layouts.set(layoutKey, layout);

    const carsInSession = new Set<string>();
    for (const entry of own) {
      totalLaps += entry.lapCount;
      layout.laps += entry.lapCount;
      distanceKm += (entry.lapCount * (session.trackLength ?? 0)) / 1000;

      const carKey = `${entry.carClass}\u0000${entry.carType}`;
      const car = cars.get(carKey) ?? {
        carClass: entry.carClass,
        carType: entry.carType,
        laps: 0,
        sessions: 0,
      };
      car.laps += entry.lapCount;
      if (!carsInSession.has(carKey)) car.sessions += 1;
      carsInSession.add(carKey);
      cars.set(carKey, car);
    }

    if (session.type === 'race' && own.some((e) => e.lapCount > 0)) {
      races += 1;
      const mine = own.find((e) => e.lapCount > 0) ?? own[0]!;
      const positions = own
        .map((e) => e.classPosition)
        .filter((p): p is number => p !== null);
      const best = positions.length > 0 ? Math.min(...positions) : null;
      if (best === 1) wins += 1;
      if (best !== null && best <= 3) podiums += 1;
      if (mine.finishStatus === 'DNF' || mine.finishStatus === 'DQ') dnfs += 1;
      raceList.push({
        sessionId: session.id,
        venue,
        course,
        carClass: mine.carClass,
        carType: mine.carType,
        time,
        position: mine.classPosition,
        grid: mine.classGridPosition,
        status: mine.finishStatus,
      });
    }
  }

  // Which car holds the fastest lap of its class, layout by layout, and when.
  const bests = new Map<string, Map<string, number>>();
  const classLayouts = new Map<string, number>();
  const ages: RecordAge[] = [];
  for (const track of tracks) {
    for (const c of track.classes) {
      const top = c.records[0];
      const winner = top?.carType ?? '';
      const perCar = bests.get(c.carClass) ?? new Map<string, number>();
      perCar.set(winner, (perCar.get(winner) ?? 0) + 1);
      bests.set(c.carClass, perCar);
      classLayouts.set(c.carClass, (classLayouts.get(c.carClass) ?? 0) + 1);
      if (top) {
        ages.push({
          venue: track.venue,
          course: track.course,
          carClass: c.carClass,
          carType: top.carType,
          lap: top.lap,
          time: top.time,
        });
      }
    }
  }

  const classNames = new Set([
    ...bests.keys(),
    ...[...cars.values()].map((c) => c.carClass),
  ]);
  const classes = [...classNames]
    .map((carClass): ClassOverview => {
      const shares = new Map<string, CarShare>();
      for (const [carType, n] of bests.get(carClass) ?? []) {
        shares.set(carType, { carType, bests: n, laps: 0, sessions: 0 });
      }
      for (const car of cars.values()) {
        if (car.carClass !== carClass) continue;
        const share = shares.get(car.carType) ?? {
          carType: car.carType,
          bests: 0,
          laps: 0,
          sessions: 0,
        };
        share.laps = car.laps;
        share.sessions = car.sessions;
        shares.set(car.carType, share);
      }
      const list = [...shares.values()].sort(
        (a, b) =>
          b.bests - a.bests ||
          b.laps - a.laps ||
          a.carType.localeCompare(b.carType),
      );
      return {
        carClass,
        layouts: classLayouts.get(carClass) ?? 0,
        totalLaps: list.reduce((sum, c) => sum + c.laps, 0),
        cars: list,
      };
    })
    .sort(
      (a, b) =>
        b.totalLaps - a.totalLaps || a.carClass.localeCompare(b.carClass),
    );

  raceList.sort((a, b) => b.time - a.time);
  const recent = raceList.slice(0, RECENT_RACES);

  return {
    sessionCount,
    totalLaps,
    distanceKm,
    layoutCount: layouts.size,
    races,
    wins,
    podiums,
    classes,
    topTracks: [...layouts.values()]
      .sort((a, b) => b.laps - a.laps || a.course.localeCompare(b.course))
      .slice(0, TOP_TRACKS),
    modes,
    activity: [...months.values()].sort((a, b) =>
      a.month.localeCompare(b.month),
    ),
    form: {
      races,
      dnfs,
      recent,
      averageFinish: average(
        recent.map((r) => r.position).filter((p): p is number => p !== null),
      ),
      averageGain: average(
        recent
          .filter((r) => r.position !== null && r.grid !== null)
          .map((r) => (r.grid as number) - (r.position as number)),
      ),
    },
    newestRecords: [...ages]
      .sort((a, b) => b.time - a.time)
      .slice(0, RECORD_LIST),
    oldestRecords: [...ages]
      .sort((a, b) => a.time - b.time)
      .slice(0, RECORD_LIST),
    recentRecordCount: ages.filter((r) => r.time >= now - RECENT_DAYS * DAY_MS)
      .length,
    rivals: buildRivals(sessions, aliases),
  };
}
