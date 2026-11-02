import type { Entry, Session } from './types';

/** The lap a driver was on at a session time (seconds). */
export function lapAt(entry: Entry, time: number): number | null {
  if (entry.laps.length === 0) return null;
  const lap = entry.laps.find((l) => l.endTime !== null && l.endTime >= time);
  return lap ? lap.num : (entry.laps.at(-1)?.num ?? 0) + 1;
}

export function findEntry(session: Session, name: string): Entry | undefined {
  return session.entries.find((e) => e.driverName === name);
}

// ---------------------------------------------------------------- lap chart

/** Identifies an entry within a session. */
export function entryKey(e: Entry): string {
  return `${e.carNumber}|${e.driverName}`;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

// ----------------------------------------------------------- position chart

export interface PositionPoint {
  /** 0 is the grid, 1..n are laps, n+1 is the finish. */
  x: number;
  y: number;
}

export interface PositionSeries {
  entry: Entry;
  points: PositionPoint[];
}

export interface PositionChartData {
  series: PositionSeries[];
  /** Highest lap number with data; the finish is at `laps + 1`. */
  laps: number;
  /** Largest position on the chart. */
  maxPosition: number;
}

/**
 * Position of every entry at the grid, after each lap and at the finish.
 * With `carClass` set, positions are ranks within that class, derived from the
 * overall positions the game records per lap.
 */
export function positionChart(
  session: Session,
  carClass: string | null,
): PositionChartData {
  const entries = session.entries.filter(
    (e) => carClass === null || e.carClass === carClass,
  );
  const laps = Math.max(0, ...entries.flatMap((e) => e.laps.map((l) => l.num)));

  // rank[lap] = entries ordered by overall position at that lap
  const rankAt = (lap: number): Map<Entry, number> => {
    const present = entries
      .map((e) => ({
        e,
        p: e.laps.find((l) => l.num === lap)?.position ?? null,
      }))
      .filter((x): x is { e: Entry; p: number } => x.p !== null)
      .sort((x, y) => x.p - y.p);
    return new Map(
      present.map((x, i) => [x.e, carClass === null ? x.p : i + 1]),
    );
  };

  const perLap = new Map<number, Map<Entry, number>>();
  for (let lap = 1; lap <= laps; lap++) perLap.set(lap, rankAt(lap));

  const series = entries.map((entry): PositionSeries => {
    const points: PositionPoint[] = [];
    const grid =
      carClass === null ? entry.gridPosition : entry.classGridPosition;
    if (grid !== null) points.push({ x: 0, y: grid });
    for (let lap = 1; lap <= laps; lap++) {
      const y = perLap.get(lap)?.get(entry);
      if (y !== undefined) points.push({ x: lap, y });
    }
    const end = carClass === null ? entry.position : entry.classPosition;
    if (end !== null && points.length > 0) points.push({ x: laps + 1, y: end });
    return { entry, points };
  });

  const maxPosition = Math.max(
    1,
    ...series.flatMap((s) => s.points.map((p) => p.y)),
  );
  return { series, laps, maxPosition };
}

// --------------------------------------------------------------- statistics

export interface LapMark {
  entry: Entry;
  lap: number;
  time: number;
}

export interface ClassStats {
  carClass: string;
  fastestLap: LapMark | null;
  fastestSectors: [LapMark | null, LapMark | null, LapMark | null];
  consistent: { entry: Entry; deviation: number; laps: number } | null;
  mostGained: { entry: Entry; places: number } | null;
  mostLost: { entry: Entry; places: number } | null;
  tyre: { compound: string; laps: number } | null;
}

/** Laps slower than this multiple of a driver's best are not counted for consistency. */
const CLEAN_LAP_FACTOR = 1.07;
const MIN_CLEAN_LAPS = 5;

function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
  );
}

function cleanLapTimes(entry: Entry): number[] {
  const times = entry.laps
    .filter((l) => l.time !== null && !l.pit)
    .map((l) => l.time as number);
  if (times.length === 0) return [];
  const best = Math.min(...times);
  return times.filter((t) => t <= best * CLEAN_LAP_FACTOR);
}

export function classStats(session: Session, carClass: string): ClassStats {
  const entries = session.entries.filter((e) => e.carClass === carClass);

  let fastestLap: LapMark | null = null;
  const fastestSectors: ClassStats['fastestSectors'] = [null, null, null];
  const compounds = new Map<string, number>();
  for (const entry of entries) {
    for (const lap of entry.laps) {
      if (lap.time !== null && (!fastestLap || lap.time < fastestLap.time)) {
        fastestLap = { entry, lap: lap.num, time: lap.time };
      }
      for (const i of [0, 1, 2] as const) {
        const t = lap.sectors[i];
        const known = fastestSectors[i];
        if (t !== null && (!known || t < known.time)) {
          fastestSectors[i] = { entry, lap: lap.num, time: t };
        }
      }
      if (lap.compound) {
        compounds.set(lap.compound, (compounds.get(lap.compound) ?? 0) + 1);
      }
    }
  }

  let consistent: ClassStats['consistent'] = null;
  for (const entry of entries) {
    const times = cleanLapTimes(entry);
    if (times.length < MIN_CLEAN_LAPS) continue;
    const deviation = standardDeviation(times);
    if (!consistent || deviation < consistent.deviation) {
      consistent = { entry, deviation, laps: times.length };
    }
  }

  let mostGained: ClassStats['mostGained'] = null;
  let mostLost: ClassStats['mostLost'] = null;
  for (const entry of entries) {
    if (
      entry.classGridPosition === null ||
      entry.classPosition === null ||
      entry.finishStatus === 'DQ'
    ) {
      continue;
    }
    const places = entry.classGridPosition - entry.classPosition;
    if (places > 0 && (!mostGained || places > mostGained.places)) {
      mostGained = { entry, places };
    }
    if (places < 0 && (!mostLost || places < mostLost.places)) {
      mostLost = { entry, places };
    }
  }

  const topCompound = [...compounds.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    carClass,
    fastestLap,
    fastestSectors,
    consistent,
    mostGained,
    mostLost,
    tyre: topCompound
      ? { compound: topCompound[0], laps: topCompound[1] }
      : null,
  };
}
