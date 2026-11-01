import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'library' }
  | { name: 'records' }
  | { name: 'settings' }
  | { name: 'session'; id: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'settings') return { name: 'settings' };
  if (path === 'records') return { name: 'records' };
  const session = /^session\/(.+)$/.exec(path);
  if (session)
    return { name: 'session', id: decodeURIComponent(session[1] as string) };
  return { name: 'library' };
}

export const routes = {
  library: () => '#/',
  records: () => '#/records',
  settings: () => '#/settings',
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
