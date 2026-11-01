import type { SessionSummary } from '../results/types';

export interface StoredSession {
  /** `SUMMARY_VERSION` at the time the record was written. */
  version: number;
  summary: SessionSummary;
  /** Size and modification time of the file, to detect changes on a rescan. */
  size: number;
  lastModified: number;
}

/**
 * Local storage for the session index and the settings. Best effort: if
 * IndexedDB is unavailable (private mode, blocked site data) the app keeps
 * working with an in-memory store that is lost on reload.
 */
export interface Store {
  /** False for the in-memory fallback. */
  readonly persistent: boolean;
  getSessions(): Promise<StoredSession[]>;
  putSessions(items: StoredSession[]): Promise<void>;
  deleteSessions(ids: string[]): Promise<void>;
  clearSessions(): Promise<void>;
  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;
}

export function createMemoryStore(): Store {
  const sessions = new Map<string, StoredSession>();
  const settings = new Map<string, unknown>();
  return {
    persistent: false,
    getSessions: async () => [...sessions.values()],
    putSessions: async (items) => {
      for (const item of items) sessions.set(item.summary.id, item);
    },
    deleteSessions: async (ids) => {
      for (const id of ids) sessions.delete(id);
    },
    clearSessions: async () => sessions.clear(),
    getSetting: async <T>(key: string) => settings.get(key) as T | undefined,
    setSetting: async (key, value) => {
      settings.set(key, value);
    },
  };
}

const DB_NAME = 'simpaddock';
const DB_VERSION = 1;
const SESSIONS = 'sessions';
const SETTINGS = 'settings';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      db.createObjectStore(SESSIONS, { keyPath: 'summary.id' });
      db.createObjectStore(SETTINGS);
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('IndexedDB is blocked'));
  });
}

export async function openStore(): Promise<Store> {
  try {
    const db = await openDb();
    // Probe once: some browsers open the database but fail on first use.
    await request(db.transaction(SETTINGS).objectStore(SETTINGS).count());
    return {
      persistent: true,
      getSessions: () =>
        request(db.transaction(SESSIONS).objectStore(SESSIONS).getAll()),
      putSessions: async (items) => {
        const tx = db.transaction(SESSIONS, 'readwrite');
        for (const item of items) tx.objectStore(SESSIONS).put(item);
        await done(tx);
      },
      deleteSessions: async (ids) => {
        const tx = db.transaction(SESSIONS, 'readwrite');
        for (const id of ids) tx.objectStore(SESSIONS).delete(id);
        await done(tx);
      },
      clearSessions: async () => {
        const tx = db.transaction(SESSIONS, 'readwrite');
        tx.objectStore(SESSIONS).clear();
        await done(tx);
      },
      getSetting: async <T>(key: string) =>
        (await request(
          db.transaction(SETTINGS).objectStore(SETTINGS).get(key),
        )) as T | undefined,
      setSetting: async (key, value) => {
        const tx = db.transaction(SETTINGS, 'readwrite');
        tx.objectStore(SETTINGS).put(value, key);
        await done(tx);
      },
    };
  } catch {
    return createMemoryStore();
  }
}
