import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  applyThemeSetting,
  loadThemeSetting,
  resolveTheme,
  saveThemeSetting,
  type Theme,
  type ThemeSetting,
} from '../design/theme';
import {
  createTranslate,
  resolveLanguage,
  type Language,
  type LanguageSetting,
  type Translate,
} from '../i18n';
import type { League } from '../league/types';
import type { LeagueLink } from '../league/source';
import { loadDemo } from '../library/demo';
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
  themeSetting: ThemeSetting;
  /** The theme in effect, after the system preference is applied. */
  theme: Theme;
  setThemeSetting(setting: ThemeSetting): void;
  t: Translate;
  toggleFavorite(id: string): Promise<void>;
  /** The leagues of the user, or the in-memory ones during the demo. */
  leagues: League[];
  saveLeague(league: League): Promise<void>;
  /** Where each league is saved to and was loaded from, by league id. */
  leagueLinks: Record<string, LeagueLink>;
  /** Sets or, with null, forgets the link; does nothing during the demo. */
  setLeagueLink(id: string, link: LeagueLink | null): Promise<void>;
  deleteLeague(id: string): Promise<void>;
  chooseFolder(): Promise<void>;
  chooseFiles(files: FileList | null): Promise<void>;
  reconnectFolder(): Promise<void>;
  clearIndex(): Promise<void>;
  setAliases(aliases: string[]): Promise<void>;
  setLanguageSetting(setting: LanguageSetting): Promise<void>;
  loadSession(id: string): Promise<Session>;
  /** True while the bundled demo sessions are shown instead of the own library. */
  demo: boolean;
  demoError: string | null;
  startDemo(): Promise<void>;
  stopDemo(): void;
}

