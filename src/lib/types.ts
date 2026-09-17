export type OpenDotaMatch = {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  lobby_type: number;
  duration: number;
  game_mode: number;
  hero_id: number;
  start_time: number;
  kills: number;
  deaths: number;
  assists: number;
  average_rank: number | null;
  leaver_status: number;
  party_size: number | null;
};

export type OpenDotaHero = {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
};

export type OpenDotaPlayer = {
  profile: {
    account_id: number;
    personaname: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    profileurl: string;
  };
  rank_tier: number | null;
  leaderboard_rank: number | null;
  // computed_mmr exists on API but MUST NOT be shown as 天梯分
};

export type HeroStat = {
  heroId: number;
  heroName: string;
  localizedName: string;
  iconUrl: string;
  games: number;
  wins: number;
  losses: number;
  netWins: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  winrate: number;
};

export type SummaryStats = {
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKda: number;
  netWins: number;
};

export type ChartPoint = {
  index: number;
  date: string;
  dateLabel: string;
  cumulativeNetWins: number;
  rollingWinrate: number | null;
  result: "W" | "L";
  hero: string;
};

export type LadderPayload = {
  player: OpenDotaPlayer;
  matches: OpenDotaMatch[];
  heroes: OpenDotaHero[];
  fetchedAt: string;
};
