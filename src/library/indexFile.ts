import { parseSession, summarize } from '../results/parse';
import type { StoredSession } from '../storage/store';

/** Parses one result file into the small record kept in the local index. */
export function indexFile(
  name: string,
  text: string,
  size: number,
  lastModified: number,
): StoredSession {
  return { summary: summarize(parseSession(text, name)), size, lastModified };
}
