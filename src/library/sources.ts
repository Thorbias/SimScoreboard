import { parseResultFileName } from '../results/fileName';

/** Where result files usually are, relative to a folder the user may pick. */
const RESULT_PATHS: string[][] = [
  ['UserData', 'Log', 'Results'],
  ['Log', 'Results'],
  ['Results'],
  [],
];

export function supportsDirectoryPicker(): boolean {
  return typeof window.showDirectoryPicker === 'function';
}

/** Asks the user for a folder. Returns null if they cancel. */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!window.showDirectoryPicker) return null;
  try {
    return await window.showDirectoryPicker({ mode: 'read' });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

export async function hasReadPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  return (await handle.queryPermission?.({ mode: 'read' })) === 'granted';
}

/** Must be called from a user gesture, e.g. a click. */
export async function requestReadPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  return (await handle.requestPermission?.({ mode: 'read' })) === 'granted';
}

async function descend(
  root: FileSystemDirectoryHandle,
  path: string[],
): Promise<FileSystemDirectoryHandle | null> {
  let dir = root;
  for (const segment of path) {
    try {
      dir = await dir.getDirectoryHandle(segment);
    } catch {
      return null;
    }
  }
  return dir;
}

async function resultFilesIn(dir: FileSystemDirectoryHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, entry] of dir.entries()) {
    if (entry.kind === 'file' && parseResultFileName(name)) {
      files.push(await (entry as FileSystemFileHandle).getFile());
    }
  }
  return files;
}

/**
 * Finds the result files below a picked folder. The user may pick the game
 * folder, its `UserData` folder or the `Results` folder itself.
 */
export async function listResultFiles(
  root: FileSystemDirectoryHandle,
): Promise<File[]> {
  for (const path of RESULT_PATHS) {
    const dir = await descend(root, path);
    if (!dir) continue;
    const files = await resultFilesIn(dir);
    if (files.length > 0) return files;
  }
  return [];
}

/**
 * Fallback for browsers without the File System Access API: files from a
 * folder input or a drop. Prefers files in a `Results` folder if the user
 * picked a larger folder.
 */
export function resultFilesFromList(list: Iterable<File>): File[] {
  const all = [...list].filter((f) => parseResultFileName(f.name));
  const inResults = all.filter((f) =>
    /(^|\/)Results\//.test(f.webkitRelativePath),
  );
  const chosen = inResults.length > 0 ? inResults : all;
  return [...new Map(chosen.map((f) => [f.name, f])).values()];
}
