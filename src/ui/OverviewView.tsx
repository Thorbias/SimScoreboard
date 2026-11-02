import { useApp } from '../app/AppContext';
import type { ClassOverview, Overview } from '../library/records';
import { trackTitle } from '../library/tracks';

/** How many cars each class shows. */
const TOP_CARS = 5;

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function Share({
  count,
  total,
  label,
}: {
  count: number;
  total: number;
  label: string;
}) {
  const p = percent(count, total);
  return (
    <span className="share">
      <span className="share-track" aria-hidden="true">
        <i style={{ width: `${p}%` }} />
      </span>
      <span>{label}</span>
    </span>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="stat card">
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        {note && <span className="muted">{note}</span>}
      </dd>
    </div>
  );
}

function ClassSection({ data }: { data: ClassOverview }) {
  const { t } = useApp();
  const shown = data.cars.slice(0, TOP_CARS);
  const hidden = data.cars.length - shown.length;
  return (
    <section className="layout-section">
      <h4>{data.carClass}</h4>
      <p className="muted small">
        {t('overall.classSub', { n: data.layouts })}
      </p>
      <div className="table-wrap">
        <table className="results">
          <thead>
            <tr>
              <th>{t('col.car')}</th>
              <th>{t('overall.bests')}</th>
              <th>{t('col.laps')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((car) => (
              <tr key={car.carType}>
                <td>{car.carType || '–'}</td>
                <td>
                  <Share
                    count={car.bests}
                    total={data.layouts}
                    label={t('overall.share', {
                      n: car.bests,
                      percent: percent(car.bests, data.layouts),
                    })}
                  />
                </td>
                <td>
                  <Share
                    count={car.laps}
                    total={data.totalLaps}
                    label={t('overall.share', {
                      n: car.laps,
                      percent: percent(car.laps, data.totalLaps),
                    })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 && (
        <p className="muted small">{t('overall.more', { n: hidden })}</p>
      )}
    </section>
  );
}

/** The summary over all tracks, shown as the first entry of the personal bests. */
export function OverviewDetail({
  overview,
  onPickTrack,
}: {
  overview: Overview;
  onPickTrack: (venue: string, course: string) => void;
}) {
  const { t, language } = useApp();
  const km = new Intl.NumberFormat(language, {
    maximumFractionDigits: 0,
  }).format(overview.distanceKm);
  const number = new Intl.NumberFormat(language);

  return (
    <div className="records-detail">
      <header className="records-head">
        <div>
          <h2>{t('records.overall')}</h2>
          <p className="layout">{t('overall.subtitle')}</p>
        </div>
      </header>

      <dl className="cards">
        <Stat
          label={t('overall.sessions')}
          value={number.format(overview.sessionCount)}
        />
        <Stat
          label={t('overall.laps')}
          value={number.format(overview.totalLaps)}
        />
        <Stat
          label={t('overall.distance')}
          value={t('overall.distanceValue', { km })}
        />
        <Stat
          label={t('overall.layouts')}
          value={number.format(overview.layoutCount)}
        />
        <Stat
          label={t('overall.races')}
          value={number.format(overview.races)}
        />
        <Stat
          label={t('overall.wins')}
          value={number.format(overview.wins)}
          note={
            overview.races > 0
              ? t('overall.winRate', {
                  percent: percent(overview.wins, overview.races),
                })
              : undefined
          }
        />
        <Stat
          label={t('overall.podiums')}
          value={number.format(overview.podiums)}
          note={
            overview.races > 0
              ? t('overall.winRate', {
                  percent: percent(overview.podiums, overview.races),
                })
              : undefined
          }
        />
      </dl>

      <p className="hint">{t('overall.hint')}</p>

      {overview.classes.map((c) => (
        <ClassSection key={c.carClass} data={c} />
      ))}

      {overview.topTracks.length > 0 && (
        <section className="layout-section">
          <h4>{t('overall.topTracks')}</h4>
          <ul className="top-tracks">
            {overview.topTracks.map((x) => (
              <li key={`${x.venue}|${x.course}`}>
                <button
                  className="linklike"
                  onClick={() => onPickTrack(x.venue, x.course)}
                >
                  {trackTitle(x.venue, x.course)}
                </button>
                <span className="muted">
                  {t('overall.lapsSessions', {
                    laps: number.format(x.laps),
                    sessions: x.sessions,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
