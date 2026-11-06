import type { Translate } from '../i18n';
import type { Correction, League } from './types';
import type { ClassStandings, RaceCell, Standings } from './standings';

/**
 * CSV exports of the standings (F-025): the table as shown, and the points with
 * the way they came about. The files are plain text and not encrypted.
 */

export type CsvField = string | number | null;

/** Excel runs a text that starts with one of these as a formula. */
const FORMULA_START = /^[=+\-@\t\r]/;

function field(value: CsvField): string {
  if (value === null) return '';
  // Numbers are written as they are; a text is defused so a spreadsheet does
  // not run it as a formula (a driver name or a reason is typed by people).
  const text =
    typeof value === 'number'
      ? String(value)
      : FORMULA_START.test(value)
        ? `'${value}`
        : value;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Semicolon separated, as German spreadsheet programs expect, with a byte order
 * mark so they read the umlauts correctly.
 */
export function toCsv(rows: CsvField[][]): string {
  return `\uFEFF${rows.map((row) => row.map(field).join(';')).join('\r\n')}\r\n`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `2026-10-30 14:38` in local time; sorts as text and reads the same everywhere. */
export function csvDate(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms <= 0) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function correctionText(c: Correction, t: Translate): string {
  const base = {
    timePenalty: () => t('league.csv.corr.timePenalty', { value: c.value }),
    disqualify: () => t('league.csv.corr.disqualify'),
    position: () => t('league.csv.corr.position', { value: c.value }),
    points: () => t('league.csv.corr.points', { value: signed(c.value) }),
    drop: () => t('league.csv.corr.drop'),
  }[c.kind]();
  return c.reason.trim() ? `${base} (${c.reason.trim()})` : base;
}

function tableCell(cell: RaceCell | null, t: Translate): CsvField {
  if (cell === null) return null;
  if (cell.dropped) return 'X';
  if (cell.disqualified) {
    return `${t('league.dsq')}${cell.points ? ` ${cell.points}` : ''}`;
  }
  return cell.points;
}

function eachClass(
  standings: Standings,
  fn: (cls: ClassStandings) => CsvField[][],
): CsvField[][] {
  return standings.classes.flatMap(fn);
}

/** The table as on the screen: class, rank, driver, points, one column per race. */
export function standingsCsv(
  league: League,
  standings: Standings,
  t: Translate,
): string {
  const header: CsvField[] = [
    t('league.class'),
    t('league.csv.rank'),
    t('league.driver'),
    t('league.total'),
    ...league.races.map((r) => {
      const when = csvDate(r.started ?? r.date);
      const factor = (r.factor ?? 1) > 1 ? ` ×${r.factor}` : '';
      return `${r.name}${when ? ` (${when})` : ''}${factor}`;
    }),
  ];
  const body = eachClass(standings, (cls) =>
    cls.rows.map((row, index) => [
      cls.carClass,
      index + 1,
      row.name,
      row.total,
      ...row.cells.map((cell) => tableCell(cell, t)),
    ]),
  );
  return toCsv([header, ...body]);
}

/**
 * One line per person and race with everything the points are made of:
 * points = (formula points + correction points) * factor, 0 for a dropped
 * result.
 */
export function pointsCsv(
  league: League,
  standings: Standings,
  t: Translate,
): string {
  const yes = (v: boolean) => t(v ? 'league.csv.yes' : 'league.csv.no');
  const header: CsvField[] = [
    t('league.class'),
    t('league.csv.rank'),
    t('league.driver'),
    t('league.csv.race'),
    t('league.csv.track'),
    t('league.csv.date'),
    t('league.csv.grid'),
    t('league.csv.original'),
    t('league.csv.position'),
    t('league.csv.starters'),
    t('league.csv.fastest'),
    t('league.csv.pole'),
    t('league.csv.finished'),
    t('league.csv.laps'),
    t('league.csv.formulaPoints'),
    t('league.csv.bonusPoints'),
    t('league.csv.factor'),
    t('league.csv.dropped'),
    t('league.csv.disqualified'),
    t('league.total'),
    t('league.csv.corrections'),
    t('league.formula'),
  ];
  const body = eachClass(standings, (cls) =>
    cls.rows.flatMap((row, index) =>
      row.cells.flatMap((cell, raceIndex): CsvField[][] => {
        const race = league.races[raceIndex];
        if (!cell || !race) return [];
        const d = cell.detail;
        return [
          [
            cls.carClass,
            index + 1,
            row.name,
            race.name,
            race.track,
            csvDate(race.started ?? race.date),
            d.gridPosition,
            d.originalPosition,
            cell.disqualified ? null : cell.position,
            d.values.starters,
            d.values.fastestLap,
            d.values.pole,
            d.values.finished,
            d.values.laps,
            d.formulaPoints,
            d.bonusPoints,
            d.factor,
            yes(cell.dropped),
            yes(cell.disqualified),
            cell.points,
            d.corrections.map((c) => correctionText(c, t)).join('; '),
            league.formula,
          ],
        ];
      }),
    ),
  );
  return toCsv([header, ...body]);
}

/** `Spa Cup 2026` becomes `spa-cup-2026-table.csv` (or `-points`). */
export function csvFileName(name: string, kind: 'table' | 'points'): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'league'}-${kind}.csv`;
}
