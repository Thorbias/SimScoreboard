import { entryKey } from './analysis';
import type { Entry, Lap } from './types';

/** The lap chart compares up to four drivers, called A to D. */
export const MAX_LAP_DRIVERS = 4;

/**
 * Adds a driver to the selection, filling the slots one after another (A, B, C,
 * D). When all four are taken, D is replaced. A driver who is already selected
 * stays where they are.
 */
export function addLapDriver(
  current: readonly string[],
  key: string,
): string[] {
  if (current.includes(key)) return [...current];
  if (current.length < MAX_LAP_DRIVERS) return [...current, key];
  return [...current.slice(0, MAX_LAP_DRIVERS - 1), key];
}

/** Removes the driver in a slot; the drivers behind move up (C becomes B, …). */
export function removeLapDriver(
  current: readonly string[],
  index: number,
): string[] {
  return current.filter((_, i) => i !== index);
}

/** Puts another driver into a slot. A driver cannot be selected twice. */
export function setLapDriverAt(
  current: readonly string[],
  index: number,
  key: string,
): string[] {
  if (index < 0 || index >= current.length) return [...current];
  if (current.some((k, i) => k === key && i !== index)) return [...current];
  return current.map((k, i) => (i === index ? key : k));
}

function fastestFirst(entries: Entry[]): Entry[] {
  return entries
    .filter((e) => e.bestLap !== null)
    .sort((x, y) => (x.bestLap as number) - (y.bestLap as number));
}

/**
 * A driver to offer for an empty slot: the fastest one not yet selected,
 * preferably from the class of the first selected driver.
 */
export function suggestLapDriver(
  choices: Entry[],
  selected: readonly string[],
): string | null {
  const taken = new Set(selected);
  const free = choices.filter((e) => !taken.has(entryKey(e)));
  const first = choices.find((e) => entryKey(e) === selected[0]);
  const sameClass = free.filter((e) => e.carClass === first?.carClass);
  const pick =
    fastestFirst(sameClass)[0] ?? fastestFirst(free)[0] ?? free[0] ?? null;
  return pick ? entryKey(pick) : null;
}

/**
 * What the lap chart shows before anything was chosen: the own driver (or the
 * first entry) against the fastest rival.
 */
export function defaultLapDrivers(
  choices: Entry[],
  isOwn: (entry: Entry) => boolean,
): string[] {
  const a = choices.find(isOwn) ?? choices[0];
  if (!a) return [];
  const b = suggestLapDriver(choices, [entryKey(a)]);
  return b ? [entryKey(a), b] : [entryKey(a)];
}

export interface MultiLapRow {
  lap: number;
  /** One lap per selected driver, undefined where the driver has no such lap. */
  laps: (Lap | undefined)[];
  /**
   * Time of each driver minus the time of the first one. The first entry is
   * null, as is any entry where one of the two times is missing.
   */
  deltas: (number | null)[];
}

/** Lines up the laps of the given drivers, lap by lap. */
export function compareLapsMulti(entries: readonly Entry[]): MultiLapRow[] {
  const byNum = entries.map((e) => new Map(e.laps.map((l) => [l.num, l])));
  const nums = [...new Set(byNum.flatMap((m) => [...m.keys()]))].sort(
    (x, y) => x - y,
  );
  return nums.map((lap) => {
    const laps = byNum.map((m) => m.get(lap));
    const base = laps[0]?.time ?? null;
    return {
      lap,
      laps,
      deltas: laps.map((l, i) =>
        i === 0 || base === null || l?.time == null ? null : l.time - base,
      ),
    };
  });
}
