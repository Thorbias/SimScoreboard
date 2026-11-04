import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { routes } from '../app/route';
import { formatDate, formatDateTime } from '../format/date';
import {
  createLeague,
  leagueFingerprint,
  newId,
  parseLeague,
  saveState,
  serializeLeague,
} from '../league/file';
import { leagueFileName, saveLeagueFile } from '../league/fileIo';
import { checkFormula } from '../league/formula';
import { mergedInto, mergeInto } from '../league/people';
import { importRaceFile, snapshotRace } from '../league/race';
import { preloadDriveAuth, requestDriveToken } from '../league/drive/auth';
import {
  driveDownloadUrl,
  driveFileId,
  driveShareLink,
  saveToDrive,
  shareDriveFile,
} from '../league/drive/api';
import { driveConfig } from '../league/drive/config';
import { fetchLeague, parseLeagueAddress } from '../league/source';
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
export function LeaguePage({
  selectedId,
  tab,
}: {
  selectedId: string | null;
  tab: string | null;
}) {
  const { t, leagues } = useApp();
  const league = leagues.find((l) => l.id === selectedId) ?? null;
  return (
    <div className={league ? 'split has-session' : 'split'}>
      <aside className="master" aria-label={t('league.title')}>
        <LeagueList leagues={leagues} selectedId={league?.id ?? null} />
      </aside>
      <section className="detail">
        {league ? (
          <LeagueDetail
            key={league.id}
            league={league}
            initialTab={TABS.find((id) => id === tab) ?? 'standings'}
          />
        ) : (
          <p className="detail-empty">{t('league.pick')}</p>
        )}
      </section>
    </div>
  );
}

/**
 * Loads a league from an address or a Drive link and opens it. A league that
 * came from the same address is replaced by the newest version; any other gets
 * a copy of its own. Returns the reason when it fails, otherwise null.
 */
function useOpenFromAddress() {
  const { t, leagues, saveLeague, leagueLinks, setLeagueLink } = useApp();
  return async (input: string): Promise<string | null> => {
    const driveId = driveFileId(input);
    if (driveId && !driveConfig) return t('league.drive.notSetUp');
    // A Drive file is read with the API key; the address kept and compared is
    // the share link, so the key stays out of the stored data.
    const url = driveId ? driveShareLink(driveId) : parseLeagueAddress(input);
    if (!url) return t('league.address.invalid');
    try {
      const league = await fetchLeague(
        driveId && driveConfig
          ? driveDownloadUrl(driveId, driveConfig.apiKey)
          : url,
      );
      // The same league is never listed twice. One that came from this address
      // is brought up to date; one the user keeps themselves (saved to a file or
      // Drive, or with changes) stays untouched; a plain saved copy is replaced.
      const existing = leagues.find((l) => l.id === league.id);
      const existingLink = existing ? leagueLinks[existing.id] : undefined;
      const keep =
        existing &&
        existingLink?.url !== url &&
        (existingLink?.url ||
          existingLink?.handle ||
          existingLink?.driveId ||
          saveState(existing, existingLink?.saved) !== 'saved');
      if (!keep) {
        await saveLeague(league);
        await setLeagueLink(league.id, {
          url,
          ...(driveId ? { driveId } : {}),
          saved: leagueFingerprint(league),
        });
      }
      window.location.hash = routes.league(league.id);
      return null;
    } catch (e) {
      return message(e);
    }
  };
}

/**
 * Brings a league that was loaded from an address up to date. Returns the
 * reason when that fails (the last copy then stays), otherwise null.
 */
function useRefreshLeague() {
  const { leagues, leagueLinks, saveLeague, setLeagueLink } = useApp();
  return async (id: string): Promise<string | null> => {
    const league = leagues.find((l) => l.id === id);
    const link = leagueLinks[id];
    if (!league || !link?.url) return null;
    try {
      const fresh = await fetchLeague(
        link.driveId && driveConfig
          ? driveDownloadUrl(link.driveId, driveConfig.apiKey)
          : link.url,
      );
      const next = { ...fresh, id };
      const saved = leagueFingerprint(next);
      if (saved !== leagueFingerprint(league)) await saveLeague(next);
      if (saved !== link.saved) await setLeagueLink(id, { ...link, saved });
      return null;
    } catch (e) {
      return message(e);
    }
  };
}

