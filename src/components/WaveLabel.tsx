/** Per-char lift on parent hover (C: staggered translateY). */
export function WaveLabel({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`wave-label ${className}`.trim()} aria-label={text}>
      {[...text].map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          className="wave-char"
          aria-hidden="true"
          style={{ ["--i" as string]: i }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}
