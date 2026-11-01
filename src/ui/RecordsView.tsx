import { useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import { routes } from '../app/route';
import { formatDate } from '../format/date';
import { formatLapTime } from '../format/lapTime';
import { formatGap, formatSector } from '../format/time';
import {
  buildRecords,
  type LapRecord,
  type VenueRecords,
} from '../library/records';
import { CountryLabel } from './CountryLabel';

function RecordLink({ record }: { record: LapRecord }) {
  const { t, language } = useApp();
  return (
    <a className="record-link" href={routes.session(record.sessionId)}>
      <span className={`badge type-${record.sessionType}`}>
        {t(`type.${record.sessionType}`)}
      </span>{' '}
      <span className="muted">{formatDate(record.time, language)}</span>
    </a>
  );
}

function BestCard({
  label,
  record,
}: {
  label: string;
  record: LapRecord | null;
}) {
  const { t } = useApp();
  return (
    <div className="stat card">
      <dt>{label}</dt>
      <dd>
        {record ? (
          <>
            <strong className="mono">{formatLapTime(record.lap)}</strong>
            <span>
              {record.carClass} · {record.carType}
            </span>
            <RecordLink record={record} />
          </>
        ) : (
          <span className="muted">{t('records.noTime')}</span>
        )}
      </dd>
    </div>
  );
}

function VenueDetail({
  venue,
  carClass,
  onClass,
}: {
  venue: VenueRecords;
  carClass: string;
  onClass: (value: string) => void;
}) {
  const { t, language } = useApp();
  const classes = [
    ...new Set(venue.layouts.flatMap((l) => l.classes.map((c) => c.carClass))),
  ].sort((a, b) => a.localeCompare(b));
  const multipleLayouts = venue.layouts.length > 1;

  return (
    <div className="records-detail">
      <header className="records-head">
        <div>
          <h2>{venue.venue}</h2>
          <p className="layout">
            <CountryLabel venue={venue.venue} />
          </p>
        </div>
        {classes.length > 1 && (
          <label className="inline-select">
            {t('filter.class')}
            <select value={carClass} onChange={(e) => onClass(e.target.value)}>
              <option value="">{t('filter.all')}</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <dl className="cards">
        <BestCard
          label={t('records.bestQuali')}
          record={venue.bestQualifying}
        />
        <BestCard label={t('records.bestRace')} record={venue.bestRace} />
        <div className="stat card">
          <dt>{t('records.totalLaps')}</dt>
          <dd>
            <strong>{venue.totalLaps}</strong>
            <span className="muted">
              {t('records.sessions', { n: venue.sessionCount })}
            </span>
          </dd>
        </div>
        <div className="stat card">
          <dt>{t('records.cars')}</dt>
          <dd>
            <span>{venue.cars.join(', ') || '–'}</span>
          </dd>
        </div>
      </dl>

      {venue.layouts.length === 0 && (
        <p className="empty">{t('records.noTime')}</p>
      )}

      {venue.layouts.map((layout) => (
        <section key={layout.course} className="layout-section">
          {multipleLayouts && <h3>{layout.course}</h3>}
          {layout.classes
            .filter((c) => carClass === '' || c.carClass === carClass)
            .map((c) => (
              <div key={c.carClass}>
                <h4>{c.carClass}</h4>
                <div className="table-wrap">
                  <table className="results">
                    <thead>
                      <tr>
                        <th>{t('col.car')}</th>
                        <th>{t('records.session')}</th>
                        <th>{t('records.date')}</th>
                        <th className="num">{t('col.s1')}</th>
                        <th className="num">{t('col.s2')}</th>
                        <th className="num">{t('col.s3')}</th>
                        <th className="num">{t('lap.time')}</th>
                        <th className="num">{t('records.toBest')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.records.map((r) => (
                        <tr key={r.carType}>
                          <td>{r.carType || '–'}</td>
                          <td>
                            <RecordLink record={r} />
                          </td>
                          <td className="muted">
                            {formatDate(r.time, language)}
                          </td>
                          {([0, 1, 2] as const).map((i) => (
                            <td key={i} className="num">
                              {formatSector(r.sectors[i])}
                            </td>
                          ))}
                          <td
                            className={r.lap === c.best ? 'num fastest' : 'num'}
                          >
                            {formatLapTime(r.lap)}
                          </td>
                          <td className="num">
                            {r.lap === c.best ? '–' : formatGap(r.lap - c.best)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}

export function RecordsView() {
  const { t, sessions, aliases } = useApp();
  const venues = useMemo(
    () => buildRecords(sessions, aliases),
    [sessions, aliases],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [carClass, setCarClass] = useState('');

  if (aliases.length === 0) {
    return (
      <p className="notice">
        {t('records.needName')}{' '}
        <a href={routes.settings()}>{t('nav.settings')}</a>
      </p>
    );
  }
  if (venues.length === 0) return <p className="empty">{t('records.empty')}</p>;

  const venue = venues.find((v) => v.venue === selected) ?? venues[0]!;

  return (
    <>
      <h2>{t('records.title')}</h2>
      <div className="records-layout">
        <ul className="venue-list">
          {venues.map((v) => (
            <li key={v.venue}>
              <button
                aria-pressed={v.venue === venue.venue}
                onClick={() => setSelected(v.venue)}
              >
                <strong>{v.venue}</strong>
                <span className="muted">
                  <CountryLabel venue={v.venue} />
                </span>
                <span className="muted">
                  {t('records.layouts', { n: v.layouts.length })} ·{' '}
                  {t('records.sessions', { n: v.sessionCount })}
                </span>
                <span className="chips">
                  {v.bestByClass.map((b) => (
                    <span className="chip" key={b.carClass}>
                      {b.carClass} {formatLapTime(b.best)}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <VenueDetail venue={venue} carClass={carClass} onClass={setCarClass} />
      </div>
    </>
  );
}
