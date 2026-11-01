import { describe, expect, it } from 'vitest';
import { countryName, countryOf, flagEmoji } from './tracks';

describe('tracks', () => {
  it('finds the country from the venue or the layout', () => {
    expect(countryOf('Algarve International Circuit')).toBe('PT');
    expect(countryOf('Circuit de la Sarthe')).toBe('FR');
    expect(countryOf('Autódromo José Carlos Pace')).toBe('BR');
    expect(countryOf('Unknown Venue', 'Bahrain Outer Circuit')).toBe('BH');
  });

  it('has no country for an unknown track', () => {
    expect(countryOf('Somewhere Else')).toBeNull();
  });

  it('builds the flag emoji from the country code', () => {
    expect(flagEmoji('PT')).toBe('🇵🇹');
  });

  it('names the country in the requested language', () => {
    expect(countryName('PT', 'en')).toBe('Portugal');
    expect(countryName('DE', 'de')).toBe('Deutschland');
  });
});
