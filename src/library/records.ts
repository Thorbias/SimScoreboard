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
