import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionSummary } from '../results/types';
import { LEGACY_DB_NAME, openStore, type StoredSession } from './store';

function summary(id: string): SessionSummary {
  return {
    id,
    type: 'race',
    section: 'Race',
    endedAt: 1,
    startedAt: null,
    eventKey: null,
    mode: 'Multiplayer',
    trackVenue: 'Venue',
    trackCourse: 'Layout',
    trackEvent: 'Event',
    trackLength: 5000,
    gameVersion: '1.4200',
    minutes: 20,
    scheduledLaps: null,
    classes: ['GT3'],
    entries: [],
    contacts: [],
  };
}

function stored(id: string): StoredSession {
  return { version: 2, summary: summary(id), size: 10, lastModified: 20 };
}

function wait<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Builds a database the way the app wrote it under its former name. */
async function createLegacyDatabase(): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open(LEGACY_DB_NAME, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore('sessions', { keyPath: 'summary.id' });
      open.result.createObjectStore('settings');
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  const tx = db.transaction(['sessions', 'settings'], 'readwrite');
  tx.objectStore('sessions').put(stored('old-1.xml'));
  tx.objectStore('sessions').put(stored('old-2.xml'));
  tx.objectStore('settings').put(['Max Muster'], 'aliases');
  tx.objectStore('settings').put(['old-1.xml'], 'favorites');
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
}

async function databaseNames(): Promise<string[]> {
  return (await indexedDB.databases()).map((d) => d.name ?? '');
}

beforeEach(() => {
  // A fresh, empty browser for every test.
  globalThis.indexedDB = new IDBFactory();
});

describe('openStore', () => {
  it('keeps and returns sessions and settings', async () => {
    const store = await openStore();
    expect(store.persistent).toBe(true);
    await store.putSessions([stored('a.xml'), stored('b.xml')]);
    await store.setSetting('aliases', ['Max Muster']);
    expect((await store.getSessions()).map((s) => s.summary.id).sort()).toEqual(
      ['a.xml', 'b.xml'],
    );
    expect(await store.getSetting('aliases')).toEqual(['Max Muster']);
    await store.deleteSessions(['a.xml']);
    expect(await store.getSessions()).toHaveLength(1);
    await store.clearSessions();
    expect(await store.getSessions()).toHaveLength(0);
  });
});

describe('migration from the former app name', () => {
  it('copies the index and the settings and removes the old database', async () => {
    await createLegacyDatabase();
    expect(await databaseNames()).toContain(LEGACY_DB_NAME);

    const store = await openStore();
    expect((await store.getSessions()).map((s) => s.summary.id).sort()).toEqual(
      ['old-1.xml', 'old-2.xml'],
    );
    expect(await store.getSetting('aliases')).toEqual(['Max Muster']);
    expect(await store.getSetting('favorites')).toEqual(['old-1.xml']);
    expect(await databaseNames()).not.toContain(LEGACY_DB_NAME);
  });

  it('does nothing a second time', async () => {
    await createLegacyDatabase();
    await openStore();
    const again = await openStore();
    expect(await again.getSessions()).toHaveLength(2);
  });

  it('leaves the old database alone when the new one already has data', async () => {
    const first = await openStore();
    await first.setSetting('aliases', ['New Name']);
    await createLegacyDatabase();

    const store = await openStore();
    expect(await store.getSetting('aliases')).toEqual(['New Name']);
    expect(await store.getSessions()).toHaveLength(0);
    expect(await databaseNames()).toContain(LEGACY_DB_NAME);
  });

  it('starts empty when there is nothing to migrate', async () => {
    const store = await openStore();
    expect(await store.getSessions()).toEqual([]);
    expect(await store.getSetting('aliases')).toBeUndefined();
  });

  it('does not touch the old database if its stores are missing', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(LEGACY_DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore('other');
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    await wait(db.transaction('other').objectStore('other').count());
    db.close();

    const store = await openStore();
    expect(await store.getSessions()).toEqual([]);
  });
});
