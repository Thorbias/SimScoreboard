import { describe, expect, it } from 'vitest';
import { leagueFileName, writeToHandle } from './fileIo';

describe('leagueFileName', () => {
  it('makes a safe file name from the league name', () => {
    expect(leagueFileName('Spa Cup 2026')).toBe(
      'spa-cup-2026.simscoreboard-league.json',
    );
    expect(leagueFileName('  ../Üb?er  ')).toBe(
      'b-er.simscoreboard-league.json',
    );
    expect(leagueFileName('***')).toBe('league.simscoreboard-league.json');
  });
});

describe('writeToHandle', () => {
  const handleWith = (query: string, request: string) => {
    const written: string[] = [];
    const handle = {
      queryPermission: async () => query,
      requestPermission: async () => request,
      createWritable: async () => ({
        write: async (text: string) => void written.push(text),
        close: async () => undefined,
      }),
    } as unknown as FileSystemFileHandle;
    return { handle, written };
  };

  it('writes when access is already granted', async () => {
    const { handle, written } = handleWith('granted', 'denied');
    expect(await writeToHandle(handle, 'x')).toBe(true);
    expect(written).toEqual(['x']);
  });

  it('asks once for access that is only prompted', async () => {
    const { handle, written } = handleWith('prompt', 'granted');
    expect(await writeToHandle(handle, 'x')).toBe(true);
    expect(written).toEqual(['x']);
  });

  it('does not write without access', async () => {
    const { handle, written } = handleWith('prompt', 'denied');
    expect(await writeToHandle(handle, 'x')).toBe(false);
    expect(written).toEqual([]);
  });
});
