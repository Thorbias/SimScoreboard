import { useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import { formatClock } from '../format/time';
import { isOwnDriver } from '../library/names';
import { findEntry, lapAt } from '../results/analysis';
import type { Session, StreamEvent } from '../results/types';

type IncidentEvent = Exclude<StreamEvent, { kind: 'chat' }>;
type Kind = IncidentEvent['kind'];

const KINDS: Kind[] = ['contact', 'damage', 'trackLimits', 'penalty'];

export function isIncident(event: StreamEvent): event is IncidentEvent {
  return event.kind !== 'chat';
}

export function IncidentsView({ session }: { session: Session }) {
  const { t, aliases } = useApp();
  const [kind, setKind] = useState<Kind | ''>('');
  const [carClass, setCarClass] = useState('');
  const [driver, setDriver] = useState('');

  const rows = useMemo(
    () =>
      session.events.filter(isIncident).map((event) => {
        const entry = findEntry(session, event.driver);
        const time = event.time;
        return {
          event,
          carClass: entry?.carClass ?? '',
          lap:
            entry && time !== null
              ? lapAt(entry, time)
              : event.kind === 'trackLimits'
                ? event.lap
                : null,
        };
      }),
    [session],
  );

  const classes = [...new Set(rows.map((r) => r.carClass).filter(Boolean))];
  const drivers = [...new Set(rows.map((r) => r.event.driver))].sort((a, b) =>
    a.localeCompare(b),
  );
  const shown = rows.filter(
    (r) =>
      (kind === '' || r.event.kind === kind) &&
      (carClass === '' || r.carClass === carClass) &&
      (driver === '' || r.event.driver === driver),
  );

  const detail = (event: IncidentEvent): string => {
    switch (event.kind) {
      case 'contact': {
        const force = event.force !== null ? Math.round(event.force) : '–';
        return event.other
          ? t('inc.withDriver', { name: event.other, force })
          : t('inc.withObject', { object: event.object ?? '', force });
      }
      case 'damage':
        return t('inc.damage', { part: event.part });
      case 'trackLimits':
        return event.warningPoints
          ? t('inc.points', {
              outcome: event.outcome,
              points: event.currentPoints ?? event.warningPoints,
            })
          : event.outcome;
      case 'penalty':
        return event.served
          ? t('inc.served', { penalty: event.penalty })
          : t('inc.penaltyDetail', {
              penalty: event.penalty,
              reason: event.reason,
            });
    }
  };

  if (rows.length === 0) return <p className="empty">{t('inc.empty')}</p>;

  const total = session.minutes !== null ? session.minutes * 60 : null;

  return (
    <section>
      <div className="filters">
        <label>
          {t('inc.type')}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind | '')}
          >
            <option value="">{t('filter.all')}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`inc.type.${k}`)}
              </option>
            ))}
          </select>
        </label>
        {classes.length > 1 && (
          <label>
            {t('inc.class')}
            <select
              value={carClass}
              onChange={(e) => setCarClass(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t('inc.driver')}
          <select value={driver} onChange={(e) => setDriver(e.target.value)}>
            <option value="">{t('filter.all')}</option>
            {drivers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="empty">{t('inc.noMatch')}</p>
      ) : (
        <div className="table-wrap">
          <table className="results">
            <thead>
              <tr>
                <th className="num">{t('inc.time')}</th>
                <th className="num">{t('inc.remaining')}</th>
                <th>{t('inc.type')}</th>
                <th>{t('inc.driver')}</th>
                <th>{t('inc.class')}</th>
                <th className="num">{t('inc.lap')}</th>
                <th>{t('inc.detail')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr
                  key={i}
                  className={
                    isOwnDriver(r.event.driver, aliases) ? 'own' : undefined
                  }
                >
                  <td className="num">{formatClock(r.event.time)}</td>
                  <td className="num">
                    {total !== null && r.event.time !== null
                      ? formatClock(Math.max(0, total - r.event.time))
                      : '–'}
                  </td>
                  <td>{t(`inc.type.${r.event.kind}`)}</td>
                  <td>{r.event.driver}</td>
                  <td>{r.carClass || '–'}</td>
                  <td className="num">{r.lap ?? '–'}</td>
                  <td>{detail(r.event)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
