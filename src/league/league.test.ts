import { describe, expect, it } from 'vitest';
import {
  createLeague,
  LeagueFileError,
  leagueFingerprint,
  parseLeague,
  saveState,
  serializeLeague,
} from './file';
import { computeStandings, raceDriverNames } from './standings';
import type { Correction, League, RaceResult } from './types';

function result(
  driverName: string,
  classPosition: number,
  extra: Partial<RaceResult> = {},
): RaceResult {
  return {
    driverName,
    carClass: 'GT3',
    carNumber: String(classPosition),
    position: classPosition,
    classPosition,
    classGridPosition: classPosition,
    laps: 20,
    finishStatus: 'Finished Normally',
    finishTime: 1800 + classPosition * 5,
    bestLap: 90 + classPosition,
    ...extra,
  };
}

function league(): League {
  const l = createLeague('Test League');
  l.formula = '11 - position';
  l.races = [
    {
      id: 'r1',
      name: 'Round 1',
      sessionId: 'a.xml',
      date: null,
      track: 'Spa',
      results: [
        result('Anna Example', 1),
        result('Bert Sample', 2),
        result('Cora Demo', 3),
      ],
    },
    {
      id: 'r2',
      name: 'Round 2',
      sessionId: 'b.xml',
      date: null,
      track: 'Monza',
      results: [
        result('Bert Sample#4711', 1),
        result('Anna Example', 2),
        result('Dora Other', 3),
      ],
    },
  ];
  return l;
}

const correction = (c: Partial<Correction>): Correction => ({
  id: 'c',
  raceId: 'r1',
  driver: 'Anna Example',
  kind: 'points',
  value: 0,
  reason: 'test',
  ...c,
});

const rowOf = (l: League, name: string) =>
  computeStandings(l).classes[0]?.rows.find((r) => r.name === name);

describe('standings', () => {
  it('adds up the points of the races', () => {
    const s = computeStandings(league());
    expect(s.error).toBeNull();
    const rows = s.classes[0]?.rows ?? [];
    // Anna 10 + 9, Bert 9 + 10: equal, Bert has no more wins; name decides.
    expect(rows.map((r) => [r.name, r.total])).toEqual([
      ['Anna Example', 19],
      ['Bert Sample', 19],
      ['Cora Demo', 8],
      ['Dora Other', 8],
    ]);
  });

  it('counts a driver once, with and without the online suffix', () => {
    const row = rowOf(league(), 'Bert Sample');
    expect(row?.cells.map((c) => c?.points)).toEqual([9, 10]);
  });

  it('leaves a cell empty where a person did not start', () => {
    const row = rowOf(league(), 'Cora Demo');
    expect(row?.cells[1]).toBeNull();
  });

  it('gives the fastest lap of the class the bonus', () => {
    const l = league();
    const r1 = l.races[0];
    if (!r1) throw new Error('missing race');
    l.formula = '11 - position + fastestLap';
    (r1.results[2] as RaceResult).bestLap = 80;
    expect(rowOf(l, 'Cora Demo')?.cells[0]?.points).toBe(9);
  });

  it('merges names that belong to one person', () => {
    const l = league();
    l.people = [{ name: 'Dora', aliases: ['Cora Demo', 'Dora Other'] }];
    const row = rowOf(l, 'Dora');
    expect(row?.cells.map((c) => c?.points)).toEqual([8, 8]);
    expect(rowOf(l, 'Cora Demo')).toBeUndefined();
  });

  it('keeps the classes apart', () => {
    const l = league();
    const r1 = l.races[0];
    if (!r1) throw new Error('missing race');
    r1.results.push(
      result('Eva Hyper', 1, { carClass: 'Hypercar', position: 1 }),
    );
    const s = computeStandings(l);
    expect(s.classes.map((c) => c.carClass)).toEqual(['GT3', 'Hypercar']);
    expect(s.classes[1]?.rows[0]).toMatchObject({
      name: 'Eva Hyper',
      total: 10,
    });
  });

  it('reports a formula error instead of calculating', () => {
    const l = league();
    l.formula = '11 - nonsense';
    expect(computeStandings(l)).toEqual({
      error: 'Unknown name "nonsense"',
      classes: [],
    });
  });

  it('lists the driver names once', () => {
    expect(raceDriverNames(league())).toEqual([
      'Anna Example',
      'Bert Sample',
      'Cora Demo',
      'Dora Other',
    ]);
  });
});

