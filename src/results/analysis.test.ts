import { describe, expect, it } from 'vitest';
import {
  classStats,
  compareLaps,
  lapAt,
  median,
  positionChart,
} from './analysis';
import { parseSession } from './parse';
import { classesOf } from './table';
import type { Entry, Lap } from './types';

const files = import.meta.glob('./__fixtures__/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function load(fileName: string) {
  return parseSession(files[`./__fixtures__/${fileName}`] as string, fileName);
}

const RACE = '2026_09_30_23_39_30-18R1.xml';
const MP_RACE = '2026_10_30_14_38_02-65R1.xml';

function lap(num: number, time: number | null, endTime: number): Lap {
  return {
    num,
    time,
    sectors: [null, null, null],
    position: null,
    endTime,
    topSpeed: null,
    compound: null,
    pit: false,
  };
}

function entry(laps: Lap[]): Entry {
  return { laps } as Entry;
}

describe('stream events', () => {
  const session = load(MP_RACE);

  it('reads contacts, penalties, track limits and chat', () => {
    const kinds = new Set(session.events.map((e) => e.kind));
    expect(kinds).toContain('contact');
    expect(kinds).toContain('trackLimits');
    expect(kinds).toContain('chat');
    expect(kinds).toContain('penalty');
  });

  it('tells contacts with cars from contacts with objects', () => {
    const contacts = session.events.filter((e) => e.kind === 'contact');
    expect(contacts.some((c) => c.other !== null && c.object === null)).toBe(
      true,
    );
  });

  it('drops the duplicated track limit entries', () => {
    const tl = session.events.filter((e) => e.kind === 'trackLimits');
    const keys = tl.map((e) => `${e.time}|${e.driver}|${e.lap}|${e.outcome}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has no events in an aborted session', () => {
    expect(load('2026_10_28_22_23_36-02Q1.xml').events).toEqual([]);
  });
});

describe('lapAt', () => {
  const e = entry([lap(1, 100, 100), lap(2, 90, 190)]);
  it('finds the lap a time falls into', () => {
    expect(lapAt(e, 50)).toBe(1);
    expect(lapAt(e, 100)).toBe(1);
    expect(lapAt(e, 150)).toBe(2);
    expect(lapAt(e, 500)).toBe(3);
    expect(lapAt(entry([]), 10)).toBeNull();
  });
});

describe('compareLaps', () => {
  it('lines up laps and computes the delta', () => {
    const a = entry([lap(1, 100, 100), lap(2, 90, 190), lap(3, null, 290)]);
    const b = entry([lap(1, 98, 98), lap(2, 91, 189)]);
    const rows = compareLaps(a, b);
    expect(rows.map((r) => r.lap)).toEqual([1, 2, 3]);
    expect(rows[0]?.delta).toBeCloseTo(2);
    expect(rows[1]?.delta).toBeCloseTo(-1);
    expect(rows[2]?.delta).toBeNull();
  });
});

describe('median', () => {
  it('handles odd, even and empty input', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe('positionChart', () => {
  const session = load(RACE);

  it('starts on the grid and ends at the finish position', () => {
    const data = positionChart(session, null);
    expect(data.laps).toBeGreaterThan(0);
    for (const s of data.series) {
      if (s.points.length === 0) continue;
      expect(s.points.at(-1)?.x).toBe(data.laps + 1);
      expect(s.points.at(-1)?.y).toBe(s.entry.position);
    }
    expect(data.series.some((s) => s.points[0]?.x === 0)).toBe(true);
  });

  it('ranks within a class when a class is chosen', () => {
    const [carClass] = classesOf(session);
    const data = positionChart(session, carClass as string);
    expect(data.series.every((s) => s.entry.carClass === carClass)).toBe(true);
    const lapPoints = data.series.flatMap((s) =>
      s.points.filter((p) => p.x >= 1 && p.x <= data.laps),
    );
    expect(Math.max(...lapPoints.map((p) => p.y))).toBeLessThanOrEqual(
      data.series.length,
    );
  });
});

describe('classStats', () => {
  const session = load(RACE);

  it('finds the fastest lap of each class', () => {
    for (const carClass of classesOf(session)) {
      const stats = classStats(session, carClass);
      const times = session.entries
        .filter((e) => e.carClass === carClass)
        .flatMap((e) => e.laps.map((l) => l.time))
        .filter((t): t is number => t !== null);
      expect(stats.fastestLap?.time).toBe(Math.min(...times));
      expect(stats.tyre?.laps).toBeGreaterThan(0);
    }
  });

  it('only reports gained and lost places that are really gained or lost', () => {
    for (const carClass of classesOf(session)) {
      const stats = classStats(session, carClass);
      if (stats.mostGained) expect(stats.mostGained.places).toBeGreaterThan(0);
      if (stats.mostLost) expect(stats.mostLost.places).toBeLessThan(0);
    }
  });

  it('measures consistency on clean laps only', () => {
    const a = entry([]);
    Object.assign(a, {
      carClass: 'X',
      classGridPosition: null,
      classPosition: null,
      finishStatus: '',
      laps: [100, 100.2, 99.9, 100.1, 100, 250].map((t, i) => lap(i + 1, t, i)),
    });
    const stats = classStats({ entries: [a] } as never, 'X');
    expect(stats.consistent?.laps).toBe(5);
    expect(stats.consistent?.deviation).toBeLessThan(0.2);
  });
});
