import { AppProvider, useApp } from './app/AppContext';
import { routes, useRoute } from './app/route';
import { LeagueOpenPage, LeaguePage } from './ui/LeagueView';
import { LogoMark } from './ui/LogoMark';
import { RecordsView } from './ui/RecordsView';
import { SessionsPage } from './ui/SessionsPage';
import { SettingsView } from './ui/SettingsView';

function Shell() {
  const { t, demo, stopDemo } = useApp();
  const route = useRoute();
  // Every page shares one frame, so the header stays put when switching pages.
  // Sessions, personal bests and leagues keep their list on the left and fill
  // the screen height; the other pages scroll within the frame.
  const onSessions = route.name === 'sessions' || route.name === 'session';
  const split =
    onSessions || route.name === 'records' || route.name === 'league';

  return (
    <div className="app app-split">
      <header className="top">
        <a className="brand" href={routes.sessions()}>
          <span>Sim</span>
          <span className="brand-name">Scoreboard</span>
          <LogoMark />
        </a>
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
            href={routes.league()}
            aria-current={route.name === 'league' ? 'page' : undefined}
          >
            {t('nav.league')}
          </a>
          <a
            href={routes.settings()}
            aria-current={route.name === 'settings' ? 'page' : undefined}
          >
            {t('nav.settings')}
          </a>
        </nav>
      </header>
      {demo && (
        <div className="demo-banner" role="status">
          <span>{t('demo.banner')}</span>
          <button onClick={stopDemo}>{t('demo.exit')}</button>
        </div>
      )}
      <main className={split ? undefined : 'page'}>
        {onSessions && (
          <SessionsPage
            selectedId={route.name === 'session' ? route.id : null}
          />
        )}
        {route.name === 'records' && <RecordsView />}
        {route.name === 'league' && (
          <LeaguePage selectedId={route.id} tab={route.tab} />
        )}
        {route.name === 'leagueOpen' && (
          <div className="page-body">
            <LeagueOpenPage drive={route.drive} url={route.url} />
          </div>
        )}
        {route.name === 'settings' && (
          <div className="page-body">
            <SettingsView />
          </div>
        )}
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
