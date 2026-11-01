import { useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import type { LanguageSetting } from '../i18n';
import { isOwnDriver, suggestNames } from '../library/names';

const LANGUAGES: LanguageSetting[] = ['auto', 'en', 'de'];

export function SettingsView() {
  const app = useApp();
  const { t, aliases, sessions } = app;
  const [draft, setDraft] = useState('');

  const suggestions = useMemo(
    () =>
      suggestNames(sessions, 8).filter((s) => !isOwnDriver(s.name, aliases)),
    [sessions, aliases],
  );

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || isOwnDriver(trimmed, aliases)) return;
    void app.setAliases([...aliases, trimmed]);
    setDraft('');
  };

  return (
    <>
      <h2>{t('settings.title')}</h2>

      <section className="panel">
        <h3>{t('settings.driver')}</h3>
        <p className="hint">{t('settings.driverHelp')}</p>
        <ul className="alias-list">
          {aliases.map((alias) => (
            <li key={alias}>
              <span>{alias}</span>
              <button
                onClick={() =>
                  void app.setAliases(aliases.filter((a) => a !== alias))
                }
              >
                {t('settings.remove')}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="alias-form"
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
          }}
        >
          <input
            value={draft}
            placeholder={t('settings.driverPlaceholder')}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="primary" type="submit">
            {t('settings.add')}
          </button>
        </form>
        {suggestions.length > 0 && (
          <>
            <h4>{t('settings.suggestions')}</h4>
            <ul className="suggestions">
              {suggestions.map((s) => (
                <li key={s.name}>
                  <button onClick={() => add(s.name)}>
                    {s.name} <span className="count">{s.sessions}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h3>{t('settings.language')}</h3>
        <select
          value={app.languageSetting}
          onChange={(e) =>
            void app.setLanguageSetting(e.target.value as LanguageSetting)
          }
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l === 'auto'
                ? t('settings.languageAuto')
                : l === 'en'
                  ? 'English'
                  : 'Deutsch'}
            </option>
          ))}
        </select>
      </section>

      <section className="panel">
        <h3>{t('settings.index')}</h3>
        <p className="hint">{t('settings.indexHelp')}</p>
        <button
          onClick={() => {
            if (window.confirm(t('settings.clearConfirm'))) {
              void app.clearIndex();
            }
          }}
        >
          {t('settings.clearIndex')}
        </button>
      </section>
    </>
  );
}
