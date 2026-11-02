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

const DB_NAME = 'simscoreboard';
/** The database of the app under its former name; its data is carried over once. */
export const LEGACY_DB_NAME = 'simpaddock';
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

async function isEmpty(db: IDBDatabase): Promise<boolean> {
  const sessions = await request(
    db.transaction(SESSIONS).objectStore(SESSIONS).count(),
  );
  const settings = await request(
    db.transaction(SETTINGS).objectStore(SETTINGS).count(),
  );
  return sessions === 0 && settings === 0;
}

function openExisting(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(name);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

/**
 * The app used to store its data in a database called `simpaddock`. On the
 * first start under the new name the index, the driver names, the favourites and
 * the folder access are copied over and the old database is deleted. Nothing is
 * done if the new database already holds data, if the old one does not exist, or
 * if the browser cannot list databases; the library is then simply read again.
 */
async function migrateLegacy(target: IDBDatabase): Promise<void> {
  try {
    if (typeof indexedDB.databases !== 'function') return;
    const known = await indexedDB.databases();
    if (!known.some((d) => d.name === LEGACY_DB_NAME)) return;
    if (!(await isEmpty(target))) return;

    const legacy = await openExisting(LEGACY_DB_NAME);
    try {
      if (
        !legacy.objectStoreNames.contains(SESSIONS) ||
        !legacy.objectStoreNames.contains(SETTINGS)
      ) {
        return;
      }
      const sessions = await request(
        legacy.transaction(SESSIONS).objectStore(SESSIONS).getAll(),
      );
      const keys = await request(
        legacy.transaction(SETTINGS).objectStore(SETTINGS).getAllKeys(),
      );
      const values = await request(
        legacy.transaction(SETTINGS).objectStore(SETTINGS).getAll(),
      );

      const tx = target.transaction([SESSIONS, SETTINGS], 'readwrite');
      for (const item of sessions) tx.objectStore(SESSIONS).put(item);
      keys.forEach((key, i) => tx.objectStore(SETTINGS).put(values[i], key));
      await done(tx);
    } finally {
      legacy.close();
    }
    await new Promise<void>((resolve) => {
      const del = indexedDB.deleteDatabase(LEGACY_DB_NAME);
      del.onsuccess = () => resolve();
      del.onerror = () => resolve();
      del.onblocked = () => resolve();
    });
  } catch {
    // A failed migration must never keep the app from starting.
  }
}

export async function openStore(): Promise<Store> {
  try {
    const db = await openDb();
    // Probe once: some browsers open the database but fail on first use.
    await request(db.transaction(SETTINGS).objectStore(SETTINGS).count());
    await migrateLegacy(db);
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
