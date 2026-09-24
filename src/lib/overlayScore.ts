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
  // 鱼吧/overlay 常见简称（与对账实战一致）
  小刘: ["魅惑魔女"],
  小鹿: ["魅惑魔女"],
  魅惑魔女: ["魅惑魔女"],
  剑圣: ["主宰"],
  主宰: ["主宰"],
  夜魔: ["暗夜魔王"],
  暗夜魔王: ["暗夜魔王"],
  剃刀: ["雷泽"],
  雷泽: ["雷泽"],
  岩王: ["兽王"],
  兽王: ["兽王"],
  末日: ["末日使者"],
  末日使者: ["末日使者"],
  天怒: ["天怒法师"],
  天怒法师: ["天怒法师"],
  斯文: ["斯温"],
  斯温: ["斯温"],
  小鱼人: ["斯拉克"],
  斯拉克: ["斯拉克"],
  敌法: ["敌法师"],
  敌法师: ["敌法师"],
  ck: ["混沌骑士"],
  CK: ["混沌骑士"],
  混沌骑士: ["混沌骑士"],
  斧王: ["斧王"],
  噬魂鬼: ["噬魂鬼"],
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

/** Lookup signed overlay delta for an official CN hero name. */
export function overlayDeltaForHero(
  officialCn: string,
  overlay: OverlayScorePayload | null | undefined,
): number | null {
  if (!overlay || overlay.empty || !overlay.heroes.length) return null;
  const hit = overlay.heroes.find((h) => namesMatch(officialCn, h.name));
  return hit ? hit.value : null;
}

/** Prefer exact match_id delta; fall back to hero-name overlay list. */
export function overlayDeltaForMatch(
  matchId: number | undefined,
  officialCn: string,
  overlay: OverlayScorePayload | null | undefined,
): number | null {
  if (!overlay || overlay.empty) return null;
  if (matchId != null && overlay.matchDeltas?.length) {
    const hit = overlay.matchDeltas.find((d) => d.match_id === matchId);
    if (hit) return hit.value;
  }
  return overlayDeltaForHero(officialCn, overlay);
}
