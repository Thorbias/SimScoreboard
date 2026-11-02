import type { StreamEvent } from './types';

/** An incident gets the chat from this many seconds before and after it. */
export const CHAT_WINDOW_SECONDS = 120;

export type ChatEvent = Extract<StreamEvent, { kind: 'chat' }>;

/** The chat messages of a session that have a time, in the order they were sent. */
export function chatMessages(events: readonly StreamEvent[]): ChatEvent[] {
  return events
    .filter((e): e is ChatEvent => e.kind === 'chat' && e.time !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}

/**
 * The chat messages sent within `windowSeconds` before or after `time`, both
 * ends included. Without a time there is nothing to compare, so the result is
 * empty.
 */
export function chatAround(
  messages: readonly ChatEvent[],
  time: number | null,
  windowSeconds: number = CHAT_WINDOW_SECONDS,
): ChatEvent[] {
  if (time === null) return [];
  return messages.filter(
    (m) => m.time !== null && Math.abs(m.time - time) <= windowSeconds,
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
