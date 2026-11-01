/**
 * The brand motif: three slanted segments, one per sector. Each segment carries
 * a timing role, so the bar is data, not decoration: `fastest` (purple) is the
 * fastest of the class, `pb` (green) a personal best, `accent` is the brand
 * colour, `neutral` has no special meaning.
 */
export type SegmentRole = 'fastest' | 'pb' | 'accent' | 'neutral';

export function SectorBar({
  segments,
  size = 'md',
  label,
}: {
  segments: [SegmentRole, SegmentRole, SegmentRole];
  size?: 'sm' | 'md' | 'lg';
  /** Accessible text; the bar is hidden from assistive technology without it. */
  label?: string;
}) {
  return (
    <span
      className={`sector-bar sector-bar-${size}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {segments.map((role, i) => (
        <i key={i} className={`seg seg-${role}`} />
      ))}
    </span>
  );
}

/** The brand bar used in the header and as favicon. */
export const BRAND_SEGMENTS: [SegmentRole, SegmentRole, SegmentRole] = [
  'fastest',
  'pb',
  'accent',
];

/**
 * A progress bar built from the same three segments. `value` runs from 0 to 1;
 * each segment fills in turn.
 */
export function SectorProgress({ value }: { value: number }) {
  const fill = (index: number) =>
    Math.max(0, Math.min(1, value * 3 - index)) * 100;
  return (
    <span
      className="sector-bar sector-bar-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      {[0, 1, 2].map((i) => (
        <i key={i} className="seg seg-track">
          <b style={{ width: `${fill(i)}%` }} />
        </i>
      ))}
    </span>
  );
}
