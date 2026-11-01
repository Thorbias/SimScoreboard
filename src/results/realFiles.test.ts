import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseResultFileName } from './fileName';
import { parseSession, summarize } from './parse';

// Local smoke test against a real results folder. Skipped unless
// SIMPADDOCK_RESULTS points at one, e.g. the game's UserData/Log/Results.
const dir = process.env.SIMPADDOCK_RESULTS;

describe.skipIf(!dir)('real result files', () => {
  it('parses every file without throwing', () => {
    const names = readdirSync(dir as string).filter((n) =>
      parseResultFileName(n),
    );
    expect(names.length).toBeGreaterThan(0);
    const problems: string[] = [];
    let entries = 0;
    for (const name of names) {
      try {
        const session = parseSession(
          readFileSync(join(dir as string, name), 'utf8'),
          name,
        );
        summarize(session);
        entries += session.entries.length;
        if (session.entries.length === 0) problems.push(`${name}: no entries`);
      } catch (error) {
        problems.push(`${name}: ${String(error)}`);
      }
    }
    console.log(`${names.length} files, ${entries} entries`);
    console.log(problems.join('\n'));
    expect(problems.filter((p) => !p.endsWith('no entries'))).toEqual([]);
  });
});
