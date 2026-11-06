import { describe, expect, it } from 'vitest';
import { createTranslate } from '../i18n';
import { csvDate, csvFileName, pointsCsv, standingsCsv, toCsv } from './csv';
import { createLeague } from './file';
import { computeStandings } from './standings';
import type { Correction, League, RaceResult } from './types';

const t = createTranslate('en');

function result(name: string, position: number): RaceResult {
  return {
    driverName: name,
    carClass: 'GT3',
    carNumber: String(position),
    position,
    classPosition: position,
    classGridPosition: position,
    laps: 20,
    finishStatus: 'Finished Normally',
    finishTime: 1800 + position * 5,
    bestLap: 90 + position,
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
      factor: 2,
      results: [result('Anna Example', 1), result('Bert Sample', 2)],
    },
    {
      id: 'r2',
      name: 'Round 2',
      sessionId: 'b.xml',
      date: null,
      track: 'Monza',
      results: [result('Bert Sample', 1), result('Anna Example', 2)],
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

const lines = (csv: string) =>
  csv
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n');

describe('toCsv', () => {
  it('uses semicolons, a byte order mark and quotes where needed', () => {
    const csv = toCsv([['a', 'b;c', 'say "hi"', 'x\ny', 3, null]]);
    expect(csv).toBe('\uFEFFa;"b;c";"say ""hi""";"x\ny";3;\r\n');
  });

  it('defuses texts a spreadsheet would run as a formula, but not numbers', () => {
    const csv = toCsv([['=1+1', '+a', '-b', '@c', -3]]);
    expect(csv).toBe("\uFEFF'=1+1;'+a;'-b;'@c;-3\r\n");
  });
});

describe('csvDate and file names', () => {
  it('writes local date and time, or nothing', () => {
    expect(csvDate(new Date(2026, 9, 30, 14, 5).getTime())).toBe(
      '2026-10-30 14:05',
    );
    expect(csvDate(null)).toBe('');
    expect(csvDate(undefined)).toBe('');
  });

  it('builds a plain name', () => {
    expect(csvFileName('Spa Cup 2026', 'table')).toBe('spa-cup-2026-table.csv');
    expect(csvFileName('!!!', 'points')).toBe('league-points.csv');
  });
});

describe('standingsCsv', () => {
  it('has class, rank, driver, points and a column per race', () => {
    const l = league();
    const rows = lines(standingsCsv(l, computeStandings(l), t));
    expect(rows[0]).toBe(
      `${t('league.class')};Rank;${t('league.driver')};${t('league.total')};Round 1 ×2;Round 2`,
    );
    // Anna 10*2 + 9, Bert 9*2 + 10.
    expect(rows[1]).toBe('GT3;1;Anna Example;29;20;9');
    expect(rows[2]).toBe('GT3;2;Bert Sample;28;18;10');
  });

  it('marks a dropped and a disqualified result', () => {
    const l = league();
    l.corrections = [
      correction({ kind: 'drop', raceId: 'r1' }),
      correction({ id: 'd', kind: 'disqualify', raceId: 'r2' }),
      correction({ id: 'p', kind: 'points', value: -3, raceId: 'r2' }),
    ];
    const rows = lines(standingsCsv(l, computeStandings(l), t));
    const anna = rows.find((r) => r.includes('Anna Example'));
    expect(anna).toMatch(/;X;DSQ -3$/);
  });

  it('is only the header for a league without races', () => {
    const l = createLeague('Empty');
    expect(lines(standingsCsv(l, computeStandings(l), t))).toHaveLength(1);
  });
});

describe('pointsCsv', () => {
  const split = (line: string | undefined) => (line ?? '').split(';');

  it('gives a line per person and race that adds up to the points', () => {
    const l = league();
    l.corrections = [
      correction({ kind: 'points', value: 3, raceId: 'r1', reason: 'late' }),
      correction({
        id: 't',
        kind: 'timePenalty',
        value: 30,
        raceId: 'r2',
        reason: 'contact',
      }),
    ];
    const rows = lines(pointsCsv(l, computeStandings(l), t));
    const head = split(rows[0]);
    const col = (name: string) => head.indexOf(t(name as 'league.total'));
    expect(rows).toHaveLength(5);

    for (const row of rows.slice(1)) {
      const c = split(row);
      const formula = Number(c[col('league.csv.formulaPoints')]);
      const bonus = Number(c[col('league.csv.bonusPoints')]);
      const factor = Number(c[col('league.csv.factor')]);
      expect(Number(c[col('league.total')])).toBe((formula + bonus) * factor);
    }

    const anna1 = split(rows.find((r) => r.includes('Anna Example;Round 1')));
    expect(anna1[col('league.csv.corrections')]).toBe('Points +3 (late)');
    expect(anna1[col('league.csv.factor')]).toBe('2');
    expect(anna1[col('league.total')]).toBe('26');
    expect(anna1.at(-1)).toBe('11 - position');

    // The penalty moves Bert ahead of Anna in race 2.
    const anna2 = split(rows.find((r) => r.includes('Anna Example;Round 2')));
    expect(anna2[col('league.csv.original')]).toBe('2');
    expect(anna2[col('league.csv.position')]).toBe('2');
  });

  it('shows a dropped result with zero points and no position for a DSQ', () => {
    const l = league();
    l.corrections = [
      correction({ kind: 'drop', raceId: 'r1', reason: '' }),
      correction({ id: 'd', kind: 'disqualify', raceId: 'r2' }),
    ];
    const rows = lines(pointsCsv(l, computeStandings(l), t));
    const head = split(rows[0]);
    const idx = (name: string) => head.indexOf(t(name as 'league.total'));
    const dropped = split(rows.find((r) => r.includes('Anna Example;Round 1')));
    expect(dropped[idx('league.csv.dropped')]).toBe('yes');
    expect(dropped[idx('league.total')]).toBe('0');
    expect(dropped[idx('league.csv.corrections')]).toBe('Dropped result');
    const dsq = split(rows.find((r) => r.includes('Anna Example;Round 2')));
    expect(dsq[idx('league.csv.disqualified')]).toBe('yes');
    expect(dsq[idx('league.csv.position')]).toBe('');
  });
});
