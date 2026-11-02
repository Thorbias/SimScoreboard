import { useEffect, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useApp } from '../app/AppContext';
import { formatLapTime } from '../format/lapTime';
import { formatSector } from '../format/time';
import { isOwnDriver } from '../library/names';
import { entryKey, median } from '../results/analysis';
import {
  compareLapsMulti,
  defaultLapDrivers,
  MAX_LAP_DRIVERS,
  removeLapDriver,
  setLapDriverAt,
  suggestLapDriver,
  type MultiLapRow,
} from '../results/lapSelection';
import type { Entry, Session } from '../results/types';
import { observeWidth } from './plotSize';

const CHART_HEIGHT = 320;
const CUTOFF_FACTOR = 1.25;

/** Colour token and letter of each slot. A is the own driver's highlight colour. */
const SLOT_VARS = ['--you', '--rival-b', '--rival-c', '--rival-d'] as const;
const SLOT_LETTERS = ['A', 'B', 'C', 'D'] as const;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function entryLabel(e: Entry): string {
  return `#${e.carNumber} ${e.driverName} (${e.carClass})`;
}

function LapPlot({ rows, names }: { rows: MultiLapRow[]; names: string[] }) {
  const { t, theme } = useApp();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const times = rows
      .flatMap((r) => r.laps.map((l) => l?.time ?? null))
      .filter((v): v is number => v !== null);
    const mid = median(times);
    const limit = mid === null ? Infinity : mid * CUTOFF_FACTOR;
    const clip = (v: number | null | undefined) =>
      v == null || v > limit ? null : v;

    // Laps without a time and the cut-off slow laps leave gaps. Every driver
    // gets a second, dashed series that bridges them; it is drawn first, so the
    // solid line covers it wherever there is no gap.
    const values = names.map((_, i) => rows.map((r) => clip(r.laps[i]?.time)));
    const data: uPlot.AlignedData = [
      rows.map((r) => r.lap),
      ...values,
      ...values,
    ];

    const muted = cssVar('--muted');
    const line = cssVar('--line');
    const axis = {
      stroke: muted,
      grid: { stroke: line, width: 1 },
      ticks: { stroke: line, width: 1 },
    };
    const lapValue = (_u: uPlot, v: number | null) =>
      v == null ? '–' : formatLapTime(v);

    const plot = new uPlot(
      {
        width: el.clientWidth || 600,
        height: CHART_HEIGHT,
        scales: {
          x: { time: false },
          y: {
            range: (_u, min, max) => {
              const pad = Math.max((max - min) * 0.08, 0.2);
              return [min - pad, max + pad];
            },
          },
        },
        axes: [
          { ...axis, label: t('lap.axisLap') },
          {
            ...axis,
            label: t('lap.axisTime'),
            size: 70,
            values: (_u, vals) => vals.map((v) => formatLapTime(v)),
          },
        ],
        series: [
          { label: t('lap.lap') },
          ...names.map((name, i) => ({
            label: name,
            stroke: cssVar(SLOT_VARS[i] ?? '--muted'),
            width: 1.5,
            dash: [6, 5],
            spanGaps: true,
            value: lapValue,
            points: { show: false },
          })),
          ...names.map((name, i) => ({
            label: name,
            stroke: cssVar(SLOT_VARS[i] ?? '--muted'),
            width: 2,
            value: lapValue,
            points: { show: true, size: 6 },
          })),
        ],
        hooks: {
          ready: [
            (u) => {
              // The bridging series are not drivers of their own: keep them
              // out of the legend.
              const rowsInLegend = u.root.querySelectorAll(
                '.u-legend .u-series',
              );
              for (let i = 1; i <= names.length; i++) {
                const row = rowsInLegend[i];
                if (row instanceof HTMLElement) row.style.display = 'none';
              }
            },
          ],
        },
      },
      data,
      el,
    );

    const stop = observeWidth(el, (width) =>
      plot.setSize({ width, height: CHART_HEIGHT }),
    );
    return () => {
      stop();
      plot.destroy();
    };
  }, [rows, names, t, theme]);

  return (
    <div className="lap-plot">
      <div className="lap-plot-host" ref={host} />
    </div>
  );
}

const delta = (v: number | null) =>
  v === null ? '–' : `${v > 0 ? '+' : ''}${v.toFixed(3)}`;

