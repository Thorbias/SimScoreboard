import { describe, expect, it } from 'vitest';
import type { EntrySummary, SessionSummary } from '../results/types';
import {
  filterSessions,
  groupByEvent,
  NO_FILTER,
  ownResult,
  uniqueClasses,
  uniqueTracks,
} from './filters';
import { isOwnDriver, normalizeName, suggestNames } from './names';

function entry(name: string, classPosition = 1): EntrySummary {
  return {
    driverName: name,
    carClass: 'GT3',
    carType: 'Car',
    carNumber: '1',
    position: classPosition,
    classPosition,
    bestLap: null,
    bestLapSectors: [null, null, null],
    lapCount: 0,
    classGridPosition: null,
    finishStatus: '',
  };
}

function session(over: Partial<SessionSummary>): SessionSummary {
  return {
    id: 'a.xml',
    type: 'race',
    section: 'Race',
    endedAt: 1000,
    startedAt: null,
    eventKey: null,
    mode: 'Multiplayer',
    trackVenue: 'Venue',
    trackCourse: 'Course',
    trackEvent: 'Event',
    trackLength: 5000,
    gameVersion: '1.4200',
    minutes: 20,
    scheduledLaps: null,
    classes: ['GT3'],
    entries: [],
    contacts: [],
    ...over,
  };
}

describe('names', () => {
  it('ignores the online suffix, case and spacing', () => {
    expect(normalizeName('  Max   Muster#8989 ')).toBe('max muster');
    expect(isOwnDriver('Max Muster#1234', ['max muster'])).toBe(true);
    expect(isOwnDriver('Max Muster', ['Max Muster#1'])).toBe(true);
    expect(isOwnDriver('Someone', ['Max Muster'])).toBe(false);
    expect(isOwnDriver('', [''])).toBe(false);
  });

  it('suggests the most frequent names once per session', () => {
    const list = [
      session({ id: '1', entries: [entry('A'), entry('A'), entry('B')] }),
      session({ id: '2', entries: [entry('A#1'), entry('C')] }),
    ];
    const [first, second] = suggestNames(list);
    expect(first).toEqual({ name: 'A', sessions: 2 });
    expect(second?.sessions).toBe(1);
  });
});

describe('filterSessions', () => {
  const list = [
    session({ id: '1', type: 'race', trackCourse: 'X', endedAt: 100 }),
    session({
      id: '2',
      type: 'qualifying',
      trackCourse: 'Y',
      classes: ['Hyper', 'GT3'],
      endedAt: 200,
    }),
  ];
  const ids = (f: Partial<typeof NO_FILTER>) =>
    filterSessions(list, { ...NO_FILTER, ...f }).map((s) => s.id);

  it('filters by each criterion', () => {
    expect(ids({})).toEqual(['1', '2']);
    expect(ids({ type: 'race' })).toEqual(['1']);
    expect(ids({ track: 'Y' })).toEqual(['2']);
    expect(ids({ carClass: 'Hyper' })).toEqual(['2']);
    expect(ids({ from: 150 })).toEqual(['2']);
    expect(ids({ to: 150 })).toEqual(['1']);
  });

  it('keeps only favourites when asked', () => {
    expect(
      filterSessions(list, { ...NO_FILTER, favoritesOnly: true }, ['2']).map(
        (s) => s.id,
      ),
    ).toEqual(['2']);
    expect(filterSessions(list, NO_FILTER, ['2'])).toHaveLength(2);
  });

  it('lists tracks and classes for the filter menus', () => {
    expect(uniqueTracks(list)).toEqual(['X', 'Y']);
    expect(uniqueClasses(list)).toEqual(['GT3', 'Hyper']);
  });
});

describe('groupByEvent', () => {
  it('groups sessions of one event and sorts newest first', () => {
    const groups = groupByEvent([
      session({ id: 'r', type: 'race', eventKey: 'T|1', endedAt: 300 }),
      session({ id: 'q', type: 'qualifying', eventKey: 'T|1', endedAt: 200 }),
      session({ id: 'old', eventKey: 'T|0', endedAt: 100 }),
      session({ id: 'solo', eventKey: null, endedAt: 50 }),
    ]);
    expect(groups.map((g) => g.sessions.map((s) => s.id))).toEqual([
      ['q', 'r'],
      ['old'],
      ['solo'],
    ]);
  });
});

describe('ownResult', () => {
  it('finds the own entry and flags a class win in a race', () => {
    const race = session({ entries: [entry('Me#12', 1), entry('Other', 2)] });
    expect(ownResult(race, ['Me'])?.won).toBe(true);
    const quali = session({ type: 'qualifying', entries: [entry('Me', 1)] });
    expect(ownResult(quali, ['Me'])?.won).toBe(false);
    expect(ownResult(race, ['Nobody'])).toBeNull();
  });
});
