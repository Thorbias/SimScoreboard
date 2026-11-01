import type { SessionSummary } from '../results/types';

/**
 * The game has no stable driver ID, and the same driver shows up under
 * slightly different names (an online suffix like `#1234` in older files).
 * Names are therefore compared without the suffix, case-insensitively.
 */
export function normalizeName(name: string): string {
  const hash = name.indexOf('#');
  const base = hash === -1 ? name : name.slice(0, hash);
  return base.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isOwnDriver(name: string, aliases: readonly string[]): boolean {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  return aliases.some((alias) => normalizeName(alias) === normalized);
}

export interface NameSuggestion {
  name: string;
  sessions: number;
}

/** The most frequent driver names across all sessions, as candidates for "me". */
export function suggestNames(
  sessions: readonly SessionSummary[],
  limit = 5,
): NameSuggestion[] {
  const counts = new Map<string, { name: string; sessions: number }>();
  for (const session of sessions) {
    const seen = new Set<string>();
    for (const entry of session.entries) {
      const key = normalizeName(entry.driverName);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const known = counts.get(key);
      if (known) known.sessions += 1;
      else counts.set(key, { name: entry.driverName, sessions: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name))
    .slice(0, limit);
}
