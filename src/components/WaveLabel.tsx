"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Split into chars for staggered startle animation (parent `.is-startled`). */
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
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}

/**
 * Mouse enter once → children WaveLabels startle (lift + settle), then idle.
 * Does not stay elevated while hovered.
 */
export function StartleGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const el = ref.current;
    const n = el?.querySelectorAll(".wave-char").length ?? 1;
    const ms = 450 + Math.max(0, n - 1) * 45 + 40;
    const t = window.setTimeout(() => setPlaying(false), ms);
    return () => window.clearTimeout(t);
  }, [playing]);

  return (
    <div
      ref={ref}
      className={`startle-group ${playing ? "is-startled" : ""} ${className}`.trim()}
      onMouseEnter={() => {
        if (!playing) setPlaying(true);
      }}
    >
      {children}
    </div>
  );
}
