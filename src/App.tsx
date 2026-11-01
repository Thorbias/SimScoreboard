import { AppProvider, useApp } from './app/AppContext';
import { routes, useRoute } from './app/route';
import { LibraryView } from './ui/LibraryView';
import { SessionView } from './ui/SessionView';
import { SettingsView } from './ui/SettingsView';

function Shell() {
  const { t } = useApp();
  const route = useRoute();

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href={routes.library()}>
          {t('app.name')}
        </a>
        <p className="tagline">{t('app.tagline')}</p>
        <nav>
          <a
            href={routes.library()}
            aria-current={route.name !== 'settings' ? 'page' : undefined}
          >
            {t('nav.library')}
          </a>
          <a
            href={routes.settings()}
            aria-current={route.name === 'settings' ? 'page' : undefined}
          >
            {t('nav.settings')}
          </a>
        </nav>
      </header>
      <main>
        {route.name === 'library' && <LibraryView />}
        {route.name === 'session' && <SessionView id={route.id} />}
        {route.name === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
