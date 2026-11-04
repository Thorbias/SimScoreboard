import { describe, expect, it } from 'vitest';
import type {
  ContactSummary,
  EntrySummary,
  SessionSummary,
} from '../results/types';
import { buildRivals } from './rivals';

const ME = ['Max Muster'];

function entry(driverName: string, lapCount = 10): EntrySummary {
  return {
    driverName,
    carClass: 'GT3',
    carType: 'Car',
    carNumber: '1',
    position: 1,
    classPosition: 1,
    bestLap: 90,
    bestLapSectors: [null, null, null],
    lapCount,
    classGridPosition: 1,
    finishStatus: 'Finished Normally',
  };
}

let counter = 0;
function session(
  drivers: string[],
  over: Partial<SessionSummary> = {},
): SessionSummary {
  counter += 1;
  return {
    id: `s${counter}.xml`,
    type: 'race',
    section: 'Race',
    endedAt: 1000 + counter,
    startedAt: null,
    eventKey: null,
    mode: 'Multiplayer',
    trackVenue: 'Venue',
    trackCourse: 'Layout',
    trackEvent: 'Event',
    trackLength: 5000,
    gameVersion: '1',
    minutes: 20,
    scheduledLaps: null,
    classes: ['GT3'],
    entries: drivers.map((d) => entry(d)),
    contacts: [],
    ...over,
  };
}

const contact = (
  time: number | null,
  driver: string,
  other: string,
): ContactSummary => ({ time, driver, other });

describe('buildRivals: races together', () => {
  it('lists drivers met in at least two races, most often first', () => {
    const sessions = [
      session(['Max Muster', 'Anna', 'Bert']),
      session(['Max Muster', 'Anna', 'Bert']),
      session(['Max Muster', 'Anna', 'Cora']),
    ];
    expect(buildRivals(sessions, ME).sharedRaces).toEqual([
      { name: 'Anna', count: 3 },
      { name: 'Bert', count: 2 },
    ]);
  });

  it('leaves out drivers met only once and the own driver', () => {
    const sessions = [
      session(['Max Muster', 'Anna']),
      session(['Max Muster', 'Bert']),
    ];
    expect(buildRivals(sessions, ME).sharedRaces).toEqual([]);
  });

  it('counts races only, and only those the own driver drove', () => {
    const sessions = [
      session(['Max Muster', 'Anna'], { type: 'qualifying' }),
      session(['Max Muster', 'Anna'], { type: 'practice' }),
      session(['Anna', 'Bert']),
      session(['Anna', 'Bert']),
    ];
    expect(buildRivals(sessions, ME).sharedRaces).toEqual([]);
  });

  it('ignores drivers who did not complete a lap', () => {
    const a = session(['Max Muster', 'Anna']);
    const b = session(['Max Muster']);
    b.entries.push(entry('Anna', 0));
    expect(buildRivals([a, b], ME).sharedRaces).toEqual([]);
  });

  it('joins a name with and without the online suffix', () => {
    const sessions = [
      session(['Max Muster', 'Anna Example#14']),
      session(['Max Muster', 'anna example']),
    ];
    expect(buildRivals(sessions, ME).sharedRaces).toEqual([
      { name: 'Anna Example', count: 2 },
    ]);
  });
});

describe('buildRivals: online only', () => {
  it('ignores sessions against the computer', () => {
    const offline = { mode: 'Singleplayer' };
    const sessions = [
      session(['Max Muster', 'Anna'], {
        ...offline,
        contacts: [contact(10, 'Max Muster', 'Anna')],
      }),
      session(['Max Muster', 'Anna'], {
        ...offline,
        contacts: [contact(10, 'Max Muster', 'Anna')],
      }),
    ];
    const rivals = buildRivals(sessions, ME);
    expect(rivals.sharedRaces).toEqual([]);
    expect(rivals.collisions).toEqual([]);
  });

  it('counts the online sessions among offline ones', () => {
    const sessions = [
      session(['Max Muster', 'Anna']),
      session(['Max Muster', 'Anna']),
      session(['Max Muster', 'Anna'], { mode: 'Singleplayer' }),
    ];
    expect(buildRivals(sessions, ME).sharedRaces).toEqual([
      { name: 'Anna', count: 2 },
    ]);
  });
});

describe('buildRivals: collisions', () => {
  it('counts the contacts with another driver, each one once', () => {
    const both = (time: number): ContactSummary[] => [
      contact(time, 'Max Muster', 'Anna'),
      contact(time + 0.1, 'Anna', 'Max Muster'),
    ];
    const sessions = [
      session(['Max Muster', 'Anna'], { contacts: both(100) }),
      session(['Max Muster', 'Anna'], {
        contacts: [...both(50), ...both(300)],
      }),
    ];
    expect(buildRivals(sessions, ME).collisions).toEqual([
      { name: 'Anna', count: 3 },
    ]);
  });

  it('counts a contact that only the other driver reported', () => {
    const sessions = [
      session(['Max Muster', 'Anna'], {
        contacts: [contact(10, 'Anna', 'Max Muster')],
      }),
      session(['Max Muster', 'Anna'], {
        contacts: [contact(20, 'Max Muster', 'Anna')],
      }),
    ];
    expect(buildRivals(sessions, ME).collisions).toEqual([
      { name: 'Anna', count: 2 },
    ]);
  });

  it('leaves out drivers with a single collision and other pairs', () => {
    const sessions = [
      session(['Max Muster', 'Anna', 'Bert'], {
        contacts: [
          contact(10, 'Max Muster', 'Anna'),
          contact(20, 'Bert', 'Anna'),
          contact(30, 'Bert', 'Anna'),
        ],
      }),
    ];
    expect(buildRivals(sessions, ME).collisions).toEqual([]);
  });

  it('counts contacts in every kind of session', () => {
    const sessions = [
      session(['Max Muster', 'Anna'], {
        type: 'qualifying',
        contacts: [contact(10, 'Max Muster', 'Anna')],
      }),
      session(['Max Muster', 'Anna'], {
        contacts: [contact(10, 'Max Muster', 'Anna')],
      }),
    ];
    expect(buildRivals(sessions, ME).collisions).toEqual([
      { name: 'Anna', count: 2 },
    ]);
  });

  it('works with summaries from before contacts were stored', () => {
    const old = session(['Max Muster', 'Anna']) as Partial<SessionSummary>;
    delete old.contacts;
    expect(buildRivals([old as SessionSummary], ME).collisions).toEqual([]);
  });
});
