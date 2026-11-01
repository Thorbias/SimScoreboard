import { describe, expect, it } from 'vitest';
import type { EntrySummary, SessionSummary } from '../results/types';
import { buildRecords } from './records';

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
