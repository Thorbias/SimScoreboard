import { describe, expect, it } from 'vitest';
import { parseSession } from './parse';

// The demo sessions are the only anonymized real data that ships with the app.
const demoFiles = import.meta.glob('../../public/demo/*.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const demoManifest = import.meta.glob('../../public/demo/manifest.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Written by tools/anonymize-results.mjs on the machine that has the real
// files; it is git-ignored, so on other machines this list is empty.
const leakLists = import.meta.glob('../../samples/leak-names.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const baseName = (path: string) => path.split('/').at(-1) as string;

/** True when `name` occurs as a word of its own, not inside another word. */
function occursAsWord(name: string, text: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
    'u',
  ).test(text);
}

const manifest = JSON.parse(Object.values(demoManifest)[0] ?? '{}') as {
  ownName?: string;
  files?: string[];
};

describe('demo data is anonymized and complete', () => {
  it('lists exactly the files that are there', () => {
    const present = Object.keys(demoFiles).map(baseName).sort();
    expect(present.length).toBeGreaterThan(0);
    expect([...(manifest.files ?? [])].sort()).toEqual(present);
  });

  it('uses only pseudonymous names and teams', () => {
    for (const [path, text] of Object.entries(demoFiles)) {
      const file = baseName(path);
      for (const m of text.matchAll(/<Name>([^<]*)<\/Name>/g)) {
        expect(m[1], file).toMatch(/^((Driver|Guest) \d\d|Demo Driver)$/);
      }
      for (const m of text.matchAll(/<TeamName>([^<]*)<\/TeamName>/g)) {
        expect(m[1], file).toMatch(/^Team \d\d$/);
      }
    }
  });

  it('has no local paths, server names or connection details', () => {
    for (const [path, text] of Object.entries(demoFiles)) {
      const file = baseName(path);
      expect(text, file).not.toMatch(/[A-Z]:\\(?!Installed)/);
      expect(text, file).not.toMatch(
        /<ServerName>(?!Server<)[^<]+<\/ServerName>/,
      );
      expect(text, file).not.toMatch(
        /<ConnectionType[^>]*>(?!Connection<)[^<]+</,
      );
    }
  });

  it('contains none of the real names seen while building it', () => {
    const list = Object.values(leakLists)[0];
    if (!list) return; // real files are not available on this machine
    const names = list.split('\n').filter(Boolean);
    for (const [path, text] of Object.entries(demoFiles)) {
      for (const name of names) {
        expect(
          occursAsWord(name, text),
          `${baseName(path)} leaks a real name`,
        ).toBe(false);
      }
    }
  });

  it('has the own driver in every session', () => {
    expect(manifest.ownName).toBe('Demo Driver');
    for (const [path, text] of Object.entries(demoFiles)) {
      expect(text, baseName(path)).toContain('<Name>Demo Driver</Name>');
    }
  });

  it('can be read by the parser, with races, qualifying and practice', () => {
    const types = new Set<string>();
    for (const [path, text] of Object.entries(demoFiles)) {
      const session = parseSession(text, baseName(path));
      types.add(session.type);
      expect(session.entries.length, baseName(path)).toBeGreaterThan(0);
    }
    expect([...types].sort()).toEqual(['practice', 'qualifying', 'race']);
  });

  it('stays small enough to ship', () => {
    const bytes = Object.values(demoFiles).reduce(
      (sum, t) => sum + t.length,
      0,
    );
    expect(bytes).toBeLessThan(2 * 1024 * 1024);
  });
});
