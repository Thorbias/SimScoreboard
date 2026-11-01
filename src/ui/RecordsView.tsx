import { useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import { routes } from '../app/route';
import { formatDate } from '../format/date';
import { formatLapTime } from '../format/lapTime';
import { formatGap, formatSector } from '../format/time';
import {
  buildRecords,
  type LapRecord,
  type TrackRecords,
} from '../library/records';
import { trackTitle } from '../library/tracks';
import { CountryLabel } from './CountryLabel';

const trackKey = (t: TrackRecords) => `${t.venue}\u0000${t.course}`;

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

function TrackDetail({
  track,
  carClass,
  onClass,
}: {
  track: TrackRecords;
  carClass: string;
  onClass: (value: string) => void;
}) {
  const { t, language } = useApp();
  const classes = track.classes.map((c) => c.carClass);

  return (
    <div className="records-detail">
      <header className="records-head">
        <div>
          <h2>{trackTitle(track.venue, track.course)}</h2>
          <p className="layout">
            <CountryLabel venue={track.venue} course={track.course} />
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
          record={track.bestQualifying}
        />
        <BestCard label={t('records.bestRace')} record={track.bestRace} />
        <div className="stat card">
          <dt>{t('records.totalLaps')}</dt>
          <dd>
            <strong>{track.totalLaps}</strong>
            <span className="muted">
              {t('records.sessions', { n: track.sessionCount })}
            </span>
          </dd>
        </div>
        <div className="stat card">
          <dt>{t('records.cars')}</dt>
          <dd>
            <span>{track.cars.join(', ') || '–'}</span>
          </dd>
        </div>
      </dl>

      {track.classes.length === 0 && (
        <p className="empty">{t('records.noTime')}</p>
      )}

      {track.classes
        .filter((c) => carClass === '' || c.carClass === carClass)
        .map((c) => (
          <section key={c.carClass} className="layout-section">
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
                      <td className="muted">{formatDate(r.time, language)}</td>
                      {([0, 1, 2] as const).map((i) => (
                        <td key={i} className="num">
                          {formatSector(r.sectors[i])}
                        </td>
                      ))}
                      <td className={r.lap === c.best ? 'num pb' : 'num'}>
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
          </section>
        ))}
    </div>
  );
}

export function RecordsView() {
  const { t, sessions, aliases } = useApp();
  const tracks = useMemo(
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
  if (tracks.length === 0) return <p className="empty">{t('records.empty')}</p>;

  const track = tracks.find((x) => trackKey(x) === selected) ?? tracks[0]!;

  return (
    <>
      <h2>{t('records.title')}</h2>
      <div className="records-layout">
        <ul className="venue-list">
          {tracks.map((x) => (
            <li key={trackKey(x)}>
              <button
                aria-pressed={trackKey(x) === trackKey(track)}
                onClick={() => setSelected(trackKey(x))}
              >
                <strong>{trackTitle(x.venue, x.course)}</strong>
                <span className="muted">
                  <CountryLabel venue={x.venue} course={x.course} />
                </span>
                <span className="muted">
                  {t('records.sessions', { n: x.sessionCount })}
                </span>
                <span className="chips">
                  {x.classes.map((c) => (
                    <span className="chip" key={c.carClass}>
                      {c.carClass} {formatLapTime(c.best)}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <TrackDetail track={track} carClass={carClass} onClass={setCarClass} />
      </div>
    </>
  );
}
