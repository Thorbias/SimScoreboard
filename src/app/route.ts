import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'sessions' }
  | { name: 'records' }
  | { name: 'settings' }
  | { name: 'league'; id: string | null }
  | { name: 'session'; id: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'settings') return { name: 'settings' };
  if (path === 'records') return { name: 'records' };
  const league = /^league(?:\/(.+))?$/.exec(path);
  if (league) {
    return {
      name: 'league',
      id: league[1] ? decodeURIComponent(league[1]) : null,
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
  league: (id?: string) =>
    id ? `#/league/${encodeURIComponent(id)}` : '#/league',
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
