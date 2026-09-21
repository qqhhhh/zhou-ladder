import { Dashboard } from "@/components/Dashboard";
import { loadBootstrapWithFallback } from "@/lib/matchRead";
import type { OpenDotaHero, OpenDotaPlayer } from "@/lib/types";

export const revalidate = 60;
export const maxDuration = 60;

type SearchParams = Promise<{
  days?: string;
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
  let payload: Awaited<ReturnType<typeof loadBootstrapWithFallback>> | null =
    null;

  try {
    payload = await loadBootstrapWithFallback();
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

  return (
    <Dashboard
      player={slimPlayer(payload.player)}
      matches={payload.matches}
      heroes={slimHeroes(payload.heroes)}
      fetchedAt={payload.fetchedAt}
      initialDays={sp.days}
    />
  );
}
