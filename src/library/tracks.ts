/**
 * The result files name the venue and layout but not the country, so the
 * country comes from this table. Entries match on parts of the lower-case venue
 * or layout name; a track that is not listed simply has no country.
 */
const COUNTRIES: [needles: string[], code: string][] = [
  [['bahrain'], 'BH'],
  [['algarve', 'portim'], 'PT'],
  [['spa-francorchamps'], 'BE'],
  [['fuji'], 'JP'],
  [['laguna seca'], 'US'],
  [['sebring'], 'US'],
  [['road atlanta'], 'US'],
  [['daytona'], 'US'],
  [['long beach'], 'US'],
  [['circuit of the americas'], 'US'],
  [['monza', 'imola', 'enzo e dino', 'mugello'], 'IT'],
  [['sarthe', 'le mans', 'paul ricard'], 'FR'],
  [['carlos pace', 'interlagos'], 'BR'],
  [['barcelona', 'catalunya'], 'ES'],
  [['lusail', 'losail'], 'QA'],
  [['silverstone'], 'GB'],
  [['nürburgring', 'nurburgring'], 'DE'],
];

/** Two-letter ISO country code for a track, or null if the track is unknown. */
export function countryOf(venue: string, course = ''): string | null {
  const haystack = `${venue} ${course}`.toLowerCase();
  for (const [needles, code] of COUNTRIES) {
    if (needles.some((n) => haystack.includes(n))) return code;
  }
  return null;
}

/** The flag as an emoji. Some systems (e.g. Windows) show the two letters instead. */
export function flagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames(language, { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
