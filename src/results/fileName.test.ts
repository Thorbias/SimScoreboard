import { describe, expect, it } from 'vitest';
import { parseResultFileName } from './fileName';

describe('parseResultFileName', () => {
  it('reads the end time and the session type', () => {
    const r = parseResultFileName('2026_10_30_14_38_02-65R1.xml');
    expect(r?.type).toBe('race');
    expect(r?.endedAt).toBe(new Date(2026, 9, 30, 14, 38, 2).getTime());
    expect(parseResultFileName('2026_10_28_22_23_36-02Q1.xml')?.type).toBe(
      'qualifying',
    );
    expect(parseResultFileName('2025_06_03_10_03_47-16P1.xml')?.type).toBe(
      'practice',
    );
  });

  it('rejects other files in the results folder', () => {
    expect(parseResultFileName('BatchTemplateR1.ini')).toBeNull();
    expect(parseResultFileName('notes.xml')).toBeNull();
  });
});
