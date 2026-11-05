import { describe, expect, it } from 'vitest';
import {
  createDriveFile,
  driveDownloadUrl,
  driveEditAccess,
  driveRevision,
  driveFileId,
  driveShareLink,
  saveToDrive,
  shareDriveFile,
  type FetchLike,
} from './api';

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456';

interface Call {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** A Drive that answers each call with the next reply and records the calls. */
function fakeDrive(...replies: { status?: number; json?: unknown }[]) {
  const calls: Call[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, ...init });
    const reply = replies.shift() ?? {};
    const status = reply.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => '',
      json: async () => reply.json,
    };
  };
  return { calls, fetchImpl };
}

describe('driveFileId', () => {
  it('reads the ID from the usual links', () => {
    expect(
      driveFileId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`),
    ).toBe(ID);
    expect(driveFileId(`https://drive.google.com/open?id=${ID}`)).toBe(ID);
    expect(
      driveFileId(`https://drive.google.com/uc?id=${ID}&export=download`),
    ).toBe(ID);
  });

  it('accepts a bare ID', () => {
    expect(driveFileId(` ${ID} `)).toBe(ID);
  });

  it('rejects other addresses and text', () => {
    expect(driveFileId('https://example.org/file/d/abc')).toBeNull();
    expect(driveFileId('http://drive.google.com/file/d/abc')).toBeNull();
    expect(driveFileId('hello world')).toBeNull();
    expect(driveFileId('https://drive.google.com/drive/my-drive')).toBeNull();
  });
});

describe('addresses', () => {
  it('builds the share link and the download address', () => {
    expect(driveShareLink(ID)).toBe(
      `https://drive.google.com/file/d/${ID}/view`,
    );
    expect(driveDownloadUrl(ID, 'k&y')).toBe(
      `https://www.googleapis.com/drive/v3/files/${ID}?alt=media&key=k%26y`,
    );
  });
});

describe('createDriveFile', () => {
  it('uploads the text with the token and returns the file', async () => {
    const drive = fakeDrive({ json: { id: ID, version: 3 } });
    const file = await createDriveFile(
      'tok',
      'a.json',
      '{"x":1}',
      drive.fetchImpl,
    );
    expect(file).toEqual({ id: ID, version: '3' });
    const call = drive.calls[0]!;
    expect(call.method).toBe('POST');
    expect(call.url).toContain('uploadType=multipart');
    expect(call.headers?.Authorization).toBe('Bearer tok');
    expect(call.body).toContain('"name":"a.json"');
    expect(call.body).toContain('{"x":1}');
  });

  it('reports an error answer', async () => {
    const drive = fakeDrive({ status: 403 });
    await expect(
      createDriveFile('tok', 'a', 'b', drive.fetchImpl),
    ).rejects.toThrow('403');
  });
});

describe('saveToDrive', () => {
  const base = { token: 't', name: 'a.json', text: '{}' };

  it('creates the file when none is known', async () => {
    const drive = fakeDrive({ json: { id: ID, version: '1' } });
    const file = await saveToDrive(
      { ...base, known: null, confirmOverwrite: () => true },
      drive.fetchImpl,
    );
    expect(file).toEqual({ id: ID, version: '1' });
    expect(drive.calls).toHaveLength(1);
  });

  it('updates without asking when the version is unchanged', async () => {
    const drive = fakeDrive(
      { json: { id: ID, version: '2' } },
      { json: { id: ID, version: '3' } },
    );
    let asked = false;
    const file = await saveToDrive(
      {
        ...base,
        known: { id: ID, version: '2' },
        confirmOverwrite: () => ((asked = true), true),
      },
      drive.fetchImpl,
    );
    expect(asked).toBe(false);
    expect(file?.version).toBe('3');
    expect(drive.calls[1]?.method).toBe('PATCH');
  });

  it('asks when Drive holds a newer version and stops on no', async () => {
    const drive = fakeDrive({ json: { id: ID, version: '5' } });
    const file = await saveToDrive(
      {
        ...base,
        known: { id: ID, version: '2' },
        confirmOverwrite: () => false,
      },
      drive.fetchImpl,
    );
    expect(file).toBeNull();
    expect(drive.calls).toHaveLength(1);
  });

  it('overwrites a newer version when the user agrees', async () => {
    const drive = fakeDrive(
      { json: { id: ID, version: '5' } },
      { json: { id: ID, version: '6' } },
    );
    const file = await saveToDrive(
      {
        ...base,
        known: { id: ID, version: '2' },
        confirmOverwrite: () => true,
      },
      drive.fetchImpl,
    );
    expect(file?.version).toBe('6');
  });
});

describe('saveToDrive with a file that is gone', () => {
  const base = { token: 't', name: 'a.json', text: '{}' };
  const known = { id: ID, version: '2' };

  it('creates a new file when Drive no longer knows the old one', async () => {
    const drive = fakeDrive(
      { status: 404 },
      { json: { id: 'NEW', version: '1' } },
    );
    let asked = false;
    const file = await saveToDrive(
      { ...base, known, confirmOverwrite: () => ((asked = true), true) },
      drive.fetchImpl,
    );
    expect(file).toMatchObject({ id: 'NEW', version: '1', recreated: true });
    expect(asked).toBe(false);
    expect(drive.calls[1]?.method).toBe('POST');
  });

  it('creates a new file when the old one is in the trash', async () => {
    const drive = fakeDrive(
      { json: { id: ID, version: '9', trashed: true } },
      { json: { id: 'NEW', version: '1' } },
    );
    const file = await saveToDrive(
      { ...base, known, confirmOverwrite: () => true },
      drive.fetchImpl,
    );
    expect(file?.id).toBe('NEW');
    expect(file?.recreated).toBe(true);
  });

  it('still reports other errors', async () => {
    const drive = fakeDrive({ status: 500 });
    await expect(
      saveToDrive(
        { ...base, known, confirmOverwrite: () => true },
        drive.fetchImpl,
      ),
    ).rejects.toThrow('500');
  });
});

describe('the version that is compared', () => {
  it('follows the content, not the counter that sharing also moves', async () => {
    const drive = fakeDrive(
      { json: { id: ID, headRevisionId: 'rev1', version: '7' } },
      { json: { id: ID, headRevisionId: 'rev2', version: '8' } },
    );
    let asked = false;
    const file = await saveToDrive(
      {
        token: 't',
        name: 'a.json',
        text: '{}',
        known: { id: ID, version: 'rev1' },
        confirmOverwrite: () => ((asked = true), true),
      },
      drive.fetchImpl,
    );
    expect(asked).toBe(false);
    expect(file?.version).toBe('rev2');
  });
});

describe('driveRevision', () => {
  it('reads the revision of a file shared by link with the key', async () => {
    const drive = fakeDrive({ json: { headRevisionId: 'rev9' } });
    expect(await driveRevision(ID, 'k&y', drive.fetchImpl)).toBe('rev9');
    expect(drive.calls[0]?.url).toContain(`/files/${ID}?fields=headRevisionId`);
    expect(drive.calls[0]?.url).toContain('key=k%26y');
    expect(drive.calls[0]?.headers?.Authorization).toBeUndefined();
  });

  it('gives null when it cannot be read', async () => {
    expect(
      await driveRevision(ID, 'k', fakeDrive({ status: 404 }).fetchImpl),
    ).toBeNull();
    expect(
      await driveRevision(ID, 'k', fakeDrive({ json: {} }).fetchImpl),
    ).toBeNull();
    const down: FetchLike = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await driveRevision(ID, 'k', down)).toBeNull();
  });
});

