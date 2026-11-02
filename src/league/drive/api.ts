/**
 * The few Google Drive calls the league needs (ADR-0009, stage 2): create and
 * update the league file, read its version, share it by link and download it.
 * Everything takes the fetch function as a parameter so tests can fake Drive.
 */

export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    cache?: 'no-store';
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}>;

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FIELDS = 'id,version,modifiedTime';

export class DriveError extends Error {}

export interface DriveFile {
  id: string;
  /** Drive's counter for the content; it changes with every save. */
  version: string;
}

/** The file ID in a Drive link, or in a bare ID; null for anything else. */
export function driveFileId(input: string): string | null {
  const text = input.trim();
  if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return text;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (
    url.hostname !== 'drive.google.com' &&
    url.hostname !== 'docs.google.com'
  ) {
    return null;
  }
  const inPath = /\/d\/([A-Za-z0-9_-]+)/.exec(url.pathname);
  const id = inPath?.[1] ?? url.searchParams.get('id');
  return id && /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

/** The link to hand to the players. */
export const driveShareLink = (id: string): string =>
  `https://drive.google.com/file/d/${id}/view`;

/** Where a file that is shared by link can be read with the API key. */
export const driveDownloadUrl = (id: string, apiKey: string): string =>
  `${API}/files/${encodeURIComponent(id)}?alt=media&key=${encodeURIComponent(apiKey)}`;

async function call(
  fetchImpl: FetchLike,
  token: string,
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<unknown> {
  let response;
  try {
    response = await fetchImpl(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new DriveError('Google Drive could not be reached');
  }
  if (!response.ok) {
    throw new DriveError(`Google Drive answered with ${response.status}`);
  }
  return response.json();
}

const asFile = (value: unknown): DriveFile => {
  const v = value as { id?: unknown; version?: unknown } | null;
  if (typeof v?.id !== 'string' || v.version == null) {
    throw new DriveError('Google Drive sent an unexpected answer');
  }
  return { id: v.id, version: String(v.version) };
};

/** Creates the file; the app can only see files it created itself. */
export async function createDriveFile(
  token: string,
  name: string,
  text: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<DriveFile> {
  const boundary = 'simscoreboard-league';
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify({ name, mimeType: 'application/json' })}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${text}\r\n` +
    `--${boundary}--`;
  return asFile(
    await call(
      fetchImpl,
      token,
      `${UPLOAD}/files?uploadType=multipart&fields=${FIELDS}`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      },
    ),
  );
}

export async function updateDriveFile(
  token: string,
  id: string,
  text: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<DriveFile> {
  return asFile(
    await call(
      fetchImpl,
      token,
      `${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=media&fields=${FIELDS}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      },
    ),
  );
}

export async function driveFileVersion(
  token: string,
  id: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<DriveFile> {
  return asFile(
    await call(
      fetchImpl,
      token,
      `${API}/files/${encodeURIComponent(id)}?fields=${FIELDS}`,
      {},
    ),
  );
}

/** Lets everyone with the link read the file (never write it). */
export async function shareDriveFile(
  token: string,
  id: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<void> {
  await call(
    fetchImpl,
    token,
    `${API}/files/${encodeURIComponent(id)}/permissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    },
  );
}

export interface DriveSaveInput {
  token: string;
  name: string;
  text: string;
  /** The file and version this league was last saved to or loaded from. */
  known: { id: string; version: string } | null;
  /** Asked when Drive holds a newer version; false cancels the save. */
  confirmOverwrite: () => boolean;
}

/**
 * Saves the league to Drive: creates the file the first time, otherwise updates
 * it, asking first when someone else saved a newer version. Returns null when
 * the user chose not to overwrite.
 */
export async function saveToDrive(
  input: DriveSaveInput,
  fetchImpl: FetchLike = defaultFetch,
): Promise<DriveFile | null> {
  const { token, name, text, known, confirmOverwrite } = input;
  if (!known) return createDriveFile(token, name, text, fetchImpl);
  const current = await driveFileVersion(token, known.id, fetchImpl);
  if (current.version !== known.version && !confirmOverwrite()) return null;
  return updateDriveFile(token, known.id, text, fetchImpl);
}
