import { parseSession, summarize } from '../results/parse';
import { SUMMARY_VERSION } from '../results/types';
import type { StoredSession } from '../storage/store';

/** Parses one result file into the small record kept in the local index. */
export function indexFile(
  name: string,
  text: string,
  size: number,
  lastModified: number,
): StoredSession {
  return {
    version: SUMMARY_VERSION,
    summary: summarize(parseSession(text, name)),
    size,
    lastModified,
  };
}
