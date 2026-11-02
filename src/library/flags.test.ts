import { describe, expect, it } from 'vitest';
import { flagUrl } from './flags';
import { KNOWN_COUNTRY_CODES } from './tracks';

describe('flags', () => {
  it('has an image for every country in the track table', () => {
    for (const code of KNOWN_COUNTRY_CODES) {
      expect(flagUrl(code), code).toBeTruthy();
    }
  });

  it('accepts lower case and returns null for unknown codes', () => {
    expect(flagUrl('pt')).toBe(flagUrl('PT'));
    expect(flagUrl('XX')).toBeNull();
  });
});
