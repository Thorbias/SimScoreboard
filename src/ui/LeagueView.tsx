import { useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { routes } from '../app/route';
import { formatDate } from '../format/date';
import { createLeague, newId, parseLeague } from '../league/file';
import { saveLeagueFile } from '../league/fileIo';
import { checkFormula } from '../league/formula';
import { mergedInto, mergeInto } from '../league/people';
import { snapshotRace } from '../league/race';
import {
  computeStandings,
  raceDriverNames,
  type StandingsRow,
} from '../league/standings';
import type { Correction, CorrectionKind, League } from '../league/types';
import { trackTitle } from '../library/tracks';

type Tab = 'standings' | 'races' | 'drivers' | 'corrections' | 'settings';
const TABS: Tab[] = [
  'standings',
  'races',
  'drivers',
  'corrections',
  'settings',
];

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * Two columns like the session page: the leagues on the left, the chosen one
 * on the right. All changes are made by the organizer; whoever opens a league
 * file gets a copy of their own (ADR-0007).
 */
export function LeaguePage({ selectedId }: { selectedId: string | null }) {
  const { t, leagues } = useApp();
  const league = leagues.find((l) => l.id === selectedId) ?? null;
  return (
    <div className={league ? 'split has-session' : 'split'}>
      <aside className="master" aria-label={t('league.title')}>
        <LeagueList leagues={leagues} selectedId={league?.id ?? null} />
      </aside>
      <section className="detail">
        {league ? (
          <LeagueDetail key={league.id} league={league} />
        ) : (
          <p className="detail-empty">{t('league.pick')}</p>
        )}
      </section>
    </div>
  );
}

function LeagueList({
  leagues,
  selectedId,
}: {
  leagues: League[];
  selectedId: string | null;
}) {
  const { t, saveLeague } = useApp();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const league = createLeague(trimmed);
    await saveLeague(league);
    setName('');
    window.location.hash = routes.league(league.id);
  };

  const open = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const league = parseLeague(await file.text());
      // A copy under a new id, so opening a file never replaces a league of the
      // same name that was changed here.
      const copy = leagues.some((l) => l.id === league.id)
        ? { ...league, id: newId('league') }
        : league;
      await saveLeague(copy);
      window.location.hash = routes.league(copy.id);
    } catch (e) {
      setError(t('league.openFailed', { message: message(e) }));
    }
  };

  return (
    <>
      <h2 className="list-title">{t('league.title')}</h2>
      <form
        className="league-new"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <input
          value={name}
          placeholder={t('league.newName')}
          aria-label={t('league.newName')}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="primary" type="submit" disabled={!name.trim()}>
          {t('league.create')}
        </button>
      </form>
      <p>
        <button onClick={() => fileInput.current?.click()}>
          {t('league.open')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            void open(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </p>
      {error && <p className="notice error">{error}</p>}
      {leagues.length === 0 ? (
        <p className="empty">{t('league.empty')}</p>
      ) : (
        <ul className="league-list">
          {leagues.map((l) => (
            <li key={l.id}>
              <a
                href={routes.league(l.id)}
                aria-current={l.id === selectedId ? 'true' : undefined}
              >
                <strong>{l.name}</strong>
                <span className="muted">
                  {t('league.races', { n: l.races.length })}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function LeagueDetail({ league }: { league: League }) {
  const { t, saveLeague } = useApp();
  const [tab, setTab] = useState<Tab>('standings');
  const standings = useMemo(() => computeStandings(league), [league]);
  const change = (next: League) => void saveLeague(next);

  return (
    <>
      <a className="back" href={routes.league()}>
        ← {t('league.title')}
      </a>
      <h3>{league.name}</h3>
      <div className="tabs" role="tablist">
        {TABS.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {t(`league.tab.${id}`)}
          </button>
        ))}
      </div>
      {tab === 'standings' && (
        <StandingsTab league={league} standings={standings} />
      )}
      {tab === 'races' && <RacesTab league={league} change={change} />}
      {tab === 'drivers' && <DriversTab league={league} change={change} />}
      {tab === 'corrections' && (
        <CorrectionsTab league={league} change={change} />
      )}
      {tab === 'settings' && <SettingsTab league={league} change={change} />}
    </>
  );
}

function StandingsTab({
  league,
  standings,
}: {
  league: League;
  standings: ReturnType<typeof computeStandings>;
}) {
  const { t } = useApp();
  if (standings.error) {
    return (
      <p className="notice error">
        {t('league.formulaError', { message: standings.error })}
      </p>
    );
  }
  if (league.races.length === 0) {
    return <p className="empty">{t('league.noRaces')}</p>;
  }
  return (
    <>
      {standings.classes.map((cls) => (
        <section key={cls.carClass}>
          <h4>
            {t('league.class')} {cls.carClass}
          </h4>
          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>{t('league.driver')}</th>
                  {league.races.map((r) => (
                    <th key={r.id} className="num" title={r.track}>
                      {r.name}
                    </th>
                  ))}
                  <th className="num">{t('league.total')}</th>
                </tr>
              </thead>
              <tbody>
                {cls.rows.map((row, index) => (
                  <StandingsLine key={row.key} row={row} rank={index + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="hint">{t('league.corrected')}: *</p>
    </>
  );
}

function StandingsLine({ row, rank }: { row: StandingsRow; rank: number }) {
  const { t } = useApp();
  return (
    <tr>
      <td className="num">{rank}</td>
      <td>{row.name}</td>
      {row.cells.map((cell, i) => (
        <td key={i} className="num">
          {cell === null
            ? '–'
            : cell.disqualified
              ? `${t('league.dsq')}${cell.points ? ` ${cell.points}` : ''}*`
              : `${cell.points}${cell.corrected ? '*' : ''}`}
        </td>
      ))}
      <td className="num">
        <strong>{row.total}</strong>
      </td>
    </tr>
  );
}

function RacesTab({
  league,
  change,
}: {
  league: League;
  change: (next: League) => void;
}) {
  const { t, sessions, language, loadSession } = useApp();
  const [pick, setPick] = useState('');
  const [error, setError] = useState<string | null>(null);

  const available = sessions
    .filter(
      (s) =>
        s.type === 'race' && !league.races.some((r) => r.sessionId === s.id),
    )
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));

  const add = async () => {
    setError(null);
    try {
      const race = snapshotRace(await loadSession(pick));
      change({ ...league, races: [...league.races, race] });
      setPick('');
    } catch (e) {
      setError(t('league.addRaceFailed', { message: message(e) }));
    }
  };

  const move = (index: number, by: number) => {
    const races = [...league.races];
    const [moved] = races.splice(index, 1);
    if (!moved) return;
    races.splice(index + by, 0, moved);
    change({ ...league, races });
  };

  const rename = (index: number, name: string) =>
    change({
      ...league,
      races: league.races.map((r, i) => (i === index ? { ...r, name } : r)),
    });

  const remove = (index: number) => {
    const race = league.races[index];
    if (!race || !window.confirm(t('league.removeRaceConfirm'))) return;
    change({
      ...league,
      races: league.races.filter((_, i) => i !== index),
      corrections: league.corrections.filter((c) => c.raceId !== race.id),
    });
  };

  return (
    <>
      <ol className="league-races">
        {league.races.map((race, i) => (
          <li key={race.id}>
            <input
              value={race.name}
              aria-label={t('league.raceName')}
              onChange={(e) => rename(i, e.target.value)}
            />
            <span className="muted">
              {race.track}
              {race.date ? ` · ${formatDate(race.date, language)}` : ''}
            </span>
            <button
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={t('league.moveUp')}
              title={t('league.moveUp')}
            >
              ↑
            </button>
            <button
              disabled={i === league.races.length - 1}
              onClick={() => move(i, 1)}
              aria-label={t('league.moveDown')}
              title={t('league.moveDown')}
            >
              ↓
            </button>
            <button onClick={() => remove(i)}>{t('league.removeRace')}</button>
          </li>
        ))}
      </ol>
      <h4>{t('league.addRace')}</h4>
      {available.length === 0 ? (
        <p className="hint">{t('league.addRaceNone')}</p>
      ) : (
        <p className="league-add">
          <select
            value={pick}
            aria-label={t('league.addRacePick')}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">{t('league.addRacePick')}</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.endedAt, language)} ·{' '}
                {trackTitle(s.trackVenue, s.trackCourse)}
              </option>
            ))}
          </select>
          <button
            className="primary"
            disabled={!pick}
            onClick={() => void add()}
          >
            {t('league.addRace')}
          </button>
        </p>
      )}
      {error && <p className="notice error">{error}</p>}
    </>
  );
}

function DriversTab({
  league,
  change,
}: {
  league: League;
  change: (next: League) => void;
}) {
  const { t } = useApp();
  const names = raceDriverNames(league);
  return (
    <>
      <p className="hint">{t('league.drivers.help')}</p>
      <div className="table-wrap">
        <table className="results">
          <thead>
            <tr>
              <th>{t('league.driver')}</th>
              <th>{t('league.mergeInto')}</th>
            </tr>
          </thead>
          <tbody>
            {names.map((name) => (
              <tr key={name}>
                <td>{name}</td>
                <td>
                  <select
                    value={mergedInto(league.people, name) ?? ''}
                    aria-label={`${name}: ${t('league.mergeInto')}`}
                    onChange={(e) =>
                      change({
                        ...league,
                        people: mergeInto(
                          league.people,
                          name,
                          e.target.value || null,
                        ),
                      })
                    }
                  >
                    <option value="">{t('league.mergeNone')}</option>
                    {names
                      .filter((other) => other !== name)
                      .map((other) => (
                        <option key={other} value={other}>
                          {other}
                        </option>
                      ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const KINDS: CorrectionKind[] = [
  'timePenalty',
  'disqualify',
  'position',
  'points',
];

function CorrectionsTab({
  league,
  change,
}: {
  league: League;
  change: (next: League) => void;
}) {
  const { t } = useApp();
  const standings = useMemo(() => computeStandings(league), [league]);
  const people = useMemo(
    () => [
      ...new Set(
        standings.classes.flatMap((c) => c.rows.map((row) => row.name)),
      ),
    ],
    [standings],
  );
  const [raceId, setRaceId] = useState('');
  const [driver, setDriver] = useState('');
  const [kind, setKind] = useState<CorrectionKind>('timePenalty');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const race = raceId || league.races[0]?.id;
    const who = driver || people[0];
    if (!race || !who) return;
    if (!reason.trim()) {
      setError(t('league.corr.reasonRequired'));
      return;
    }
    const correction: Correction = {
      id: newId('corr'),
      raceId: race,
      driver: who,
      kind,
      value: kind === 'disqualify' ? 0 : Number(value) || 0,
      reason: reason.trim(),
    };
    change({ ...league, corrections: [...league.corrections, correction] });
    setValue('');
    setReason('');
    setError(null);
  };

  const raceName = (id: string) =>
    league.races.find((r) => r.id === id)?.name ?? id;

  return (
    <>
      <p className="hint">{t('league.corr.help')}</p>
      {league.corrections.length === 0 ? (
        <p className="empty">{t('league.corr.none')}</p>
      ) : (
        <div className="table-wrap">
          <table className="results">
            <thead>
              <tr>
                <th>{t('league.corr.race')}</th>
                <th>{t('league.corr.driver')}</th>
                <th>{t('league.corr.kind')}</th>
                <th className="num">{t('league.corr.value')}</th>
                <th>{t('league.corr.reason')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {league.corrections.map((c) => (
                <tr key={c.id}>
                  <td>{raceName(c.raceId)}</td>
                  <td>{c.driver}</td>
                  <td>{t(`league.corr.${c.kind}`)}</td>
                  <td className="num">
                    {c.kind === 'disqualify' ? '–' : c.value}
                  </td>
                  <td>{c.reason}</td>
                  <td>
                    <button
                      onClick={() =>
                        change({
                          ...league,
                          corrections: league.corrections.filter(
                            (x) => x.id !== c.id,
                          ),
                        })
                      }
                    >
                      {t('league.corr.remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {league.races.length > 0 && people.length > 0 && (
        <>
          <h4>{t('league.corr.add')}</h4>
          <form
            className="league-correction"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <label>
              {t('league.corr.race')}
              <select
                value={raceId}
                onChange={(e) => setRaceId(e.target.value)}
              >
                {league.races.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('league.corr.driver')}
              <select
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
              >
                {people.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('league.corr.kind')}
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as CorrectionKind)}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`league.corr.${k}`)}
                  </option>
                ))}
              </select>
            </label>
            {kind !== 'disqualify' && (
              <label>
                {t('league.corr.value')}
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
            )}
            <label className="wide">
              {t('league.corr.reason')}
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button className="primary" type="submit">
              {t('league.corr.add')}
            </button>
          </form>
          {error && <p className="notice error">{error}</p>}
        </>
      )}
    </>
  );
}

function SettingsTab({
  league,
  change,
}: {
  league: League;
  change: (next: League) => void;
}) {
  const { t, deleteLeague } = useApp();
  const [status, setStatus] = useState<string | null>(null);
  const check = checkFormula(league.formula);

  const save = async () => {
    setStatus(null);
    if (await saveLeagueFile(league)) setStatus(t('league.saved'));
  };

  return (
    <>
      <label className="league-field">
        {t('league.name')}
        <input
          value={league.name}
          onChange={(e) => change({ ...league, name: e.target.value })}
        />
      </label>
      <label className="league-field">
        {t('league.formula')}
        <input
          className="league-formula"
          value={league.formula}
          spellCheck={false}
          aria-invalid={!check.ok}
          onChange={(e) => change({ ...league, formula: e.target.value })}
        />
      </label>
      {check.ok ? (
        <p className="hint">{t('league.formula.ok')}</p>
      ) : (
        <p className="notice error">
          {check.message} (
          {t('league.formula.at', { position: check.position + 1 })})
        </p>
      )}
      <p className="hint">{t('league.formula.help')}</p>

      <h4>{t('league.save')}</h4>
      <p className="hint">{t('league.privacy')}</p>
      <p className="hint">{t('league.shared')}</p>
      <p>
        <button className="primary" onClick={() => void save()}>
          {t('league.save')}
        </button>{' '}
        <button
          onClick={() => {
            if (window.confirm(t('league.deleteConfirm'))) {
              void deleteLeague(league.id);
              window.location.hash = routes.league();
            }
          }}
        >
          {t('league.delete')}
        </button>
      </p>
      {status && <p className="hint">{status}</p>}
    </>
  );
}
