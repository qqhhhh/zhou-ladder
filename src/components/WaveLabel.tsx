"use client";

import { useEffect, useState } from "react";

/**
 * Hit box = this text's own glyphs only.
 * Mouse enter → one-shot staggered startle, then idle (ignore leave).
 */
export function WaveLabel({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const chars = [...text];

  useEffect(() => {
    if (!playing) return;
    const ms = 450 + Math.max(0, chars.length - 1) * 45 + 40;
    const t = window.setTimeout(() => setPlaying(false), ms);
    return () => window.clearTimeout(t);
  }, [playing, chars.length]);

  return (
    <span
      className={`wave-label ${playing ? "is-startled" : ""} ${className}`.trim()}
      aria-label={text}
      onMouseEnter={() => {
        if (!playing) setPlaying(true);
      }}
    >
      {chars.map((ch, i) => (
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
