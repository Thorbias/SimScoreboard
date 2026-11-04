import { serializeLeague } from './file';
import type { League } from './types';

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

type SavePicker = (
  options?: SaveFilePickerOptions,
) => Promise<FileSystemFileHandle>;

/** `Spa Cup 2026` becomes `spa-cup-2026.simscoreboard-league.json`. */
export function leagueFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'league'}.simscoreboard-league.json`;
}

/**
 * Writes the text to the file behind a remembered handle. Returns false when the
 * browser does not give write access (it has to be asked again after a restart,
 * and the question needs a click).
 */
export async function writeToHandle(
  handle: FileSystemFileHandle,
  text: string,
): Promise<boolean> {
  const mode = { mode: 'readwrite' } as const;
  if ((await handle.queryPermission?.(mode)) !== 'granted') {
    if ((await handle.requestPermission?.(mode)) !== 'granted') return false;
  }
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return true;
}

export interface SaveResult {
  /** False when the user cancelled. */
  saved: boolean;
  /** The file written to, to be remembered; null for a download. */
  handle: FileSystemFileHandle | null;
}

/**
 * Saves the league as a file. With a remembered `handle` it overwrites that file;
 * otherwise (or when the browser withholds access) it asks for a file with a
 * save dialog where the browser has one, so it can go into a folder a cloud
 * client synchronizes, and else downloads it.
 */
export async function saveLeagueFile(
  league: League,
  handle?: FileSystemFileHandle | null,
): Promise<SaveResult> {
  const text = serializeLeague(league);
  if (handle) {
    try {
      if (await writeToHandle(handle, text)) return { saved: true, handle };
    } catch (error) {
      // The file was moved or deleted; fall back to asking for a new one.
      if (!(error instanceof DOMException)) throw error;
    }
  }
  const suggestedName = leagueFileName(league.name);
  const picker = (window as { showSaveFilePicker?: SavePicker })
    .showSaveFilePicker;
  if (picker) {
    try {
      const picked = await picker.call(window, {
        suggestedName,
        types: [
          {
            description: 'SimScoreboard league',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await picked.createWritable();
      await writable.write(text);
      await writable.close();
      return { saved: true, handle: picked };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { saved: false, handle: null };
      }
      throw error;
    }
  }
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { saved: true, handle: null };
}
