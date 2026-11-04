import { describe, expect, it } from 'vitest';
import { importRaceFile } from './race';

const files = import.meta.glob('../results/__fixtures__/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const fixture = (name: string): string => {
  const text = files[`../results/__fixtures__/${name}`];
  if (text === undefined) throw new Error(`missing fixture ${name}`);
  return text;
};

const RACE = '2026_10_30_14_38_02-65R1.xml';
const QUALI = '2026_09_30_23_04_23-10Q1.xml';

describe('importRaceFile', () => {
  it('turns a race result file into a league race', () => {
    const race = importRaceFile(fixture(RACE), RACE, []);
    expect(race.sessionId).toBe(RACE);
    expect(race.id).toBe(`race-${RACE}`);
    expect(race.results.length).toBeGreaterThan(1);
  });

  it('refuses a session that is not a race', () => {
    expect(() => importRaceFile(fixture(QUALI), QUALI, [])).toThrow(
      'not a race session',
    );
  });

  it('refuses a file that is not a result file', () => {
    expect(() => importRaceFile('<a/>', 'x.xml', [])).toThrow(
      'not a result file',
    );
    expect(() => importRaceFile('no xml at all', 'x.xml', [])).toThrow(
      'not a result file',
    );
  });

  it('refuses a race that is already in the league', () => {
    const race = importRaceFile(fixture(RACE), RACE, []);
    expect(() => importRaceFile(fixture(RACE), RACE, [race])).toThrow(
      'already in the league',
    );
  });
});
