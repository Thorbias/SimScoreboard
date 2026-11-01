import type { Entry, Session } from './types';

export type Scope = { kind: 'overall' } | { kind: 'class'; carClass: string };

export type Gap =
  | { kind: 'leader' }
  | { kind: 'time'; seconds: number }
  | { kind: 'laps'; laps: number }
  | { kind: 'dnf' }
  | { kind: 'dq' }
  | { kind: 'none' };

export interface RaceRow {
  entry: Entry;
  rank: number;
  gap: Gap;
  /** Compound on the last lap. */
  tyre: string | null;
  fastestInClass: boolean;
}

export interface QualiRow {
  entry: Entry;
  rank: number;
  /** Best single sector times over all laps of the entry. */
  sectors: [number | null, number | null, number | null];
  /** Gap to the fastest time in the scope; null without a time. */
  gap: number | null;
  /** Which sectors are the fastest of the entry's class. */
  fastestSectors: [boolean, boolean, boolean];
  fastestInClass: boolean;
  /** Compound on the best lap, falling back to the last lap. */
  tyre: string | null;
}

export function classesOf(session: Session): string[] {
  return [...new Set(session.entries.map((e) => e.carClass).filter(Boolean))];
}

function inScope(entries: Entry[], scope: Scope): Entry[] {
  return scope.kind === 'overall'
    ? entries
    : entries.filter((e) => e.carClass === scope.carClass);
}

function positionIn(entry: Entry, scope: Scope): number | null {
  return scope.kind === 'overall' ? entry.position : entry.classPosition;
}

const byPosition = (scope: Scope) => (a: Entry, b: Entry) =>
  (positionIn(a, scope) ?? Infinity) - (positionIn(b, scope) ?? Infinity);

function bestLapOfClass(entries: Entry[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const e of entries) {
    if (e.bestLap === null) continue;
    const known = best.get(e.carClass);
    if (known === undefined || e.bestLap < known)
      best.set(e.carClass, e.bestLap);
  }
  return best;
}

function gapOf(entry: Entry, leader: Entry): Gap {
  if (entry.finishStatus === 'DQ') return { kind: 'dq' };
  if (entry.finishStatus === 'DNF') return { kind: 'dnf' };
  if (entry === leader) return { kind: 'leader' };
  const lapsBehind = leader.lapCount - entry.lapCount;
  if (lapsBehind > 0) return { kind: 'laps', laps: lapsBehind };
  if (entry.finishTime !== null && leader.finishTime !== null) {
    return {
      kind: 'time',
      seconds: Math.max(0, entry.finishTime - leader.finishTime),
    };
  }
  return { kind: 'none' };
}

export function raceRows(session: Session, scope: Scope): RaceRow[] {
  const classBest = bestLapOfClass(session.entries);
  const entries = [...inScope(session.entries, scope)].sort(byPosition(scope));
  const leader = entries[0];
  return entries.map((entry, index) => ({
    entry,
    rank: positionIn(entry, scope) ?? index + 1,
    gap: leader ? gapOf(entry, leader) : { kind: 'none' },
    tyre: entry.laps.at(-1)?.compound ?? null,
    fastestInClass:
      entry.bestLap !== null && entry.bestLap === classBest.get(entry.carClass),
  }));
}

function bestSectors(entry: Entry): QualiRow['sectors'] {
  const best: QualiRow['sectors'] = [null, null, null];
  for (const lap of entry.laps) {
    for (const i of [0, 1, 2] as const) {
      const time = lap.sectors[i];
      const current = best[i];
      if (time !== null && (current === null || time < current)) {
        best[i] = time;
      }
    }
  }
  return best;
}

export function qualiRows(session: Session, scope: Scope): QualiRow[] {
  const classBest = bestLapOfClass(session.entries);
  const sectorsOf = new Map(session.entries.map((e) => [e, bestSectors(e)]));
  const classSectorBest = new Map<string, QualiRow['sectors']>();
  for (const e of session.entries) {
    const own = sectorsOf.get(e) as QualiRow['sectors'];
    const known = classSectorBest.get(e.carClass) ?? [null, null, null];
    classSectorBest.set(
      e.carClass,
      known.map((k, i) => {
        const v = own[i] ?? null;
        return k === null || (v !== null && v < k) ? v : k;
      }) as QualiRow['sectors'],
    );
  }

  const scoped = inScope(session.entries, scope);
  const timed = scoped.filter((e) => e.bestLap !== null);
  const untimed = scoped.filter((e) => e.bestLap === null);
  timed.sort((a, b) => (a.bestLap as number) - (b.bestLap as number));
  untimed.sort(byPosition(scope));
  const ordered = [...timed, ...untimed];
  const pole = timed[0]?.bestLap ?? null;

  return ordered.map((entry, index) => {
    const sectors = sectorsOf.get(entry) as QualiRow['sectors'];
    const best = classSectorBest.get(entry.carClass) ?? [null, null, null];
    const isBest = (i: 0 | 1 | 2) =>
      sectors[i] !== null && sectors[i] === best[i];
    return {
      entry,
      rank: index + 1,
      sectors,
      gap:
        entry.bestLap !== null && pole !== null ? entry.bestLap - pole : null,
      fastestSectors: [isBest(0), isBest(1), isBest(2)],
      fastestInClass:
        entry.bestLap !== null &&
        entry.bestLap === classBest.get(entry.carClass),
      tyre:
        entry.laps.find((l) => l.time !== null && l.time === entry.bestLap)
          ?.compound ??
        entry.laps.at(-1)?.compound ??
        null,
    };
  });
}