/** What a shared link opens: asks before anything is loaded (ADR-0009). */
export function LeagueOpenPage({
  drive,
  url,
}: {
  drive: string | null;
  url: string | null;
}) {
  const { t } = useApp();
  const openFromAddress = useOpenFromAddress();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = drive ?? url ?? '';
  const valid = drive
    ? driveConfig !== null
    : parseLeagueAddress(address) !== null;
  const host = drive
    ? 'drive.google.com'
    : parseLeagueAddress(address)
      ? new URL(address).host
      : '';

  const load = async () => {
    setBusy(true);
    setError(null);
    const failure = await openFromAddress(address);
    setBusy(false);
    if (failure) setError(t('league.openFailed', { message: failure }));
  };

  return (
    <div className="league-open">
      <h2>{t('league.link.title')}</h2>
      {valid ? (
        <>
          <p>{t('league.link.ask', { host })}</p>
          <p>
            <button
              className="primary"
              disabled={busy}
              onClick={() => void load()}
            >
              {t('league.link.load')}
            </button>{' '}
            <button onClick={() => (window.location.hash = routes.league())}>
              {t('league.link.cancel')}
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="notice error">
            {drive ? t('league.drive.notSetUp') : t('league.address.invalid')}
          </p>
          <p>
            <a href={routes.league()}>{t('league.title')}</a>
          </p>
        </>
      )}
      {error && <p className="notice error">{error}</p>}
    </div>
  );
}

/** A read-only line with the full text and a button that copies it. */
function CopyField({ value, label }: { value: string; label: string }) {
  const { t } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: select the text so it can be copied by hand.
      input.current?.select();
    }
  };
  return (
    <span className="copy-field">
      <input
        ref={input}
        readOnly
        className="league-formula"
        value={value}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        className="icon-button"
        onClick={() => void copy()}
        title={copied ? t('league.copied') : t('league.copy')}
        aria-label={copied ? t('league.copied') : t('league.copy')}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect
              x="9"
              y="9"
              width="11"
              height="11"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </span>
  );
}

