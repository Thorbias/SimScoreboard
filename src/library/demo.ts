import { parseResultFileName } from '../results/fileName';

export interface DemoManifest {
  /** The name of the own driver in the demo files. */
  ownName: string;
  files: string[];
}

export interface DemoData {
  ownName: string;
  files: File[];
}

/** Checks the shape of `manifest.json`; file names must be result file names. */
export function parseManifest(value: unknown): DemoManifest {
  const manifest = value as Partial<DemoManifest> | null;
  if (
    !manifest ||
    typeof manifest.ownName !== 'string' ||
    manifest.ownName.trim() === '' ||
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0
  ) {
    throw new Error('The demo manifest is not valid');
  }
  const names = manifest.files;
  const valid = names.every(
    (name) => typeof name === 'string' && parseResultFileName(name) !== null,
  );
  if (!valid || new Set(names).size !== names.length) {
    throw new Error('The demo manifest lists an invalid file');
  }
  return { ownName: manifest.ownName, files: names };
}

/**
 * Loads the demo sessions: anonymized result files that are served next to the
 * app, under `demo/`. They are turned into `File` objects so that they go
 * through the same reading path as files from a game folder.
 */
export async function loadDemo(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DemoData> {
  const base = `${baseUrl}demo/`;
  const response = await fetchImpl(`${base}manifest.json`);
  if (!response.ok) {
    throw new Error(
      `The demo data could not be loaded (HTTP ${response.status})`,
    );
  }
  const manifest = parseManifest(await response.json());
  const files = await Promise.all(
    manifest.files.map(async (name) => {
      const file = await fetchImpl(`${base}${encodeURIComponent(name)}`);
      if (!file.ok) {
        throw new Error(
          `The demo file ${name} could not be loaded (HTTP ${file.status})`,
        );
      }
      return new File([await file.blob()], name, { type: 'text/xml' });
    }),
  );
  return { ownName: manifest.ownName, files };
}
