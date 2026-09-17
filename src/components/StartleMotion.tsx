"use client";

import { useEffect, useState, type ReactNode } from "react";

const STARTLE_MS = 400; // match text startle-bounce

function useStartle() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setPlaying(false), STARTLE_MS + 20);
    return () => window.clearTimeout(t);
  }, [playing]);

  return {
    playing,
    onMouseEnter: () => {
      if (!playing) setPlaying(true);
    },
  };
}

/** KPI icon well: background jitters; glyph scales up and spins once. */
export function StartleIconWell({ children }: { children: ReactNode }) {
  const { playing, onMouseEnter } = useStartle();
  return (
    <div
      className={`stat-icon startle-icon-well ${playing ? "is-startled" : ""}`}
      onMouseEnter={onMouseEnter}
    >
      <span className="startle-icon-glyph" aria-hidden>
        {children}
      </span>
    </div>
  );
}

/** Hero portrait: high-frequency tiny buzz, same ~0.4s window. */
export function StartleAvatar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { playing, onMouseEnter } = useStartle();
  return (
    <span
      className={`startle-avatar ${playing ? "is-startled" : ""} ${className}`.trim()}
      onMouseEnter={onMouseEnter}
    >
      <span className="startle-avatar-inner">{children}</span>
    </span>
  );
}
