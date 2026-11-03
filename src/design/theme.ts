export type ThemeSetting = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'simscoreboard.theme';
/** The key under the former name of the app; read once and moved. */
const LEGACY_STORAGE_KEY = 'simpaddock.theme';

/** The part of `Storage` this module needs, so tests can pass a stand-in. */
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStorage(): ThemeStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Without a saved choice the app is dark; "auto" follows the system and is picked in the settings. */
export const DEFAULT_THEME_SETTING: ThemeSetting = 'dark';

export function isThemeSetting(value: unknown): value is ThemeSetting {
  return value === 'auto' || value === 'light' || value === 'dark';
}

/** The theme in effect: an explicit choice wins, otherwise the system decides. */
export function resolveTheme(
  setting: ThemeSetting,
  systemPrefersDark: boolean,
): Theme {
  if (setting !== 'auto') return setting;
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * The choice is a per-viewer convenience, so it lives in localStorage, which
 * can be read before the first paint. It can be unavailable (private mode,
 * blocked site data); then the app simply follows the system.
 */
export function loadThemeSetting(
  storage: ThemeStorage | null = defaultStorage(),
): ThemeSetting {
  try {
    if (!storage) return DEFAULT_THEME_SETTING;
    const value = storage.getItem(STORAGE_KEY);
    if (isThemeSetting(value)) return value;
    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (isThemeSetting(legacy)) {
      storage.setItem(STORAGE_KEY, legacy);
      storage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
    return DEFAULT_THEME_SETTING;
  } catch {
    return DEFAULT_THEME_SETTING;
  }
}

export function saveThemeSetting(
  setting: ThemeSetting,
  storage: ThemeStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, setting);
  } catch {
    // The choice then only lasts for this visit.
  }
}

/** Sets `data-theme` on <html>; "auto" removes it so the system query applies. */
export function applyThemeSetting(setting: ThemeSetting): void {
  const root = document.documentElement;
  if (setting === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', setting);
}
