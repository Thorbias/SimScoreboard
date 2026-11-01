import { useEffect, useState } from 'react';
import { NotConnectedError, useApp } from '../app/AppContext';
import { routes } from '../app/route';
import { formatDateTime } from '../format/date';
import { sessionTime } from '../library/filters';
import { classesOf, type Scope } from '../results/table';
import type { Session } from '../results/types';
import { QualiTable, RaceTable } from './ResultsTables';

type Load =
  | { status: 'loading' }
  | { status: 'ready'; session: Session }
  | { status: 'not-connected' }
  | { status: 'failed' };

function SessionHeader({ session }: { session: Session }) {
  const { t, language } = useApp();
  const facts = [
    formatDateTime(sessionTime(session), language),
    session.minutes !== null
      ? t('session.minutes', { n: session.minutes })
      : null,
    session.scheduledLaps !== null
      ? t('session.laps', { n: session.scheduledLaps })
      : null,
    session.trackLength !== null
      ? t('session.trackLength', {
          km: (session.trackLength / 1000).toFixed(3),
        })
      : null,
    t('session.drivers', { n: session.entries.length }),
    session.mode || null,
    session.gameVersion
      ? t('session.version', { version: session.gameVersion })
      : null,
  ].filter(Boolean);

  return (
    <header className="session-header">
      <p className="eyebrow">
        <span className={`badge type-${session.type}`}>
          {t(`type.${session.type}`)}
        </span>
        {session.trackEvent}
      </p>
      <h2>{session.trackVenue || session.trackCourse}</h2>
      {session.trackCourse && session.trackCourse !== session.trackVenue && (
        <p className="layout">{session.trackCourse}</p>
      )}
      <ul className="facts">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    </header>
  );
}

function SessionResults({ session }: { session: Session }) {
  const { t } = useApp();
  const classes = classesOf(session);
  const [carClass, setCarClass] = useState('');
  const scope: Scope =
    carClass && classes.includes(carClass)
      ? { kind: 'class', carClass }
      : { kind: 'overall' };

  return (
    <section>
      <div className="results-head">
        <h3>{t('results.title')}</h3>
        {classes.length > 1 && (
          <div className="segmented" role="group">
            <button
              aria-pressed={scope.kind === 'overall'}
              onClick={() => setCarClass('')}
            >
              {t('results.overall')}
            </button>
            {classes.map((c) => (
              <button
                key={c}
                aria-pressed={scope.kind === 'class' && scope.carClass === c}
                onClick={() => setCarClass(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
      {session.entries.length === 0 ? (
        <p className="empty">{t('results.empty')}</p>
      ) : session.type === 'race' ? (
        <RaceTable session={session} scope={scope} />
      ) : (
        <QualiTable session={session} scope={scope} />
      )}
    </section>
  );
}

function SessionLoader({ id }: { id: string }) {
  const { t, loadSession, sourceVersion } = useApp();
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadSession(id).then(
      (session) => {
        if (!cancelled) setLoad({ status: 'ready', session });
      },
      (error: unknown) => {
        if (cancelled) return;
        setLoad({
          status:
            error instanceof NotConnectedError ? 'not-connected' : 'failed',
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id, loadSession, sourceVersion]);

  return (
    <>
      <a className="back" href={routes.library()}>
        ← {t('session.back')}
      </a>
      {load.status === 'loading' && <p>{t('session.loading')}</p>}
      {load.status === 'not-connected' && (
        <p className="notice">{t('session.notConnected')}</p>
      )}
      {load.status === 'failed' && (
        <p className="notice error">{t('session.failed')}</p>
      )}
      {load.status === 'ready' && (
        <>
          <SessionHeader session={load.session} />
          <SessionResults session={load.session} />
        </>
      )}
    </>
  );
}

export function SessionView({ id }: { id: string }) {
  // Keyed so that opening another session starts from a clean loading state.
  return <SessionLoader key={id} id={id} />;
}