describe('corrections', () => {
  it('adds or removes points', () => {
    const l = league();
    l.corrections = [correction({ kind: 'points', value: -3 })];
    const cell = rowOf(l, 'Anna Example')?.cells[0];
    expect(cell).toMatchObject({ points: 7, corrected: true });
  });

  it('disqualifies a driver and moves the others up', () => {
    const l = league();
    l.corrections = [correction({ kind: 'disqualify' })];
    expect(rowOf(l, 'Anna Example')?.cells[0]).toMatchObject({
      points: 0,
      position: null,
      disqualified: true,
      corrected: true,
    });
    expect(rowOf(l, 'Bert Sample')?.cells[0]?.position).toBe(1);
    expect(rowOf(l, 'Cora Demo')?.cells[0]?.position).toBe(2);
  });

  it('reorders the class after a time penalty', () => {
    const l = league();
    l.corrections = [correction({ kind: 'timePenalty', value: 30 })];
    expect(rowOf(l, 'Anna Example')?.cells[0]?.position).toBe(3);
    expect(rowOf(l, 'Bert Sample')?.cells[0]?.position).toBe(1);
  });

  it('puts a driver at a fixed position', () => {
    const l = league();
    l.corrections = [
      correction({ kind: 'position', value: 3, driver: 'Anna Example' }),
    ];
    expect(rowOf(l, 'Anna Example')?.cells[0]?.position).toBe(3);
    expect(rowOf(l, 'Bert Sample')?.cells[0]?.position).toBe(1);
  });

  it('applies a correction to the person behind an alias', () => {
    const l = league();
    l.people = [{ name: 'Bert', aliases: ['Bert Sample'] }];
    l.corrections = [
      correction({ raceId: 'r2', driver: 'Bert', kind: 'points', value: 5 }),
    ];
    expect(rowOf(l, 'Bert')?.cells[1]?.points).toBe(15);
  });

  it('treats a result with status DQ as disqualified', () => {
    const l = league();
    const r1 = l.races[0];
    if (!r1) throw new Error('missing race');
    (r1.results[0] as RaceResult).finishStatus = 'DQ';
    expect(rowOf(l, 'Anna Example')?.cells[0]?.disqualified).toBe(true);
  });
});

describe('league file', () => {
  it('survives a round trip', () => {
    const l = league();
    l.corrections = [correction({ kind: 'timePenalty', value: 5 })];
    expect(parseLeague(serializeLeague(l))).toEqual(l);
  });

  it('refuses foreign or newer files', () => {
    expect(() => parseLeague('nope')).toThrow(LeagueFileError);
    expect(() => parseLeague('{"format":"other"}')).toThrow(
      'not a SimScoreboard league',
    );
    const newer = { ...league(), version: 99 };
    expect(() => parseLeague(JSON.stringify(newer))).toThrow('newer version');
  });

  it('refuses a malformed correction', () => {
    const bad = { ...league(), corrections: [{ id: 'x', kind: 'zap' }] };
    expect(() => parseLeague(JSON.stringify(bad))).toThrow(LeagueFileError);
  });

  it('keeps the signature field empty in version 1', () => {
    expect(createLeague('x').signature).toBeNull();
  });
});

describe('leagueFingerprint and saveState', () => {
  it('stays the same for the same content and changes with it', () => {
    const a = createLeague('Spa Cup');
    expect(leagueFingerprint(a)).toBe(leagueFingerprint({ ...a }));
    expect(leagueFingerprint(a)).not.toBe(
      leagueFingerprint({ ...a, name: 'Spa Cup 2' }),
    );
    expect(leagueFingerprint(a)).not.toBe(
      leagueFingerprint({ ...a, formula: `${a.formula} + 1` }),
    );
  });

  it('tells never saved, changed and saved apart', () => {
    const a = createLeague('Spa Cup');
    expect(saveState(a, undefined)).toBe('never');
    expect(saveState(a, leagueFingerprint(a))).toBe('saved');
    expect(saveState({ ...a, name: 'Other' }, leagueFingerprint(a))).toBe(
      'changed',
    );
  });
});
