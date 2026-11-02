import { describe, expect, it } from 'vitest';
import {
  countryName,
  countryOf,
  KNOWN_COUNTRY_CODES,
  trackTitle,
} from './tracks';

describe('trackTitle', () => {
  it('names the layout whenever it differs from the venue', () => {
    expect(
      trackTitle('Bahrain International Circuit', 'Bahrain Outer Circuit'),
    ).toBe('Bahrain International Circuit – Bahrain Outer Circuit');
  });

  it('uses the venue alone when the layout is the main one', () => {
    expect(trackTitle('Spa', 'Spa')).toBe('Spa');
    expect(trackTitle('Spa', '')).toBe('Spa');
    expect(trackTitle('', 'Layout')).toBe('Layout');
  });
});

// The 18 circuits installed with Le Mans Ultimate 1.4.2. Names marked (*) were
// not seen in result files yet and are the likely venue names.
const GAME_VENUES: [venue: string, country: string][] = [
  ['Algarve International Circuit', 'PT'],
  ['Bahrain International Circuit', 'BH'],
  ['Circuit de Barcelona', 'ES'],
  ['Circuit of the Americas', 'US'],
  ['Daytona International Speedway', 'US'],
  ['Fuji Speedway', 'JP'],
  ['Autodromo Internazionale Enzo e Dino Ferrari', 'IT'], // (*) Imola
  ['Autódromo José Carlos Pace', 'BR'],
  ['WeatherTech Raceway Laguna Seca', 'US'],
  ['Circuit de la Sarthe', 'FR'],
  ['Grand Prix of Long Beach', 'US'],
  ['Autodromo Nazionale Monza', 'IT'],
  ['Paul Ricard Circuit', 'FR'],
  ['Lusail International Circuit', 'QA'],
  ['Michelin Raceway Road Atlanta', 'US'],
  ['Sebring International Raceway', 'US'],
  ['Silverstone Circuit', 'GB'], // (*)
  ['Circuit de Spa-Francorchamps', 'BE'],
];

describe('track table covers the game', () => {
  it.each(GAME_VENUES)('knows %s', (venue, country) => {
    expect(countryOf(venue)).toBe(country);
  });

  it('has a flag for every country of the game', () => {
    const countries = new Set(GAME_VENUES.map(([, c]) => c));
    expect(countries.size).toBe(11);
    for (const code of countries) expect(KNOWN_COUNTRY_CODES).toContain(code);
  });

  it('has no country in the table that the game does not use', () => {
    const used = new Set(GAME_VENUES.map(([, c]) => c));
    for (const code of KNOWN_COUNTRY_CODES)
      expect(used.has(code), code).toBe(true);
  });
});

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

  it('names the country in the requested language', () => {
    expect(countryName('PT', 'en')).toBe('Portugal');
    expect(countryName('DE', 'de')).toBe('Deutschland');
  });
});
