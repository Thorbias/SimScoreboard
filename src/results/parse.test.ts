import { describe, expect, it } from 'vitest';
import { parseSession, summarize } from './parse';

const files = import.meta.glob('./__fixtures__/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function load(fileName: string) {
  const text = files[`./__fixtures__/${fileName}`];
  if (text === undefined) throw new Error(`missing fixture ${fileName}`);
  return parseSession(text, fileName);
}

const MP_RACE = '2026_10_30_14_38_02-65R1.xml';
const MP_QUALI_MULTI = '2026_09_30_23_04_23-10Q1.xml';
const MP_RACE_MULTI = '2026_09_30_23_39_30-18R1.xml';
const OLD_PRACTICE = '2025_06_03_10_03_47-16P1.xml';
const SP_RACE = '2026_07_29_21_41_26-85R1.xml';
const ABORTED_QUALI = '2026_10_28_22_23_36-02Q1.xml';

describe('parseSession', () => {
  it('reads the header of a multiplayer race', () => {
    const s = load(MP_RACE);
    expect(s.type).toBe('race');
    expect(s.section).toBe('Race');
    expect(s.mode).toBe('Multiplayer');
    expect(s.trackVenue).toBe('Algarve International Circuit');
    expect(s.trackEvent).toBe('6 Hours of Portimao');
    expect(s.trackLength).toBeCloseTo(4635.3);
    expect(s.gameVersion).toBe('1.4200');
    expect(s.minutes).toBe(20);
    expect(s.scheduledLaps).toBeNull();
    expect(s.mostLapsCompleted).toBe(12);
    expect(s.startedAt).toBe(1793365997 * 1000);
  });

  it('reads entries with results and laps', () => {
    const s = load(MP_RACE);
    expect(s.entries).toHaveLength(5);
    const own = s.entries.find((e) => e.driverName === 'Own Driver');
    expect(own).toBeDefined();
    expect(own?.position).toBe(6);
    expect(own?.classPosition).toBe(6);
    expect(own?.gridPosition).toBe(7);
    expect(own?.carClass).toBe('GT3');
    expect(own?.laps.length).toBeGreaterThan(0);
  });

  it('keeps laps without a time as null and sectors as single times', () => {
    const s = load(MP_RACE);
    const laps = s.entries.flatMap((e) => e.laps);
    const untimed = laps.find((l) => l.time === null);
    expect(untimed).toBeDefined();
    const timed = laps.find(
      (l) => l.time !== null && l.sectors.every((x) => x !== null),
    );
    expect(timed).toBeDefined();
    const sum = (timed?.sectors as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(timed?.time as number, 2);
    expect(timed?.compound).toBe('Medium');
  });

  it('reads finish status and finish time', () => {
    const s = load(MP_RACE);
    expect(s.entries.every((e) => e.finishStatus !== '')).toBe(true);
    const finisher = s.entries.find(
      (e) => e.finishStatus === 'Finished Normally',
    );
    expect(finisher?.finishTime).toBeGreaterThan(0);
  });

  it('reads a multi-class race and groups sessions of one event', () => {
    const race = load(MP_RACE_MULTI);
    const quali = load(MP_QUALI_MULTI);
    expect(race.type).toBe('race');
    expect(quali.type).toBe('qualifying');
    expect(summarize(race).classes.sort()).toEqual(['GT3', 'LMP2_ELMS']);
    expect(race.eventKey).not.toBeNull();
    expect(race.eventKey).toBe(quali.eventKey);
  });

  it('reads a file from game version 0.5000 with fuel and wear attributes', () => {
    const s = load(OLD_PRACTICE);
    expect(s.gameVersion).toBe('0.5000');
    expect(s.type).toBe('practice');
    expect(s.mode).toBe('Race Weekend');
    expect(summarize(s).classes.sort()).toEqual(['GTE', 'Hyper', 'LMP2']);
    expect(s.entries.flatMap((e) => e.laps).some((l) => l.time !== null)).toBe(
      true,
    );
  });

  it('reads a single-player race weekend race', () => {
    const s = load(SP_RACE);
    expect(s.mode).toBe('Race Weekend');
    expect(s.type).toBe('race');
    expect(s.entries.length).toBeGreaterThan(0);
  });

  it('loads an aborted session without laps', () => {
    const s = load(ABORTED_QUALI);
    expect(s.type).toBe('qualifying');
    expect(s.entries).toHaveLength(4);
    expect(
      s.entries.every((e) => e.lapCount === 0 && e.laps.length === 0),
    ).toBe(true);
    expect(s.entries.every((e) => e.bestLap === null)).toBe(true);
  });

  it('derives the end time and type from the file name', () => {
    const s = load(MP_RACE);
    expect(s.endedAt).toBe(new Date(2026, 9, 30, 14, 38, 2).getTime());
  });

  it('survives truncated input', () => {
    const text = files[`./__fixtures__/${MP_RACE}`] as string;
    const s = parseSession(text.slice(0, text.length / 2), MP_RACE);
    expect(s.trackVenue).toBe('Algarve International Circuit');
  });

  it('rejects text that is not a result file', () => {
    expect(() => parseSession('<html></html>', 'x.xml')).toThrow();
  });
});

describe('summarize', () => {
  it('keeps what the library list needs and drops the laps', () => {
    const summary = summarize(load(MP_RACE));
    expect(summary.entries).toHaveLength(5);
    expect(summary.classes).toEqual(['GT3']);
    expect(summary.entries[0]).not.toHaveProperty('laps');
  });
});
