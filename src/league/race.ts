import type { Session } from '../results/types';
import { parseSession } from '../results/parse';
import { trackTitle } from '../library/tracks';
import type { LeagueRace, RaceResult } from './types';

/** Takes the snapshot of a race session that the league keeps (ADR-0007). */
export function snapshotRace(session: Session, name?: string): LeagueRace {
  const results: RaceResult[] = session.entries.map((e) => ({
    driverName: e.driverName,
    carClass: e.carClass,
    carNumber: e.carNumber,
    position: e.position,
    classPosition: e.classPosition,
    classGridPosition: e.classGridPosition,
    laps: e.lapCount,
    finishStatus: e.finishStatus,
    finishTime: e.finishTime,
    bestLap: e.bestLap,
  }));
  return {
    id: `race-${session.id}`,
    name: name ?? trackTitle(session.trackVenue, session.trackCourse),
    sessionId: session.id,
    date: session.endedAt ?? session.startedAt,
    ...(session.startedAt !== null ? { started: session.startedAt } : {}),
    track: trackTitle(session.trackVenue, session.trackCourse),
    results,
  };
}

/**
 * Builds a league race from a result file the user picked by hand. Throws an
 * `Error` with a readable reason when the file is not a result file, not a
 * race, or already in the league (the same file name counts as the same race).
 */
export function importRaceFile(
  text: string,
  fileName: string,
  existing: readonly LeagueRace[],
): LeagueRace {
  let session: Session;
  try {
    session = parseSession(text, fileName);
  } catch (e) {
    // The parser names a file that is no result file itself; anything else is
    // a real failure and its reason is kept.
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(
      reason.endsWith('is not a result file')
        ? reason
        : `${fileName} could not be read (${reason})`,
      { cause: e },
    );
  }
  if (session.type !== 'race') {
    throw new Error(`${fileName} is not a race session`);
  }
  if (existing.some((r) => r.sessionId === session.id)) {
    throw new Error(`${fileName} is already in the league`);
  }
  return snapshotRace(session);
}
