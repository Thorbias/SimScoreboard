import { describe, expect, it } from 'vitest';
import { parseSession } from './parse';
import { classesOf, qualiRows, raceRows } from './table';

const files = import.meta.glob('./__fixtures__/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function load(fileName: string) {
  const text = files[`./__fixtures__/${fileName}`] as string;
  return parseSession(text, fileName);
}

describe('raceRows', () => {
  const race = load('2026_09_30_23_39_30-18R1.xml');

  it('lists the overall order by position with the leader first', () => {
    const rows = raceRows(race, { kind: 'overall' });
    expect(rows).toHaveLength(race.entries.length);
    const positions = rows.map((r) => r.entry.position ?? Infinity);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(rows[0]?.gap).toEqual({ kind: 'leader' });
  });

  it('restricts to one class and uses the class position', () => {
    const [carClass] = classesOf(race);
    const rows = raceRows(race, {
      kind: 'class',
      carClass: carClass as string,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.entry.carClass === carClass)).toBe(true);
    const positions = rows.map((r) => r.entry.classPosition ?? Infinity);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(rows[0]?.gap).toEqual({ kind: 'leader' });
  });

  it('marks exactly one fastest lap per class', () => {
    const rows = raceRows(race, { kind: 'overall' });
    for (const carClass of classesOf(race)) {
      const marked = rows.filter(
        (r) => r.entry.carClass === carClass && r.fastestInClass,
      );
      expect(marked.length).toBeLessThanOrEqual(1);
    }
  });

  it('shows laps behind for lapped entries and keeps DNF as DNF', () => {
    const rows = raceRows(race, { kind: 'overall' });
    for (const row of rows) {
      if (row.gap.kind === 'laps') expect(row.gap.laps).toBeGreaterThan(0);
      if (row.entry.finishStatus === 'DNF')
        expect(row.gap).toEqual({ kind: 'dnf' });
    }
  });
});

describe('qualiRows', () => {
  const quali = load('2026_09_30_23_04_23-10Q1.xml');

  it('orders by best lap with the pole at zero gap', () => {
    const rows = qualiRows(quali, { kind: 'overall' });
    const timed = rows.filter((r) => r.entry.bestLap !== null);
    expect(timed[0]?.gap).toBe(0);
    const laps = timed.map((r) => r.entry.bestLap as number);
    expect(laps).toEqual([...laps].sort((a, b) => a - b));
    expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1));
  });

  it('puts entries without a time at the end', () => {
    const rows = qualiRows(load('2026_10_28_22_23_36-02Q1.xml'), {
      kind: 'overall',
    });
    expect(rows.every((r) => r.gap === null && r.entry.bestLap === null)).toBe(
      true,
    );
    expect(rows).toHaveLength(4);
  });

  it('flags the fastest sector of each class', () => {
    const rows = qualiRows(quali, { kind: 'overall' });
    for (const carClass of classesOf(quali)) {
      for (const i of [0, 1, 2] as const) {
        const inClass = rows.filter((r) => r.entry.carClass === carClass);
        const best = Math.min(...inClass.map((r) => r.sectors[i] ?? Infinity));
        if (!Number.isFinite(best)) continue;
        const flagged = inClass.filter((r) => r.fastestSectors[i]);
        expect(flagged.length).toBeGreaterThan(0);
        expect(flagged.every((r) => r.sectors[i] === best)).toBe(true);
      }
    }
  });
});
