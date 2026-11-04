import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'sessions' }
  | { name: 'records' }
  | { name: 'settings' }
  | { name: 'league'; id: string | null; tab: string | null }
  | { name: 'leagueOpen'; drive: string | null; url: string | null }
  | { name: 'session'; id: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'settings') return { name: 'settings' };
  if (path === 'records') return { name: 'records' };
  // A link to a league: the Drive file ID, or an address (ADR-0009).
  const openDrive = /^league\/open\/([A-Za-z0-9_-]+)$/.exec(path);
  if (openDrive) {
    return { name: 'leagueOpen', drive: openDrive[1] as string, url: null };
  }
  const openUrl = /^league\/open\?u=(.+)$/.exec(path);
  if (openUrl) {
    return {
      name: 'leagueOpen',
      drive: null,
      url: decodeURIComponent(openUrl[1] as string),
    };
  }
  const league = /^league(?:\/([^/]+)(?:\/([a-z]+))?)?$/.exec(path);
  if (league) {
    return {
      name: 'league',
      id: league[1] ? decodeURIComponent(league[1]) : null,
      tab: league[2] ?? null,
    };
  }
  const session = /^session\/(.+)$/.exec(path);
  if (session)
    return { name: 'session', id: decodeURIComponent(session[1] as string) };
  return { name: 'sessions' };
}

export const routes = {
  sessions: () => '#/',
  records: () => '#/records',
  settings: () => '#/settings',
  league: (id?: string, tab?: string) =>
    id
      ? `#/league/${encodeURIComponent(id)}${tab ? `/${tab}` : ''}`
      : '#/league',
  leagueOpenDrive: (id: string) => `#/league/open/${id}`,
  leagueOpenUrl: (url: string) => `#/league/open?u=${encodeURIComponent(url)}`,
  session: (id: string) => `#/session/${encodeURIComponent(id)}`,
};

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

const getHash = () => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash);
  return parseRoute(hash);
}
