import { checkFormula } from './formula';
import {
  DEFAULT_FORMULA,
  LEAGUE_FORMAT,
  LEAGUE_VERSION,
  type Correction,
  type League,
  type LeaguePerson,
  type LeagueRace,
  type RaceResult,
} from './types';

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLeague(name: string): League {
  return {
    format: LEAGUE_FORMAT,
    version: LEAGUE_VERSION,
    signature: null,
    id: newId('league'),
    name,
    formula: DEFAULT_FORMULA,
    races: [],
    people: [],
    corrections: [],
  };
}

export function serializeLeague(league: League): string {
  return `${JSON.stringify(league, null, 2)}\n`;
}

export class LeagueFileError extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, what: string): string => {
  if (typeof v !== 'string') throw new LeagueFileError(`${what} is missing`);
  return v;
};
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const list = (v: unknown, what: string): unknown[] => {
  if (!Array.isArray(v)) throw new LeagueFileError(`${what} is missing`);
  return v;
};

function readResult(raw: unknown): RaceResult {
  if (!isObject(raw)) throw new LeagueFileError('A result is malformed');
  return {
    driverName: str(raw.driverName, 'driverName'),
    carClass: str(raw.carClass, 'carClass'),
    carNumber: typeof raw.carNumber === 'string' ? raw.carNumber : '',
    position: num(raw.position),
    classPosition: num(raw.classPosition),
    classGridPosition: num(raw.classGridPosition),
    laps: num(raw.laps) ?? 0,
    finishStatus: typeof raw.finishStatus === 'string' ? raw.finishStatus : '',
    finishTime: num(raw.finishTime),
    bestLap: num(raw.bestLap),
  };
}

function readRace(raw: unknown): LeagueRace {
  if (!isObject(raw)) throw new LeagueFileError('A race is malformed');
  return {
    id: str(raw.id, 'race id'),
    name: str(raw.name, 'race name'),
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : '',
    date: num(raw.date),
    track: typeof raw.track === 'string' ? raw.track : '',
    results: list(raw.results, 'results').map(readResult),
  };
}

function readCorrection(raw: unknown): Correction {
  if (!isObject(raw)) throw new LeagueFileError('A correction is malformed');
  const kind = raw.kind;
  if (
    kind !== 'timePenalty' &&
    kind !== 'disqualify' &&
    kind !== 'position' &&
    kind !== 'points'
  ) {
    throw new LeagueFileError('A correction has an unknown kind');
  }
  return {
    id: str(raw.id, 'correction id'),
    raceId: str(raw.raceId, 'raceId'),
    driver: str(raw.driver, 'driver'),
    kind,
    value: num(raw.value) ?? 0,
    reason: typeof raw.reason === 'string' ? raw.reason : '',
  };
}

function readPerson(raw: unknown): LeaguePerson {
  if (!isObject(raw)) throw new LeagueFileError('A person is malformed');
  return {
    name: str(raw.name, 'person name'),
    aliases: list(raw.aliases, 'aliases').filter(
      (a): a is string => typeof a === 'string',
    ),
  };
}

/**
 * Reads a league file. Throws a `LeagueFileError` with a short reason when the
 * text is not a league of a version this app understands.
 */
export function parseLeague(text: string): League {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new LeagueFileError('The file is not valid JSON');
  }
  if (!isObject(raw) || raw.format !== LEAGUE_FORMAT) {
    throw new LeagueFileError('The file is not a SimScoreboard league');
  }
  const version = num(raw.version);
  if (version === null || version > LEAGUE_VERSION) {
    throw new LeagueFileError('The file is from a newer version of the app');
  }
  const formula = str(raw.formula, 'formula');
  // A broken formula is not a broken file: it is shown as an error in the app.
  void checkFormula(formula);
  return {
    format: LEAGUE_FORMAT,
    version: LEAGUE_VERSION,
    signature: null,
    id: str(raw.id, 'id'),
    name: str(raw.name, 'name'),
    formula,
    races: list(raw.races, 'races').map(readRace),
    people: list(raw.people, 'people').map(readPerson),
    corrections: list(raw.corrections, 'corrections').map(readCorrection),
  };
}
