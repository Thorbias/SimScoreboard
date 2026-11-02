import { describe, expect, it } from 'vitest';
import { de } from './de';
import { en } from './en';
import { createTranslate, resolveLanguage } from './index';

describe('i18n', () => {
  it('has the same keys in every language', () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps the placeholders of the English text in the German text', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(de[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('defaults to English and follows a German browser locale', () => {
    expect(resolveLanguage('auto', 'fr-FR')).toBe('en');
    expect(resolveLanguage('auto', 'de-AT')).toBe('de');
    expect(resolveLanguage('en', 'de-DE')).toBe('en');
  });

  it('fills in values', () => {
    const t = createTranslate('en');
    expect(t('library.count', { n: 3 })).toBe('3 sessions');
    expect(createTranslate('de')('library.count', { n: 4 })).toBe('4 Sessions');
    expect(createTranslate('en')('row.position', { pos: 2 })).toBe('P2');
  });
});
