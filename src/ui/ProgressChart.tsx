import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useApp } from '../app/AppContext';
import { formatLapTime } from '../format/lapTime';
import { runningBest, type LapPoint } from '../library/records';
import { observeWidth } from './plotSize';

const HEIGHT = 220;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * How the best lap of a class on one layout developed: the best lap of every
 * session as a dot, and the personal best so far as a stepped line.
 */
export function ProgressChart({ history }: { history: LapPoint[] }) {
  const { t, theme } = useApp();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || history.length < 2) return;

    const lapValue = (_u: uPlot, v: number | null) =>
      v == null ? '–' : formatLapTime(v);
    const data: uPlot.AlignedData = [
      history.map((p) => p.time / 1000),
      history.map((p) => p.lap),
      runningBest(history).map((p) => p.best),
    ];
    const muted = cssVar('--muted');
    const line = cssVar('--line');
    const axis = {
      stroke: muted,
      grid: { stroke: line, width: 1 },
      ticks: { stroke: line, width: 1 },
    };

    const plot = new uPlot(
      {
        width: el.clientWidth || 600,
        height: HEIGHT,
        scales: {
          y: {
            range: (_u, min, max) => {
              const pad = Math.max((max - min) * 0.1, 0.2);
              return [min - pad, max + pad];
            },
          },
        },
        axes: [
          axis,
          {
            ...axis,
            size: 70,
            values: (_u, vals) => vals.map((v) => formatLapTime(v)),
          },
        ],
        series: [
          {},
          {
            label: t('progress.session'),
            paths: () => null,
            points: { show: true, size: 7, fill: muted, stroke: muted },
            value: lapValue,
          },
          {
            label: t('progress.best'),
            stroke: cssVar('--accent'),
            width: 2,
            paths: uPlot.paths.stepped?.({ align: 1 }),
            points: { show: false },
            value: lapValue,
          },
        ],
      },
      data,
      el,
    );

    const stop = observeWidth(el, (width) =>
      plot.setSize({ width, height: HEIGHT }),
    );
    return () => {
      stop();
      plot.destroy();
    };
  }, [history, t, theme]);

  if (history.length < 2) return null;
  return (
    <div className="progress-chart">
      <h5>{t('progress.title')}</h5>
      <div className="lap-plot">
        <div className="lap-plot-host" ref={host} />
      </div>
    </div>
  );
}
