import { describe, expect, it } from 'vitest';
import { isThemeSetting, resolveTheme } from './theme';

describe('theme', () => {
  it('lets an explicit choice win over the system', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system on automatic', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
  });

  it('only accepts the three known settings', () => {
    expect(isThemeSetting('auto')).toBe(true);
    expect(isThemeSetting('light')).toBe(true);
    expect(isThemeSetting('sepia')).toBe(false);
    expect(isThemeSetting(null)).toBe(false);
  });
});
