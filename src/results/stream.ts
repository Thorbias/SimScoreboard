import type { StreamEvent } from './types';
import type { XmlElement } from './xml';

function num(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function parseIncident(el: XmlElement): StreamEvent | null {
  const m = /^(.+?)\(\d+\) reported contact \(([\d.]+)\) with (.+)$/.exec(
    el.text,
  );
  if (!m) return null;
  const withText = m[3] as string;
  const car = /^another vehicle (.+?)\(\d+\)$/.exec(withText);
  return {
    kind: 'contact',
    time: num(el.attrs.et),
    driver: m[1] as string,
    force: num(m[2]),
    other: car ? (car[1] as string) : null,
    object: car ? null : withText,
  };
}

function parseSector(el: XmlElement): StreamEvent | null {
  const m = /^(.+?)\(\d+\) reports new (.+) damage$/.exec(el.text);
  if (!m) return null; // "set new best for sector N" carries no extra information
  return {
    kind: 'damage',
    time: num(el.attrs.et),
    driver: m[1] as string,
    part: m[2] as string,
  };
}

function parsePenalty(el: XmlElement): StreamEvent | null {
  const driver = el.attrs.Driver;
  if (driver) {
    return {
      kind: 'penalty',
      time: num(el.attrs.et),
      driver,
      penalty: el.attrs.Penalty ?? '',
      seconds: num(el.attrs.Time),
      laps: num(el.attrs.Laps),
      reason: el.attrs.Reason ?? '',
      served: false,
    };
  }
  // "<Name> served 1st Drive Thru penalty, result: …"
  const served = /^(.+?) served (.+?) penalty/.exec(el.text);
  if (!served) return null;
  return {
    kind: 'penalty',
    time: num(el.attrs.et),
    driver: served[1] as string,
    penalty: served[2] as string,
    seconds: null,
    laps: null,
    reason: '',
    served: true,
  };
}

function parseChat(el: XmlElement): StreamEvent | null {
  const colon = el.text.indexOf(': ');
  if (colon === -1) return null;
  return {
    kind: 'chat',
    time: num(el.attrs.et),
    sender: el.text.slice(0, colon),
    text: el.text.slice(colon + 2),
  };
}

/**
 * Reads the events worth showing from the `Stream` of a session. Lap-crossing
 * scores and "new best sector" lines are skipped; they make up most of the
 * stream and are not needed. The game writes track-limit entries twice, so
 * identical ones are dropped.
 */
export function parseStream(stream: XmlElement | undefined): StreamEvent[] {
  if (!stream) return [];
  const events: StreamEvent[] = [];
  const seen = new Set<string>();
  for (const el of stream.children) {
    let event: StreamEvent | null = null;
    switch (el.name) {
      case 'Incident':
        event = parseIncident(el);
        break;
      case 'Sector':
        event = parseSector(el);
        break;
      case 'Penalty':
        event = parsePenalty(el);
        break;
      case 'ChatMessage':
        event = parseChat(el);
        break;
      case 'TrackLimits':
        event = {
          kind: 'trackLimits',
          time: num(el.attrs.et),
          driver: el.attrs.Driver ?? '',
          lap: num(el.attrs.Lap),
          warningPoints: num(el.attrs.WarningPoints),
          currentPoints: num(el.attrs.CurrentPoints),
          outcome: el.text,
        };
        break;
      default:
        break;
    }
    if (!event) continue;
    if (event.kind === 'trackLimits') {
      const key = `${event.time}|${event.driver}|${event.lap}|${event.outcome}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    events.push(event);
  }
  return events;
}
