import type { SessionType } from './types';

export interface ResultFileName {
  /** Time the game wrote the file (the end of the session), epoch ms, local time. */
  endedAt: number;
  type: SessionType | null;
}

const PATTERN =
  /^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})-\d{2}([PQR])\d\.xml$/i;

const TYPES: Record<string, SessionType> = {
  P: 'practice',
  Q: 'qualifying',
  R: 'race',
};

/**
 * Reads `JJJJ_MM_TT_hh_mm_ss-NNxN.xml`. Returns null for any other file, e.g.
 * the `BatchTemplate*.ini` files that share the folder.
 */
export function parseResultFileName(name: string): ResultFileName | null {
  const m = PATTERN.exec(name);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    endedAt: new Date(y, mo - 1, d, h, mi, s).getTime(),
    type: TYPES[(m[7] as string).toUpperCase()] ?? null,
  };
}
