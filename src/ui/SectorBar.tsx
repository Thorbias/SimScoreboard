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

/**
 * A progress indicator in the shape of the logo: the three slanted bars build up
 * from the bottom to the top, orange first, then green, then purple. `value`
 * runs from 0 to 1; each bar fills from left to right in turn.
 */
export function SectorProgress({ value }: { value: number }) {
  const fill = (index: number) => Math.max(0, Math.min(1, value * 3 - index));
  // The bars of the logo, top to bottom; the last one is filled first.
  const bars = [
    { y: 5, color: 'var(--fastest)', step: 2 },
    { y: 13.25, color: 'var(--pb)', step: 1 },
    { y: 21.5, color: 'var(--accent)', step: 0 },
  ];
  return (
    <svg
      className="sector-progress"
      viewBox="0 0 32 32"
      width={28}
      height={28}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <g transform="translate(5 0) skewX(-18)">
        {bars.map((bar) => (
          <g key={bar.step}>
            <rect
              x="4"
              y={bar.y}
              width="22"
              height="5.5"
              fill="var(--seg-neutral)"
            />
            <rect
              x="4"
              y={bar.y}
              width={22 * fill(bar.step)}
              height="5.5"
              fill={bar.color}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