/** A closed padlock: the league can be viewed but not changed. */
function LockIcon({ title }: { title: string }) {
  return (
    <svg
      className="lock-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The address of this site, so a shared link works wherever it is hosted. */
const appUrl = () => window.location.origin + window.location.pathname;

function LeagueList({
  leagues,
  selectedId,
}: {
  leagues: League[];
  selectedId: string | null;
}) {
  const { t, saveLeague, leagueLinks, setLeagueLink } = useApp();
  const openFromAddress = useOpenFromAddress();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const league = createLeague(trimmed);
    await saveLeague(league);
    setName('');
    // A new league is not saved anywhere yet; the settings are where it is saved.
    window.location.hash = routes.league(league.id, 'settings');
  };

  const open = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const league = parseLeague(await file.text());
      // The same league is never listed twice: the file replaces it, after a
      // question when the one here has changes that are not saved.
      const existing = leagues.find((l) => l.id === league.id);
      if (
        existing &&
        saveState(existing, leagueLinks[existing.id]?.saved) !== 'saved' &&
        !window.confirm(t('league.open.replaceConfirm'))
      ) {
        return;
      }
      await saveLeague(league);
      await setLeagueLink(league.id, { saved: leagueFingerprint(league) });
      window.location.hash = routes.league(league.id);
    } catch (e) {
      setError(t('league.openFailed', { message: message(e) }));
    }
  };

  const openAddress = async () => {
    setError(null);
    setLoading(true);
    const failure = await openFromAddress(address);
    setLoading(false);
    if (failure) setError(t('league.openFailed', { message: failure }));
    else setAddress('');
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
      <form
        className="league-new"
        onSubmit={(e) => {
          e.preventDefault();
          void openAddress();
        }}
      >
        <input
          value={address}
          placeholder={t('league.address')}
          aria-label={t('league.address')}
          inputMode="url"
          onChange={(e) => setAddress(e.target.value)}
        />
        <button type="submit" disabled={!address.trim() || loading}>
          {t('league.address.open')}
        </button>
      </form>
      <p className="hint">{t('league.address.hint')}</p>
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
                  {leagueLinks[l.id]?.url && (
                    <LockIcon title={t('league.readOnly')} />
                  )}{' '}
                  {!leagueLinks[l.id]?.url &&
                    saveState(l, leagueLinks[l.id]?.saved) !== 'saved' && (
                      <span
                        className="unsaved-dot"
                        title={t('league.unsaved.short')}
                      >
                        ●{' '}
                      </span>
                    )}
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

function LeagueDetail({
  league,
  initialTab,
}: {
  league: League;
  initialTab: Tab;
}) {
  const { t, saveLeague, leagueLinks } = useApp();
  const link = leagueLinks[league.id];
  // A league that came from a link is a copy of the organizer's: it is shown,
  // not changed, and brought up to date whenever it is opened.
  const readOnly = Boolean(link?.url);
  const tabs = readOnly ? TABS.filter((id) => id !== 'drivers') : TABS;
  const [tab, setTab] = useState<Tab>(initialTab);
  const refreshLeague = useRefreshLeague();
  const refreshRef = useRef(refreshLeague);
  useEffect(() => {
    refreshRef.current = refreshLeague;
  });
  const [refreshing, setRefreshing] = useState(readOnly);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  useEffect(() => {
    if (!readOnly) return;
    let current = true;
    void refreshRef.current(league.id).then((failure) => {
      if (!current) return;
      setRefreshError(failure);
      setRefreshing(false);
    });
    return () => {
      current = false;
    };
  }, [league.id, readOnly]);
  const state = readOnly ? 'saved' : saveState(league, link?.saved);
  const standings = useMemo(() => computeStandings(league), [league]);
  const change = (next: League) => void saveLeague(next);

  return (
    <>
      <a className="back" href={routes.league()}>
        ← {t('league.title')}
      </a>
      <h3>{league.name}</h3>
      {readOnly && (
        <p className="hint league-badge">
          <LockIcon title={t('league.readOnly')} />
          <span>
            <strong>{t('league.readOnly')}</strong> {t('league.readOnly.hint')}{' '}
            {refreshing && t('league.refresh.busy')}
          </span>
        </p>
      )}
      {refreshError && (
        <p className="notice error">
          {t('league.refresh.failed', { message: refreshError })}
        </p>
      )}
      {state !== 'saved' && (
        <div className="notice unsaved" role="status">
          <span>
            {state === 'never'
              ? t('league.unsaved.never')
              : t('league.unsaved.changed')}
          </span>
          {tab !== 'settings' && (
            <button onClick={() => setTab('settings')}>
              {t('league.unsaved.go')}
            </button>
          )}
        </div>
      )}
      <div className="tabs" role="tablist">
        {tabs.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {t(`league.tab.${id}`)}
            {id === 'settings' && state !== 'saved' && (
              <span className="unsaved-dot" aria-hidden="true">
                {' '}
                ●
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === 'standings' && (
        <StandingsTab league={league} standings={standings} />
      )}
      {tab === 'races' && (
        <RacesTab league={league} change={change} readOnly={readOnly} />
      )}
      {tab === 'drivers' && !readOnly && (
        <DriversTab league={league} change={change} />
      )}
      {tab === 'corrections' && (
        <CorrectionsTab league={league} change={change} readOnly={readOnly} />
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
  const { t, sessions, language } = useApp();
  if (standings.error) {
    return (
      <p className="notice error">
        {t('league.formulaError', { message: standings.error })}
      </p>
    );
  }
  if (standings.singleStarter) {
    return (
      <p className="notice error">
        {t('league.singleStarter', {
          race: standings.singleStarter.race,
          carClass: standings.singleStarter.carClass,
        })}
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
          <div className="table-wrap standings-wrap">
            <table className="results standings">
              <thead>
                <tr>
                  <th className="num col-rank">#</th>
                  <th className="col-driver">{t('league.driver')}</th>
                  <th className="num col-points">{t('league.total')}</th>
                  {league.races.map((r) => {
                    const head = (
                      <>
                        <span className="race-name">{r.name}</span>
                        <span className="race-date">
                          {formatDateTime(r.date, language)}
                        </span>
                      </>
                    );
                    // Only a session this computer has can be opened.
                    const known = sessions.some((s) => s.id === r.sessionId);
                    return (
                      <th key={r.id} className="num race-head" title={r.track}>
                        {known ? (
                          <a
                            href={routes.session(r.sessionId)}
                            className="race-link"
                          >
                            {head}
                          </a>
                        ) : (
                          head
                        )}
                      </th>
                    );
                  })}
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
      <td className="num col-rank">{rank}</td>
      <td className="col-driver" title={row.name}>
        {row.name}
      </td>
      <td className="num col-points">
        <strong>{row.total}</strong>
      </td>
      {row.cells.map((cell, i) => (
        <td key={i} className="num">
          {cell === null
            ? '–'
            : cell.disqualified
              ? `${t('league.dsq')}${cell.points ? ` ${cell.points}` : ''}*`
              : `${cell.points}${cell.corrected ? '*' : ''}`}
        </td>
      ))}
    </tr>
  );
}

function RacesTab({
  league,
  change,
  readOnly,
}: {
  league: League;
  change: (next: League) => void;
  readOnly: boolean;
}) {
  const { t, sessions, language, loadSession } = useApp();
  const [pick, setPick] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  // Result files picked by hand; each is added if it is a race not yet in the
  // league, the others are named in the error.
  const importFiles = async (picked: File[]) => {
    setError(null);
    const races = [...league.races];
    const failures: string[] = [];
    for (const file of picked) {
      try {
        races.push(importRaceFile(await file.text(), file.name, races));
      } catch (e) {
        failures.push(message(e));
      }
    }
    if (races.length > league.races.length) change({ ...league, races });
    if (failures.length > 0) {
      setError(t('league.importRaceFailed', { message: failures.join('; ') }));
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
            {readOnly ? (
              <strong>{race.name}</strong>
            ) : (
              <input
                value={race.name}
                aria-label={t('league.raceName')}
                onChange={(e) => rename(i, e.target.value)}
              />
            )}
            <span className="muted">
              {race.track}
              {race.date ? ` · ${formatDate(race.date, language)}` : ''}
            </span>
            {!readOnly && (
              <>
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
                <button onClick={() => remove(i)}>
                  {t('league.removeRace')}
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      {!readOnly && <h4>{t('league.addRace')}</h4>}
      {readOnly ? null : available.length === 0 ? (
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
      {!readOnly && (
        <>
          <h4>{t('league.importRace')}</h4>
          <p className="hint">{t('league.importRaceHelp')}</p>
          <input
            ref={fileInput}
            type="file"
            accept=".xml"
            multiple
            hidden
            onChange={(e) => {
              const picked = [...(e.target.files ?? [])];
              e.target.value = '';
              void importFiles(picked);
            }}
          />
          <p>
            <button onClick={() => fileInput.current?.click()}>
              {t('league.importRacePick')}
            </button>
          </p>
        </>
      )}
      {!readOnly && error && <p className="notice error">{error}</p>}
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
  readOnly,
}: {
  league: League;
  change: (next: League) => void;
  readOnly: boolean;
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
                    {!readOnly && (
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!readOnly && league.races.length > 0 && people.length > 0 && (
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
  const { t, deleteLeague, leagueLinks, setLeagueLink } = useApp();
  const refreshLeague = useRefreshLeague();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const check = checkFormula(league.formula);
  const link = leagueLinks[league.id];

  // With a remembered file, saving overwrites it; "save as" asks for a new one.
  // The file written to is remembered for the next time.
  const save = async (asNew: boolean) => {
    setStatus(null);
    setError(null);
    try {
      const result = await saveLeagueFile(league, asNew ? null : link?.handle);
      if (!result.saved) return;
      await setLeagueLink(league.id, {
        ...link,
        ...(result.handle ? { handle: result.handle } : {}),
        saved: leagueFingerprint(league),
      });
      setStatus(t('league.saved'));
    } catch (e) {
      setError(t('league.saveFailed', { message: message(e) }));
    }
  };

  useEffect(() => {
    if (driveConfig) preloadDriveAuth().catch(() => undefined);
  }, []);

  const saveDrive = async () => {
    if (!driveConfig) return;
    setDriveStatus(null);
    setDriveError(null);
    try {
      // Asking for access opens a window, so it comes first, right after the click.
      const token = await requestDriveToken(driveConfig.clientId);
      const file = await saveToDrive({
        token,
        name: leagueFileName(league.name),
        text: serializeLeague(league),
        known:
          link?.driveId && link.driveVersion && !link.url
            ? { id: link.driveId, version: link.driveVersion }
            : null,
        confirmOverwrite: () => window.confirm(t('league.drive.newer')),
      });
      if (!file) return;
      try {
        await setLeagueLink(league.id, {
          handle: link?.handle,
          driveId: file.id,
          driveVersion: file.version,
          ...(file.id === link?.driveId && link.shared ? { shared: true } : {}),
          saved: leagueFingerprint(league),
        });
      } catch (e) {
        // The file exists in Drive but this browser could not remember it.
        console.error(e);
        setDriveError(
          t('league.drive.rememberFailed', { message: message(e) }),
        );
        return;
      }
      setDriveStatus(
        t(file.recreated ? 'league.drive.recreated' : 'league.drive.saved'),
      );
    } catch (e) {
      console.error(e);
      setDriveError(t('league.saveFailed', { message: message(e) }));
    }
  };

  const shareDrive = async () => {
    if (!driveConfig || !link?.driveId) return;
    setDriveStatus(null);
    setDriveError(null);
    try {
      const token = await requestDriveToken(driveConfig.clientId);
      await shareDriveFile(token, link.driveId);
      await setLeagueLink(league.id, { ...link, shared: true });
      setDriveStatus(t('league.drive.shared'));
    } catch (e) {
      setDriveError(t('league.saveFailed', { message: message(e) }));
    }
  };

  const refresh = async () => {
    setStatus(null);
    setError(null);
    const failure = await refreshLeague(league.id);
    if (failure) setError(t('league.openFailed', { message: failure }));
    else setStatus(t('league.refreshed'));
  };

  if (link?.url) {
    return (
      <>
        <p className="hint">{t('league.readOnly.hint')}</p>
        <p className="hint">{t('league.source', { url: link.url })}</p>
        <p>
          <strong>{t('league.formula')}:</strong>{' '}
          <code className="league-formula">{league.formula}</code>
        </p>
        <p>
          <button onClick={() => void refresh()}>{t('league.refresh')}</button>{' '}
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
        <p className="hint">{t('league.deleteHint')}</p>
        {status && <p className="hint">{status}</p>}
        {error && <p className="notice error">{error}</p>}
      </>
    );
  }

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
      <p className="hint">{t('league.formula.example1')}</p>
      <p className="hint">{t('league.formula.example2')}</p>

      <h4>{t('league.save')}</h4>
      <p className="hint">{t('league.privacy')}</p>
      <p className="hint">{t('league.shared')}</p>
      {link?.handle && (
        <p className="hint">{t('league.file', { name: link.handle.name })}</p>
      )}
      {link?.url && (
        <p className="hint">{t('league.source', { url: link.url })}</p>
      )}
      {driveConfig && (
        <>
          <h4>{t('league.drive')}</h4>
          <p className="hint">{t('league.drive.hint')}</p>
          {link?.driveId && !link.url && (
            <div className="league-field wide">
              {t('league.drive.link')}
              <CopyField
                value={driveShareLink(link.driveId)}
                label={t('league.drive.link')}
              />
            </div>
          )}
          <p>
            <button onClick={() => void saveDrive()}>
              {t('league.drive.save')}
            </button>{' '}
            {link?.driveId && !link.url && (
              <button onClick={() => void shareDrive()}>
                {t('league.drive.share')}
              </button>
            )}
          </p>
          {link?.driveId && !link.url && (
            <p className="hint">{t('league.drive.shareHint')}</p>
          )}
          {driveStatus && <p className="hint">{driveStatus}</p>}
          {driveError && <p className="notice error">{driveError}</p>}
          {link?.driveId && !link.url && link.shared && (
            <div className="league-field wide">
              {t('league.drive.deeplink')}
              <CopyField
                value={appUrl() + routes.leagueOpenDrive(link.driveId)}
                label={t('league.drive.deeplink')}
              />
              <span className="hint">{t('league.drive.deeplink.hint')}</span>
            </div>
          )}
        </>
      )}
      <p>
        <button className="primary" onClick={() => void save(false)}>
          {link?.handle ? t('league.saveToFile') : t('league.save')}
        </button>{' '}
        {link?.handle && (
          <>
            <button onClick={() => void save(true)}>
              {t('league.saveAs')}
            </button>{' '}
          </>
        )}
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
      <p className="hint">{t('league.deleteHint')}</p>
      {status && <p className="hint">{status}</p>}
      {error && <p className="notice error">{error}</p>}
    </>
  );
}
