# 对局数据架构（Turso）

Turso/libSQL 是**唯一展示数据源**。页面与 `GET /api/matches` **不会**在请求路径上实时翻页打 OpenDota。

## 数据流

```
OpenDota API ──┐
               ├──► POST/GET /api/sync ──► Turso ──► page.tsx / /api/matches
STRATZ GraphQL ┘         ▲
                         │
                   Vercel Cron（每小时）
```

1. **展示**：`page.tsx` 读 `player_meta` + 最近对局；客户端再拉 `/api/matches` 全量 compact 历史。
2. **同步**：`/api/sync` 增量拉取 OpenDota（以及可选 STRATZ），按 `match_id` upsert 进 Turso。
3. **英雄常量**：仍可从 OpenDota `/heroes` 拉（带 try/catch）；失败时用空列表，页面仍可用（中文名走本地映射）。

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `TURSO_DATABASE_URL` | 是 | `libsql://…` |
| `TURSO_AUTH_TOKEN` | 是 | Turso DB token |
| `STRATZ_API_TOKEN` | 否 | STRATZ Bearer；缺省则跳过 STRATZ 同步 |
| `CRON_SECRET` | 生产建议 | `Authorization: Bearer <secret>`；Vercel Cron 会自动带 |

## Schema

见 `src/lib/db/schema.sql`：

- `ranked_matches` — compact 天梯对局（映射 `CompactMatch`）
- `sync_state` — 同步水位 / 元信息
- `player_meta` — 头像、昵称、段位（仅在 sync 时更新，不在每次页面请求打 OpenDota）

在 Turso Dashboard SQL 或 CLI 粘贴执行该文件即可。

## 首次同步

1. 创建 Turso DB，粘贴 `schema.sql`
2. 在 Vercel / `.env.local` 写入 `TURSO_*`（及可选 `STRATZ_API_TOKEN`、`CRON_SECRET`）
3. 全量回填：

```bash
curl -X POST "https://<host>/api/sync?full=1" \
  -H "Authorization: Bearer $CRON_SECRET"
```

之后每小时 Cron 打 `/api/sync`（增量：翻页直到撞上已有 `match_id`）。

## 相关代码

- `src/lib/turso.ts` — client
- `src/lib/db/matches.ts` — 读写
- `src/lib/sync/opendotaSync.ts` / `stratzSync.ts` — 上游同步
- `src/app/api/sync/route.ts` — Cron / 手动触发
