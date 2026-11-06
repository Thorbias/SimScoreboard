import { normalizeName } from '../library/names';
import { compileFormula, FormulaError, type FormulaValues } from './formula';
import type { Correction, League, LeagueRace, RaceResult } from './types';

/** What one person scored in one race. */
export interface RaceCell {
  points: number;
  /** Position in the class after corrections; null for a disqualification. */
  position: number | null;
  /** True when a correction changed this result. */
  corrected: boolean;
  disqualified: boolean;
  /** The race does not count for this person; shown as X, scores nothing. */
  dropped: boolean;
}

export interface StandingsRow {
  key: string;
  name: string;
  /** One cell per race of the league, null where the person did not start. */
  cells: (RaceCell | null)[];
  total: number;
  wins: number;
}

export interface ClassStandings {
  carClass: string;
  rows: StandingsRow[];
}

export interface Standings {
  /** Message of a formula error; the tables are empty then. */
  error: string | null;
  /**
   * A race with a single starter in a class, where the formula divides by
   * zero. The race does not count as valid; the tables are empty then.
   */
  singleStarter: { race: string; carClass: string } | null;
  classes: ClassStandings[];
}

/** Maps every name of the game to the key of the person it belongs to. */
function personIndex(league: League) {
  const display = new Map<string, string>();
  const keyOfName = new Map<string, string>();
  for (const person of league.people) {
    const key = normalizeName(person.name);
    if (!key) continue;
    display.set(key, person.name);
    keyOfName.set(key, key);
    for (const alias of person.aliases) {
      const aliasKey = normalizeName(alias);
      if (aliasKey) keyOfName.set(aliasKey, key);
    }
  }
  const keyOf = (name: string): string => {
    const own = normalizeName(name);
    const key = keyOfName.get(own) ?? own;
    if (!display.has(key)) display.set(key, name.replace(/#.*$/, '').trim());
    return key;
  };
  return { keyOf, nameOf: (key: string) => display.get(key) ?? key };
}

interface Ranked {
  result: RaceResult;
  key: string;
  disqualified: boolean;
}

function baseOrder(results: Ranked[]): Ranked[] {
  const rank = (r: RaceResult) => r.classPosition ?? r.position ?? Infinity;
  return results
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) => rank(a.item.result) - rank(b.item.result) || a.index - b.index,
    )
    .map(({ item }) => item);
}

function rankRace(
  race: LeagueRace,
  carClass: string,
  corrections: Correction[],
  keyOf: (name: string) => string,
): { order: Ranked[]; disqualified: Ranked[]; changed: Set<string> } {
  const changed = new Set<string>();
  const dsqKeys = new Set(
    corrections
      .filter((c) => c.kind === 'disqualify')
      .map((c) => normalizeName(c.driver)),
  );
  const all: Ranked[] = race.results
    .filter((r) => r.carClass === carClass && r.driverName.trim() !== '')
    .map((result) => {
      const key = keyOf(result.driverName);
      return {
        result,
        key,
        disqualified: result.finishStatus === 'DQ' || dsqKeys.has(key),
      };
    });
  for (const item of all) if (dsqKeys.has(item.key)) changed.add(item.key);

  const disqualified = all.filter((r) => r.disqualified);
  let order = baseOrder(all.filter((r) => !r.disqualified));

  const penalties = new Map<string, number>();
  for (const c of corrections) {
    if (c.kind !== 'timePenalty') continue;
    const key = normalizeName(c.driver);
    penalties.set(key, (penalties.get(key) ?? 0) + c.value);
    changed.add(key);
  }
  if (penalties.size > 0) {
    const finished = order.filter((r) => r.result.finishTime !== null);
    const rest = order.filter((r) => r.result.finishTime === null);
    finished.sort(
      (a, b) =>
        b.result.laps - a.result.laps ||
        (a.result.finishTime as number) +
          (penalties.get(a.key) ?? 0) -
          ((b.result.finishTime as number) + (penalties.get(b.key) ?? 0)),
    );
    order = [...finished, ...rest];
  }

  for (const c of corrections) {
    if (c.kind !== 'position') continue;
    const key = normalizeName(c.driver);
    const from = order.findIndex((r) => r.key === key);
    if (from === -1) continue;
    const [moved] = order.splice(from, 1);
    order.splice(
      Math.max(0, Math.min(order.length, c.value - 1)),
      0,
      moved as Ranked,
    );
    changed.add(key);
  }
  return { order, disqualified, changed };
}

/** Thrown inside the calculation when the formula cannot rate a lone starter. */
class SingleStarterError extends Error {
  constructor(
    readonly race: string,
    readonly carClass: string,
  ) {
    super('Single starter');
  }
}

