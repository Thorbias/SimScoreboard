import type { Session } from '../results/types';
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
    track: trackTitle(session.trackVenue, session.trackCourse),
    results,
  };
}