export function LapChartView({
  session,
  selected,
  onSelect,
}: {
  session: Session;
  /** Keys of the chosen drivers in slot order, or null to use the defaults. */
  selected: string[] | null;
  onSelect: (next: string[]) => void;
}) {
  const { t, aliases } = useApp();
  const [showChart, setShowChart] = useState(true);

  const choices = useMemo(
    () =>
      session.entries
        .filter((e) => e.laps.length > 0)
        .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)),
    [session],
  );

  const defaults = useMemo(
    () => defaultLapDrivers(choices, (e) => isOwnDriver(e.driverName, aliases)),
    [choices, aliases],
  );

  const keys = useMemo(
    () =>
      (selected ?? defaults).filter((k) =>
        choices.some((e) => entryKey(e) === k),
      ),
    [selected, defaults, choices],
  );
  const entries = useMemo(
    () => keys.map((k) => choices.find((e) => entryKey(e) === k) as Entry),
    [keys, choices],
  );
  const rows = useMemo(() => compareLapsMulti(entries), [entries]);
  const names = useMemo(() => entries.map((e) => e.driverName), [entries]);

  if (choices.length === 0) return <p className="empty">{t('lap.empty')}</p>;

  const suggestion =
    keys.length < MAX_LAP_DRIVERS ? suggestLapDriver(choices, keys) : null;
  const best = entries.map((e) => e.bestLap);

  return (
    <section>
      <div className="lap-controls">
        {keys.map((key, i) => (
          <div className={`slot slot-${i}`} key={key}>
            <label>
              <span className="slot-label">
                <i className="slot-dot" aria-hidden="true" />
                {t('lap.driver', { slot: SLOT_LETTERS[i] ?? '' })}
              </span>
              <select
                value={key}
                onChange={(e) =>
                  onSelect(setLapDriverAt(keys, i, e.target.value))
                }
              >
                {choices.map((c) => (
                  <option
                    key={entryKey(c)}
                    value={entryKey(c)}
                    disabled={entryKey(c) !== key && keys.includes(entryKey(c))}
                  >
                    {entryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="slot-remove"
              title={t('lap.remove', { slot: SLOT_LETTERS[i] ?? '' })}
              aria-label={t('lap.remove', { slot: SLOT_LETTERS[i] ?? '' })}
              onClick={() => onSelect(removeLapDriver(keys, i))}
            >
              ×
            </button>
          </div>
        ))}
        {suggestion && (
          <button
            className="slot-add"
            onClick={() => onSelect([...keys, suggestion])}
          >
            + {t('lap.add')}
          </button>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={showChart}
            onChange={(e) => setShowChart(e.target.checked)}
          />
          {t('lap.showChart')}
        </label>
      </div>

      {entries.length === 0 ? (
        <p className="empty">{t('lap.noneSelected')}</p>
      ) : (
        <>
          {showChart && (
            <>
              <LapPlot rows={rows} names={names} />
              <p className="hint">{t('lap.cutoff')}</p>
            </>
          )}

          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr>
                  <th className="num">{t('lap.lap')}</th>
                  {entries.map((e, i) => (
                    <SlotHeader key={entryKey(e)} index={i} />
                  ))}
                  {entries.slice(1).map((e, i) => (
                    <th key={`d${entryKey(e)}`} className={`num slot-${i + 1}`}>
                      {t('lap.delta', { slot: SLOT_LETTERS[i + 1] ?? '' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.lap}>
                    <td className="num">{row.lap}</td>
                    {entries.map((e, i) => {
                      const lap = row.laps[i];
                      return (
                        <SlotCells
                          key={entryKey(e)}
                          sectors={lap?.sectors}
                          time={lap?.time ?? null}
                          isBest={lap?.time != null && lap.time === best[i]}
                        />
                      );
                    })}
                    {row.deltas.slice(1).map((d, i) => (
                      <td key={i} className="num">
                        {delta(d)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function SlotHeader({ index }: { index: number }) {
  const { t } = useApp();
  const letter = SLOT_LETTERS[index] ?? '';
  return (
    <>
      <th className={`num slot-${index}`}>
        {t('col.s1')} {letter}
      </th>
      <th className={`num slot-${index}`}>
        {t('col.s2')} {letter}
      </th>
      <th className={`num slot-${index}`}>
        {t('col.s3')} {letter}
      </th>
      <th className={`num slot-${index}`}>
        {t('lap.time')} {letter}
      </th>
    </>
  );
}

function SlotCells({
  sectors,
  time,
  isBest,
}: {
  sectors: [number | null, number | null, number | null] | undefined;
  time: number | null;
  isBest: boolean;
}) {
  return (
    <>
      {([0, 1, 2] as const).map((i) => (
        <td key={i} className="num">
          {formatSector(sectors?.[i])}
        </td>
      ))}
      <td className={isBest ? 'num pb' : 'num'}>{formatLapTime(time)}</td>
    </>
  );
}
