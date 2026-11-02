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
 * Saves the league as a file: with a save dialog where the browser has one (so
 * it can go into a folder a cloud client synchronizes), otherwise as a
 * download. Returns false when the user cancelled the dialog.
 */
export async function saveLeagueFile(league: League): Promise<boolean> {
  const text = serializeLeague(league);
  const suggestedName = leagueFileName(league.name);
  const picker = (window as { showSaveFilePicker?: SavePicker })
    .showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName,
        types: [
          {
            description: 'SimScoreboard league',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
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
  return true;
}
