import { describe, expect, it } from 'vitest';
import { readDriveConfig } from './config';

describe('readDriveConfig', () => {
  it('needs both values', () => {
    expect(readDriveConfig({})).toBeNull();
    expect(readDriveConfig({ VITE_GOOGLE_CLIENT_ID: 'id' })).toBeNull();
    expect(readDriveConfig({ VITE_GOOGLE_API_KEY: 'key' })).toBeNull();
    expect(
      readDriveConfig({ VITE_GOOGLE_CLIENT_ID: ' ', VITE_GOOGLE_API_KEY: 'k' }),
    ).toBeNull();
  });

  it('returns the trimmed values', () => {
    expect(
      readDriveConfig({
        VITE_GOOGLE_CLIENT_ID: ' id ',
        VITE_GOOGLE_API_KEY: 'key',
      }),
    ).toEqual({ clientId: 'id', apiKey: 'key' });
  });
});
