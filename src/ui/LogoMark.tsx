/**
 * The logo: the three sector segments stacked and slanted, like the favicon.
 * Same colours as the favicon.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g transform="translate(5 0) skewX(-18)">
        <rect x="4" y="5" width="22" height="5.5" fill="var(--fastest)" />
        <rect x="4" y="13.25" width="22" height="5.5" fill="var(--pb)" />
        <rect x="4" y="21.5" width="22" height="5.5" fill="var(--accent)" />
      </g>
    </svg>
  );
}
