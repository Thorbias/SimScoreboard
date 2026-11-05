import { afterEach, describe, expect, it } from 'vitest';
import { createLeague, serializeLeague } from '../league/file';
import {
  createProtection,
  encryptLeague,
  readEnvelope,
  type Protection,
} from '../league/protect';
import {
  forgetSessionKeys,
  openLeagueText,
  textToSave,
} from './leaguePassword';
import { settle, snapshot } from './passwordPrompt';

const PASSWORD = 'correct horse battery staple';
const FAST = 1000;
const WRONG = 'wrong password';

/** Waits until the dialog is asked for something, and answers it. */
async function answer(password: string, remember = false) {
  for (let i = 0; i < 200 && !snapshot(); i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
  const request = snapshot()?.request;
  settle({ password, remember });
  return request;
}

async function protectedText() {
  const league = createLeague('Spa Cup');
  const protection = await createProtection(PASSWORD, FAST);
  const text = await encryptLeague(league, protection, protection.key);
  return { league, protection, text };
}

afterEach(() => {
  forgetSessionKeys();
  settle(null);
});

describe('openLeagueText', () => {
  it('reads a plain file without asking', async () => {
    const league = createLeague('Plain');
    const opened = await openLeagueText(
      serializeLeague(league),
      undefined,
      WRONG,
    );
    expect(opened?.league).toEqual(league);
    expect(opened?.protection).toBeUndefined();
    expect(snapshot()).toBeNull();
  });

  it('asks for the password of a protected file and opens it', async () => {
    const { league, text } = await protectedText();
    const opening = openLeagueText(text, undefined, WRONG);
    const request = await answer(PASSWORD);
    const opened = await opening;
    expect(request).toMatchObject({ purpose: 'open', leagueName: 'Spa Cup' });
    expect(opened?.league).toEqual(league);
    expect(opened?.protection?.salt).toBe(readEnvelope(text)?.encryption.salt);
    expect(opened?.protection?.key).toBeUndefined();
  });

  it('asks again after a wrong password', async () => {
    const { league, text } = await protectedText();
    const opening = openLeagueText(text, undefined, WRONG);
    await answer('not the password');
    const second = await answer(PASSWORD);
    expect(second?.error).toBe(WRONG);
    expect((await opening)?.league).toEqual(league);
  });

  it('returns null when the user cancels', async () => {
    const { text } = await protectedText();
    const opening = openLeagueText(text, undefined, WRONG);
    for (let i = 0; i < 200 && !snapshot(); i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    settle(null);
    expect(await opening).toBeNull();
  });

  it('keeps the key for this visit and for the device when asked', async () => {
    const { league, text } = await protectedText();
    const first = openLeagueText(text, undefined, WRONG);
    await answer(PASSWORD, true);
    const opened = await first;
    expect(opened?.protection?.key).toBeDefined();

    // Again, without asking: with the remembered key, and with the visit's key.
    const withDevice = await openLeagueText(text, opened?.protection, WRONG);
    expect(withDevice?.league).toEqual(league);
    expect(withDevice?.protection?.key).toBeDefined();
    const withVisit = await openLeagueText(text, undefined, WRONG);
    expect(withVisit?.league).toEqual(league);
    expect(withVisit?.protection?.key).toBeUndefined();
    expect(snapshot()).toBeNull();
  });
});

describe('textToSave', () => {
  it('writes a plain file without a protection', async () => {
    const league = createLeague('Plain');
    const saved = await textToSave(league, undefined, WRONG);
    expect(saved?.text).toBe(serializeLeague(league));
    expect(saved?.protection).toBeUndefined();
  });

  it('uses the remembered key without asking', async () => {
    const { league, protection } = await protectedText();
    const saved = await textToSave(league, protection, WRONG);
    expect(readEnvelope(saved?.text ?? '')).not.toBeNull();
    expect(snapshot()).toBeNull();
  });

  it('asks for the password when no key is at hand, and checks it', async () => {
    const { league, protection } = await protectedText();
    const { key, ...withoutKey } = protection;
    void key;
    const saving = textToSave(league, withoutKey as Protection, WRONG);
    await answer('another password!');
    const second = await answer(PASSWORD, true);
    expect(second?.error).toBe(WRONG);
    const saved = await saving;
    expect(readEnvelope(saved?.text ?? '')?.encryption.salt).toBe(
      protection.salt,
    );
    expect(saved?.protection?.key).toBeDefined();
  });

  it('returns null when the user cancels', async () => {
    const { league, protection } = await protectedText();
    const { key, ...withoutKey } = protection;
    void key;
    const saving = textToSave(league, withoutKey as Protection, WRONG);
    for (let i = 0; i < 200 && !snapshot(); i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    settle(null);
    expect(await saving).toBeNull();
  });
});
