import { describe, expect, it } from 'vitest';
import {
  isThemeSetting,
  loadThemeSetting,
  resolveTheme,
  saveThemeSetting,
  type ThemeStorage,
} from './theme';

function memoryStorage(initial: Record<string, string> = {}): ThemeStorage & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('theme', () => {
  it('lets an explicit choice win over the system', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system on automatic', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
  });

  it('moves a choice saved under the former app name', () => {
    const storage = memoryStorage({ 'simpaddock.theme': 'light' });
    expect(loadThemeSetting(storage)).toBe('light');
    expect(storage.data.get('simscoreboard.theme')).toBe('light');
    expect(storage.data.has('simpaddock.theme')).toBe(false);
    expect(loadThemeSetting(storage)).toBe('light');
  });

  it('prefers the new key and ignores invalid values', () => {
    expect(
      loadThemeSetting(
        memoryStorage({
          'simscoreboard.theme': 'dark',
          'simpaddock.theme': 'light',
        }),
      ),
    ).toBe('dark');
    expect(
      loadThemeSetting(memoryStorage({ 'simpaddock.theme': 'sepia' })),
    ).toBe('auto');
    expect(loadThemeSetting(null)).toBe('auto');
  });

  it('saves the choice and survives a storage that throws', () => {
    const storage = memoryStorage();
    saveThemeSetting('dark', storage);
    expect(storage.data.get('simscoreboard.theme')).toBe('dark');
    const broken: ThemeStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => saveThemeSetting('dark', broken)).not.toThrow();
    expect(loadThemeSetting(broken)).toBe('auto');
  });

  it('only accepts the three known settings', () => {
    expect(isThemeSetting('auto')).toBe(true);
    expect(isThemeSetting('light')).toBe(true);
    expect(isThemeSetting('sepia')).toBe(false);
    expect(isThemeSetting(null)).toBe(false);
  });
});
