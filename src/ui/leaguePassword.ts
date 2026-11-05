import { parseLeague } from '../league/file';
import {
  checkKey,
  createProtection,
  decryptEnvelope,
  keyFromPassword,
  protectionFor,
  readEnvelope,
  serializeProtected,
  WrongPasswordError,
  type Protection,
} from '../league/protect';
import type { League } from '../league/types';
import { askPassword } from './passwordPrompt';

/**
 * The steps of password protection that need the user (ADR-0010): opening a
 * protected file, choosing a password, writing a protected file. The key of a
 * password is kept for this visit, so it is asked for once; the user can ask
 * to keep it on this device as well.
 */

const sessionKeys = new Map<string, CryptoKey>();

export interface OpenedLeague {
  league: League;
  /** Set when the file was protected. */
  protection?: Protection;
}

/**
 * Reads the text of a league file. A protected file needs its password: a key
 * kept for this league or this visit is tried first, then the user is asked.
 * Returns null when the user cancels. `wrong` is the text for a wrong password.
 */
export async function openLeagueText(
  text: string,
  known: Protection | undefined,
  wrong: string,
): Promise<OpenedLeague | null> {
  const envelope = readEnvelope(text);
  if (!envelope) return { league: parseLeague(text) };
  const { salt, iterations } = envelope.encryption;

  const remembered = known?.salt === salt ? known.key : undefined;
  for (const key of [remembered, sessionKeys.get(salt)]) {
    if (!key) continue;
    try {
      const league = await decryptEnvelope(envelope, key);
      const protection = await protectionFor(envelope.encryption, key);
      return {
        league,
        protection: key === remembered ? { ...protection, key } : protection,
      };
    } catch (error) {
      if (!(error instanceof WrongPasswordError)) throw error;
    }
  }

  let error: string | undefined;
  for (;;) {
    const answer = await askPassword({
      purpose: 'open',
      leagueName: envelope.name,
      error,
    });
    if (!answer) return null;
    const key = await keyFromPassword(answer.password, salt, iterations);
    try {
      const league = await decryptEnvelope(envelope, key);
      sessionKeys.set(salt, key);
      const protection = await protectionFor(envelope.encryption, key);
      return {
        league,
        protection: answer.remember ? { ...protection, key } : protection,
      };
    } catch (e) {
      if (!(e instanceof WrongPasswordError)) throw e;
      error = wrong;
    }
  }
}

/** A password the user chose, as the protection to remember for the league. */
export async function choosePassword(
  leagueName: string,
): Promise<Protection | null> {
  const answer = await askPassword({ purpose: 'choose', leagueName });
  if (!answer) return null;
  const { key, ...protection } = await createProtection(answer.password);
  sessionKeys.set(protection.salt, key);
  return answer.remember ? { ...protection, key } : protection;
}

/**
 * The text to write for a league. With a protection the text is encrypted; the
 * key comes from the device, this visit, or the password, which is asked for.
 * Returns the protection to remember (with the key when the user asked to keep
 * it), or null when the user cancels.
 */
export async function textToSave(
  league: League,
  protection: Protection | undefined,
  wrong: string,
): Promise<{ text: string; protection: Protection | undefined } | null> {
  if (!protection) {
    return {
      text: await serializeProtected(league, undefined, undefined),
      protection,
    };
  }
  let key = protection.key ?? sessionKeys.get(protection.salt);
  let remember = protection;
  if (!key) {
    let error: string | undefined;
    while (!key) {
      const answer = await askPassword({
        purpose: 'save',
        leagueName: league.name,
        error,
      });
      if (!answer) return null;
      const candidate = await keyFromPassword(
        answer.password,
        protection.salt,
        protection.iterations,
      );
      if (await checkKey(candidate, protection.verify)) {
        key = candidate;
        sessionKeys.set(protection.salt, key);
        if (answer.remember) remember = { ...protection, key };
      } else {
        error = wrong;
      }
    }
  }
  return {
    text: await serializeProtected(league, protection, key),
    protection: remember,
  };
}

/** Forgets the keys kept for this visit; used by the tests. */
export function forgetSessionKeys(): void {
  sessionKeys.clear();
}