const IDLE_SCAN: ScanState = {
  active: false,
  done: 0,
  total: 0,
  failed: 0,
  error: null,
  empty: false,
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystemDark(listener: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function getSystemDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

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
  // The demo lives next to the real library and never touches it: its sessions,
  // favourites and files are kept apart and are gone when the demo ends.
  const [demo, setDemo] = useState<{ ownName: string } | null>(null);
  const [demoSessions, setDemoSessions] = useState<SessionSummary[]>([]);
  const [demoFavorites, setDemoFavorites] = useState<string[]>([]);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [leagues, setLeaguesState] = useState<League[]>([]);
  const [demoLeagues, setDemoLeagues] = useState<League[]>([]);
  const demoActiveRef = useRef(false);
  const demoFilesRef = useRef(new Map<string, File>());
  const [languageSetting, setLanguageSettingState] =
    useState<LanguageSetting>('auto');

  const storeRef = useRef<Store | null>(null);
  const favoritesRef = useRef<string[]>([]);
  const leaguesRef = useRef<League[]>([]);
  const [leagueLinks, setLeagueLinksState] = useState<
    Record<string, LeagueLink>
  >({});
  const leagueLinksRef = useRef<Record<string, LeagueLink>>({});
  const filesRef = useRef(new Map<string, File>());
  const knownRef = useRef(
    new Map<string, { size: number; lastModified: number }>(),
  );
  const handleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const [themeSetting, setThemeSettingState] =
    useState<ThemeSetting>(loadThemeSetting);
  const systemDark = useSyncExternalStore(subscribeSystemDark, getSystemDark);
  const theme = resolveTheme(themeSetting, systemDark);

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
      leaguesRef.current = (await store.getSetting<League[]>('leagues')) ?? [];
      setLeaguesState(leaguesRef.current);
      leagueLinksRef.current =
        (await store.getSetting<Record<string, LeagueLink>>('leagueLinks')) ??
        {};
      setLeagueLinksState(leagueLinksRef.current);
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

  const stopDemo = useCallback(() => {
    demoActiveRef.current = false;
    demoFilesRef.current = new Map();
    setDemo(null);
    setDemoSessions([]);
    setDemoFavorites([]);
    setDemoLeagues([]);
    setDemoError(null);
    setSourceVersion((v) => v + 1);
  }, []);

  const startDemo = useCallback(async () => {
    setDemoError(null);
    setScan({ ...IDLE_SCAN, active: true });
    try {
      const { ownName, files } = await loadDemo(import.meta.env.BASE_URL);
      demoFilesRef.current = new Map(files.map((f) => [f.name, f]));
      demoActiveRef.current = true;
      setDemoSessions([]);
      setDemoFavorites([]);
      setDemoLeagues([]);
      setDemo({ ownName });
      setSourceVersion((v) => v + 1);
      window.location.hash = '#/';
      const failed = await runIndexer(files, {
        onBatch: (items: StoredSession[]) => {
          const byId = new Map(items.map((i) => [i.summary.id, i.summary]));
          setDemoSessions((prev) => [
            ...prev.filter((s) => !byId.has(s.id)),
            ...byId.values(),
          ]);
        },
        onProgress: (done, total) =>
          setScan((prev) => ({ ...prev, done, total })),
      });
      setScan((prev) => ({ ...prev, active: false, failed: failed.length }));
    } catch (error) {
      demoActiveRef.current = false;
      setDemo(null);
      setScan(IDLE_SCAN);
      setDemoError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const chooseFolder = useCallback(async () => {
    if (demoActiveRef.current) stopDemo();
    const handle = await pickDirectory();
    if (!handle) return;
    await storeRef.current?.setSetting('folder', handle);
    await scanHandle(handle);
  }, [scanHandle, stopDemo]);

  const chooseFiles = useCallback(
    async (list: FileList | null) => {
      if (!list) return;
      if (demoActiveRef.current) stopDemo();
      setFolder('connected');
      await runScan(resultFilesFromList(Array.from(list)));
    },
    [runScan, stopDemo],
  );

  const reconnectFolder = useCallback(async () => {
    const handle = handleRef.current;
    if (handle && (await requestReadPermission(handle))) {
      await scanHandle(handle);
    }
  }, [scanHandle]);

  const clearIndex = useCallback(async () => {
    if (demoActiveRef.current) return;
    await storeRef.current?.clearSessions();
    knownRef.current.clear();
    setSessions([]);
  }, []);

  const setAliases = useCallback(async (next: string[]) => {
    if (demoActiveRef.current) return;
    setAliasesState(next);
    await storeRef.current?.setSetting('aliases', next);
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    if (demoActiveRef.current) {
      setDemoFavorites((prev) =>
        prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
      );
      return;
    }
    const current = favoritesRef.current;
    const next = current.includes(id)
      ? current.filter((f) => f !== id)
      : [...current, id];
    favoritesRef.current = next;
    setFavoritesState(next);
    await storeRef.current?.setSetting('favorites', next);
  }, []);

  const saveLeague = useCallback(async (league: League) => {
    const replace = (list: League[]) =>
      list.some((l) => l.id === league.id)
        ? list.map((l) => (l.id === league.id ? league : l))
        : [...list, league];
    // Leagues made during the demo hold anonymized names; they stay in memory.
    if (demoActiveRef.current) {
      setDemoLeagues(replace);
      return;
    }
    leaguesRef.current = replace(leaguesRef.current);
    setLeaguesState(leaguesRef.current);
    await storeRef.current?.setSetting('leagues', leaguesRef.current);
  }, []);

  const setLeagueLink = useCallback(
    async (id: string, link: LeagueLink | null) => {
      if (demoActiveRef.current) return;
      const next = { ...leagueLinksRef.current };
      if (link) next[id] = link;
      else delete next[id];
      leagueLinksRef.current = next;
      setLeagueLinksState(next);
      await storeRef.current?.setSetting('leagueLinks', next);
    },
    [],
  );

  const deleteLeague = useCallback(
    async (id: string) => {
      if (demoActiveRef.current) {
        setDemoLeagues((prev) => prev.filter((l) => l.id !== id));
        return;
      }
      leaguesRef.current = leaguesRef.current.filter((l) => l.id !== id);
      setLeaguesState(leaguesRef.current);
      await storeRef.current?.setSetting('leagues', leaguesRef.current);
      await setLeagueLink(id, null);
    },
    [setLeagueLink],
  );

  const setThemeSetting = useCallback((next: ThemeSetting) => {
    saveThemeSetting(next);
    applyThemeSetting(next);
    setThemeSettingState(next);
  }, []);

  const setLanguageSetting = useCallback(async (next: LanguageSetting) => {
    setLanguageSettingState(next);
    await storeRef.current?.setSetting('language', next);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const files = demoActiveRef.current ? demoFilesRef : filesRef;
    const file = files.current.get(id);
    if (!file) throw new NotConnectedError();
    return parseSession(await file.text(), id);
  }, []);

  const value: AppState = {
    ready,
    persistent,
    sessions: demo ? demoSessions : sessions,
    scan,
    sourceVersion,
    folder,
    canPickDirectory: supportsDirectoryPicker(),
    aliases: demo ? [demo.ownName] : aliases,
    favorites: demo ? demoFavorites : favorites,
    toggleFavorite,
    leagues: demo ? demoLeagues : leagues,
    saveLeague,
    leagueLinks: demo ? {} : leagueLinks,
    setLeagueLink,
    deleteLeague,
    languageSetting,
    language,
    themeSetting,
    theme,
    setThemeSetting,
    t,
    chooseFolder,
    chooseFiles,
    reconnectFolder,
    clearIndex,
    setAliases,
    setLanguageSetting,
    loadSession,
    demo: demo !== null,
    demoError,
    startDemo,
    stopDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
