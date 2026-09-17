"use client";

import { useState } from "react";

/**
 * Outer span = fixed hit box (never translates).
 * Inner span = visual startle only, so neighbors don't steal the cursor.
 */
function StartleChar({ ch }: { ch: string }) {
  const [playing, setPlaying] = useState(false);
  const glyph = ch === " " ? "\u00a0" : ch;

  return (
    <span
      className="wave-char"
      aria-hidden="true"
      onMouseEnter={() => {
        if (!playing) setPlaying(true);
      }}
    >
      <span
        className={`wave-char-inner ${playing ? "is-startled" : ""}`}
        onAnimationEnd={() => setPlaying(false)}
      >
        {glyph}
      </span>
    </span>
  );
}

/** Per-character hit box; only the touched glyph jumps. */
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
        <StartleChar key={`${i}-${ch}`} ch={ch} />
      ))}
    </span>
  );
}
