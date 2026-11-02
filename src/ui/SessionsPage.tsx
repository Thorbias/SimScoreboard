import { useApp } from '../app/AppContext';
import { SessionList } from './SessionList';
import { SessionView } from './SessionView';

/**
 * Two columns: the list of sessions stays on the left, and the session chosen
 * there is shown on the right with its tabs. On a narrow screen only one of the
 * two is visible at a time.
 */
export function SessionsPage({ selectedId }: { selectedId: string | null }) {
  const { t } = useApp();
  return (
    <div className={selectedId ? 'split has-session' : 'split'}>
      <aside className="master" aria-label={t('nav.sessions')}>
        <SessionList selectedId={selectedId} />
      </aside>
      <section className="detail">
        {selectedId ? (
          <SessionView id={selectedId} />
        ) : (
          <p className="detail-empty">{t('sessions.pick')}</p>
        )}
      </section>
    </div>
  );
}
