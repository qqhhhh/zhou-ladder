import { createClient, type Client } from "@libsql/client";

let cached: Client | null = null;

/**
 * Shared Turso/libSQL client. Throws a clear error when env is missing
 * so API/page can surface a helpful message (build-time env may be absent).
 */
export function getTurso(): Client {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      "缺少 Turso 配置：请设置环境变量 TURSO_DATABASE_URL 与 TURSO_AUTH_TOKEN",
    );
  }

  cached = createClient({ url, authToken });
  return cached;
}

/** True when Turso env is present (does not open a connection). */
export function hasTursoEnv(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}
