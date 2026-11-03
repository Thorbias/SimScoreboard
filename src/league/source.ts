import { LeagueFileError, parseLeague } from './file';
import type { League } from './types';

/** Where a league on this computer came from and where it goes (ADR-0009). */
export interface LeagueLink {
  /** The address the league was loaded from, for refreshing. */
  url?: string;
  /** The file the league is saved to; kept only in this browser. */
  handle?: FileSystemFileHandle;
  /** The Google Drive file the league was saved to or loaded from. */
  driveId?: string;
  /** Drive's version of that file when it was last saved or loaded here. */
  driveVersion?: string;
  /** Fingerprint of the league when it was last saved or loaded (file.ts). */
  saved?: string;
  /** The Drive file has been shared by link. */
  shared?: boolean;
}

type FetchLike = (
  url: string,
  init?: { cache?: 'no-store' },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * The address to load a league from: `https` (or `http` for the local machine),
 * nothing else. Returns null for anything that is not such an address.
 */
export function parseLeagueAddress(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  const secure =
    url.protocol === 'https:' ||
    (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname));
  return secure && !url.username && !url.password ? url.href : null;
}

/** Loads a league file from an address; throws `LeagueFileError` on failure. */
export async function fetchLeague(
  address: string,
  fetchImpl: FetchLike = (url, init) => fetch(url, init),
): Promise<League> {
  const url = parseLeagueAddress(address);
  if (!url) throw new LeagueFileError('The address must start with https://');
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch {
    throw new LeagueFileError(
      'The address could not be reached (the server must allow access from other sites)',
    );
  }
  if (!response.ok) {
    // Drive answers 404 for a file that is not shared with everyone who has
    // the link; the key alone cannot read a restricted file (ADR-0009).
    if (
      (response.status === 403 || response.status === 404) &&
      new URL(url).hostname === 'www.googleapis.com'
    ) {
      throw new LeagueFileError(
        `The file is not shared with everyone who has the link, or no longer exists (the server answered with ${response.status})`,
      );
    }
    throw new LeagueFileError(`The server answered with ${response.status}`);
  }
  return parseLeague(await response.text());
}
