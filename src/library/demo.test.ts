import { describe, expect, it } from 'vitest';
import { loadDemo, parseManifest } from './demo';

const NAME = '2026_10_25_13_52_10-34R1.xml';

function fakeFetch(
  routes: Record<string, { status?: number; body: string }>,
): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const route = routes[url];
    if (!route) return new Response('missing', { status: 404 });
    return new Response(route.body, { status: route.status ?? 200 });
  }) as typeof fetch;
}

describe('parseManifest', () => {
  it('accepts a list of result file names', () => {
    expect(parseManifest({ ownName: 'Demo Driver', files: [NAME] })).toEqual({
      ownName: 'Demo Driver',
      files: [NAME],
    });
  });

  it('rejects anything else', () => {
    expect(() => parseManifest(null)).toThrow();
    expect(() => parseManifest({ ownName: '', files: [NAME] })).toThrow();
    expect(() => parseManifest({ ownName: 'x', files: [] })).toThrow();
    expect(() =>
      parseManifest({ ownName: 'x', files: ['../secret.txt'] }),
    ).toThrow();
    expect(() =>
      parseManifest({ ownName: 'x', files: [NAME, NAME] }),
    ).toThrow();
    expect(() => parseManifest({ ownName: 'x', files: [1] })).toThrow();
  });
});

describe('loadDemo', () => {
  it('turns the listed files into File objects', async () => {
    const fetchImpl = fakeFetch({
      './demo/manifest.json': {
        body: JSON.stringify({ ownName: 'Demo Driver', files: [NAME] }),
      },
      [`./demo/${NAME}`]: { body: '<rFactorXML></rFactorXML>' },
    });
    const demo = await loadDemo('./', fetchImpl);
    expect(demo.ownName).toBe('Demo Driver');
    expect(demo.files).toHaveLength(1);
    expect(demo.files[0]?.name).toBe(NAME);
    expect(await demo.files[0]?.text()).toBe('<rFactorXML></rFactorXML>');
  });

  it('fails clearly when the manifest is missing', async () => {
    await expect(loadDemo('./', fakeFetch({}))).rejects.toThrow('HTTP 404');
  });

  it('fails when a listed file is missing', async () => {
    const fetchImpl = fakeFetch({
      './demo/manifest.json': {
        body: JSON.stringify({ ownName: 'Demo Driver', files: [NAME] }),
      },
    });
    await expect(loadDemo('./', fetchImpl)).rejects.toThrow(NAME);
  });
});
