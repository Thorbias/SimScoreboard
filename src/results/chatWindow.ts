import { isChatSender } from '../library/names';
import type { StreamEvent } from './types';

/** An incident gets the chat from its time up to this many seconds after it. */
export const CHAT_WINDOW_SECONDS = 30;

/** Only these incidents show chat; penalties and track limits do not. */
export const CHAT_INCIDENT_KINDS: readonly string[] = ['contact', 'damage'];

export type ChatEvent = Extract<StreamEvent, { kind: 'chat' }>;

/** The chat messages of a session that have a time, in the order they were sent. */
export function chatMessages(events: readonly StreamEvent[]): ChatEvent[] {
  return events
    .filter((e): e is ChatEvent => e.kind === 'chat' && e.time !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}

/**
 * The chat messages sent from `time` up to `windowSeconds` after it, both
 * ends included. Without a time there is nothing to compare, so the result is
 * empty.
 */
export function chatAfter(
  messages: readonly ChatEvent[],
  time: number | null,
  windowSeconds: number = CHAT_WINDOW_SECONDS,
): ChatEvent[] {
  if (time === null) return [];
  return messages.filter(
    (m) => m.time !== null && m.time >= time && m.time <= time + windowSeconds,
  );
}

/**
 * Where an incident belongs in a list of chat messages: the number of messages
 * sent before it. Messages sent at the same moment count as after it.
 */
export function incidentPosition(
  messages: readonly ChatEvent[],
  time: number | null,
): number {
  if (time === null) return messages.length;
  const index = messages.findIndex((m) => m.time !== null && m.time >= time);
  return index === -1 ? messages.length : index;
}

export type IncidentEvent = Exclude<StreamEvent, { kind: 'chat' }>;

/**
 * The incidents a chat message belongs to: contacts and damage of the driver
 * who wrote it, or contacts "with" that driver, that happened up to
 * `windowSeconds` before the message (or at the same moment). Oldest first;
 * at the same moment, the report of the sender's own car comes last.
 */
export function incidentsBefore(
  message: ChatEvent,
  events: readonly StreamEvent[],
  windowSeconds: number = CHAT_WINDOW_SECONDS,
): IncidentEvent[] {
  if (message.time === null) return [];
  const sent = message.time;
  const { sender } = message;
  return events
    .filter(
      (e): e is IncidentEvent =>
        CHAT_INCIDENT_KINDS.includes(e.kind) &&
        e.kind !== 'chat' &&
        e.time !== null &&
        e.time <= sent &&
        e.time >= sent - windowSeconds &&
        (isChatSender(sender, e.driver) ||
          (e.kind === 'contact' &&
            e.other !== null &&
            isChatSender(sender, e.other))),
    )
    .sort(
      (a, b) =>
        (a.time as number) - (b.time as number) ||
        Number(isChatSender(sender, a.driver)) -
          Number(isChatSender(sender, b.driver)),
    );
}
