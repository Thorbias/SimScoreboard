import { describe, expect, it } from 'vitest';
import { formatLapTime } from './lapTime';

describe('formatLapTime', () => {
  it('formats seconds as m:ss.mmm', () => {
    expect(formatLapTime(207.4567)).toBe('3:27.457');
    expect(formatLapTime(59.9)).toBe('0:59.900');
  });

  it('rolls over when rounding reaches a full minute', () => {
    expect(formatLapTime(59.9996)).toBe('1:00.000');
  });

  it('returns a placeholder for missing or invalid times', () => {
    expect(formatLapTime(null)).toBe('--:--.---');
    expect(formatLapTime(undefined)).toBe('--:--.---');
    expect(formatLapTime(Number.NaN)).toBe('--:--.---');
    expect(formatLapTime(-1)).toBe('--:--.---');
  });
});
