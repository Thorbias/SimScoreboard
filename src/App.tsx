import { AppProvider, useApp } from './app/AppContext';
import { routes, useRoute } from './app/route';
import { BRAND_SEGMENTS, SectorBar } from './ui/SectorBar';
import { RecordsView } from './ui/RecordsView';
import { SessionsPage } from './ui/SessionsPage';
import { SettingsView } from './ui/SettingsView';

function Shell() {
  const { t } = useApp();
  const route = useRoute();
  // Sessions and personal bests keep their list on the left and fill the screen
  // height; the other pages use the full width and scroll as a whole.
  const onSessions = route.name === 'sessions' || route.name === 'session';
  const split = onSessions || route.name === 'records';

  return (
    <div className={split ? 'app app-split' : 'app'}>
      <header className="top">
        <a className="brand" href={routes.sessions()}>
          <span>Sim</span>
          <span className="brand-name">Scoreboard</span>
        </a>
        <span className="brand-bar">
          <SectorBar segments={BRAND_SEGMENTS} size="lg" />
        </span>
        <p className="tagline">{t('app.tagline')}</p>
        <nav>
          <a
            href={routes.sessions()}
            aria-current={onSessions ? 'page' : undefined}
          >
            {t('nav.sessions')}
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
        {onSessions && (
          <SessionsPage
            selectedId={route.name === 'session' ? route.id : null}
          />
        )}
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
