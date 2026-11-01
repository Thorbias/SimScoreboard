import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createTranslate,
  resolveLanguage,
  type Language,
  type LanguageSetting,
  type Translate,
} from '../i18n';
import { runIndexer } from '../library/indexer';
import {
  hasReadPermission,
  listResultFiles,
  pickDirectory,
  requestReadPermission,
  resultFilesFromList,
  supportsDirectoryPicker,
} from '../library/sources';
import { parseSession, upgradeSummary } from '../results/parse';
import {
  SUMMARY_VERSION,
  type Session,
  type SessionSummary,
} from '../results/types';
import { openStore, type Store, type StoredSession } from '../storage/store';

export type FolderState = 'none' | 'needs-permission' | 'connected';

export interface ScanState {
  active: boolean;
  done: number;
  total: number;
  failed: number;
  error: string | null;
  /** The last scanned folder held no result files. */
  empty: boolean;
}

export class NotConnectedError extends Error {
  constructor() {
    super('The folder is not connected');
  }
}

export interface AppState {
  ready: boolean;
  persistent: boolean;
  sessions: SessionSummary[];
  scan: ScanState;
  /** Changes whenever the set of readable files changes. */
  sourceVersion: number;
  folder: FolderState;
  canPickDirectory: boolean;
  aliases: string[];
  /** IDs (file names) of the sessions marked as favourite. */
  favorites: string[];
  languageSetting: LanguageSetting;
  language: Language;
  t: Translate;
  toggleFavorite(id: string): Promise<void>;
  chooseFolder(): Promise<void>;
  chooseFiles(files: FileList | null): Promise<void>;
  reconnectFolder(): Promise<void>;
  clearIndex(): Promise<void>;
  setAliases(aliases: string[]): Promise<void>;
  setLanguageSetting(setting: LanguageSetting): Promise<void>;
  loadSession(id: string): Promise<Session>;
}

const IDLE_SCAN: ScanState = {
  active: false,
  done: 0,
  total: 0,
  failed: 0,
  error: null,
  empty: false,
};

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [scan, setScan] = useState<ScanState>(IDLE_SCAN);
  const [sourceVersion, setSourceVersion] = useState(0);
  const [folder, setFolder] = useState<FolderState>('none');
  const [aliases, setAliasesState] = useState<string[]>([]);
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [languageSetting, setLanguageSettingState] =
    useState<LanguageSetting>('auto');

  const storeRef = useRef<Store | null>(null);
  const favoritesRef = useRef<string[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const knownRef = useRef(
    new Map<string, { size: number; lastModified: number }>(),
  );
  const handleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const language = resolveLanguage(languageSetting);
  const t = useMemo(() => createTranslate(language), [language]);

  const runScan = useCallback(async (files: File[]) => {
    const store = storeRef.current;
    if (!store) return;
    filesRef.current = new Map(files.map((f) => [f.name, f]));
    setSourceVersion((v) => v + 1);
    setScan({ ...IDLE_SCAN, active: true, empty: files.length === 0 });
    try {
      const known = knownRef.current;
      const removed = [...known.keys()].filter(
        (id) => !filesRef.current.has(id),
      );
      if (removed.length > 0 && files.length > 0) {
        await store.deleteSessions(removed);
        for (const id of removed) known.delete(id);
        const gone = new Set(removed);
        setSessions((prev) => prev.filter((s) => !gone.has(s.id)));
      }
      const changed = files.filter((f) => {
        const k = known.get(f.name);
        return !k || k.size !== f.size || k.lastModified !== f.lastModified;
      });
      const failed = await runIndexer(changed, {
        onBatch: (items: StoredSession[]) => {
          for (const item of items) {
            known.set(item.summary.id, {
              size: item.size,
              lastModified: item.lastModified,
            });
          }
          const byId = new Map(items.map((i) => [i.summary.id, i.summary]));
          setSessions((prev) => [
            ...prev.filter((s) => !byId.has(s.id)),
            ...byId.values(),
          ]);
          void store.putSessions(items);
        },
        onProgress: (done, total) =>
          setScan((prev) => ({ ...prev, done, total })),
      });
      setScan((prev) => ({ ...prev, active: false, failed: failed.length }));
    } catch (error) {
      setScan({
        ...IDLE_SCAN,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  const scanHandle = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      handleRef.current = handle;
      setFolder('connected');
      try {
        await runScan(await listResultFiles(handle));
      } catch (error) {
        setScan({
          ...IDLE_SCAN,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [runScan],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const store = await openStore();
      if (cancelled) return;
      storeRef.current = store;
      setPersistent(store.persistent);
      const stored = await store.getSessions();
      for (const item of stored) {
        // Records of an older version stay out of `known`, so the next scan
        // reads their files again.
        if (item.version === SUMMARY_VERSION) {
          knownRef.current.set(item.summary.id, {
            size: item.size,
            lastModified: item.lastModified,
          });
        }
      }
      setSessions(stored.map((s) => upgradeSummary(s.summary)));
      setAliasesState((await store.getSetting<string[]>('aliases')) ?? []);
      favoritesRef.current =
        (await store.getSetting<string[]>('favorites')) ?? [];
      setFavoritesState(favoritesRef.current);
      setLanguageSettingState(
        (await store.getSetting<LanguageSetting>('language')) ?? 'auto',
      );
      const handle =
        await store.getSetting<FileSystemDirectoryHandle>('folder');
      if (handle) {
        handleRef.current = handle;
        if (await hasReadPermission(handle)) await scanHandle(handle);
        else setFolder('needs-permission');
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [scanHandle]);

  const chooseFolder = useCallback(async () => {
    const handle = await pickDirectory();
    if (!handle) return;
    await storeRef.current?.setSetting('folder', handle);
    await scanHandle(handle);
  }, [scanHandle]);

  const chooseFiles = useCallback(
    async (list: FileList | null) => {
      if (!list) return;
      setFolder('connected');
      await runScan(resultFilesFromList(Array.from(list)));
    },
    [runScan],
  );

  const reconnectFolder = useCallback(async () => {
    const handle = handleRef.current;
    if (handle && (await requestReadPermission(handle))) {
      await scanHandle(handle);
    }
  }, [scanHandle]);

  const clearIndex = useCallback(async () => {
    await storeRef.current?.clearSessions();
    knownRef.current.clear();
    setSessions([]);
  }, []);

  const setAliases = useCallback(async (next: string[]) => {
    setAliasesState(next);
    await storeRef.current?.setSetting('aliases', next);
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const current = favoritesRef.current;
    const next = current.includes(id)
      ? current.filter((f) => f !== id)
      : [...current, id];
    favoritesRef.current = next;
    setFavoritesState(next);
    await storeRef.current?.setSetting('favorites', next);
  }, []);

  const setLanguageSetting = useCallback(async (next: LanguageSetting) => {
    setLanguageSettingState(next);
    await storeRef.current?.setSetting('language', next);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const file = filesRef.current.get(id);
    if (!file) throw new NotConnectedError();
    return parseSession(await file.text(), id);
  }, []);

  const value: AppState = {
    ready,
    persistent,
    sessions,
    scan,
    sourceVersion,
    folder,
    canPickDirectory: supportsDirectoryPicker(),
    aliases,
    favorites,
    toggleFavorite,
    languageSetting,
    language,
    t,
    chooseFolder,
    chooseFiles,
    reconnectFolder,
    clearIndex,
    setAliases,
    setLanguageSetting,
    loadSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
