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

export interface LayoutRecords {
  course: string;
  classes: ClassRecords[];
}

export interface VenueRecords {
  venue: string;
  layouts: LayoutRecords[];
  sessionCount: number;
  totalLaps: number;
  cars: string[];
  bestQualifying: LapRecord | null;
  bestRace: LapRecord | null;
  /** Fastest own lap per class over all layouts of the venue. */
  bestByClass: { carClass: string; best: number }[];
  lastDriven: number;
}

function faster(a: LapRecord | null, b: LapRecord): LapRecord {
  return a && a.lap <= b.lap ? a : b;
}

/**
 * The own driver's best laps, grouped by venue, layout, class and car. Laps on
 * different layouts are never compared. Only sessions in which one of the
 * aliases took part count.
 */
export function buildRecords(
  sessions: readonly SessionSummary[],
  aliases: readonly string[],
): VenueRecords[] {
  interface Venue {
    venue: string;
    sessionCount: number;
    totalLaps: number;
    cars: Set<string>;
    bestQualifying: LapRecord | null;
    bestRace: LapRecord | null;
    lastDriven: number;
    // course -> class -> car -> record
    layouts: Map<string, Map<string, Map<string, LapRecord>>>;
  }
  const venues = new Map<string, Venue>();

  for (const session of sessions) {
    const own = session.entries.filter((e) =>
      isOwnDriver(e.driverName, aliases),
    );
    if (own.length === 0) continue;

    const key = session.trackVenue || session.trackCourse;
    let venue = venues.get(key);
    if (!venue) {
      venue = {
        venue: key,
        sessionCount: 0,
        totalLaps: 0,
        cars: new Set(),
        bestQualifying: null,
        bestRace: null,
        lastDriven: 0,
        layouts: new Map(),
      };
      venues.set(key, venue);
    }
    venue.sessionCount += 1;
    venue.lastDriven = Math.max(venue.lastDriven, sessionTime(session));

    for (const entry of own) {
      venue.totalLaps += entry.lapCount;
      if (entry.carType) venue.cars.add(entry.carType);
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
        venue.bestQualifying = faster(venue.bestQualifying, record);
      }
      if (session.type === 'race') {
        venue.bestRace = faster(venue.bestRace, record);
      }

      const course = session.trackCourse || key;
      const classes = venue.layouts.get(course) ?? new Map();
      const cars = classes.get(entry.carClass) ?? new Map();
      cars.set(entry.carType, faster(cars.get(entry.carType) ?? null, record));
      classes.set(entry.carClass, cars);
      venue.layouts.set(course, classes);
    }
  }

  return [...venues.values()]
    .map((v): VenueRecords => {
      const layouts = [...v.layouts.entries()]
        .map(([course, classes]): LayoutRecords => ({
          course,
          classes: [...classes.entries()]
            .map(([carClass, cars]): ClassRecords => {
              const records = [...cars.values()].sort((a, b) => a.lap - b.lap);
              return { carClass, best: records[0]?.lap ?? 0, records };
            })
            .sort((a, b) => a.carClass.localeCompare(b.carClass)),
        }))
        .sort((a, b) => a.course.localeCompare(b.course));

      const bestByClass = new Map<string, number>();
      for (const layout of layouts) {
        for (const c of layout.classes) {
          const known = bestByClass.get(c.carClass);
          if (known === undefined || c.best < known) {
            bestByClass.set(c.carClass, c.best);
          }
        }
      }
      return {
        venue: v.venue,
        layouts,
        sessionCount: v.sessionCount,
        totalLaps: v.totalLaps,
        cars: [...v.cars].sort((a, b) => a.localeCompare(b)),
        bestQualifying: v.bestQualifying,
        bestRace: v.bestRace,
        bestByClass: [...bestByClass.entries()]
          .map(([carClass, best]) => ({ carClass, best }))
          .sort((a, b) => a.carClass.localeCompare(b.carClass)),
        lastDriven: v.lastDriven,
      };
    })
    .sort((a, b) => b.lastDriven - a.lastDriven);
}
