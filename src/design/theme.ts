export type ThemeSetting = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'simpaddock.theme';

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
export function loadThemeSetting(): ThemeSetting {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isThemeSetting(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

export function saveThemeSetting(setting: ThemeSetting): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, setting);
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
