import { describe, expect, it } from 'vitest';
import {
  createDriveFile,
  driveDownloadUrl,
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
