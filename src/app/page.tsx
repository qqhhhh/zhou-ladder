import { Dashboard } from "@/components/Dashboard";
import { fetchLadderData } from "@/lib/opendota";
import { toCompactMatches } from "@/lib/stats";
import type { OpenDotaHero, OpenDotaPlayer } from "@/lib/types";

export const revalidate = 3600;
export const maxDuration = 60;

type SearchParams = Promise<{
  days?: string;
  from?: string;
  to?: string;
}>;

function slimPlayer(player: OpenDotaPlayer): OpenDotaPlayer {
  return {
    profile: {
      account_id: 0,
      personaname: player.profile.personaname,
      avatar: player.profile.avatar,
      avatarmedium: player.profile.avatarmedium,
      avatarfull: player.profile.avatarfull,
      profileurl: "",
    },
    rank_tier: player.rank_tier,
    leaderboard_rank: player.leaderboard_rank,
  };
}

function slimHeroes(heroes: OpenDotaHero[]): OpenDotaHero[] {
  return heroes.map((h) => ({
    id: h.id,
    name: h.name,
    localized_name: h.localized_name,
    primary_attr: "",
    attack_type: "",
    roles: [],
  }));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  let error: string | null = null;
  let payload: Awaited<ReturnType<typeof fetchLadderData>> | null = null;

  try {
    payload = await fetchLadderData();
  } catch (e) {
    error = e instanceof Error ? e.message : "对局数据请求失败";
  }

  if (error || !payload) {
    return (
      <div className="dash-shell mx-auto max-w-7xl px-4 py-16">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-bold text-navy-700">数据暂时不可用</h1>
          <p className="mt-2 text-sm text-rose-500">{error}</p>
          <p className="mt-4 text-xs text-ink-muted">请稍后刷新。</p>
        </div>
      </div>
    );
  }

  const matches = toCompactMatches(payload.matches);

  return (
    <Dashboard
      player={slimPlayer(payload.player)}
      matches={matches}
      heroes={slimHeroes(payload.heroes)}
      fetchedAt={payload.fetchedAt}
      initialDays={sp.days}
      initialFrom={sp.from}
      initialTo={sp.to}
    />
  );
}
