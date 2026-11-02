import { AppProvider, useApp } from './app/AppContext';
import { routes, useRoute } from './app/route';
import { LibraryView } from './ui/LibraryView';
import { BRAND_SEGMENTS, SectorBar } from './ui/SectorBar';
import { RecordsView } from './ui/RecordsView';
import { SessionView } from './ui/SessionView';
import { SettingsView } from './ui/SettingsView';

function Shell() {
  const { t } = useApp();
  const route = useRoute();

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href={routes.library()}>
          <span>Sim</span>
          <span className="brand-name">Scoreboard</span>
        </a>
        <span className="brand-bar">
          <SectorBar segments={BRAND_SEGMENTS} size="lg" />
        </span>
        <p className="tagline">{t('app.tagline')}</p>
        <nav>
          <a
            href={routes.library()}
            aria-current={
              route.name === 'library' || route.name === 'session'
                ? 'page'
                : undefined
            }
          >
            {t('nav.library')}
          </a>
          <a
            href={routes.records()}
            aria-current={route.name === 'records' ? 'page' : undefined}
          >
            {t('nav.records')}
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
        {route.name === 'records' && <RecordsView />}
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
