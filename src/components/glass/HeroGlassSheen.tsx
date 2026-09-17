"use client";

import { useEffect, useRef } from "react";

/**
 * Light 2D canvas ice specular for the hero glass panel (Authkit cathedral clarity).
 * Soft drifting cool highlight; static on prefers-reduced-motion / narrow viewports.
 */
export function HeroGlassSheen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqNarrow = window.matchMedia("(max-width: 640px)");

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let t0 = performance.now();
    let running = false;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };

    const paint = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      const reduced = mqReduce.matches;
      const mobile = mqNarrow.matches;
      const phase = reduced || mobile ? 0 : (now - t0) * 0.00016;

      const cx = w * (0.78 + Math.sin(phase) * 0.035);
      const cy = h * (0.14 + Math.cos(phase * 0.9) * 0.025);
      const r = Math.max(w, h) * 0.58;

      // Ice spotlight (Authkit cool blue-white)
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g1.addColorStop(0, "rgba(216,236,248,0.18)");
      g1.addColorStop(0.3, "rgba(186,215,247,0.07)");
      g1.addColorStop(0.65, "rgba(152,192,239,0.025)");
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Soft top-left cathedral wash
      const g2 = ctx.createLinearGradient(0, 0, w * 0.5, h * 0.4);
      g2.addColorStop(0, "rgba(216,236,248,0.12)");
      g2.addColorStop(0.4, "rgba(186,215,247,0.035)");
      g2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Thin ice rim (top)
      const edge = ctx.createLinearGradient(0, 0, 0, 16);
      edge.addColorStop(0, "rgba(216,236,248,0.28)");
      edge.addColorStop(1, "rgba(216,236,248,0)");
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, 16);

      // Lit-from-below inner glow (Authkit glass plate)
      const under = ctx.createRadialGradient(
        w * 0.5,
        h * 1.05,
        0,
        w * 0.5,
        h * 0.85,
        Math.max(w, h) * 0.55,
      );
      under.addColorStop(0, "rgba(168,216,245,0.07)");
      under.addColorStop(0.55, "rgba(168,216,245,0.02)");
      under.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = under;
      ctx.fillRect(0, 0, w, h);
    };

    const tick = (now: number) => {
      paint(now);
      if (running) rafRef.current = requestAnimationFrame(tick);
    };

    const syncLoop = () => {
      const shouldAnimate = !mqReduce.matches && !mqNarrow.matches;
      if (shouldAnimate && !running) {
        running = true;
        t0 = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      } else if (!shouldAnimate && running) {
        running = false;
        cancelAnimationFrame(rafRef.current);
        paint(performance.now());
      } else if (!shouldAnimate) {
        paint(performance.now());
      }
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();
    syncLoop();

    const onChange = () => syncLoop();
    mqReduce.addEventListener("change", onChange);
    mqNarrow.addEventListener("change", onChange);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mqReduce.removeEventListener("change", onChange);
      mqNarrow.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
      style={{ mixBlendMode: "soft-light", opacity: 0.95 }}
    />
  );
}
