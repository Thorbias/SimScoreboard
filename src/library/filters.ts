import type {
  EntrySummary,
  SessionSummary,
  SessionType,
} from '../results/types';
import { isOwnDriver } from './names';

export interface LibraryFilter {
  type: SessionType | 'all';
  track: string;
  carClass: string;
  /** Epoch ms, inclusive. */
  from: number | null;
  /** Epoch ms, inclusive. */
  to: number | null;
  favoritesOnly: boolean;
}

export const NO_FILTER: LibraryFilter = {
  type: 'all',
  track: '',
  carClass: '',
  from: null,
  to: null,
  favoritesOnly: false,
};

/** When a session happened; the file name time is the most reliable. */
export function sessionTime(
  session: Pick<SessionSummary, 'endedAt' | 'startedAt'>,
): number {
  return session.endedAt ?? session.startedAt ?? 0;
}

export function filterSessions(
  sessions: readonly SessionSummary[],
  filter: LibraryFilter,
  favorites: readonly string[] = [],
): SessionSummary[] {
  return sessions.filter((s) => {
    if (filter.favoritesOnly && !favorites.includes(s.id)) return false;
    if (filter.type !== 'all' && s.type !== filter.type) return false;
    if (filter.track && s.trackCourse !== filter.track) return false;
    if (filter.carClass && !s.classes.includes(filter.carClass)) return false;
    const time = sessionTime(s);
    if (filter.from !== null && time < filter.from) return false;
    if (filter.to !== null && time > filter.to) return false;
    return true;
  });
}

export function uniqueTracks(sessions: readonly SessionSummary[]): string[] {
  return [...new Set(sessions.map((s) => s.trackCourse).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function uniqueClasses(sessions: readonly SessionSummary[]): string[] {
  return [...new Set(sessions.flatMap((s) => s.classes))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export interface EventGroup {
  key: string;
  title: string;
  trackCourse: string;
  /** Time of the latest session in the group. */
  time: number;
  /** In the order they were driven. */
  sessions: SessionSummary[];
}

/**
 * Sessions of one event weekend share the track and the event start time in
 * the header. Sessions without that key stand alone. Newest group first.
 */
export function groupByEvent(
  sessions: readonly SessionSummary[],
): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const session of sessions) {
    const key = session.eventKey ?? `single|${session.id}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        title: session.trackEvent || session.trackVenue || session.trackCourse,
        trackCourse: session.trackCourse,
        time: 0,
        sessions: [],
      };
      groups.set(key, group);
    }
    group.sessions.push(session);
    group.time = Math.max(group.time, sessionTime(session));
  }
  for (const group of groups.values()) {
    group.sessions.sort((a, b) => sessionTime(a) - sessionTime(b));
  }
  return [...groups.values()].sort((a, b) => b.time - a.time);
}

export interface OwnResult {
  entry: EntrySummary;
  /** Won the race in the own class. */
  won: boolean;
}

export function ownResult(
  session: SessionSummary,
  aliases: readonly string[],
): OwnResult | null {
  const entry = session.entries.find((e) => isOwnDriver(e.driverName, aliases));
  if (!entry) return null;
  return { entry, won: session.type === 'race' && entry.classPosition === 1 };
}
