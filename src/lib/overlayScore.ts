import type { CompactMatch } from "@/lib/stats";
import type { OpenDotaHero } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { heroNameCn } from "@/lib/heroNamesCn";

/** Short overlay names → official CN names (TB = 恐怖利刃). */
const OVERLAY_ALIASES: Record<string, string[]> = {
  风行: ["风行者", "风行"],
  风行者: ["风行者", "风行"],
  先知: ["自然先知", "先知"],
  自然先知: ["自然先知", "先知"],
  tb: ["恐怖利刃"],
  TB: ["恐怖利刃"],
  恐怖利刃: ["恐怖利刃"],
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function namesMatch(officialCn: string, overlayName: string): boolean {
  const o = overlayName.trim();
  if (!o) return false;
  if (officialCn === o) return true;
  const aliases = OVERLAY_ALIASES[o] ?? OVERLAY_ALIASES[o.toUpperCase()];
  if (aliases?.includes(officialCn)) return true;
  // also try lowercase key for TB
  const lower = OVERLAY_ALIASES[norm(o)];
  if (lower?.includes(officialCn)) return true;
  return norm(officialCn) === norm(o);
}

export function resolveOfficialHeroName(
  heroId: number,
  heroes: OpenDotaHero[],
): string {
  const h = heroes.find((x) => x.id === heroId);
  return heroNameCn(heroId, h?.name, h?.localized_name);
}

/**
 * Show total only when the most recent match's hero appears in the
 * overlay hero-score list (makes the total "trusted").
 */
export function trustedLadderScore(
  matches: CompactMatch[],
  overlay: OverlayScorePayload | null | undefined,
  heroes: OpenDotaHero[],
): number | null {
  if (!overlay || overlay.empty || overlay.total == null) return null;
  if (!overlay.heroes.length) return null;
  if (!matches.length) return null;

  const last = [...matches].sort((a, b) => b.start_time - a.start_time)[0];
  if (!last) return null;
  const official = resolveOfficialHeroName(last.hero_id, heroes);
  const hit = overlay.heroes.some((h) => namesMatch(official, h.name));
  return hit ? overlay.total : null;
}
