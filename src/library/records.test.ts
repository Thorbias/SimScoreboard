import { describe, expect, it } from 'vitest';
import type { EntrySummary, SessionSummary } from '../results/types';
import { buildOverview, buildRecords } from './records';

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
