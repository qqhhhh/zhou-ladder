import { getMatchesWithFallback } from "@/lib/matchRead";
import { toSlimMatch } from "@/lib/slimMatch";

export const runtime = "nodejs";
export const maxDuration = 60;
export const revalidate = 60;

function parseUnixOrIso(raw: string | null): number | null {
  if (raw == null || raw === "") return null;
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum > 0) {
    // Heuristic: ms timestamps are > 1e12
    return asNum > 1e12 ? Math.floor(asNum / 1000) : Math.floor(asNum);
  }
  const ms = Date.parse(raw);
  if (Number.isFinite(ms)) return Math.floor(ms / 1000);
  return null;
}

/**
 * Range-scoped compact matches: Turso first, OpenDota fallback.
 *
 * Query params:
 * - days=30 (default) — last N calendar days; days=all for full history
 * - from / to — unix seconds or ISO (overrides days when either set)
 * - slim=1 — short keys {m,t,h,w,k,d,a}
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const daysRaw = url.searchParams.get("days");
    const from = parseUnixOrIso(url.searchParams.get("from"));
    const to = parseUnixOrIso(url.searchParams.get("to"));
    const slim =
      url.searchParams.get("slim") === "1" ||
      url.searchParams.get("slim") === "true";

    let days: number | "all" = 30;
    if (from != null || to != null) {
      // bounds mode — ignore days default
      days = "all"; // placeholder; from/to take precedence in reader
    } else if (daysRaw == null || daysRaw === "") {
      days = 30;
    } else if (daysRaw === "all" || daysRaw === "*") {
      days = "all";
    } else {
      const n = Number(daysRaw);
      if (!Number.isFinite(n) || n <= 0) {
        days = 30;
      } else {
        days = Math.min(Math.floor(n), 36500);
      }
    }

    const bundle =
      from != null || to != null
        ? await getMatchesWithFallback({ from, to })
        : await getMatchesWithFallback({ days });

    const body = slim
      ? {
          slim: true as const,
          matches: bundle.matches.map(toSlimMatch),
          fetchedAt: bundle.fetchedAt,
          count: bundle.count,
          since: bundle.since,
          until: bundle.until,
          source: bundle.source,
          days: from != null || to != null ? null : days === "all" ? "all" : days,
        }
      : {
          matches: bundle.matches,
          fetchedAt: bundle.fetchedAt,
          count: bundle.count,
          since: bundle.since,
          until: bundle.until,
          source: bundle.source,
          days: from != null || to != null ? null : days === "all" ? "all" : days,
        };

    // CDN caches by full URL (including ?days=), so s-maxage is keyed by range.
    return Response.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "对局数据请求失败";
    return Response.json({ error: message }, { status: 502 });
  }
}
