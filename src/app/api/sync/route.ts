import { syncOpenDota } from "@/lib/sync/opendotaSync";
import { syncStratz } from "@/lib/sync/stratzSync";
import { countMatches, getMaxMatchId } from "@/lib/db/matches";
import { hasTursoEnv } from "@/lib/turso";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If unset, allow in development only
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  return bearer === secret;
}

async function runSync(req: Request) {
  if (!authorize(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasTursoEnv()) {
    return Response.json(
      {
        error:
          "缺少 Turso 配置：请设置 TURSO_DATABASE_URL 与 TURSO_AUTH_TOKEN",
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const full = url.searchParams.get("full") === "1";

  const beforeCount = await countMatches();
  const beforeMax = await getMaxMatchId();

  let opendota: Awaited<ReturnType<typeof syncOpenDota>> | { error: string } ;
  let stratz: Awaited<ReturnType<typeof syncStratz>> | { error: string };
  try {
    opendota = await syncOpenDota({ full });
  } catch (e) {
    opendota = { error: e instanceof Error ? e.message : String(e) };
  }
  try {
    stratz = await syncStratz({ full });
  } catch (e) {
    stratz = { error: e instanceof Error ? e.message : String(e) };
  }

  const afterCount = await countMatches();
  const afterMax = await getMaxMatchId();

  return Response.json({
    ok: true,
    full,
    before: { count: beforeCount, maxMatchId: beforeMax },
    after: { count: afterCount, maxMatchId: afterMax },
    opendota,
    stratz,
    syncedAt: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    return await runSync(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : "同步失败";
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  try {
    return await runSync(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : "同步失败";
    return Response.json({ error: message }, { status: 502 });
  }
}
