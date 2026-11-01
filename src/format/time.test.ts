import { describe, expect, it } from 'vitest';
import { formatGap, formatRaceTime, formatSector } from './time';

describe('time formatting', () => {
  it('formats gaps', () => {
    expect(formatGap(0.234)).toBe('+0.234');
    expect(formatGap(62.3456)).toBe('+1:02.346');
    expect(formatGap(null)).toBe('–');
  });

  it('formats race times', () => {
    expect(formatRaceTime(1270.0376)).toBe('21:10.038');
    expect(formatRaceTime(3723.456)).toBe('1:02:03.456');
    expect(formatRaceTime(undefined)).toBe('–');
  });

  it('formats sector times', () => {
    expect(formatSector(22.152)).toBe('22.152');
    expect(formatSector(null)).toBe('–');
  });
});
