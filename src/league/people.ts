import { normalizeName } from '../library/names';
import type { LeaguePerson } from './types';

/** The person a game name is merged into, or null when it stands for itself. */
export function mergedInto(
  people: readonly LeaguePerson[],
  name: string,
): string | null {
  const key = normalizeName(name);
  const person = people.find((p) =>
    p.aliases.some((alias) => normalizeName(alias) === key),
  );
  return person ? person.name : null;
}

/**
 * Merges the game name `name` into the person `target`, or releases it when
 * `target` is null. Names that were merged into `name` follow it.
 */
export function mergeInto(
  people: readonly LeaguePerson[],
  name: string,
  target: string | null,
): LeaguePerson[] {
  const key = normalizeName(name);
  let followers: string[] = [];
  const rest: LeaguePerson[] = [];
  for (const person of people) {
    if (normalizeName(person.name) === key) {
      followers = person.aliases;
      continue;
    }
    rest.push({
      name: person.name,
      aliases: person.aliases.filter((a) => normalizeName(a) !== key),
    });
  }
  if (target === null || normalizeName(target) === key) {
    return rest.filter((p) => p.aliases.length > 0);
  }

  const targetName = mergedInto(rest, target) ?? target;
  const targetKey = normalizeName(targetName);
  let host = rest.find((p) => normalizeName(p.name) === targetKey);
  if (!host) {
    host = { name: targetName, aliases: [] };
    rest.push(host);
  }
  for (const alias of [name, ...followers]) {
    const aliasKey = normalizeName(alias);
    if (
      aliasKey !== targetKey &&
      !host.aliases.some((a) => normalizeName(a) === aliasKey)
    ) {
      host.aliases.push(alias);
    }
  }
  return rest.filter((p) => p.aliases.length > 0);
}
