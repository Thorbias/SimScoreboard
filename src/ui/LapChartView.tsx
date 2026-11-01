import { useEffect, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useApp } from '../app/AppContext';
import { formatLapTime } from '../format/lapTime';
import { formatSector } from '../format/time';
import { isOwnDriver } from '../library/names';
import { compareLaps, median, type LapRow } from '../results/analysis';
import type { Entry, Session } from '../results/types';

const CHART_HEIGHT = 320;
const CUTOFF_FACTOR = 1.25;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function entryKey(e: Entry): string {
  return `${e.carNumber}|${e.driverName}`;
}

function entryLabel(e: Entry): string {
  return `#${e.carNumber} ${e.driverName} (${e.carClass})`;
}

function LapPlot({
  rows,
  nameA,
  nameB,
}: {
  rows: LapRow[];
  nameA: string;
  nameB: string;
}) {
  const { t, theme } = useApp();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const all = rows.flatMap((r) => [r.a?.time ?? null, r.b?.time ?? null]);
    const times = all.filter((v): v is number => v !== null);
    const mid = median(times);
    const limit = mid === null ? Infinity : mid * CUTOFF_FACTOR;
    const clip = (v: number | null | undefined) =>
      v == null || v > limit ? null : v;

    const data: uPlot.AlignedData = [
      rows.map((r) => r.lap),
      rows.map((r) => clip(r.a?.time)),
      rows.map((r) => clip(r.b?.time)),
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
          {
            label: nameA,
            stroke: cssVar('--you'),
            width: 2,
            value: lapValue,
            points: { show: true, size: 6 },
          },
          {
            label: nameB,
            stroke: cssVar('--accent'),
            width: 2,
            value: lapValue,
            points: { show: true, size: 6 },
          },
        ],
      },
      data,
      el,
    );

    const observer = new ResizeObserver(() =>
      plot.setSize({ width: el.clientWidth, height: CHART_HEIGHT }),
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      plot.destroy();
    };
  }, [rows, nameA, nameB, t, theme]);

  return <div className="lap-plot" ref={host} />;
}

function bestTime(entry: Entry | undefined): number | null {
  return entry?.bestLap ?? null;
}

export function LapChartView({ session }: { session: Session }) {
  const { t, aliases } = useApp();

  const choices = useMemo(
    () =>
      session.entries
        .filter((e) => e.laps.length > 0)
        .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)),
    [session],
  );

  const defaults = useMemo(() => {
    const a =
      choices.find((e) => isOwnDriver(e.driverName, aliases)) ?? choices[0];
    const rivals = choices.filter((e) => e !== a);
    const sameClass = rivals.filter((e) => e.carClass === a?.carClass);
    const pool = sameClass.length > 0 ? sameClass : rivals;
    const b = pool
      .filter((e) => e.bestLap !== null)
      .sort((x, y) => (x.bestLap as number) - (y.bestLap as number))[0];
    return { a: a ? entryKey(a) : '', b: b ? entryKey(b) : '' };
  }, [choices, aliases]);

  const [keyA, setKeyA] = useState<string | null>(null);
  const [keyB, setKeyB] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(true);

  const entryA = choices.find((e) => entryKey(e) === (keyA ?? defaults.a));
  const entryB = choices.find((e) => entryKey(e) === (keyB ?? defaults.b));
  const rows = useMemo(() => compareLaps(entryA, entryB), [entryA, entryB]);

  if (choices.length === 0) return <p className="empty">{t('lap.empty')}</p>;

  const bestA = bestTime(entryA);
  const bestB = bestTime(entryB);
  const delta = (v: number | null) =>
    v === null ? '–' : `${v > 0 ? '+' : ''}${v.toFixed(3)}`;

  const picker = (
    label: string,
    value: string,
    onChange: (key: string) => void,
  ) => (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {choices.map((e) => (
          <option key={entryKey(e)} value={entryKey(e)}>
            {entryLabel(e)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section>
      <div className="lap-controls">
        {picker(t('lap.driverA'), keyA ?? defaults.a, setKeyA)}
        {picker(t('lap.driverB'), keyB ?? defaults.b, setKeyB)}
        <label className="check">
          <input
            type="checkbox"
            checked={showChart}
            onChange={(e) => setShowChart(e.target.checked)}
          />
          {t('lap.showChart')}
        </label>
      </div>

      {showChart && entryA && entryB && (
        <>
          <LapPlot
            rows={rows}
            nameA={entryA.driverName}
            nameB={entryB.driverName}
          />
          <p className="hint">{t('lap.cutoff')}</p>
        </>
      )}

      <div className="table-wrap">
        <table className="results">
          <thead>
            <tr>
              <th className="num">{t('lap.lap')}</th>
              <th className="num group-a">{t('col.s1')} A</th>
              <th className="num group-a">{t('col.s2')} A</th>
              <th className="num group-a">{t('col.s3')} A</th>
              <th className="num group-a">{t('lap.time')} A</th>
              <th className="num group-b">{t('col.s1')} B</th>
              <th className="num group-b">{t('col.s2')} B</th>
              <th className="num group-b">{t('col.s3')} B</th>
              <th className="num group-b">{t('lap.time')} B</th>
              <th className="num">{t('lap.delta')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lap}>
                <td className="num">{row.lap}</td>
                {([0, 1, 2] as const).map((i) => (
                  <td key={`a${i}`} className="num">
                    {formatSector(row.a?.sectors[i])}
                  </td>
                ))}
                <td
                  className={
                    row.a?.time != null && row.a.time === bestA
                      ? 'num pb'
                      : 'num'
                  }
                >
                  {formatLapTime(row.a?.time)}
                </td>
                {([0, 1, 2] as const).map((i) => (
                  <td key={`b${i}`} className="num">
                    {formatSector(row.b?.sectors[i])}
                  </td>
                ))}
                <td
                  className={
                    row.b?.time != null && row.b.time === bestB
                      ? 'num pb'
                      : 'num'
                  }
                >
                  {formatLapTime(row.b?.time)}
                </td>
                <td className="num">{delta(row.delta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
