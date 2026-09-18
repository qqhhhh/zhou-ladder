import { Dashboard } from "@/components/Dashboard";
import { ACCOUNT_ID } from "@/lib/opendota";
import {
  getPlayerMeta,
  listRecentCompactMatches,
} from "@/lib/db/matches";
import { getStaticHeroes } from "@/lib/heroNamesCn";
import { hasTursoEnv } from "@/lib/turso";
import type { CompactMatch } from "@/lib/stats";
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

function playerFromMeta(
  meta: Awaited<ReturnType<typeof getPlayerMeta>>,
): OpenDotaPlayer {
  const name = meta?.personaname ?? "Zhou";
  const avatar = meta?.avatar ?? "";
  return {
    profile: {
      account_id: ACCOUNT_ID,
      personaname: name,
      avatar,
      avatarmedium: avatar,
      avatarfull: avatar,
      profileurl: "",
    },
    rank_tier: meta?.rank_tier ?? null,
    leaderboard_rank: meta?.leaderboard_rank ?? null,
  };
}

async function loadBootstrap(): Promise<{
  player: OpenDotaPlayer;
  matches: CompactMatch[];
  heroes: OpenDotaHero[];
  fetchedAt: string;
}> {
  if (!hasTursoEnv()) {
    throw new Error(
      "缺少 Turso 配置：请设置 TURSO_DATABASE_URL 与 TURSO_AUTH_TOKEN",
    );
  }

  // Heroes from checked-in static map — no OpenDota on critical path.
  const [meta, matches] = await Promise.all([
    getPlayerMeta(ACCOUNT_ID),
    listRecentCompactMatches(200),
  ]);
  const heroes = getStaticHeroes();

  return {
    player: playerFromMeta(meta),
    matches,
    heroes,
    fetchedAt: meta?.updated_at ?? new Date().toISOString(),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  let error: string | null = null;
  let payload: Awaited<ReturnType<typeof loadBootstrap>> | null = null;

  try {
    payload = await loadBootstrap();
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
