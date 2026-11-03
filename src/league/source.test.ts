import { describe, expect, it } from 'vitest';
import { createLeague, serializeLeague } from './file';
import { fetchLeague, parseLeagueAddress } from './source';

describe('parseLeagueAddress', () => {
  it('accepts https addresses and trims them', () => {
    expect(parseLeagueAddress('  https://example.org/a/league.json ')).toBe(
      'https://example.org/a/league.json',
    );
  });

  it('accepts http only for the local machine', () => {
    expect(parseLeagueAddress('http://localhost:5173/x.json')).toBe(
      'http://localhost:5173/x.json',
    );
    expect(parseLeagueAddress('http://example.org/x.json')).toBeNull();
  });

  it('rejects other schemes, credentials and text', () => {
    expect(parseLeagueAddress('file:///c:/x.json')).toBeNull();
    expect(parseLeagueAddress('javascript:alert(1)')).toBeNull();
    expect(parseLeagueAddress('https://user:pw@example.org/x')).toBeNull();
    expect(parseLeagueAddress('not an address')).toBeNull();
  });
});

describe('fetchLeague', () => {
  const league = createLeague('Spa Cup');
  const answer = (status: number, body: string) => async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  });

  it('loads and parses a league file', async () => {
    const loaded = await fetchLeague(
      'https://example.org/l.json',
      answer(200, serializeLeague(league)),
    );
    expect(loaded.id).toBe(league.id);
    expect(loaded.name).toBe('Spa Cup');
  });

  it('asks for the newest version', async () => {
    let cache: string | undefined;
    await fetchLeague('https://example.org/l.json', async (_url, init) => {
      cache = init?.cache;
      return {
        ok: true,
        status: 200,
        text: async () => serializeLeague(league),
      };
    });
    expect(cache).toBe('no-store');
  });

  it('reports a bad address, a failing server and a bad file', async () => {
    await expect(fetchLeague('ftp://x/l.json')).rejects.toThrow('https://');
    await expect(
      fetchLeague('https://example.org/l.json', answer(404, '')),
    ).rejects.toThrow('404');
    await expect(
      fetchLeague('https://example.org/l.json', async () => {
        throw new TypeError('Failed to fetch');
      }),
    ).rejects.toThrow('reached');
    await expect(
      fetchLeague('https://example.org/l.json', answer(200, '{"a":1}')),
    ).rejects.toThrow();
  });
});
