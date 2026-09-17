"use client";

import { useState } from "react";

/** One glyph: mouse enter → startle once, then idle. */
function StartleChar({ ch, index }: { ch: string; index: number }) {
  const [playing, setPlaying] = useState(false);
  const glyph = ch === " " ? "\u00a0" : ch;

  return (
    <span
      className={`wave-char ${playing ? "is-startled" : ""}`}
      aria-hidden="true"
      onMouseEnter={() => {
        if (!playing) setPlaying(true);
      }}
      onAnimationEnd={() => setPlaying(false)}
    >
      {glyph}
    </span>
  );
}

/**
 * Hit box per character. Touching a glyph startles only that glyph.
 */
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
        <StartleChar key={`${i}-${ch}`} ch={ch} index={i} />
      ))}
    </span>
  );
}
