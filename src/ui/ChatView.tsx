import { useApp } from '../app/AppContext';
import { formatClock } from '../format/time';
import { isOwnDriver } from '../library/names';
import type { ChatEvent } from '../results/chatWindow';
import type { Session } from '../results/types';

/** One chat message as a list item; shared by the chat tab and the incident chat window. */
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

export function ChatView({ session }: { session: Session }) {
  const { t } = useApp();
  const messages = session.events.filter((e) => e.kind === 'chat');
  if (messages.length === 0) return <p className="empty">{t('chat.empty')}</p>;

  return (
    <ul className="chat">
      {messages.map((m, i) => (
        <ChatLine key={i} message={m} />
      ))}
    </ul>
  );
}
