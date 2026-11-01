import { useApp } from '../app/AppContext';
import { formatClock } from '../format/time';
import { isOwnDriver } from '../library/names';
import type { Session } from '../results/types';

export function ChatView({ session }: { session: Session }) {
  const { t, aliases } = useApp();
  const messages = session.events.filter((e) => e.kind === 'chat');
  if (messages.length === 0) return <p className="empty">{t('chat.empty')}</p>;

  return (
    <ul className="chat">
      {messages.map((m, i) => (
        <li
          key={i}
          className={isOwnDriver(m.sender, aliases) ? 'own' : undefined}
        >
          <span className="chat-time">{formatClock(m.time)}</span>
          <strong>{m.sender}</strong>
          <span>{m.text}</span>
        </li>
      ))}
    </ul>
  );
}
