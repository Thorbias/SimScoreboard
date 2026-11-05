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
const FIELDS = 'id,headRevisionId,version,trashed,capabilities/canEdit';

export class DriveError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export interface DriveFile {
  id: string;
  /** The file is in the trash; Drive still answers for it. */
  trashed?: boolean;
  /** Drive's counter for the content; it changes with every save. */
  version: string;
  /** The signed-in account may change the file; unknown when not asked for. */
  canEdit?: boolean;
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

/**
 * The revision of a file that is shared by link, read with the API key. Google
 * blocks repeated downloads of the content from one connection for a while, but
 * answers this small question; so a download is only needed when the revision
 * differs from the one already held. Returns null when it cannot be read.
 */
export async function driveRevision(
  id: string,
  apiKey: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<string | null> {
  const url = `${API}/files/${encodeURIComponent(id)}?fields=headRevisionId&key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetchImpl(url, { cache: 'no-store' });
    if (!response.ok) return null;
    const body = (await response.json()) as { headRevisionId?: unknown };
    return typeof body.headRevisionId === 'string' ? body.headRevisionId : null;
  } catch {
    return null;
  }
}

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
    // Google explains the refusal in the body; show it instead of a bare code.
    let detail = '';
    try {
      const body = JSON.parse(await response.text()) as {
        error?: { message?: string };
      };
      detail = body.error?.message ?? '';
    } catch {
      // No readable body.
    }
    throw new DriveError(
      `Google Drive answered with ${response.status}${detail ? `: ${detail}` : ''}`,
      response.status,
    );
  }
  return response.json();
}

const asFile = (value: unknown): DriveFile => {
  const v = value as {
    id?: unknown;
    headRevisionId?: unknown;
    version?: unknown;
    trashed?: unknown;
    capabilities?: { canEdit?: unknown };
  } | null;
  // The head revision changes only when the content is saved. Drive's own
  // version counter also moves with sharing and other metadata, which made a
  // file look changed after the app had shared it.
  const version = v?.headRevisionId ?? v?.version;
  if (typeof v?.id !== 'string' || version == null) {
    throw new DriveError('Google Drive sent an unexpected answer');
  }
  return {
    id: v.id,
    version: String(version),
    ...(v.trashed === true ? { trashed: true } : {}),
    ...(typeof v.capabilities?.canEdit === 'boolean'
      ? { canEdit: v.capabilities.canEdit }
      : {}),
  };
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

/** The file's version, or null when the file does not exist (any more). */
export async function driveFileVersion(
  token: string,
  id: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<DriveFile | null> {
  try {
    return asFile(
      await call(
        fetchImpl,
        token,
        `${API}/files/${encodeURIComponent(id)}?fields=${FIELDS}`,
        {},
      ),
    );
  } catch (error) {
    if (error instanceof DriveError && error.status === 404) return null;
    throw error;
  }
}

export type EditAccess =
  | { status: 'ok'; file: DriveFile }
  | { status: 'missing' }
  | { status: 'readonly' };

/**
 * Whether the signed-in account may change a league file it did not create in
 * this browser. With the `drive.file` scope Drive shows the app only the files
 * it created itself, for any site that uses the same client ID, so a file of
 * someone else, or one made by another program, is reported as missing.
 */
export async function driveEditAccess(
  token: string,
  id: string,
  fetchImpl: FetchLike = defaultFetch,
): Promise<EditAccess> {
  const file = await driveFileVersion(token, id, fetchImpl);
  if (!file || file.trashed) return { status: 'missing' };
  return file.canEdit === true
    ? { status: 'ok', file }
    : { status: 'readonly' };
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
 * it, asking first when someone else saved a newer version. A file that was
 * deleted or moved to the trash in the meantime is created anew (`recreated`).
 * Returns null when the user chose not to overwrite.
 */
export async function saveToDrive(
  input: DriveSaveInput,
  fetchImpl: FetchLike = defaultFetch,
): Promise<(DriveFile & { recreated?: boolean }) | null> {
  const { token, name, text, known, confirmOverwrite } = input;
  if (!known) return createDriveFile(token, name, text, fetchImpl);
  const current = await driveFileVersion(token, known.id, fetchImpl);
  if (!current || current.trashed) {
    const created = await createDriveFile(token, name, text, fetchImpl);
    return { ...created, recreated: true };
  }
  if (current.version !== known.version && !confirmOverwrite()) return null;
  return updateDriveFile(token, known.id, text, fetchImpl);
}
