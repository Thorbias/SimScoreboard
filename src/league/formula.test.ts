import { describe, expect, it } from 'vitest';
import {
  checkFormula,
  compileFormula,
  FormulaError,
  type FormulaValues,
} from './formula';

const base: FormulaValues = {
  position: 1,
  overallPosition: 1,
  starters: 10,
  fastestLap: 0,
  pole: 0,
  finished: 1,
  laps: 20,
  leaderLaps: 20,
};

const run = (source: string, values: Partial<FormulaValues> = {}) =>
  compileFormula(source)({ ...base, ...values });

describe('formula', () => {
  it('calculates with the usual precedence', () => {
    expect(run('2 + 3 * 4')).toBe(14);
    expect(run('(2 + 3) * 4')).toBe(20);
    expect(run('10 - 4 - 3')).toBe(3);
    expect(run('-2 + 5')).toBe(3);
    expect(run('7 % 4')).toBe(3);
    expect(run('0.5 * 5')).toBe(2.5);
  });

  it('reads the variables', () => {
    expect(run('starters - position + 1', { position: 4 })).toBe(7);
  });

  it('compares and combines conditions as 1 and 0', () => {
    expect(run('position <= 3', { position: 3 })).toBe(1);
    expect(run('position < 3', { position: 3 })).toBe(0);
    expect(run('position == 1 and finished')).toBe(1);
    expect(run('position == 2 or pole', { pole: 1 })).toBe(1);
    expect(run('not fastestLap')).toBe(1);
    expect(run('position != 1')).toBe(0);
  });

  it('knows if, min, max and the rounding functions', () => {
    const points = 'if(position <= 10, 11 - position, 0) + fastestLap';
    expect(run(points, { position: 1, fastestLap: 1 })).toBe(11);
    expect(run(points, { position: 10 })).toBe(1);
    expect(run(points, { position: 11 })).toBe(0);
    expect(run('max(1, 5, 3)')).toBe(5);
    expect(run('min(4, 2)')).toBe(2);
    expect(run('round(2.5)')).toBe(3);
    expect(run('floor(2.9) + ceil(2.1) + abs(-1)')).toBe(6);
  });

  it('only evaluates the chosen branch of if', () => {
    expect(run('if(1, 5, 1 / 0)')).toBe(5);
  });

  it('reports errors with a position', () => {
    expect(checkFormula('2 +')).toMatchObject({ ok: false });
    expect(checkFormula('foo')).toEqual({
      ok: false,
      message: 'Unknown name "foo"',
      position: 0,
    });
    expect(checkFormula('1 + bar')).toMatchObject({ ok: false, position: 4 });
    expect(checkFormula('')).toMatchObject({ ok: false, position: 0 });
    expect(checkFormula('(1 + 2')).toMatchObject({ ok: false });
    expect(checkFormula('1 $ 2')).toMatchObject({ ok: false, position: 2 });
    expect(checkFormula('1 2')).toMatchObject({ ok: false, position: 2 });
    expect(checkFormula('round(1, 2)')).toMatchObject({ ok: false });
    expect(checkFormula('if(1, 2)')).toMatchObject({ ok: false });
    expect(checkFormula('wait(1)')).toMatchObject({ ok: false });
    expect(checkFormula('position + 1')).toEqual({ ok: true });
  });

  it('treats division by zero as an error, not NaN', () => {
    expect(() => run('1 / 0')).toThrow(FormulaError);
    expect(() => run('5 % 0')).toThrow(FormulaError);
    expect(() => run('starters / (position - 1)')).toThrow('Division by zero');
  });

  it('cannot reach anything beyond its vocabulary', () => {
    for (const source of [
      'constructor',
      'this',
      'globalThis',
      'process.exit()',
      'window',
      '__proto__',
      'position.toString()',
    ]) {
      expect(checkFormula(source).ok).toBe(false);
    }
  });
});
