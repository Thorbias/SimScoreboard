import { useApp } from '../app/AppContext';
import { countryName, countryOf, flagEmoji } from '../library/tracks';

/** Country and flag of a track; renders nothing for tracks that are not in the table. */
export function CountryLabel({
  venue,
  course,
}: {
  venue: string;
  course?: string;
}) {
  const { language } = useApp();
  const code = countryOf(venue, course);
  if (!code) return null;
  return (
    <span className="country">
      <span aria-hidden="true">{flagEmoji(code)}</span>{' '}
      {countryName(code, language)}
    </span>
  );
}
