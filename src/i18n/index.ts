import { de } from './de';
import { en, type MessageKey } from './en';

export type Language = 'en' | 'de';
export type LanguageSetting = Language | 'auto';
export type { MessageKey };

const MESSAGES: Record<Language, Record<MessageKey, string>> = { en, de };

/** English is the default; German is chosen for German browser locales. */
export function resolveLanguage(
  setting: LanguageSetting,
  browserLanguage: string = typeof navigator === 'undefined'
    ? 'en'
    : navigator.language,
): Language {
  if (setting !== 'auto') return setting;
  return browserLanguage.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export type Translate = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;

export function createTranslate(language: Language): Translate {
  const messages = MESSAGES[language];
  return (key, values) => {
    const template = messages[key];
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
}
