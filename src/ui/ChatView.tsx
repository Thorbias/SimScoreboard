import { useApp } from '../app/AppContext';
import { formatClock } from '../format/time';
import { isOwnDriver } from '../library/names';
import {
  incidentsBefore,
  type ChatEvent,
  type IncidentEvent,
} from '../results/chatWindow';
import type { Session } from '../results/types';

function LightningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

/** One chat message as a list item, for the chat window of an incident. */
export function ChatLine({ message }: { message: ChatEvent }) {
  const { aliases } = useApp();
  return (
    <li className={isOwnDriver(message.sender, aliases) ? 'own' : undefined}>
      <span className="chat-time">{formatClock(message.time)}</span>
      <strong>{message.sender}</strong>
      <span>{message.text}</span>
    </li>
  );
}

export function ChatView({
  session,
  onShowIncident,
}: {
  session: Session;
  onShowIncident: (incident: IncidentEvent) => void;
}) {
  const { t, aliases } = useApp();
  const messages = session.events.filter((e) => e.kind === 'chat');
  if (messages.length === 0) return <p className="empty">{t('chat.empty')}</p>;

  return (
    <div className="table-wrap">
      <table className="results chat-table">
        <thead>
          <tr>
            <th className="num">{t('chat.time')}</th>
            <th>{t('chat.driver')}</th>
            <th>{t('chat.message')}</th>
            <th className="chat-col">{t('chat.incident')}</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m, i) => {
            // The latest incident before the message is the one it most
            // likely talks about.
            const incident = incidentsBefore(m, session.events).at(-1);
            const label = incident
              ? t('chat.showIncident', {
                  type: t(`inc.type.${incident.kind}`),
                  time: formatClock(incident.time),
                })
              : '';
            return (
              <tr
                key={i}
                className={isOwnDriver(m.sender, aliases) ? 'own' : undefined}
              >
                <td className="num">{formatClock(m.time)}</td>
                <td>{m.sender}</td>
                <td className="chat-text">{m.text}</td>
                <td className="chat-col">
                  {incident && (
                    <button
                      className="incident-link"
                      onClick={() => onShowIncident(incident)}
                      title={label}
                      aria-label={label}
                    >
                      <LightningIcon />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
