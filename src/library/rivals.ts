import type { SessionSummary } from '../results/types';
import { isOwnDriver, normalizeName } from './names';

/** A driver the own driver meets again and again, with how often. */
export interface DriverCount {
  name: string;
  count: number;
}

/** Only drivers met at least this often are listed. */
export const MIN_MEETINGS = 2;
/** How many drivers each list shows. */
const TOP = 10;
/** Both drivers report one contact; reports this close count as one. */
const SAME_CONTACT_SECONDS = 1;

/** The name as shown: without the online suffix (`Name#14`). */
function displayName(name: string): string {
  const hash = name.indexOf('#');
  return (hash === -1 ? name : name.slice(0, hash)).trim();
}

/** Sorts by count, then by name, and keeps those met often enough. */
function ranked(counts: Map<string, DriverCount>): DriverCount[] {
  return [...counts.values()]
    .filter((d) => d.count >= MIN_MEETINGS)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP);
}

function bump(
  counts: Map<string, DriverCount>,
  name: string,
  by: number,
): void {
  const key = normalizeName(name);
  if (!key) return;
  const known = counts.get(key);
  if (known) known.count += by;
  else counts.set(key, { name: displayName(name), count: by });
}

/**
 * With whom the own driver raced most often, and with whom the own car touched
 * most often. Drivers appear only from two races (or two collisions) on.
 *
 * Only online sessions count; against the computer there is nobody to meet
 * again. A race counts when the own driver completed a lap in it; another
 * driver counts when they completed a lap too. A collision is a contact
 * between the own driver and another driver in any online session; the two
 * reports of one contact count once.
 */
export function buildRivals(
  sessions: readonly SessionSummary[],
  aliases: readonly string[],
): { sharedRaces: DriverCount[]; collisions: DriverCount[] } {
  const shared = new Map<string, DriverCount>();
  const collisions = new Map<string, DriverCount>();

  for (const session of sessions) {
    if (session.mode !== 'Multiplayer') continue;
    const own = session.entries.filter((e) =>
      isOwnDriver(e.driverName, aliases),
    );
    if (own.length === 0) continue;

    if (session.type === 'race' && own.some((e) => e.lapCount > 0)) {
      const met = new Map<string, string>();
      for (const e of session.entries) {
        if (e.lapCount <= 0 || isOwnDriver(e.driverName, aliases)) continue;
        met.set(normalizeName(e.driverName), e.driverName);
      }
      for (const name of met.values()) bump(shared, name, 1);
    }

    // Reports of contacts with the own driver, per other driver, by time.
    const times = new Map<string, { name: string; times: number[] }>();
    for (const c of session.contacts ?? []) {
      const ownIsDriver = isOwnDriver(c.driver, aliases);
      const ownIsOther = isOwnDriver(c.other, aliases);
      if (ownIsDriver === ownIsOther) continue;
      const name = ownIsDriver ? c.other : c.driver;
      const key = normalizeName(name);
      if (!key) continue;
      const entry = times.get(key) ?? { name, times: [] };
      // A report without a time cannot be matched with the other one; count it.
      entry.times.push(c.time ?? Number.NEGATIVE_INFINITY);
      times.set(key, entry);
    }
    for (const { name, times: list } of times.values()) {
      list.sort((a, b) => a - b);
      let count = 0;
      let last = Number.NaN;
      for (const t of list) {
        if (!(t - last <= SAME_CONTACT_SECONDS)) count += 1;
        last = t;
      }
      bump(collisions, name, count);
    }
  }

  return { sharedRaces: ranked(shared), collisions: ranked(collisions) };
}
