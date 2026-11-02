import { describe, expect, it } from 'vitest';
import type { EntrySummary, SessionSummary } from '../results/types';
import {
  buildOverview,
  buildRecords,
  recentMonths,
  runningBest,
} from './records';

function entry(over: Partial<EntrySummary>): EntrySummary {
  return {
    driverName: 'Max Muster',
    carClass: 'GT3',
    carType: 'Car A',
    carNumber: '1',
    position: 1,
    classPosition: 1,
    bestLap: 100,
    bestLapSectors: [30, 40, 30],
    lapCount: 10,
    classGridPosition: null,
    finishStatus: '',
    ...over,
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
    trackCourse: 'Layout 1',
    trackEvent: 'Event',
    trackLength: 5000,
    gameVersion: '1.4200',
    minutes: 20,
    scheduledLaps: null,
    classes: ['GT3'],
    entries: [],
    ...over,
  };
}

const ME = ['Max Muster'];

describe('buildRecords', () => {
  it('keeps the fastest lap per car and ignores other drivers', () => {
    const tracks = buildRecords(
      [
        session({
          id: '1',
          entries: [
            entry({ bestLap: 101 }),
            entry({ driverName: 'Other', bestLap: 90 }),
          ],
        }),
        session({ id: '2', entries: [entry({ bestLap: 99.5 })] }),
        session({ id: '3', entries: [entry({ driverName: 'Other' })] }),
      ],
      ME,
    );
    expect(tracks).toHaveLength(1);
    const track = tracks[0]!;
    expect(track.sessionCount).toBe(2);
    expect(track.totalLaps).toBe(20);
    const gt3 = track.classes[0]!;
    expect(gt3.records).toHaveLength(1);
    expect(gt3.records[0]?.lap).toBe(99.5);
    expect(gt3.records[0]?.sessionId).toBe('2');
  });

  it('keeps every layout of a venue apart, with its own numbers', () => {
    const tracks = buildRecords(
      [
        session({ id: '1', entries: [entry({ bestLap: 100, lapCount: 5 })] }),
        session({
          id: '2',
          trackCourse: 'Layout 2',
          entries: [entry({ bestLap: 60, lapCount: 7 })],
        }),
      ],
      ME,
    );
    expect(tracks.map((t) => t.course).sort()).toEqual([
      'Layout 1',
      'Layout 2',
    ]);
    const one = tracks.find((t) => t.course === 'Layout 1')!;
    const two = tracks.find((t) => t.course === 'Layout 2')!;
    expect(one.venue).toBe('Venue');
    expect(one.classes[0]?.best).toBe(100);
    expect(one.totalLaps).toBe(5);
    expect(two.classes[0]?.best).toBe(60);
    expect(two.totalLaps).toBe(7);
  });

  it('orders the cars of a class by lap time', () => {
    const track = buildRecords(
      [
        session({
          id: '1',
          entries: [entry({ carType: 'Car B', bestLap: 98 })],
        }),
        session({
          id: '2',
          entries: [entry({ carType: 'Car A', bestLap: 97 })],
        }),
      ],
      ME,
    )[0]!;
    expect(track.classes[0]?.records.map((r) => r.carType)).toEqual([
      'Car A',
      'Car B',
    ]);
  });

  it('tracks the best qualifying and race lap separately', () => {
    const track = buildRecords(
      [
        session({
          id: 'q',
          type: 'qualifying',
          entries: [entry({ bestLap: 95 })],
        }),
        session({ id: 'r', type: 'race', entries: [entry({ bestLap: 97 })] }),
        session({
          id: 'p',
          type: 'practice',
          entries: [entry({ bestLap: 90 })],
        }),
      ],
      ME,
    )[0]!;
    expect(track.bestQualifying?.lap).toBe(95);
    expect(track.bestRace?.lap).toBe(97);
  });

  it('counts sessions without a timed lap but gives them no record', () => {
    const track = buildRecords(
      [session({ entries: [entry({ bestLap: null, lapCount: 0 })] })],
      ME,
    )[0]!;
    expect(track.sessionCount).toBe(1);
    expect(track.classes).toEqual([]);
  });

  it('returns nothing without aliases', () => {
    expect(buildRecords([session({ entries: [entry({})] })], [])).toEqual([]);
  });
});

