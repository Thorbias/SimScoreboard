import { useState } from 'react';
import { useApp } from '../app/AppContext';
import { formatDate } from '../format/date';
import { formatLapTime } from '../format/lapTime';
import type { DriverCount } from '../library/rivals';
import {
  recentMonths,
  type ClassOverview,
  type Overview,
  type RecordAge,
  type RecentRace,
} from '../library/records';
import { trackTitle } from '../library/tracks';

/** How many cars each class shows. */
const TOP_CARS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function signed(value: number, digits = 0): string {
  const text = value.toFixed(digits);
  return value > 0 ? `+${text}` : text;
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

function TrackLink({
  venue,
  course,
  onPickTrack,
}: {
  venue: string;
  course: string;
  onPickTrack: (venue: string, course: string) => void;
}) {
  return (
    <button className="linklike" onClick={() => onPickTrack(venue, course)}>
      {trackTitle(venue, course)}
    </button>
  );
}

function RecentRaces({
  races,
  onPickTrack,
}: {
  races: RecentRace[];
  onPickTrack: (venue: string, course: string) => void;
}) {
  const { t, language } = useApp();
  return (
    <div className="table-wrap">
      <table className="results">
        <thead>
          <tr>
            <th>{t('records.date')}</th>
            <th>{t('overall.track')}</th>
            <th>{t('col.car')}</th>
            <th className="num">{t('overall.grid')}</th>
            <th className="num">{t('overall.finish')}</th>
            <th className="num">{t('overall.change')}</th>
          </tr>
        </thead>
        <tbody>
          {races.map((r) => {
            const out = r.status === 'DNF' || r.status === 'DQ';
            const change =
              !out && r.grid !== null && r.position !== null
                ? r.grid - r.position
                : null;
            return (
              <tr key={r.sessionId}>
                <td className="muted">{formatDate(r.time, language)}</td>
                <td>
                  <TrackLink
                    venue={r.venue}
                    course={r.course}
                    onPickTrack={onPickTrack}
                  />
                </td>
                <td>
                  <span className="chip">{r.carClass}</span>
                  {r.carType || '–'}
                </td>
                <td className="num">{r.grid !== null ? `P${r.grid}` : '–'}</td>
                <td className="num">
                  {out
                    ? r.status
                    : r.position !== null
                      ? `P${r.position}`
                      : '–'}
                </td>
                <td
                  className={
                    change === null || change === 0
                      ? 'num'
                      : change > 0
                        ? 'num pb'
                        : 'num loss'
                  }
                >
                  {change === null || change === 0 ? '–' : signed(change)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecordAges({
  title,
  records,
  now,
  onPickTrack,
}: {
  title: string;
  records: RecordAge[];
  now: number;
  onPickTrack: (venue: string, course: string) => void;
}) {
  const { t, language } = useApp();
  if (records.length === 0) return null;
  return (
    <>
      <h5>{title}</h5>
      <div className="table-wrap">
        <table className="results">
          <thead>
            <tr>
              <th>{t('overall.track')}</th>
              <th>{t('col.car')}</th>
              <th className="num">{t('lap.time')}</th>
              <th>{t('records.date')}</th>
              <th className="num">{t('overall.age')}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={`${r.venue}|${r.course}|${r.carClass}`}>
                <td>
                  <TrackLink
                    venue={r.venue}
                    course={r.course}
                    onPickTrack={onPickTrack}
                  />
                </td>
                <td>
                  <span className="chip">{r.carClass}</span>
                  {r.carType || '–'}
                </td>
                <td className="num pb">{formatLapTime(r.lap)}</td>
                <td className="muted">{formatDate(r.time, language)}</td>
                <td className="num">
                  {t('overall.daysAgo', {
                    n: Math.max(0, Math.floor((now - r.time) / DAY_MS)),
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RivalTable({
  title,
  countLabel,
  drivers,
}: {
  title: string;
  countLabel: string;
  drivers: DriverCount[];
}) {
  const { t } = useApp();
  if (drivers.length === 0) return null;
  // The bars are measured against the driver with the most.
  const most = Math.max(...drivers.map((d) => d.count));
  return (
    <>
      <h5>{title}</h5>
      <div className="table-wrap">
        <table className="results">
          <thead>
            <tr>
              <th>{t('overall.rivalDriver')}</th>
              <th className="rival-bar-col" aria-hidden="true"></th>
              <th className="num">{countLabel}</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td className="rival-bar-col">
                  <span className="rival-bar" aria-hidden="true">
                    <i style={{ width: `${(d.count / most) * 100}%` }} />
                  </span>
                </td>
                <td className="num">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ActivityChart({ overview }: { overview: Overview }) {
  const { t, language } = useApp();
  const months = recentMonths(overview.activity, 12);
  const max = Math.max(1, ...months.map((m) => m.laps));
  const label = new Intl.DateTimeFormat(language, {
    month: 'short',
    year: '2-digit',
  });
  return (
    <div className="activity" role="img" aria-label={t('overall.activityNote')}>
      {months.map((m) => {
        const [year, month] = m.month.split('-').map(Number) as [
          number,
          number,
        ];
        const text = label.format(new Date(year, month - 1, 1));
        return (
          <div
            className="activity-col"
            key={m.month}
            title={`${text}: ${t('overall.lapsSessions', { laps: m.laps, sessions: m.sessions })}`}
          >
            <span className="activity-value">{m.laps > 0 ? m.laps : ''}</span>
            <span className="activity-bar">
              <i style={{ height: `${(m.laps / max) * 100}%` }} />
            </span>
            <span className="activity-label">{text}</span>
          </div>
        );
      })}
    </div>
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
  // Fixed for the lifetime of the view, so the ages do not change while reading.
  const [now] = useState(() => Date.now());
  const km = new Intl.NumberFormat(language, {
    maximumFractionDigits: 0,
  }).format(overview.distanceKm);
  const number = new Intl.NumberFormat(language);
  const { form, modes } = overview;
  const sessionsTotal = modes.multiplayer.sessions + modes.other.sessions;
  const lapsTotal = modes.multiplayer.laps + modes.other.laps;

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

      <h3 className="section-title">{t('overall.carsTitle')}</h3>
      {overview.classes.map((c) => (
        <ClassSection key={c.carClass} data={c} />
      ))}

      {overview.topTracks.length > 0 && (
        <section className="layout-section">
          <h3 className="section-title">{t('overall.topTracks')}</h3>
          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr>
                  <th>{t('overall.track')}</th>
                  <th>{t('col.laps')}</th>
                  <th className="num">{t('overall.sessions')}</th>
                </tr>
              </thead>
              <tbody>
                {overview.topTracks.map((x) => (
                  <tr key={`${x.venue}|${x.course}`}>
                    <td>
                      <TrackLink
                        venue={x.venue}
                        course={x.course}
                        onPickTrack={onPickTrack}
                      />
                    </td>
                    <td>
                      <Share
                        count={x.laps}
                        total={overview.totalLaps}
                        label={t('overall.share', {
                          n: number.format(x.laps),
                          percent: percent(x.laps, overview.totalLaps),
                        })}
                      />
                    </td>
                    <td className="num">{x.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {form.races > 0 && (
        <section className="layout-section">
          <h3 className="section-title">{t('overall.formTitle')}</h3>
          <dl className="cards">
            <Stat
              label={t('overall.retirements')}
              value={`${form.dnfs} / ${form.races}`}
              note={t('overall.winRate', {
                percent: percent(form.dnfs, form.races),
              })}
            />
            {form.averageFinish !== null && (
              <Stat
                label={t('overall.avgFinish', { n: form.recent.length })}
                value={`P${form.averageFinish.toFixed(1)}`}
              />
            )}
            {form.averageGain !== null && (
              <Stat
                label={t('overall.avgGain', { n: form.recent.length })}
                value={signed(form.averageGain, 1)}
              />
            )}
          </dl>
          <h5>{t('overall.recentRaces')}</h5>
          <RecentRaces races={form.recent} onPickTrack={onPickTrack} />
        </section>
      )}

      {(overview.rivals.sharedRaces.length > 0 ||
        overview.rivals.collisions.length > 0) && (
        <section className="layout-section">
          <h3 className="section-title">{t('overall.rivalsTitle')}</h3>
          <p className="muted small">{t('overall.rivalsNote')}</p>
          <RivalTable
            title={t('overall.sharedRaces')}
            countLabel={t('overall.rivalRaces')}
            drivers={overview.rivals.sharedRaces}
          />
          <RivalTable
            title={t('overall.collisions')}
            countLabel={t('overall.rivalCollisions')}
            drivers={overview.rivals.collisions}
          />
        </section>
      )}

      {(overview.newestRecords.length > 0 ||
        overview.oldestRecords.length > 0) && (
        <section className="layout-section">
          <h3 className="section-title">{t('overall.recordsTitle')}</h3>
          <p className="muted small">
            {t('overall.recentRecords', { n: overview.recentRecordCount })}
          </p>
          <RecordAges
            title={t('overall.newest')}
            records={overview.newestRecords}
            now={now}
            onPickTrack={onPickTrack}
          />
          <RecordAges
            title={t('overall.oldest')}
            records={overview.oldestRecords}
            now={now}
            onPickTrack={onPickTrack}
          />
        </section>
      )}

      {sessionsTotal > 0 && (
        <section className="layout-section">
          <h3 className="section-title">{t('overall.modeTitle')}</h3>
          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr>
                  <th>{t('overall.mode')}</th>
                  <th>{t('overall.sessions')}</th>
                  <th>{t('col.laps')}</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['overall.multiplayer', modes.multiplayer],
                    ['overall.single', modes.other],
                  ] as const
                ).map(([key, mode]) => (
                  <tr key={key}>
                    <td>{t(key)}</td>
                    <td>
                      <Share
                        count={mode.sessions}
                        total={sessionsTotal}
                        label={t('overall.share', {
                          n: mode.sessions,
                          percent: percent(mode.sessions, sessionsTotal),
                        })}
                      />
                    </td>
                    <td>
                      <Share
                        count={mode.laps}
                        total={lapsTotal}
                        label={t('overall.share', {
                          n: number.format(mode.laps),
                          percent: percent(mode.laps, lapsTotal),
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {overview.activity.length > 0 && (
        <section className="layout-section">
          <h3 className="section-title">{t('overall.activityTitle')}</h3>
          <p className="muted small">{t('overall.activityNote')}</p>
          <ActivityChart overview={overview} />
        </section>
      )}
    </div>
  );
}
