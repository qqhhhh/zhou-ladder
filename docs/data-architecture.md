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

1. **展示**：`page.tsx` 读 `player_meta` + 最近对局；客户端再拉 `/api/matches`（**slim** compact 列）。热路径只 `SELECT` `match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type`，不读 `raw_json` / 富统计列。
2. **同步**：`/api/sync` 增量拉取 OpenDota（以及可选 STRATZ），按 `match_id` upsert 进 Turso；写入富列 + `raw_json` 供未来 UI。
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

- `ranked_matches` — 天梯对局：slim 展示列 + 富统计列（duration / GPM / damage / award / imp 等）+ `raw_json`（`{"opendota":…,"stratz":…}` 合并）
- `sync_state` — 同步水位 / 元信息
- `player_meta` — 头像、昵称、段位（仅在 sync 时更新，不在每次页面请求打 OpenDota）

新建库直接执行 `schema.sql`。已有库执行 `scripts/migrate-enrich.sql`（逐条 `ADD COLUMN`；列已存在则跳过该条）。

### 富列（同步写入；展示热路径不 SELECT）

`duration`, `player_slot`, `party_size`, `game_mode`, `average_rank`, `leaver_status`, `gold_per_min`, `xp_per_min`, `hero_damage`, `tower_damage`, `hero_healing`, `last_hits`, `denies`, `net_worth`, `award`, `imp`, `raw_json`

未来详情可用 `getMatchRich(match_id)`，Dashboard 不调用。

### 同步策略

- **OpenDota**：`/players/{id}/matches` 列表字段全部入库 + `raw_json`；**不**对全量历史 N+1 打 `/matches/{id}`。增量同步时最多对最新约 20 场拉详情补 GPM/伤害等。
- **STRATZ**：GraphQL 扩展 duration / GPM / XPM / damage / lastHits / award / imp 等；失败则回退瘦查询。
- Upsert `ON CONFLICT`：标量列 `COALESCE` 保留非空；`raw_json` 按源合并；KDA 仍偏好 OpenDota / 非空填充。

## 首次同步

1. 创建 Turso DB，粘贴 `schema.sql`（或对已有库跑 `scripts/migrate-enrich.sql`）
2. 在 Vercel / `.env.local` 写入 `TURSO_*`（及可选 `STRATZ_API_TOKEN`、`CRON_SECRET`）
3. 全量回填：

```bash
curl -X POST "https://<host>/api/sync?full=1" \
  -H "Authorization: Bearer $CRON_SECRET"
```

之后每小时 Cron 打 `/api/sync`（增量：翻页直到撞上已有 `match_id`）。

## 相关代码

- `src/lib/turso.ts` — client
- `src/lib/db/matches.ts` — 读写（slim list* + `getMatchRich`）
- `src/lib/sync/opendotaSync.ts` / `stratzSync.ts` — 上游同步
- `src/app/api/sync/route.ts` — Cron / 手动触发
- `scripts/migrate-enrich.sql` — 线上 ALTER

## Sync schedule
Vercel Hobby only allows cron once per day; `vercel.json` uses `0 16 * * *` (00:00 Asia/Shanghai). For nearer-real-time, run `npx tsx scripts/sync-now.ts` or an external/hourly box routine.