describe('buildOverview', () => {
  const me = (over: Partial<EntrySummary>) =>
    entry({ driverName: 'Max Muster', ...over });

  const sessions = [
    // Layout 1: Car A fastest (98) over Car B (99).
    session({
      id: '1',
      type: 'race',
      trackLength: 4000,
      entries: [
        me({ carType: 'Car A', bestLap: 98, lapCount: 10, classPosition: 1 }),
      ],
    }),
    session({
      id: '2',
      type: 'qualifying',
      trackLength: 4000,
      entries: [me({ carType: 'Car B', bestLap: 99, lapCount: 5 })],
    }),
    // Layout 2: Car B fastest.
    session({
      id: '3',
      type: 'race',
      trackCourse: 'Layout 2',
      trackLength: 6000,
      entries: [
        me({ carType: 'Car B', bestLap: 120, lapCount: 4, classPosition: 3 }),
      ],
    }),
    // Another class and layout 3: Car H.
    session({
      id: '4',
      type: 'race',
      trackCourse: 'Layout 3',
      trackLength: 5000,
      classes: ['Hyper'],
      entries: [
        me({
          carClass: 'Hyper',
          carType: 'Car H',
          bestLap: 90,
          lapCount: 20,
          classPosition: 5,
        }),
        entry({ driverName: 'Other', carClass: 'Hyper', bestLap: 80 }),
      ],
    }),
    // Not a session of the own driver.
    session({ id: '5', entries: [entry({ driverName: 'Other' })] }),
  ];
  const overview = buildOverview(sessions, ['Max Muster']);

  it('counts sessions, laps, distance and layouts of the own driver only', () => {
    expect(overview.sessionCount).toBe(4);
    expect(overview.totalLaps).toBe(39);
    expect(overview.distanceKm).toBeCloseTo((10 + 5) * 4 + 4 * 6 + 20 * 5);
    expect(overview.layoutCount).toBe(3);
  });

  it('counts races, wins and class podiums', () => {
    expect(overview.races).toBe(3);
    expect(overview.wins).toBe(1);
    expect(overview.podiums).toBe(2);
  });

  it('shares the best times of a class between the cars, layout by layout', () => {
    const gt3 = overview.classes.find((c) => c.carClass === 'GT3')!;
    expect(gt3.layouts).toBe(2);
    const a = gt3.cars.find((c) => c.carType === 'Car A')!;
    const b = gt3.cars.find((c) => c.carType === 'Car B')!;
    expect(a.bests).toBe(1);
    expect(b.bests).toBe(1);
    expect(a.laps).toBe(10);
    expect(b.laps).toBe(9);
    expect(gt3.totalLaps).toBe(19);
  });

  it('puts the most successful car first and breaks ties by laps', () => {
    const gt3 = overview.classes.find((c) => c.carClass === 'GT3')!;
    expect(gt3.cars[0]?.carType).toBe('Car A');
  });

  it('keeps cars that never held a best time', () => {
    const extra = buildOverview(
      [
        ...sessions,
        session({
          id: '6',
          entries: [me({ carType: 'Car C', bestLap: 130, lapCount: 3 })],
        }),
      ],
      ['Max Muster'],
    );
    const c = extra.classes
      .find((x) => x.carClass === 'GT3')!
      .cars.find((x) => x.carType === 'Car C')!;
    expect(c.bests).toBe(0);
    expect(c.laps).toBe(3);
  });

  it('orders the classes by laps driven and lists the most driven layouts', () => {
    expect(overview.classes.map((c) => c.carClass)).toEqual(['Hyper', 'GT3']);
    expect(overview.topTracks[0]).toMatchObject({
      course: 'Layout 3',
      laps: 20,
    });
    expect(overview.topTracks).toHaveLength(3);
  });

  it('is empty without aliases', () => {
    const empty = buildOverview(sessions, []);
    expect(empty.sessionCount).toBe(0);
    expect(empty.classes).toEqual([]);
    expect(empty.topTracks).toEqual([]);
  });
});

const day = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d, 12).getTime();

describe('progress over time', () => {
  it('lists the best lap of every session, oldest first', () => {
    const track = buildRecords(
      [
        session({
          id: 'late',
          endedAt: day(2026, 3, 1),
          entries: [entry({ bestLap: 98 })],
        }),
        session({
          id: 'early',
          endedAt: day(2026, 1, 1),
          entries: [entry({ bestLap: 101 })],
        }),
        session({
          id: 'mid',
          endedAt: day(2026, 2, 1),
          entries: [entry({ bestLap: 103 })],
        }),
      ],
      ['Max Muster'],
    )[0]!;
    const history = track.classes[0]!.history;
    expect(history.map((h) => h.sessionId)).toEqual(['early', 'mid', 'late']);
    expect(runningBest(history).map((r) => r.best)).toEqual([101, 101, 98]);
  });

  it('keeps classes apart', () => {
    const track = buildRecords(
      [
        session({ id: '1', entries: [entry({ bestLap: 100 })] }),
        session({
          id: '2',
          entries: [entry({ carClass: 'Hyper', bestLap: 90 })],
        }),
      ],
      ['Max Muster'],
    )[0]!;
    expect(track.classes.map((c) => [c.carClass, c.history.length])).toEqual([
      ['GT3', 1],
      ['Hyper', 1],
    ]);
  });
});

