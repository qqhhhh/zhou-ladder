import { getSyncState, setSyncState } from "@/lib/db/matches";
import { hasTursoEnv } from "@/lib/turso";
import {
  parseOverlayScore,
  type OverlayScorePayload,
} from "@/lib/parseOverlayScore";

export const runtime = "nodejs";
export const maxDuration = 30;

const STATE_KEY = "overlay_score";

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (secret) return bearer === secret;
  return process.env.NODE_ENV !== "production";
}

async function readStored(): Promise<OverlayScorePayload | null> {
  if (!hasTursoEnv()) return null;
  try {
    const raw = await getSyncState(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OverlayScorePayload;
  } catch {
    return null;
  }
}

/** Public read — UI polls this. */
export async function GET() {
  try {
    const payload = await readStored();
    if (!payload || payload.empty) {
      return Response.json({ empty: true, total: null, heroes: [] });
    }
    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "读取失败";
    return Response.json({ error: message }, { status: 502 });
  }
}

/**
 * Ingest overlay text or JSON.
 * Body: { text: "7635\\n1、风行-26\\n..." } or full OverlayScorePayload
 * Auth: Bearer CRON_SECRET
 */
export async function POST(req: Request) {
  if (!authorize(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasTursoEnv()) {
    return Response.json({ error: "缺少 Turso 配置" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as {
      text?: string;
      clear?: boolean;
      total?: number | null;
      heroes?: OverlayScorePayload["heroes"];
    };

    if (body.clear) {
      const empty: OverlayScorePayload = {
        total: null,
        heroes: [],
        rawLines: [],
        empty: true,
        updatedAt: new Date().toISOString(),
      };
      await setSyncState(STATE_KEY, JSON.stringify(empty));
      return Response.json(empty);
    }

    let payload: OverlayScorePayload;
    if (typeof body.text === "string") {
      payload = parseOverlayScore(body.text);
    } else if (Array.isArray(body.heroes) || body.total != null) {
      payload = {
        total: body.total ?? null,
        heroes: body.heroes ?? [],
        rawLines: [],
        empty: (body.total == null || Number.isNaN(body.total)) && !(body.heroes?.length),
      };
    } else {
      return Response.json({ error: "需要 text 或 total/heroes" }, { status: 400 });
    }

    payload = { ...payload, updatedAt: new Date().toISOString() };
    await setSyncState(STATE_KEY, JSON.stringify(payload));
    return Response.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "写入失败";
    return Response.json({ error: message }, { status: 502 });
  }
}