/** Calculates the standings of a league (ADR-0007). */
export function computeStandings(league: League): Standings {
  let formula;
  try {
    formula = compileFormula(league.formula);
  } catch (error) {
    if (error instanceof FormulaError) {
      return { error: error.message, singleStarter: null, classes: [] };
    }
    throw error;
  }

  const { keyOf, nameOf } = personIndex(league);
  const classNames = [
    ...new Set(league.races.flatMap((r) => r.results.map((x) => x.carClass))),
  ].sort((a, b) => a.localeCompare(b));

  try {
    const classes = classNames.map((carClass): ClassStandings => {
      const rows = new Map<string, StandingsRow>();
      const rowOf = (key: string) => {
        let row = rows.get(key);
        if (!row) {
          row = {
            key,
            name: nameOf(key),
            cells: league.races.map(() => null),
            total: 0,
            wins: 0,
          };
          rows.set(key, row);
        }
        return row;
      };

      league.races.forEach((race, raceIndex) => {
        const here = league.corrections
          .filter((c) => c.raceId === race.id)
          .map((c) => ({ ...c, driver: keyOf(c.driver) }));
        const { order, disqualified, changed } = rankRace(
          race,
          carClass,
          here,
          keyOf,
        );
        const starters = order.length + disqualified.length;
        const bests = [...order, ...disqualified]
          .map((r) => r.result.bestLap)
          .filter((v): v is number => v !== null);
        const fastest = bests.length > 0 ? Math.min(...bests) : null;
        const leaderLaps = order[0]?.result.laps ?? 0;

        const add = (item: Ranked, position: number | null) => {
          const row = rowOf(item.key);
          const bonus = here
            .filter((c) => c.kind === 'points' && c.driver === item.key)
            .reduce((sum, c) => sum + c.value, 0);
          const dropped = here.some(
            (c) => c.kind === 'drop' && c.driver === item.key,
          );
          let points = bonus;
          if (position !== null) {
            const values: FormulaValues = {
              position,
              overallPosition: item.result.position ?? 0,
              starters,
              fastestLap:
                fastest !== null && item.result.bestLap === fastest ? 1 : 0,
              pole: item.result.classGridPosition === 1 ? 1 : 0,
              finished:
                item.result.finishStatus === 'Finished Normally' ? 1 : 0,
              laps: item.result.laps,
              leaderLaps,
            };
            try {
              points += formula(values);
            } catch (error) {
              // A formula like `(starters - 1)` in a divisor cannot rate a
              // class with one starter: say so instead of "division by zero".
              if (
                error instanceof FormulaError &&
                error.message === 'Division by zero' &&
                starters < 2
              ) {
                throw new SingleStarterError(race.name, carClass);
              }
              throw error;
            }
          }
          // The factor of the race counts for the whole result. A dropped race
          // scores nothing, whatever the formula and the corrections say.
          points = dropped ? 0 : points * (race.factor ?? 1);
          const known = row.cells[raceIndex];
          row.cells[raceIndex] = {
            points: (known?.points ?? 0) + points,
            position: known?.position ?? position,
            corrected:
              (known?.corrected ?? false) ||
              changed.has(item.key) ||
              bonus !== 0 ||
              dropped,
            disqualified: (known?.disqualified ?? false) || position === null,
            dropped: (known?.dropped ?? false) || dropped,
          };
          row.total += points;
          if (position === 1 && !dropped) row.wins += 1;
        };
        order.forEach((item, index) => add(item, index + 1));
        disqualified.forEach((item) => add(item, null));
      });

      return {
        carClass,
        rows: [...rows.values()].sort(
          (a, b) =>
            b.total - a.total ||
            b.wins - a.wins ||
            a.name.localeCompare(b.name),
        ),
      };
    });
    return { error: null, singleStarter: null, classes };
  } catch (error) {
    if (error instanceof SingleStarterError) {
      return {
        error: null,
        singleStarter: { race: error.race, carClass: error.carClass },
        classes: [],
      };
    }
    if (error instanceof FormulaError) {
      return { error: error.message, singleStarter: null, classes: [] };
    }
    throw error;
  }
}

/** All driver names that occur in the races, for the alias editor. */
export function raceDriverNames(league: League): string[] {
  const seen = new Map<string, string>();
  for (const race of league.races) {
    for (const r of race.results) {
      const key = normalizeName(r.driverName);
      if (key && !seen.has(key))
        seen.set(key, r.driverName.replace(/#.*$/, '').trim());
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