describe('driveEditAccess', () => {
  it('lets an account that may edit the file take it over', async () => {
    const drive = fakeDrive({
      json: { id: ID, headRevisionId: 'r1', capabilities: { canEdit: true } },
    });
    const access = await driveEditAccess('tok', ID, drive.fetchImpl);
    expect(access).toEqual({
      status: 'ok',
      file: { id: ID, version: 'r1', canEdit: true },
    });
    expect(drive.calls[0]?.url).toContain('capabilities');
  });

  it('refuses an account that may only read', async () => {
    const drive = fakeDrive({
      json: { id: ID, version: '1', capabilities: { canEdit: false } },
    });
    expect(await driveEditAccess('tok', ID, drive.fetchImpl)).toEqual({
      status: 'readonly',
    });
  });

  it('reports a file the app cannot see, or that is in the trash', async () => {
    const gone = fakeDrive({ status: 404 });
    expect(await driveEditAccess('tok', ID, gone.fetchImpl)).toEqual({
      status: 'missing',
    });
    const trashed = fakeDrive({
      json: { id: ID, version: '1', trashed: true },
    });
    expect(await driveEditAccess('tok', ID, trashed.fetchImpl)).toEqual({
      status: 'missing',
    });
  });
});

describe('shareDriveFile', () => {
  it('grants read access to everyone with the link', async () => {
    const drive = fakeDrive({ json: {} });
    await shareDriveFile('tok', ID, drive.fetchImpl);
    expect(drive.calls[0]?.url).toContain(`/files/${ID}/permissions`);
    expect(JSON.parse(drive.calls[0]?.body ?? '{}')).toEqual({
      role: 'reader',
      type: 'anyone',
    });
  });
});
