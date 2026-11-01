import { describe, expect, it } from 'vitest';

const fixtures = import.meta.glob('./__fixtures__/*.xml', {
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

describe('fixtures are anonymized', () => {
  it('has fixtures', () => {
    expect(Object.keys(fixtures).length).toBeGreaterThan(0);
  });

  it('uses only pseudonymous driver names', () => {
    for (const [file, text] of Object.entries(fixtures)) {
      const names = [...text.matchAll(/<Name>([^<]*)<\/Name>/g)].map(
        (m) => m[1],
      );
      for (const name of names) {
        expect(name, file).toMatch(/^((Driver|Guest) \d\d|Own Driver)$/);
      }
      expect(text, file).not.toMatch(/D:\\|C:\\/);
    }
  });

  it('contains none of the real names seen while building them', () => {
    const list = Object.values(leakLists)[0];
    if (!list) return; // real files are not available on this machine
    const names = list.split('\n').filter(Boolean);
    for (const [file, text] of Object.entries(fixtures)) {
      for (const name of names) {
        expect(text.includes(name), `${file} leaks a real name`).toBe(false);
      }
    }
  });
});
