import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { formatClock } from '../format/time';
import { isOwnDriver } from '../library/names';
import { findEntry, lapAt } from '../results/analysis';
import {
  CHAT_WINDOW_SECONDS,
  chatAround,
  chatMessages,
  incidentPosition,
  type ChatEvent,
} from '../results/chatWindow';
import type { Session, StreamEvent } from '../results/types';
import { ChatLine } from './ChatView';

type IncidentEvent = Exclude<StreamEvent, { kind: 'chat' }>;
type Kind = IncidentEvent['kind'];

const KINDS: Kind[] = ['contact', 'damage', 'trackLimits', 'penalty'];

export function isIncident(event: StreamEvent): event is IncidentEvent {
  return event.kind !== 'chat';
}

interface IncidentRow {
  event: IncidentEvent;
  carClass: string;
  lap: number | null;
  /** The chat sent within two minutes of the incident. */
  chat: ChatEvent[];
}

function ChatBubbleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

/** The chat around one incident, with a marker where the incident happened. */
function IncidentChat({
  row,
  onClose,
}: {
  row: IncidentRow;
  onClose: () => void;
}) {
  const { t } = useApp();
  const before = incidentPosition(row.chat, row.event.time);
  const marker = (
    <li className="chat-marker" key="marker">
      <span className="chat-time">{formatClock(row.event.time)}</span>
      <strong>{t(`inc.type.${row.event.kind}`)}</strong>
      <span>{row.event.driver}</span>
    </li>
  );
  return (
    <>
      <header className="chat-dialog-head">
        <div>
          <h3>{t('inc.chatTitle', { time: formatClock(row.event.time) })}</h3>
          <p className="muted">
            {t('inc.chatWindow', { minutes: CHAT_WINDOW_SECONDS / 60 })}
          </p>
        </div>
        <button
          className="chat-close"
          onClick={onClose}
          aria-label={t('inc.chatClose')}
          title={t('inc.chatClose')}
        >
          ×
        </button>
      </header>
      <ul className="chat">
        {row.chat.slice(0, before).map((m, i) => (
          <ChatLine key={i} message={m} />
        ))}
        {marker}
        {row.chat.slice(before).map((m, i) => (
          <ChatLine key={before + i} message={m} />
        ))}
      </ul>
    </>
  );
}

export function IncidentsView({ session }: { session: Session }) {
  const { t, aliases } = useApp();
  const [kind, setKind] = useState<Kind | ''>('');
  const [carClass, setCarClass] = useState('');
  const [driver, setDriver] = useState('');

  const [openRow, setOpenRow] = useState<IncidentRow | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const rows = useMemo((): IncidentRow[] => {
    const chat = chatMessages(session.events);
    return session.events.filter(isIncident).map((event) => {
      const entry = findEntry(session, event.driver);
      const time = event.time;
      return {
        event,
        carClass: entry?.carClass ?? '',
        lap:
          entry && time !== null
            ? lapAt(entry, time)
            : event.kind === 'trackLimits'
              ? event.lap
              : null,
        chat: chatAround(chat, time),
      };
    });
  }, [session]);

  // The modal dialog brings its own backdrop, focus handling and Escape key.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (openRow && !element.open) element.showModal();
    if (!openRow && element.open) element.close();
  }, [openRow]);

  const classes = [...new Set(rows.map((r) => r.carClass).filter(Boolean))];
  const drivers = [...new Set(rows.map((r) => r.event.driver))].sort((a, b) =>
    a.localeCompare(b),
  );
  const shown = rows.filter(
    (r) =>
      (kind === '' || r.event.kind === kind) &&
      (carClass === '' || r.carClass === carClass) &&
      (driver === '' || r.event.driver === driver),
  );

  const detail = (event: IncidentEvent): string => {
    switch (event.kind) {
      case 'contact': {
        const force = event.force !== null ? Math.round(event.force) : '–';
        return event.other
          ? t('inc.withDriver', { name: event.other, force })
          : t('inc.withObject', { object: event.object ?? '', force });
      }
      case 'damage':
        return t('inc.damage', { part: event.part });
      case 'trackLimits':
        return event.warningPoints
          ? t('inc.points', {
              outcome: event.outcome,
              points: event.currentPoints ?? event.warningPoints,
            })
          : event.outcome;
      case 'penalty':
        return event.served
          ? t('inc.served', { penalty: event.penalty })
          : t('inc.penaltyDetail', {
              penalty: event.penalty,
              reason: event.reason,
            });
    }
  };

  if (rows.length === 0) return <p className="empty">{t('inc.empty')}</p>;

  const total = session.minutes !== null ? session.minutes * 60 : null;

  return (
    <section>
      <div className="filters">
        <label>
          {t('inc.type')}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind | '')}
          >
            <option value="">{t('filter.all')}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`inc.type.${k}`)}
              </option>
            ))}
          </select>
        </label>
        {classes.length > 1 && (
          <label>
            {t('inc.class')}
            <select
              value={carClass}
              onChange={(e) => setCarClass(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t('inc.driver')}
          <select value={driver} onChange={(e) => setDriver(e.target.value)}>
            <option value="">{t('filter.all')}</option>
            {drivers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="empty">{t('inc.noMatch')}</p>
      ) : (
        <div className="table-wrap">
          <table className="results">
            <thead>
              <tr>
                <th className="num">{t('inc.time')}</th>
                <th className="num">{t('inc.remaining')}</th>
                <th>{t('inc.type')}</th>
                <th>{t('inc.driver')}</th>
                <th>{t('inc.class')}</th>
                <th className="num">{t('inc.lap')}</th>
                <th>{t('inc.detail')}</th>
                <th className="chat-col">{t('inc.chat')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr
                  key={i}
                  className={
                    isOwnDriver(r.event.driver, aliases) ? 'own' : undefined
                  }
                >
                  <td className="num">{formatClock(r.event.time)}</td>
                  <td className="num">
                    {total !== null && r.event.time !== null
                      ? formatClock(Math.max(0, total - r.event.time))
                      : '–'}
                  </td>
                  <td>{t(`inc.type.${r.event.kind}`)}</td>
                  <td>{r.event.driver}</td>
                  <td>{r.carClass || '–'}</td>
                  <td className="num">{r.lap ?? '–'}</td>
                  <td>{detail(r.event)}</td>
                  <td className="chat-col">
                    {r.chat.length > 0 && (
                      <button
                        className="chat-bubble"
                        onClick={() => setOpenRow(r)}
                        title={t('inc.chatShow', { n: r.chat.length })}
                        aria-label={t('inc.chatShow', { n: r.chat.length })}
                      >
                        <ChatBubbleIcon />
                        <span className="chat-count">{r.chat.length}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog
        ref={dialog}
        className="chat-dialog"
        onClose={() => setOpenRow(null)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === dialog.current) setOpenRow(null);
        }}
      >
        {openRow && (
          <IncidentChat row={openRow} onClose={() => setOpenRow(null)} />
        )}
      </dialog>
    </section>
  );
}
