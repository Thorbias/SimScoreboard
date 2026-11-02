import { describe, expect, it } from 'vitest';
import { parseSession } from './parse';
import {
  CHAT_WINDOW_SECONDS,
  chatAround,
  chatMessages,
  incidentPosition,
  type ChatEvent,
} from './chatWindow';

const files = import.meta.glob('./__fixtures__/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function chat(time: number | null, text = 'hello'): ChatEvent {
  return { kind: 'chat', time, sender: 'Driver 01', text };
}

describe('chatMessages', () => {
  it('keeps only chat with a time, sorted', () => {
    const list = chatMessages([
      chat(50, 'b'),
      { kind: 'damage', time: 10, driver: 'x', part: 'suspension' },
      chat(null, 'no time'),
      chat(20, 'a'),
    ]);
    expect(list.map((m) => m.text)).toEqual(['a', 'b']);
  });
});

describe('chatAround', () => {
  const messages = [chat(0), chat(100), chat(220), chat(221), chat(500)];

  it('takes messages within two minutes before and after, ends included', () => {
    expect(CHAT_WINDOW_SECONDS).toBe(120);
    expect(chatAround(messages, 100).map((m) => m.time)).toEqual([0, 100, 220]);
    expect(chatAround(messages, 341).map((m) => m.time)).toEqual([221]);
  });

  it('is empty when nothing was said around the incident', () => {
    expect(chatAround(messages, 360)).toEqual([]);
  });

  it('is empty for an incident without a time', () => {
    expect(chatAround(messages, null)).toEqual([]);
  });

  it('accepts another window', () => {
    expect(chatAround(messages, 100, 10).map((m) => m.time)).toEqual([100]);
  });
});

describe('incidentPosition', () => {
  const messages = [chat(10), chat(20), chat(30)];

  it('counts the messages sent before the incident', () => {
    expect(incidentPosition(messages, 5)).toBe(0);
    expect(incidentPosition(messages, 25)).toBe(2);
    expect(incidentPosition(messages, 99)).toBe(3);
  });

  it('puts messages sent at the same moment after the incident', () => {
    expect(incidentPosition(messages, 20)).toBe(1);
  });

  it('puts an incident without a time at the end', () => {
    expect(incidentPosition(messages, null)).toBe(3);
  });
});

describe('real session data', () => {
  it('finds chat near the contacts of the multiplayer race', () => {
    const name = '2026_10_30_14_38_02-65R1.xml';
    const session = parseSession(
      files[`./__fixtures__/${name}`] as string,
      name,
    );
    const all = chatMessages(session.events);
    expect(all.length).toBeGreaterThan(0);
    const near = session.events.filter(
      (e) => e.kind !== 'chat' && chatAround(all, e.time).length > 0,
    );
    expect(near.length).toBeGreaterThan(0);
    const far = session.events.filter(
      (e) => e.kind !== 'chat' && chatAround(all, e.time).length === 0,
    );
    expect(near.length + far.length).toBe(
      session.events.filter((e) => e.kind !== 'chat').length,
    );
  });
});
