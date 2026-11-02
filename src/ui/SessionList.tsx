import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { routes } from '../app/route';
import { formatDateTime } from '../format/date';
import {
  filterSessions,
  groupByEvent,
  NO_FILTER,
  ownResult,
  sessionTime,
  uniqueClasses,
  uniqueTracks,
  type SessionFilter,
} from '../library/filters';
import { trackTitle } from '../library/tracks';
import type { SessionSummary, SessionType } from '../results/types';
import { CountryLabel } from './CountryLabel';
import { FavoriteButton } from './FavoriteButton';
import { FolderBar } from './FolderBar';

const TYPES: SessionType[] = ['practice', 'qualifying', 'race'];

/** `yyyy-mm-dd` from a date input to the start or end of that local day. */
function dayBound(value: string, end: boolean): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return end
    ? new Date(y, mo - 1, d, 23, 59, 59, 999).getTime()
    : new Date(y, mo - 1, d).getTime();
}

function SessionRow({
  session,
  selected,
}: {
  session: SessionSummary;
  selected: boolean;
}) {
  const { t, language, aliases } = useApp();
  const own = ownResult(session, aliases);
  const item = useRef<HTMLLIElement>(null);

  // Keep the open session visible when it was chosen elsewhere, e.g. from the
  // personal bests.
  useEffect(() => {
    if (selected) item.current?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  return (
    <li
      className={selected ? 'session-item selected' : 'session-item'}
      ref={item}
    >
      <a
        className="session-row"
        href={routes.session(session.id)}
        aria-current={selected ? 'true' : undefined}
      >
        <span className={`badge type-${session.type}`}>
          {t(`type.${session.type}`)}
        </span>
        <span className="session-time">
          {formatDateTime(sessionTime(session), language)}
        </span>
        <span className="session-own">
          {own?.won && <span className="badge win">{t('row.win')}</span>}
          {own && own.entry.classPosition !== null && (
            <span className="badge you">
              {t('row.position', { pos: own.entry.classPosition })}
            </span>
          )}
        </span>
        <span className="session-classes">{session.classes.join(' · ')}</span>
      </a>
      <FavoriteButton id={session.id} />
    </li>
  );
}

/**
 * The left part of the sessions page: folder, filters and the list of sessions
 * grouped by event. It stays on screen while a session is open on the right.
 */
export function SessionList({ selectedId }: { selectedId: string | null }) {
  const { t, sessions, ready, folder, persistent, scan, language, favorites } =
    useApp();
  const [filter, setFilter] = useState<SessionFilter>(NO_FILTER);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');

  const filtered = useMemo(
    () => filterSessions(sessions, filter, favorites),
    [sessions, filter, favorites],
  );
  const groups = useMemo(() => groupByEvent(filtered), [filtered]);
  const tracks = useMemo(() => uniqueTracks(sessions), [sessions]);
  const classes = useMemo(() => uniqueClasses(sessions), [sessions]);

  const activeFilters = [
    filter.type !== 'all',
    filter.track !== '',
    filter.carClass !== '',
    filter.favoritesOnly,
    fromText !== '',
    toText !== '',
  ].filter(Boolean).length;

  return (
    <>
      <h2 className="list-title">
        {t('library.title')}
        <span className="count">
          {t('library.count', { n: filtered.length })}
        </span>
      </h2>

      <FolderBar />
      {!persistent && <p className="notice">{t('library.memoryOnly')}</p>}

      {sessions.length > 0 && (
        <details className="filter-box">
          <summary>
            {t('filter.title')}
            {activeFilters > 0 && (
              <span className="badge">{activeFilters}</span>
            )}
          </summary>
          <div className="filters">
            <label>
              {t('filter.type')}
              <select
                value={filter.type}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    type: e.target.value as SessionFilter['type'],
                  })
                }
              >
                <option value="all">{t('filter.all')}</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`type.${type}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('filter.class')}
              <select
                value={filter.carClass}
                onChange={(e) =>
                  setFilter({ ...filter, carClass: e.target.value })
                }
              >
                <option value="">{t('filter.all')}</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              {t('filter.track')}
              <select
                value={filter.track}
                onChange={(e) =>
                  setFilter({ ...filter, track: e.target.value })
                }
              >
                <option value="">{t('filter.all')}</option>
                {tracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('filter.from')}
              <input
                type="date"
                value={fromText}
                onChange={(e) => {
                  setFromText(e.target.value);
                  setFilter({
                    ...filter,
                    from: dayBound(e.target.value, false),
                  });
                }}
              />
            </label>
            <label>
              {t('filter.to')}
              <input
                type="date"
                value={toText}
                onChange={(e) => {
                  setToText(e.target.value);
                  setFilter({ ...filter, to: dayBound(e.target.value, true) });
                }}
              />
            </label>
            <label className="check wide">
              <input
                type="checkbox"
                checked={filter.favoritesOnly}
                onChange={(e) =>
                  setFilter({ ...filter, favoritesOnly: e.target.checked })
                }
              />
              {t('filter.favorites')}
            </label>
            {activeFilters > 0 && (
              <button
                className="wide"
                onClick={() => {
                  setFilter(NO_FILTER);
                  setFromText('');
                  setToText('');
                }}
              >
                {t('filter.reset')}
              </button>
            )}
          </div>
        </details>
      )}

      {ready && sessions.length === 0 && !scan.active && folder === 'none' && (
        <p className="empty">{t('library.empty')}</p>
      )}
      {sessions.length > 0 && filtered.length === 0 && (
        <p className="empty">{t('library.noMatch')}</p>
      )}

      {groups.map((group) => (
        <section className="event" key={group.key}>
          <h3>
            <span className="event-title">
              {group.title}
              <span className="layout-name">
                {trackTitle(
                  group.sessions[0]?.trackVenue ?? '',
                  group.trackCourse,
                )}
              </span>
              <CountryLabel
                venue={group.sessions[0]?.trackVenue ?? group.title}
                course={group.trackCourse}
              />
            </span>
            <span className="event-date">
              {formatDateTime(group.time, language)}
            </span>
          </h3>
          <ul className="session-list">
            {group.sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                selected={session.id === selectedId}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
