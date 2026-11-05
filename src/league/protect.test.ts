import { describe, expect, it } from 'vitest';
import { createLeague, parseLeague, serializeLeague } from './file';
import {
  checkKey,
  createProtection,
  decryptEnvelope,
  encryptLeague,
  keyFromPassword,
  protectionFor,
  readEnvelope,
  serializeProtected,
  WrongPasswordError,
} from './protect';
import type { League } from './types';

// Few iterations keep the tests fast; the real value is KDF_ITERATIONS.
const FAST = 1000;
const PASSWORD = 'correct horse battery staple';

function league(): League {
  const l = createLeague('Spa Cup');
  l.races = [
    {
      id: 'r1',
      name: 'Round 1',
      sessionId: 'a.xml',
      date: 1,
      track: 'Spa',
      results: [
        {
          driverName: 'Anna Example',
          carClass: 'GT3',
          carNumber: '1',
          position: 1,
          classPosition: 1,
          classGridPosition: 1,
          laps: 20,
          finishStatus: 'Finished Normally',
          finishTime: 1800,
          bestLap: 90,
        },
      ],
    },
  ];
  return l;
}

describe('protected league files', () => {
  it('round-trips a league with the password', async () => {
    const original = league();
    const protection = await createProtection(PASSWORD, FAST);
    const text = await encryptLeague(original, protection, protection.key);

    const envelope = readEnvelope(text);
    expect(envelope).not.toBeNull();
    const key = await keyFromPassword(PASSWORD, protection.salt, FAST);
    expect(await decryptEnvelope(envelope!, key)).toEqual(original);
  });

  it('keeps the id and the name readable and hides the rest', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const text = await encryptLeague(league(), protection, protection.key);
    const raw = JSON.parse(text) as Record<string, unknown>;
    expect(raw.name).toBe('Spa Cup');
    expect(raw.id).toMatch(/^league-/);
    expect(text).not.toContain('Anna Example');
    expect(text).not.toContain('floor(');
    expect(raw).not.toHaveProperty('races');
    expect(raw).not.toHaveProperty('formula');
  });

  it('uses a new IV for every save', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const a = readEnvelope(
      await encryptLeague(league(), protection, protection.key),
    );
    const b = readEnvelope(
      await encryptLeague(league(), protection, protection.key),
    );
    expect(a?.encryption.iv).not.toBe(b?.encryption.iv);
    expect(a?.data).not.toBe(b?.data);
  });

  it('refuses a wrong password', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const text = await encryptLeague(league(), protection, protection.key);
    const wrong = await keyFromPassword(
      'another password!',
      protection.salt,
      FAST,
    );
    await expect(decryptEnvelope(readEnvelope(text)!, wrong)).rejects.toThrow(
      WrongPasswordError,
    );
  });

  it('notices a file that was changed', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const text = await encryptLeague(league(), protection, protection.key);
    const raw = JSON.parse(text) as { data: string };
    const bytes = atob(raw.data).split('');
    bytes[10] = String.fromCharCode(bytes[10]!.charCodeAt(0) ^ 1);
    raw.data = btoa(bytes.join(''));
    await expect(
      decryptEnvelope(readEnvelope(JSON.stringify(raw))!, protection.key),
    ).rejects.toThrow(WrongPasswordError);
  });

  it('recognizes the right key without a file', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    expect(await checkKey(protection.key, protection.verify)).toBe(true);
    const wrong = await keyFromPassword(
      'another password!',
      protection.salt,
      FAST,
    );
    expect(await checkKey(wrong, protection.verify)).toBe(false);
    expect(await checkKey(protection.key, 'nonsense')).toBe(false);
  });

  it('gets the protection back from a file and its key', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const text = await encryptLeague(league(), protection, protection.key);
    const info = readEnvelope(text)!.encryption;
    const again = await protectionFor(info, protection.key);
    expect(again.salt).toBe(protection.salt);
    expect(again.iterations).toBe(FAST);
    expect(await checkKey(protection.key, again.verify)).toBe(true);
  });
});

describe('readEnvelope and the plain reader', () => {
  it('gives null for a plain league file and for other text', () => {
    expect(readEnvelope(serializeLeague(league()))).toBeNull();
    expect(readEnvelope('not json')).toBeNull();
    expect(readEnvelope('{"format":"other"}')).toBeNull();
  });

  it('refuses a malformed protected file', () => {
    const bad = JSON.stringify({
      format: 'simscoreboard-league',
      version: 1,
      id: 'x',
      name: 'y',
      encryption: { v: 1, kdf: 'PBKDF2-SHA256', iterations: -1 },
      data: '',
    });
    expect(() => readEnvelope(bad)).toThrow('malformed');
  });

  it('makes the plain reader say that a password is needed', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const text = await encryptLeague(league(), protection, protection.key);
    expect(() => parseLeague(text)).toThrow('protected by a password');
  });
});

describe('serializeProtected', () => {
  it('writes a plain file without a protection', async () => {
    const text = await serializeProtected(league(), undefined, undefined);
    expect(parseLeague(text).name).toBe('Spa Cup');
  });

  it('writes a protected file with a protection and key', async () => {
    const protection = await createProtection(PASSWORD, FAST);
    const text = await serializeProtected(league(), protection, protection.key);
    expect(readEnvelope(text)).not.toBeNull();
  });
});