describe('recentMonths', () => {
  it('fills gaps with zero months and crosses the year', () => {
    const months = recentMonths(
      [
        { month: '2025-11', laps: 10, sessions: 1 },
        { month: '2026-02', laps: 30, sessions: 2 },
      ],
      5,
    );
    expect(months.map((m) => m.month)).toEqual([
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
    expect(months.map((m) => m.laps)).toEqual([0, 10, 0, 0, 30]);
  });

  it('is empty without activity', () => {
    expect(recentMonths([])).toEqual([]);
  });
});

describe('buildOverview: activity, modes, form and record ages', () => {
  const me = (over: Partial<EntrySummary>) =>
    entry({ driverName: 'Max Muster', ...over });
  const NOW = day(2026, 6, 30);

  const sessions = [
    session({
      id: 'old-race',
      type: 'race',
      mode: 'Multiplayer',
      endedAt: day(2026, 1, 10),
      trackCourse: 'Layout 1',
      entries: [
        me({
          bestLap: 100,
          lapCount: 10,
          classPosition: 4,
          classGridPosition: 6,
          finishStatus: 'Finished Normally',
        }),
      ],
    }),
    session({
      id: 'dnf-race',
      type: 'race',
      mode: 'Multiplayer',
      endedAt: day(2026, 6, 20),
      trackCourse: 'Layout 2',
      entries: [
        me({
          bestLap: 120,
          lapCount: 3,
          classPosition: 9,
          classGridPosition: 5,
          finishStatus: 'DNF',
        }),
      ],
    }),
    session({
      id: 'sp-quali',
      type: 'qualifying',
      mode: 'Race Weekend',
      endedAt: day(2026, 6, 25),
      trackCourse: 'Layout 2',
      entries: [me({ bestLap: 118, lapCount: 5 })],
    }),
    session({
      id: 'last-race',
      type: 'race',
      mode: 'Multiplayer',
      endedAt: day(2026, 6, 28),
      trackCourse: 'Layout 1',
      entries: [
        me({
          bestLap: 99,
          lapCount: 8,
          classPosition: 2,
          classGridPosition: 3,
          finishStatus: 'Finished Normally',
        }),
      ],
    }),
  ];
  const overview = buildOverview(sessions, ['Max Muster'], undefined, NOW);

  it('splits the sessions into multiplayer and the rest', () => {
    expect(overview.modes.multiplayer).toEqual({ sessions: 3, laps: 21 });
    expect(overview.modes.other).toEqual({ sessions: 1, laps: 5 });
  });

  it('sums the laps per month', () => {
    expect(overview.activity).toEqual([
      { month: '2026-01', laps: 10, sessions: 1 },
      { month: '2026-06', laps: 16, sessions: 3 },
    ]);
  });

  it('describes the form over the latest races, newest first', () => {
    expect(overview.form.races).toBe(3);
    expect(overview.form.dnfs).toBe(1);
    expect(overview.form.recent.map((r) => r.sessionId)).toEqual([
      'last-race',
      'dnf-race',
      'old-race',
    ]);
    expect(overview.form.averageFinish).toBeCloseTo((2 + 9 + 4) / 3);
    // grid minus finish: +1, -4, +2
    expect(overview.form.averageGain).toBeCloseTo((1 - 4 + 2) / 3);
  });

  it('lists the newest and the oldest class records and counts the recent ones', () => {
    // Layout 1 GT3 best: 99 on 28 June. Layout 2 GT3 best: 118 on 25 June.
    expect(overview.newestRecords.map((r) => r.course)).toEqual([
      'Layout 1',
      'Layout 2',
    ]);
    expect(overview.oldestRecords.map((r) => r.course)).toEqual([
      'Layout 2',
      'Layout 1',
    ]);
    expect(overview.recentRecordCount).toBe(2);
    const later = buildOverview(
      sessions,
      ['Max Muster'],
      undefined,
      day(2026, 12, 31),
    );
    expect(later.recentRecordCount).toBe(0);
  });
});
