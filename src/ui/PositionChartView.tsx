import { useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import { isOwnDriver } from '../library/names';
import { positionChart } from '../results/analysis';
import { classesOf } from '../results/table';
import type { Entry, Session } from '../results/types';

const WIDTH = 1000;
const MARGIN = { left: 44, right: 170, top: 22, bottom: 34 };
const ROW_HEIGHT = 24;

function entryKey(e: Entry): string {
  return `${e.carNumber}|${e.driverName}`;
}

/**
 * A stable colour per entry, spread around the colour wheel. The range around
 * cyan is skipped, because cyan means "you" everywhere in the app.
 */
function colour(index: number): string {
  return `hsl(${(210 + ((index * 47) % 330)) % 360} 70% 60%)`;
}

export function PositionChartView({ session }: { session: Session }) {
  const { t, aliases } = useApp();
  const classes = classesOf(session);
  const [carClass, setCarClass] = useState('');
  const scoped = carClass && classes.includes(carClass) ? carClass : null;
  const data = useMemo(() => positionChart(session, scoped), [session, scoped]);

  const ownKey = session.entries.find((e) =>
    isOwnDriver(e.driverName, aliases),
  );
  // undefined = follow the own driver, null = nothing highlighted.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const focus =
    picked === undefined ? (ownKey ? entryKey(ownKey) : null) : picked;

  const drawn = data.series.filter((s) => s.points.length > 1);
  if (drawn.length === 0) return <p className="empty">{t('pos.empty')}</p>;

  const { laps, maxPosition } = data;
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const height =
    MARGIN.top + MARGIN.bottom + Math.max(maxPosition - 1, 1) * ROW_HEIGHT;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const x = (v: number) => MARGIN.left + (v / (laps + 1)) * plotWidth;
  const y = (p: number) =>
    MARGIN.top + ((p - 1) / Math.max(maxPosition - 1, 1)) * plotHeight;

  const xStep = laps > 40 ? 10 : laps > 20 ? 5 : laps > 10 ? 2 : 1;
  const xTicks: { v: number; label: string }[] = [
    { v: 0, label: t('pos.grid') },
  ];
  for (let lap = xStep; lap <= laps; lap += xStep) {
    xTicks.push({ v: lap, label: String(lap) });
  }
  xTicks.push({ v: laps + 1, label: t('pos.finish') });
  const yStep = maxPosition > 20 ? 5 : 1;
  const yTicks: number[] = [];
  for (let p = 1; p <= maxPosition; p++) {
    if (p === 1 || p % yStep === 0 || p === maxPosition) yTicks.push(p);
  }

  const colourOf = (entry: Entry) =>
    isOwnDriver(entry.driverName, aliases)
      ? 'var(--you)'
      : colour(session.entries.indexOf(entry));
  const ordered = [...drawn].sort(
    (a, b) =>
      (scoped === null ? a.entry.position : a.entry.classPosition)! -
      (scoped === null ? b.entry.position : b.entry.classPosition)!,
  );

  return (
    <section>
      <div className="results-head">
        <h3>{t('tab.positions')}</h3>
        <div className="head-controls">
          {focus !== null && (
            <button onClick={() => setPicked(null)}>{t('pos.clear')}</button>
          )}
          {classes.length > 1 && (
            <div className="segmented" role="group">
              <button
                aria-pressed={scoped === null}
                onClick={() => setCarClass('')}
              >
                {t('results.overall')}
              </button>
              {classes.map((c) => (
                <button
                  key={c}
                  aria-pressed={scoped === c}
                  onClick={() => setCarClass(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="position-chart">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          role="img"
          aria-label={t('tab.positions')}
        >
          {yTicks.map((p) => (
            <g key={`y${p}`}>
              <line
                className="grid-line"
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={y(p)}
                y2={y(p)}
              />
              <text
                className="axis-label"
                x={MARGIN.left - 8}
                y={y(p)}
                dy="0.35em"
                textAnchor="end"
              >
                {p}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <text
              key={`x${tick.v}`}
              className="axis-label"
              x={x(tick.v)}
              y={height - MARGIN.bottom + 20}
              textAnchor="middle"
            >
              {tick.label}
            </text>
          ))}
          {drawn.map((s) => {
            const key = entryKey(s.entry);
            const active = focus === null || focus === key;
            const path = s.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.x)},${y(p.y)}`)
              .join(' ');
            const last = s.points[s.points.length - 1]!;
            return (
              <g
                key={key}
                className={active ? 'series active' : 'series dim'}
                onClick={() => setPicked(focus === key ? null : key)}
              >
                <title>{`#${s.entry.carNumber} ${s.entry.driverName}`}</title>
                <path
                  d={path}
                  fill="none"
                  stroke={colourOf(s.entry)}
                  strokeWidth={focus === key ? 3.5 : 2}
                  strokeLinejoin="round"
                />
                {active && (
                  <text
                    className="end-label"
                    x={x(last.x) + 8}
                    y={y(last.y)}
                    dy="0.35em"
                    fill={colourOf(s.entry)}
                  >
                    {`#${s.entry.carNumber} ${s.entry.driverName}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="legend">
        {ordered.map((s) => {
          const key = entryKey(s.entry);
          const end =
            scoped === null ? s.entry.position : s.entry.classPosition;
          return (
            <li key={key}>
              <button
                aria-pressed={focus === key}
                onClick={() => setPicked(focus === key ? null : key)}
              >
                <span
                  className="swatch"
                  style={{ background: colourOf(s.entry) }}
                />
                {end}. #{s.entry.carNumber} {s.entry.driverName}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
