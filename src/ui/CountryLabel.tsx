import { useApp } from '../app/AppContext';
import { flagUrl } from '../library/flags';
import { countryName, countryOf } from '../library/tracks';

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
  const flag = flagUrl(code);
  return (
    <span className="country">
      {flag && (
        <img
          className="flag"
          src={flag}
          alt=""
          width={20}
          height={15}
          loading="lazy"
        />
      )}
      {countryName(code, language)}
    </span>
  );
}
