import type { CSSProperties, ReactNode } from "react";

type Variant = "panel" | "soft" | "hero" | "rail";

const VARIANT_CLASS: Record<Variant, string> = {
  panel: "panel glass-svg",
  soft: "panel-soft glass-svg-soft",
  hero: "hero-hub glass-svg-hero",
  rail: "sidebar-rail glass-svg",
};

/**
 * Optional glass composite wrapper.
 * Most chrome still uses CSS classes; this exists for explicit SVG-filter layering
 * and a specular sheen slot (e.g. hero canvas).
 */
export function GlassPanel({
  children,
  variant = "panel",
  className = "",
  style,
  sheen,
  id,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  /** Optional specular / canvas overlay rendered behind content */
  sheen?: ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`${VARIANT_CLASS[variant]} relative ${className}`.trim()}
      style={style}
    >
      {sheen}
      <div className="relative z-[2] h-full w-full">{children}</div>
    </div>
  );
}
