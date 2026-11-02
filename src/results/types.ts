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

/**
 * An event from the session stream. Times are seconds since the session
 * start. Which kinds occur depends on game version and mode; older files and
 * single-player sessions have fewer.
 */
export type StreamEvent =
  | {
      kind: 'contact';
      time: number | null;
      driver: string;
      /** Impact strength as reported by the game. */
      force: number | null;
      /** The other driver, or null for contact with an object. */
      other: string | null;
      /** What was hit when it was not a car, e.g. `Immovable`, `Sign`. */
      object: string | null;
    }
  | { kind: 'damage'; time: number | null; driver: string; part: string }
  | {
      kind: 'trackLimits';
      time: number | null;
      driver: string;
      lap: number | null;
      warningPoints: number | null;
      currentPoints: number | null;
      /** `No Further Action`, `Warning`, or the penalty text. */
      outcome: string;
    }
  | {
      kind: 'penalty';
      time: number | null;
      driver: string;
      /** e.g. `Drive Thru`, `Stop/Go`; for a served penalty the text from the log. */
      penalty: string;
      seconds: number | null;
      laps: number | null;
      reason: string;
      /** True when the log says the penalty was served. */
      served: boolean;
    }
  | { kind: 'chat'; time: number | null; sender: string; text: string };

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
  events: StreamEvent[];
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
  carType: string;
  carNumber: string;
  position: number | null;
  classPosition: number | null;
  /** Best lap time in seconds, null without a timed lap. */
  bestLap: number | null;
  /** Sector times of the best lap; null where the file has none. */
  bestLapSectors: [number | null, number | null, number | null];
  /** Completed laps. */
  lapCount: number;
  /** Starting position within the class; null in sessions without a grid. */
  classGridPosition: number | null;
  /** `None`, `Finished Normally`, `DNF`, `DQ`, or whatever the game writes. */
  finishStatus: string;
}

/**
 * Version of the index records. Raise it when the summary gains fields; stored
 * records of an older version are re-read from the files on the next scan.
 */
export const SUMMARY_VERSION = 3;
