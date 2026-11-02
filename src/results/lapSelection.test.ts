import { describe, expect, it } from 'vitest';
import { entryKey } from './analysis';
import {
  addLapDriver,
  compareLapsMulti,
  defaultLapDrivers,
  MAX_LAP_DRIVERS,
  removeLapDriver,
  setLapDriverAt,
  suggestLapDriver,
} from './lapSelection';
import type { Entry, Lap } from './types';

function lap(num: number, time: number | null): Lap {
  return {
    num,
    time,
    sectors: [null, null, null],
    position: null,
    endTime: num * 100,
    topSpeed: null,
    compound: null,
    pit: false,
  };
}

function driver(
  name: string,
  carClass: string,
  bestLap: number | null,
  laps: Lap[] = [lap(1, bestLap)],
): Entry {
  return {
    driverName: name,
    carNumber: String(name.length),
    carClass,
    bestLap,
    laps,
  } as Entry;
}

describe('adding drivers one after another', () => {
  it('fills A, B, C and D in order', () => {
    let list: string[] = [];
    list = addLapDriver(list, 'a');
    list = addLapDriver(list, 'b');
    list = addLapDriver(list, 'c');
    list = addLapDriver(list, 'd');
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });

  it('starts at B when the own driver already holds A', () => {
    expect(addLapDriver(['me'], 'x')).toEqual(['me', 'x']);
  });

  it('replaces D with every further click', () => {
    const full = ['a', 'b', 'c', 'd'];
    expect(addLapDriver(full, 'e')).toEqual(['a', 'b', 'c', 'e']);
    expect(addLapDriver(['a', 'b', 'c', 'e'], 'f')).toEqual([
      'a',
      'b',
      'c',
      'f',
    ]);
  });

  it('does not select the same driver twice', () => {
    expect(addLapDriver(['a', 'b'], 'a')).toEqual(['a', 'b']);
    expect(addLapDriver(['a', 'b', 'c', 'd'], 'b')).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('never grows beyond four drivers', () => {
    let list: string[] = [];
    for (const k of 'abcdefg') list = addLapDriver(list, k);
    expect(list).toHaveLength(MAX_LAP_DRIVERS);
  });
});

describe('removing drivers', () => {
  it('moves the drivers behind up', () => {
    expect(removeLapDriver(['a', 'b', 'c', 'd'], 1)).toEqual(['a', 'c', 'd']);
    expect(removeLapDriver(['a', 'b', 'c'], 0)).toEqual(['b', 'c']);
    expect(removeLapDriver(['a', 'b', 'c', 'd'], 3)).toEqual(['a', 'b', 'c']);
  });

  it('can leave the selection empty', () => {
    expect(removeLapDriver(['a'], 0)).toEqual([]);
  });

  it('lets the next click fill the freed slot', () => {
    const afterRemove = removeLapDriver(['a', 'b', 'c', 'd'], 1);
    expect(addLapDriver(afterRemove, 'e')).toEqual(['a', 'c', 'd', 'e']);
  });
});

describe('changing a slot', () => {
  it('replaces the driver in that slot', () => {
    expect(setLapDriverAt(['a', 'b'], 1, 'c')).toEqual(['a', 'c']);
  });

  it('ignores a driver who is already selected elsewhere', () => {
    expect(setLapDriverAt(['a', 'b'], 1, 'a')).toEqual(['a', 'b']);
  });

  it('ignores an unknown slot', () => {
    expect(setLapDriverAt(['a'], 3, 'x')).toEqual(['a']);
  });
});

describe('defaults and suggestions', () => {
  const me = driver('Me', 'GT3', 100);
  const fast = driver('Fast1', 'GT3', 98);
  const slow = driver('Slow12', 'GT3', 101);
  const hyper = driver('Hyper', 'Hyper', 90);
  const choices = [me, fast, slow, hyper];

  it('starts with the own driver against the fastest rival of the class', () => {
    expect(defaultLapDrivers(choices, (e) => e === me)).toEqual([
      entryKey(me),
      entryKey(fast),
    ]);
  });

  it('starts with the first entry when no own driver is known', () => {
    expect(defaultLapDrivers(choices, () => false)[0]).toBe(entryKey(me));
  });

  it('suggests the fastest free driver, preferably from the same class', () => {
    expect(suggestLapDriver(choices, [entryKey(me)])).toBe(entryKey(fast));
    expect(suggestLapDriver(choices, [entryKey(me), entryKey(fast)])).toBe(
      entryKey(slow),
    );
    expect(
      suggestLapDriver(choices, [entryKey(me), entryKey(fast), entryKey(slow)]),
    ).toBe(entryKey(hyper));
  });

  it('suggests nothing when everybody is selected', () => {
    expect(suggestLapDriver(choices, choices.map(entryKey))).toBeNull();
  });
});

describe('compareLapsMulti', () => {
  it('lines up the laps of any number of drivers', () => {
    const a = driver('A', 'X', 90, [lap(1, 100), lap(2, 90), lap(3, null)]);
    const b = driver('Bb', 'X', 91, [lap(1, 98), lap(2, 91)]);
    const c = driver('Ccc', 'X', 92, [lap(2, 95), lap(4, 99)]);
    const rows = compareLapsMulti([a, b, c]);
    expect(rows.map((r) => r.lap)).toEqual([1, 2, 3, 4]);
    expect(rows[0]?.deltas[0]).toBeNull();
    expect(rows[0]?.deltas[1]).toBeCloseTo(-2);
    expect(rows[0]?.deltas[2]).toBeNull();
    expect(rows[1]?.deltas[1]).toBeCloseTo(1);
    expect(rows[1]?.deltas[2]).toBeCloseTo(5);
    expect(rows[2]?.deltas).toEqual([null, null, null]);
    expect(rows[3]?.laps[0]).toBeUndefined();
  });

  it('works with a single driver and with none', () => {
    const a = driver('A', 'X', 90, [lap(1, 100)]);
    expect(compareLapsMulti([a])[0]?.deltas).toEqual([null]);
    expect(compareLapsMulti([])).toEqual([]);
  });
});
