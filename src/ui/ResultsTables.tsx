import { useApp } from '../app/AppContext';
import { formatLapTime } from '../format/lapTime';
import { formatGap, formatRaceTime, formatSector } from '../format/time';
import { isOwnDriver } from '../library/names';
import { qualiRows, raceRows, type Gap, type Scope } from '../results/table';
import type { Entry, Session } from '../results/types';
import { SectorBar, type SegmentRole } from './SectorBar';

/** A table row can open the lap chart for its driver if it has laps. */
function canPick(entry: Entry, onPick?: (entry: Entry) => void): boolean {
  return onPick !== undefined && entry.laps.length > 0;
}

function rowClass(own: boolean, clickable: boolean): string | undefined {
  const classes = [own ? 'own' : '', clickable ? 'clickable' : '']
    .filter(Boolean)
    .join(' ');
  return classes || undefined;
}

function DriverCell({
  entry,
  onPick,
}: {
  entry: Entry;
  onPick?: (entry: Entry) => void;
}) {
  const { aliases, t } = useApp();
  const own = isOwnDriver(entry.driverName, aliases);
  return (
    <td className="driver">
      {canPick(entry, onPick) ? (
        <button
          className="driver-link"
          onClick={(e) => {
            e.stopPropagation();
            onPick?.(entry);
          }}
        >
          {entry.driverName}
        </button>
      ) : (
        entry.driverName
      )}
      {own && <span className="badge you">{t('results.you')}</span>}
    </td>
  );
}

function CarCell({ entry, showClass }: { entry: Entry; showClass: boolean }) {
  return (
    <td className="car">
      {showClass && <span className="chip">{entry.carClass}</span>}
      {entry.carType}
    </td>
  );
}

function GapText({ gap }: { gap: Gap }) {
  const { t } = useApp();
  switch (gap.kind) {
    case 'time':
      return <>{formatGap(gap.seconds)}</>;
    case 'laps':
      return <>{t('gap.laps', { n: gap.laps })}</>;
    case 'dnf':
      return <>{t('gap.dnf')}</>;
    case 'dq':
      return <>{t('gap.dq')}</>;
    default:
      return <>–</>;
  }
}

export function RaceTable({
  session,
  scope,
  onPick,
}: {
  session: Session;
  scope: Scope;
  onPick?: (entry: Entry) => void;
}) {
  const { aliases, t } = useApp();
  const rows = raceRows(session, scope);
  const showClass = scope.kind === 'overall';
  return (
    <div className="table-wrap">
      <table className="results">
        <thead>
          <tr>
            <th className="num">{t('col.pos')}</th>
            <th className="num">{t('col.number')}</th>
            <th>{t('col.driver')}</th>
            <th>{t('col.car')}</th>
            <th>{t('col.tyre')}</th>
            <th className="num">{t('col.best')}</th>
            <th className="num">{t('col.gap')}</th>
            <th className="num">{t('col.stops')}</th>
            <th className="num">{t('col.laps')}</th>
            <th className="num">{t('col.time')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.entry.driverName}|${row.entry.carNumber}`}
              className={rowClass(
                isOwnDriver(row.entry.driverName, aliases),
                canPick(row.entry, onPick),
              )}
              title={
                canPick(row.entry, onPick)
                  ? t('results.compareLaps')
                  : undefined
              }
              onClick={
                canPick(row.entry, onPick)
                  ? () => onPick?.(row.entry)
                  : undefined
              }
            >
              <td className="num">{row.rank}</td>
              <td className="num">{row.entry.carNumber}</td>
              <DriverCell entry={row.entry} onPick={onPick} />
              <CarCell entry={row.entry} showClass={showClass} />
              <td>{row.tyre ?? '–'}</td>
              <td className={row.fastestInClass ? 'num fastest' : 'num'}>
                {formatLapTime(row.entry.bestLap)}
              </td>
              <td className="num">
                <GapText gap={row.gap} />
              </td>
              <td className="num">{row.entry.pitstops}</td>
              <td className="num">{row.entry.lapCount}</td>
              <td className="num">
                {row.entry.finishTime !== null
                  ? formatRaceTime(row.entry.finishTime)
                  : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function QualiTable({
  session,
  scope,
  onPick,
}: {
  session: Session;
  scope: Scope;
  onPick?: (entry: Entry) => void;
}) {
  const { aliases, t } = useApp();
  const rows = qualiRows(session, scope);
  const showClass = scope.kind === 'overall';
  return (
    <div className="table-wrap">
      <table className="results">
        <thead>
          <tr>
            <th className="num">{t('col.pos')}</th>
            <th className="num">{t('col.number')}</th>
            <th>{t('col.driver')}</th>
            <th>{t('col.car')}</th>
            <th>{t('col.tyre')}</th>
            <th>{t('col.sectors')}</th>
            <th className="num">{t('col.s1')}</th>
            <th className="num">{t('col.s2')}</th>
            <th className="num">{t('col.s3')}</th>
            <th className="num">{t('col.best')}</th>
            <th className="num">{t('col.gapPole')}</th>
            <th className="num">{t('col.laps')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.entry.driverName}|${row.entry.carNumber}`}
              className={rowClass(
                isOwnDriver(row.entry.driverName, aliases),
                canPick(row.entry, onPick),
              )}
              title={
                canPick(row.entry, onPick)
                  ? t('results.compareLaps')
                  : undefined
              }
              onClick={
                canPick(row.entry, onPick)
                  ? () => onPick?.(row.entry)
                  : undefined
              }
            >
              <td className="num">{row.rank}</td>
              <td className="num">{row.entry.carNumber}</td>
              <DriverCell entry={row.entry} onPick={onPick} />
              <CarCell entry={row.entry} showClass={showClass} />
              <td>{row.tyre ?? '–'}</td>
              <td>
                <SectorBar
                  segments={
                    row.fastestSectors.map((fastest) =>
                      fastest ? 'fastest' : 'neutral',
                    ) as [SegmentRole, SegmentRole, SegmentRole]
                  }
                />
              </td>
              {([0, 1, 2] as const).map((i) => (
                <td
                  key={i}
                  className={row.fastestSectors[i] ? 'num fastest' : 'num'}
                >
                  {formatSector(row.sectors[i])}
                </td>
              ))}
              <td className={row.fastestInClass ? 'num fastest' : 'num'}>
                {formatLapTime(row.entry.bestLap)}
              </td>
              <td className="num">
                {row.gap === null || row.gap === 0 ? '–' : formatGap(row.gap)}
              </td>
              <td className="num">{row.entry.lapCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
