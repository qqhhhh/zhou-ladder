/** Subtle continuous dashed-line motion (PvX-style connectors / dividers). */
export function DashDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`dash-motion h-px w-full overflow-visible ${className}`}
      viewBox="0 0 400 2"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line
        x1="0"
        y1="1"
        x2="400"
        y2="1"
        className="dash-stroke"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function DashGridOverlay({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-[0.35] ${className}`}
      aria-hidden
    >
      <defs>
        <pattern
          id="dashGridPat"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 48 0 L 0 0 0 48"
            fill="none"
            className="dash-stroke-soft"
            strokeWidth="1"
            strokeDasharray="4 10"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dashGridPat)" className="dash-grid-fill" />
    </svg>
  );
}
