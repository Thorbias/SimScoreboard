export type SessionType = 'practice' | 'qualifying' | 'race';

export interface Lap {
  num: number;
  /** Lap time in seconds; null when the game recorded no time (`--.----`). */
  time: number | null;
  /** Sector times in seconds (single sectors, not cumulative); null when missing. */
  sectors: [number | null, number | null, number | null];
  position: number | null;
  /** Session time at the end of the lap, in seconds. */
  endTime: number | null;
  topSpeed: number | null;
  /** Front tyre compound, e.g. `Medium`. */
  compound: string | null;
  pit: boolean;
}

export interface Entry {
  driverName: string;
  isPlayer: boolean;
  carClass: string;
  carType: string;
  carNumber: string;
  teamName: string;
  position: number | null;
  classPosition: number | null;
  gridPosition: number | null;
  classGridPosition: number | null;
  bestLap: number | null;
  /** Completed laps as reported by the game. */
  lapCount: number;
  pitstops: number;
  /** `None`, `Finished Normally`, `DNF`, `DQ`, or whatever the game writes. */
  finishStatus: string;
  /** Total race time in seconds; only present for finishers of a race. */
  finishTime: number | null;
  laps: Lap[];
}

export interface Session {
  /** The result file name, unique within a game folder. */
  id: string;
  type: SessionType;
  /** Section name in the file, e.g. `Practice1`, `Qualify`, `Race`. */
  section: string;
  /** End of the session (time the file was written), epoch ms, from the file name. */
  endedAt: number | null;
  /** Start of the session, epoch ms. */
  startedAt: number | null;
  /** Groups the sessions of one event weekend; null when the header lacks it. */
  eventKey: string | null;
  mode: string;
  trackVenue: string;
  trackCourse: string;
  trackEvent: string;
  /** Track length in metres. */
  trackLength: number | null;
  gameVersion: string;
  /** Scheduled length in minutes, null when the session is lap-limited. */
  minutes: number | null;
  /** Scheduled laps, null when the session is time-limited. */
  scheduledLaps: number | null;
  mostLapsCompleted: number | null;
  entries: Entry[];
}

/** Everything the library list needs; small enough to keep for every session. */
export interface SessionSummary {
  id: string;
  type: SessionType;
  section: string;
  endedAt: number | null;
  startedAt: number | null;
  eventKey: string | null;
  mode: string;
  trackVenue: string;
  trackCourse: string;
  trackEvent: string;
  trackLength: number | null;
  gameVersion: string;
  minutes: number | null;
  scheduledLaps: number | null;
  classes: string[];
  entries: EntrySummary[];
}

export interface EntrySummary {
  driverName: string;
  carClass: string;
  carNumber: string;
  position: number | null;
  classPosition: number | null;
}
