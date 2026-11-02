import type { SessionSummary, SessionType } from '../results/types';
import { sessionTime } from './filters';
import { isOwnDriver } from './names';

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

export interface ClassRecords {
  carClass: string;
  /** Fastest own lap in this class on this layout. */
  best: number;
  /** One record per car, fastest first. */
  records: LapRecord[];
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
    }
  }

  return [...tracks.values()]
    .map((t): TrackRecords => ({
      venue: t.venue,
      course: t.course,
      classes: [...t.classes.entries()]
        .map(([carClass, cars]): ClassRecords => {
          const records = [...cars.values()].sort((a, b) => a.lap - b.lap);
          return { carClass, best: records[0]?.lap ?? 0, records };
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
  topTracks: {
    venue: string;
    course: string;
    laps: number;
    sessions: number;
  }[];
}

const TOP_TRACKS = 5;

/**
 * Totals over all sessions of the own driver: which cars set the best times per
 * class, how much was driven, and how the races went. `tracks` can be passed in
 * when the records were built already.
 */
export function buildOverview(
  sessions: readonly SessionSummary[],
  aliases: readonly string[],
  tracks: readonly TrackRecords[] = buildRecords(sessions, aliases),
): Overview {
  let sessionCount = 0;
  let totalLaps = 0;
  let distanceKm = 0;
  let races = 0;
  let wins = 0;
  let podiums = 0;
  const layouts = new Map<
    string,
    { venue: string; course: string; laps: number; sessions: number }
  >();
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
      const positions = own
        .map((e) => e.classPosition)
        .filter((p): p is number => p !== null);
      const best = positions.length > 0 ? Math.min(...positions) : null;
      if (best === 1) wins += 1;
      if (best !== null && best <= 3) podiums += 1;
    }
  }

  // Which car holds the fastest lap of its class, layout by layout.
  const bests = new Map<string, Map<string, number>>();
  const classLayouts = new Map<string, number>();
  for (const track of tracks) {
    for (const c of track.classes) {
      const winner = c.records[0]?.carType ?? '';
      const perCar = bests.get(c.carClass) ?? new Map<string, number>();
      perCar.set(winner, (perCar.get(winner) ?? 0) + 1);
      bests.set(c.carClass, perCar);
      classLayouts.set(c.carClass, (classLayouts.get(c.carClass) ?? 0) + 1);
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
  };
}
