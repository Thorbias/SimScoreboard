const PLACEHOLDER = '–';

function valid(seconds: number | null | undefined): seconds is number {
  return seconds != null && Number.isFinite(seconds) && seconds >= 0;
}

/** Gap to a reference time, e.g. `+0.234` or `+1:02.345`. */
export function formatGap(seconds: number | null | undefined): string {
  if (!valid(seconds)) return PLACEHOLDER;
  const totalMs = Math.round(seconds * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = String(totalMs % 1000).padStart(3, '0');
  return minutes > 0
    ? `+${minutes}:${String(secs).padStart(2, '0')}.${ms}`
    : `+${secs}.${ms}`;
}

/** Total race time, e.g. `1:02:03.456` or `21:10.037`. */
export function formatRaceTime(seconds: number | null | undefined): string {
  if (!valid(seconds)) return PLACEHOLDER;
  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = String(totalMs % 1000).padStart(3, '0');
  const ss = String(secs).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}.${ms}`
    : `${minutes}:${ss}.${ms}`;
}

/** Session clock, e.g. `3:07` or `1:02:03`. */
export function formatClock(seconds: number | null | undefined): string {
  if (!valid(seconds)) return PLACEHOLDER;
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}`
    : `${minutes}:${secs}`;
}

/** A single sector time, e.g. `22.152`. */
export function formatSector(seconds: number | null | undefined): string {
  if (!valid(seconds)) return PLACEHOLDER;
  return seconds.toFixed(3);
}
