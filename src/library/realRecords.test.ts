import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseResultFileName } from '../results/fileName';
import { parseSession, summarize } from '../results/parse';
import { buildRecords } from './records';
import { countryOf } from './tracks';

// Local smoke test: SIMPADDOCK_RESULTS is a results folder, SIMPADDOCK_OWN a
// driver name found in it.
const dir = process.env.SIMPADDOCK_RESULTS;
const own = process.env.SIMPADDOCK_OWN;

describe.skipIf(!dir || !own)('personal bests from real files', () => {
  it('builds records and knows the country of every venue', () => {
    const sessions = readdirSync(dir as string)
      .filter((n) => parseResultFileName(n))
      .map((n) =>
        summarize(
          parseSession(readFileSync(join(dir as string, n), 'utf8'), n),
        ),
      );
    const venues = buildRecords(sessions, [own as string]);
    expect(venues.length).toBeGreaterThan(0);
    console.log(
      venues
        .map(
          (v) =>
            `${v.venue} [${countryOf(v.venue) ?? '??'}] sessions=${v.sessionCount} layouts=${v.layouts.length} laps=${v.totalLaps} best=${v.bestByClass.map((b) => b.carClass + ' ' + b.best.toFixed(3)).join(', ')}`,
        )
        .join('\n'),
    );
    const unknown = [...new Set(sessions.map((s) => s.trackVenue))].filter(
      (v) => countryOf(v) === null,
    );
    console.log('unknown countries:', unknown);
  });
});
