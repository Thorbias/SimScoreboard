import { LeagueFileError, parseLeague, serializeLeague } from './file';
import { LEAGUE_FORMAT, type League } from './types';

/**
 * Password protection of the league file (ADR-0010). The league is encrypted
 * with AES-256-GCM; the key comes from the password with PBKDF2-SHA-256. The id
 * and the name stay readable, everything else is in one encrypted block.
 */

/** OWASP's advice for PBKDF2-HMAC-SHA256; it makes every guess cost time. */
export const KDF_ITERATIONS = 600_000;
/** A password this short is refused. */
export const MIN_PASSWORD_LENGTH = 12;

const SALT_BYTES = 16;
const IV_BYTES = 12;
const VERIFY_TEXT = 'simscoreboard-league';

/** The encryption block of a protected file. */
export interface EncryptionInfo {
  /** Version of this block, for later changes. */
  v: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  /** Base64. */
  salt: string;
  /** Base64; new for every save. */
  iv: string;
}

/** A protected league file as it is written. */
export interface Envelope {
  format: typeof LEAGUE_FORMAT;
  version: number;
  id: string;
  name: string;
  encryption: EncryptionInfo;
  /** Base64 of the encrypted league without id and name. */
  data: string;
}

/**
 * What is remembered of the protection of one league on this computer. The key
 * is only there when the user asked to keep it on this device.
 */
export interface Protection {
  salt: string;
  iterations: number;
  /** Proves a password is the right one without a file at hand. */
  verify: string;
  key?: CryptoKey;
}

export class WrongPasswordError extends LeagueFileError {
  constructor() {
    super('The password is wrong, or the file was changed');
  }
}

function toBase64(bytes: Uint8Array): string {
  let text = '';
  for (const b of bytes) text += String.fromCharCode(b);
  return btoa(text);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const raw = atob(text);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const random = (n: number): Uint8Array<ArrayBuffer> =>
  crypto.getRandomValues(new Uint8Array(n));

/** The key for a password and a salt; it cannot be read out of the browser. */
export async function keyFromPassword(
  password: string,
  salt: string,
  iterations: number = KDF_ITERATIONS,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64(salt),
      iterations,
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(key: CryptoKey, text: string) {
  const iv = random(IV_BYTES);
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text),
  );
  return { iv, data: new Uint8Array(data) };
}

async function decrypt(
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
): Promise<string> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new WrongPasswordError();
  }
}

/** A new protection with a fresh salt, for a password the user just chose. */
export async function createProtection(
  password: string,
  iterations: number = KDF_ITERATIONS,
): Promise<Protection & { key: CryptoKey }> {
  const salt = toBase64(random(SALT_BYTES));
  const key = await keyFromPassword(password, salt, iterations);
  return { salt, iterations, verify: await makeVerifier(key), key };
}

/** The protection that belongs to a key found with the data of a file. */
export async function protectionFor(
  info: EncryptionInfo,
  key: CryptoKey,
): Promise<Protection> {
  return {
    salt: info.salt,
    iterations: info.iterations,
    verify: await makeVerifier(key),
  };
}

async function makeVerifier(key: CryptoKey): Promise<string> {
  const { iv, data } = await encrypt(key, VERIFY_TEXT);
  return `${toBase64(iv)}.${toBase64(data)}`;
}

/** Whether the key is the one made for this protection. */
export async function checkKey(
  key: CryptoKey,
  verify: string,
): Promise<boolean> {
  const [iv, data] = verify.split('.');
  if (!iv || !data) return false;
  try {
    return (
      (await decrypt(key, fromBase64(iv), fromBase64(data))) === VERIFY_TEXT
    );
  } catch {
    return false;
  }
}

/** The league as the text of a protected file. */
export async function encryptLeague(
  league: League,
  protection: { salt: string; iterations: number },
  key: CryptoKey,
): Promise<string> {
  const { id, name, ...rest } = league;
  const { iv, data } = await encrypt(key, JSON.stringify(rest));
  const envelope: Envelope = {
    format: LEAGUE_FORMAT,
    version: league.version,
    id,
    name,
    encryption: {
      v: 1,
      kdf: 'PBKDF2-SHA256',
      iterations: protection.iterations,
      salt: protection.salt,
      iv: toBase64(iv),
    },
    data: toBase64(data),
  };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** The envelope of a protected file, or null for a plain league file. */
export function readEnvelope(text: string): Envelope | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    !isObject(raw) ||
    raw.format !== LEAGUE_FORMAT ||
    !('encryption' in raw)
  ) {
    return null;
  }
  const info = raw.encryption;
  if (
    !isObject(info) ||
    info.v !== 1 ||
    info.kdf !== 'PBKDF2-SHA256' ||
    typeof info.iterations !== 'number' ||
    !Number.isInteger(info.iterations) ||
    info.iterations < 1 ||
    info.iterations > 10_000_000 ||
    typeof info.salt !== 'string' ||
    typeof info.iv !== 'string' ||
    typeof raw.data !== 'string' ||
    typeof raw.id !== 'string' ||
    typeof raw.name !== 'string' ||
    typeof raw.version !== 'number'
  ) {
    throw new LeagueFileError('The protected file is malformed');
  }
  return {
    format: LEAGUE_FORMAT,
    version: raw.version,
    id: raw.id,
    name: raw.name,
    encryption: {
      v: 1,
      kdf: 'PBKDF2-SHA256',
      iterations: info.iterations,
      salt: info.salt,
      iv: info.iv,
    },
    data: raw.data,
  };
}

/** Decrypts a protected file; throws `WrongPasswordError` for a wrong key. */
export async function decryptEnvelope(
  envelope: Envelope,
  key: CryptoKey,
): Promise<League> {
  let iv: Uint8Array<ArrayBuffer>;
  let data: Uint8Array<ArrayBuffer>;
  try {
    iv = fromBase64(envelope.encryption.iv);
    data = fromBase64(envelope.data);
  } catch {
    throw new LeagueFileError('The protected file is malformed');
  }
  const plain = await decrypt(key, iv, data);
  let rest: unknown;
  try {
    rest = JSON.parse(plain);
  } catch {
    throw new LeagueFileError('The protected file is malformed');
  }
  // The inner text is a league without id and name; the readable ones from the
  // envelope belong to it and are checked by the same reader as a plain file.
  return parseLeague(
    JSON.stringify({
      ...(isObject(rest) ? rest : {}),
      id: envelope.id,
      name: envelope.name,
    }),
  );
}

/** The text to write for a league: protected when a protection and key are given. */
export async function serializeProtected(
  league: League,
  protection: Protection | undefined,
  key: CryptoKey | undefined,
): Promise<string> {
  if (!protection || !key) return serializeLeague(league);
  return encryptLeague(league, protection, key);
}
