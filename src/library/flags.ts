// Flag images from the `flag-icons` package (MIT). Only the countries of the
// tracks in `tracks.ts` are imported, so only those end up in the build.
import be from 'flag-icons/flags/4x3/be.svg';
import bh from 'flag-icons/flags/4x3/bh.svg';
import br from 'flag-icons/flags/4x3/br.svg';
import es from 'flag-icons/flags/4x3/es.svg';
import fr from 'flag-icons/flags/4x3/fr.svg';
import gb from 'flag-icons/flags/4x3/gb.svg';
import it from 'flag-icons/flags/4x3/it.svg';
import jp from 'flag-icons/flags/4x3/jp.svg';
import pt from 'flag-icons/flags/4x3/pt.svg';
import qa from 'flag-icons/flags/4x3/qa.svg';
import us from 'flag-icons/flags/4x3/us.svg';

const FLAGS: Record<string, string> = {
  BE: be,
  BH: bh,
  BR: br,
  ES: es,
  FR: fr,
  GB: gb,
  IT: it,
  JP: jp,
  PT: pt,
  QA: qa,
  US: us,
};

/** URL of the flag image for a two-letter country code, or null if there is none. */
export function flagUrl(code: string): string | null {
  return FLAGS[code.toUpperCase()] ?? null;
}
