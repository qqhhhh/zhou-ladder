import { getCachedCompactMatches } from "@/lib/matchCache";
import { hasTursoEnv } from "@/lib/turso";

export const runtime = "nodejs";
export const maxDuration = 60;
export const revalidate = 60;

/** Full compact match dump from Turso for client hydration. */
export async function GET() {
  try {
    if (!hasTursoEnv()) {
      return Response.json(
        {
          error:
            "缺少 Turso 配置：请设置 TURSO_DATABASE_URL 与 TURSO_AUTH_TOKEN",
        },
        { status: 503 },
      );
    }
    const bundle = await getCachedCompactMatches();
    return Response.json(bundle, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "对局数据请求失败";
    return Response.json({ error: message }, { status: 502 });
  }
}
