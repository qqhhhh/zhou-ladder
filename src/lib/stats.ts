import { format, fromUnixTime, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { heroIconUrl } from "./opendota";
import type {
  ChartPoint,
  HeroStat,
  OpenDotaHero,
  OpenDotaMatch,
  SummaryStats,
} from "./types";

export function isRadiant(playerSlot: number): boolean {
  return playerSlot < 128;
}

export function didWin(m: OpenDotaMatch): boolean {
  const radiant = isRadiant(m.player_slot);
  return radiant === m.radiant_win;
}

export function kdaRatio(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(deaths, 1);
}

export function filterMatchesByRange(
  matches: OpenDotaMatch[],
  days: number | null,
  customFrom?: number | null,
  customTo?: number | null,
): OpenDotaMatch[] {
  let filtered = matches.filter((m) => m.lobby_type === 7);

  if (customFrom != null || customTo != null) {
    filtered = filtered.filter((m) => {
      if (customFrom != null && m.start_time < customFrom) return false;
      if (customTo != null && m.start_time > customTo) return false;
      return true;
    });
  } else if (days != null && days > 0) {
    const cutoff = Math.floor(subDays(new Date(), days).getTime() / 1000);
    filtered = filtered.filter((m) => m.start_time >= cutoff);
  }

  // chronological ascending for chart
  return [...filtered].sort((a, b) => a.start_time - b.start_time);
}

export function buildSummary(matches: OpenDotaMatch[]): SummaryStats {
  const games = matches.length;
  let wins = 0;
  let kdaSum = 0;
  for (const m of matches) {
    if (didWin(m)) wins += 1;
    kdaSum += kdaRatio(m.kills, m.deaths, m.assists);
  }
  const losses = games - wins;
  return {
    games,
    wins,
    losses,
    winrate: games ? (wins / games) * 100 : 0,
    avgKda: games ? kdaSum / games : 0,
    netWins: wins - losses,
  };
}

export function buildHeroStats(
  matches: OpenDotaMatch[],
  heroes: OpenDotaHero[],
): HeroStat[] {
  const byId = new Map(heroes.map((h) => [h.id, h]));
  const map = new Map<
    number,
    {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
    }
  >();

  for (const m of matches) {
    const cur = map.get(m.hero_id) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    cur.games += 1;
    if (didWin(m)) cur.wins += 1;
    cur.kills += m.kills;
    cur.deaths += m.deaths;
    cur.assists += m.assists;
    map.set(m.hero_id, cur);
  }

  const rows: HeroStat[] = [];
  for (const [heroId, s] of map) {
    const hero = byId.get(heroId);
    const losses = s.games - s.wins;
    const avgKills = s.kills / s.games;
    const avgDeaths = s.deaths / s.games;
    const avgAssists = s.assists / s.games;
    rows.push({
      heroId,
      heroName: hero?.name ?? `hero_${heroId}`,
      localizedName: hero?.localized_name ?? `Hero ${heroId}`,
      iconUrl: hero ? heroIconUrl(hero.name) : "",
      games: s.games,
      wins: s.wins,
      losses,
      netWins: s.wins - losses,
      kills: s.kills,
      deaths: s.deaths,
      assists: s.assists,
      avgKills,
      avgDeaths,
      avgAssists,
      kda: kdaRatio(s.kills, s.deaths, s.assists),
      winrate: (s.wins / s.games) * 100,
    });
  }

  return rows.sort((a, b) => b.games - a.games || b.winrate - a.winrate);
}

const ROLLING_WINDOW = 20;

export function buildChartPoints(
  matches: OpenDotaMatch[],
  heroes: OpenDotaHero[],
): ChartPoint[] {
  const byId = new Map(heroes.map((h) => [h.id, h]));
  let net = 0;
  const recent: boolean[] = [];
  const points: ChartPoint[] = [];

  matches.forEach((m, i) => {
    const win = didWin(m);
    net += win ? 1 : -1;
    recent.push(win);
    if (recent.length > ROLLING_WINDOW) recent.shift();
    const winsInWindow = recent.filter(Boolean).length;
    const rolling =
      recent.length >= Math.min(5, ROLLING_WINDOW)
        ? (winsInWindow / recent.length) * 100
        : null;
    const d = fromUnixTime(m.start_time);
    points.push({
      index: i + 1,
      date: d.toISOString(),
      dateLabel: format(d, "M/d HH:mm", { locale: zhCN }),
      cumulativeNetWins: net,
      rollingWinrate: rolling,
      result: win ? "W" : "L",
      hero: byId.get(m.hero_id)?.localized_name ?? `#${m.hero_id}`,
    });
  });

  return points;
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatNum(n: number, digits = 1): string {
  return n.toFixed(digits);
}
