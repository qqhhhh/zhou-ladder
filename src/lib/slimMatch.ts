import type { CompactMatch } from "@/lib/stats";

/** Slim wire keys ~40%+ smaller than CompactMatch field names. */
export type SlimMatch = {
  m: number;
  t: number;
  h: number;
  w: 0 | 1;
  k: number;
  d: number;
  a: number;
};

export function toSlimMatch(m: CompactMatch): SlimMatch {
  return {
    m: m.match_id,
    t: m.start_time,
    h: m.hero_id,
    w: m.win ? 1 : 0,
    k: m.kills,
    d: m.deaths,
    a: m.assists,
  };
}

export function fromSlimMatch(s: SlimMatch): CompactMatch {
  return {
    match_id: s.m,
    start_time: s.t,
    hero_id: s.h,
    win: Boolean(s.w),
    kills: s.k,
    deaths: s.d,
    assists: s.a,
    lobby_type: 7,
  };
}
