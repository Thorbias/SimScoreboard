/**
 * The league file (ADR-0007): one JSON file with a snapshot of the results of
 * every race, the driver aliases, the corrections and the points formula. The
 * standings are calculated when the file is opened and never stored.
 */

export const LEAGUE_FORMAT = 'simscoreboard-league';
/**
 * Version 2 adds the race factor and the correction "drop". A file of version 2
 * is refused by an app that only knows version 1, which would otherwise show
 * wrong points without a hint.
 */
export const LEAGUE_VERSION = 2;

/** The facts of one driver in one race; what the standings need and no more. */
export interface RaceResult {
  driverName: string;
  carClass: string;
  carNumber: string;
  /** Overall position in the game's result, null when missing. */
  position: number | null;
  /** Position in the class in the game's result, null when missing. */
  classPosition: number | null;
  /** Starting position within the class; the pole sitter has 1. */
  classGridPosition: number | null;
  /** Completed laps. */
  laps: number;
  /** `Finished Normally`, `DNF`, `DQ`, or whatever the game writes. */
  finishStatus: string;
  /** Total time in seconds, null without one. */
  finishTime: number | null;
  /** Best lap in seconds, null without a timed lap. */
  bestLap: number | null;
}

export interface LeagueRace {
  id: string;
  name: string;
  /** The result file the snapshot was taken from. */
  sessionId: string;
  /** Epoch ms of the session, null when unknown. */
  date: number | null;
  track: string;
  results: RaceResult[];
  /**
   * Whole number the points of the race are multiplied by, e.g. 2 for a long
   * race. Missing means 1. It counts for the whole result: the points of the
   * formula and those added or removed by a correction.
   */
  factor?: number;
  /** Epoch ms the session started; missing in leagues from before it was kept. */
  started?: number;
}

export type CorrectionKind =
  'timePenalty' | 'disqualify' | 'position' | 'points' | 'drop';

export interface Correction {
  id: string;
  raceId: string;
  /** The person (see `LeaguePerson`) the correction applies to. */
  driver: string;
  kind: CorrectionKind;
  /** Seconds, the new position or the points to add; unused for `disqualify` and `drop`. */
  value: number;
  reason: string;
}

/** Several names of the game that belong to one person. */
export interface LeaguePerson {
  name: string;
  aliases: string[];
}

export interface League {
  format: typeof LEAGUE_FORMAT;
  version: number;
  /** Reserved for a later signature (IDEA-0003); always null in version 1. */
  signature: null;
  id: string;
  name: string;
  /** The points formula, see `formula.ts`. */
  formula: string;
  races: LeagueRace[];
  people: LeaguePerson[];
  corrections: Correction[];
}

export const DEFAULT_FORMULA =
  'floor(40 * (1 - (position - 1) / (starters - 1))) + 10';
