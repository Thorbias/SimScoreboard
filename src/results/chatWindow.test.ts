import { describe, expect, it } from 'vitest';
import { parseSession } from './parse';
import type { StreamEvent } from './types';
import {
  CHAT_WINDOW_SECONDS,
  CHAT_INCIDENT_KINDS,
  chatAfter,
  chatMessages,
  incidentsBefore,
  incidentPosition,
  type ChatEvent,
} from './chatWindow';

const files = import.meta.glob('./__fixtures__/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function chat(
  time: number | null,
  text = 'hello',
  sender = 'Driver 01',
): ChatEvent {
  return { kind: 'chat', time, sender, text };
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

describe('chatAfter', () => {
  const messages = [chat(0), chat(100), chat(120), chat(130), chat(131)];

  it('takes messages from the incident to 30 seconds after, ends included', () => {
    expect(CHAT_WINDOW_SECONDS).toBe(30);
    expect(chatAfter(messages, 100).map((m) => m.time)).toEqual([
      100, 120, 130,
    ]);
  });

  it('ignores messages sent before the incident', () => {
    expect(chatAfter(messages, 101).map((m) => m.time)).toEqual([
      120, 130, 131,
    ]);
  });

  it('is empty when nothing was said after the incident', () => {
    expect(chatAfter(messages, 200)).toEqual([]);
  });

  it('is empty for an incident without a time', () => {
    expect(chatAfter(messages, null)).toEqual([]);
  });

  it('accepts another window', () => {
    expect(chatAfter(messages, 100, 10).map((m) => m.time)).toEqual([100]);
  });
});

describe('CHAT_INCIDENT_KINDS', () => {
  it('names contacts and damage only', () => {
    expect([...CHAT_INCIDENT_KINDS]).toEqual(['contact', 'damage']);
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

describe('incidentsBefore', () => {
  const contact = (
    time: number,
    driver: string,
    other: string | null,
  ): StreamEvent => ({
    kind: 'contact',
    time,
    driver,
    force: 100,
    other,
    object: other ? null : 'a wall',
  });
  const damage = (time: number, driver: string): StreamEvent => ({
    kind: 'damage',
    time,
    driver,
    part: 'suspension',
  });
  const says = (time: number, sender: string) => chat(time, 'ouch', sender);

  it('finds incidents of the sender up to 30 seconds before the message', () => {
    const events = [
      contact(60, 'Anna', 'Bert'),
      contact(80, 'Anna', null),
      damage(95, 'Anna'),
    ];
    const found = incidentsBefore(says(100, 'Anna'), events);
    expect(found.map((e) => e.time)).toEqual([80, 95]);
  });

  it('includes an incident at the same moment and at exactly 30 seconds', () => {
    const events = [contact(70, 'Anna', null), damage(100, 'Anna')];
    expect(incidentsBefore(says(100, 'Anna'), events)).toHaveLength(2);
  });

  it('finds a contact with the sender as the other driver', () => {
    const events = [contact(90, 'Bert', 'Anna')];
    expect(incidentsBefore(says(100, 'Anna'), events)).toHaveLength(1);
  });

  it('ignores incidents after the message, of other drivers, and other kinds', () => {
    const events: StreamEvent[] = [
      contact(101, 'Anna', null),
      contact(90, 'Bert', 'Cora'),
      damage(90, 'Bert'),
      {
        kind: 'penalty',
        time: 90,
        driver: 'Anna',
        penalty: 'Drive Thru',
        seconds: null,
        laps: null,
        reason: '',
        served: false,
      },
    ];
    expect(incidentsBefore(says(100, 'Anna'), events)).toEqual([]);
  });

  it('compares names without the online suffix and the letter case', () => {
    const events = [damage(90, 'anna example')];
    expect(
      incidentsBefore(says(100, 'Anna Example#4711'), events),
    ).toHaveLength(1);
  });

  it('knows the short names of the chat', () => {
    // Greg Wilson reports contact with Vittorio Deux; Deux answers in the chat.
    const events = [contact(216, 'Greg Wilson', 'Vittorio Deux')];
    expect(incidentsBefore(says(230, 'V Deux'), events)).toHaveLength(1);
    expect(incidentsBefore(says(230, 'G Wilson'), events)).toHaveLength(1);
    expect(incidentsBefore(says(236, 'C McHugh'), events)).toEqual([]);
  });

  it('finds nothing for a message without a time', () => {
    expect(incidentsBefore(chat(null), [damage(1, 'Driver 01')])).toEqual([]);
  });
});

describe('real session data', () => {
  const name = '2026_10_30_14_38_02-65R1.xml';
  const session = parseSession(files[`./__fixtures__/${name}`] as string, name);
  const all = chatMessages(session.events);
  const incidents = session.events.filter((e) => e.kind !== 'chat');

  it('has chat and incidents to work with', () => {
    expect(all.length).toBeGreaterThan(0);
    expect(incidents.length).toBeGreaterThan(0);
  });

  it('never takes more with the short window than with a longer one', () => {
    for (const e of incidents) {
      const short = chatAfter(all, e.time);
      const long = chatAfter(all, e.time, 300);
      expect(short.length).toBeLessThanOrEqual(long.length);
      for (const m of short) {
        expect(m.time).toBeGreaterThanOrEqual(e.time as number);
        expect(m.time).toBeLessThanOrEqual((e.time as number) + 30);
      }
    }
  });
});
