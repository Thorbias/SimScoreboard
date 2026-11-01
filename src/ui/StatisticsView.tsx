import { useApp } from '../app/AppContext';
import { formatLapTime } from '../format/lapTime';
import { formatSector } from '../format/time';
import { isOwnDriver } from '../library/names';
import { classStats, type LapMark } from '../results/analysis';
import { classesOf } from '../results/table';
import type { Entry, Session } from '../results/types';

function DriverName({ entry }: { entry: Entry }) {
  const { aliases, t } = useApp();
  return (
    <>
      #{entry.carNumber} {entry.driverName}
      {isOwnDriver(entry.driverName, aliases) && (
        <span className="badge you">{t('results.you')}</span>
      )}
    </>
  );
}

function Mark({
  label,
  mark,
  format,
}: {
  label: string;
  mark: LapMark | null;
  format: (seconds: number) => string;
}) {
  const { t } = useApp();
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>
        {mark ? (
          <>
            <strong className="mono">{format(mark.time)}</strong>
            <span>
              <DriverName entry={mark.entry} />
            </span>
            <span className="muted">{t('stats.lapN', { n: mark.lap })}</span>
          </>
        ) : (
          t('stats.none')
        )}
      </dd>
    </div>
  );
}

export function StatisticsView({ session }: { session: Session }) {
  const { t } = useApp();
  const classes = classesOf(session);

  return (
    <section className="stats-grid">
      {classes.map((carClass) => {
        const s = classStats(session, carClass);
        return (
          <article className="panel" key={carClass}>
            <h3>{carClass}</h3>
            <dl>
              <Mark
                label={t('stats.fastestLap')}
                mark={s.fastestLap}
                format={formatLapTime}
              />
              {([0, 1, 2] as const).map((i) => (
                <Mark
                  key={i}
                  label={t('stats.fastestSector', { n: i + 1 })}
                  mark={s.fastestSectors[i]}
                  format={formatSector}
                />
              ))}
              <div className="stat">
                <dt>{t('stats.consistent')}</dt>
                <dd>
                  {s.consistent ? (
                    <>
                      <span>
                        <DriverName entry={s.consistent.entry} />
                      </span>
                      <span className="muted">
                        {t('stats.consistentDetail', {
                          deviation: s.consistent.deviation.toFixed(3),
                          laps: s.consistent.laps,
                        })}
                      </span>
                    </>
                  ) : (
                    t('stats.none')
                  )}
                </dd>
              </div>
              <div className="stat">
                <dt>{t('stats.gained')}</dt>
                <dd>
                  {s.mostGained ? (
                    <>
                      <strong>
                        +{t('stats.places', { n: s.mostGained.places })}
                      </strong>
                      <span>
                        <DriverName entry={s.mostGained.entry} />
                      </span>
                    </>
                  ) : (
                    t('stats.none')
                  )}
                </dd>
              </div>
              <div className="stat">
                <dt>{t('stats.lost')}</dt>
                <dd>
                  {s.mostLost ? (
                    <>
                      <strong>
                        −{t('stats.places', { n: -s.mostLost.places })}
                      </strong>
                      <span>
                        <DriverName entry={s.mostLost.entry} />
                      </span>
                    </>
                  ) : (
                    t('stats.none')
                  )}
                </dd>
              </div>
              <div className="stat">
                <dt>{t('stats.tyre')}</dt>
                <dd>
                  {s.tyre ? (
                    <>
                      <strong>{s.tyre.compound}</strong>
                      <span className="muted">
                        {t('stats.tyreLaps', { n: s.tyre.laps })}
                      </span>
                    </>
                  ) : (
                    t('stats.none')
                  )}
                </dd>
              </div>
            </dl>
          </article>
        );
      })}
    </section>
  );
}
