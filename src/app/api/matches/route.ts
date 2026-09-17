import { getCachedCompactMatches } from "@/lib/matchCache";

export const runtime = "nodejs";
export const maxDuration = 60;
export const revalidate = 3600;

/** Full compact match dump for client hydration after fast bootstrap. */
export async function GET() {
  try {
    const bundle = await getCachedCompactMatches();
    return Response.json(bundle, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "对局数据请求失败";
    return Response.json({ error: message }, { status: 502 });
  }
}
