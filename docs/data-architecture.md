# 对局数据架构（Turso + OpenDota 回源）

展示读路径：**Turso 优先**；Turso 不可用 / 过旧（>48h）/ 报错时 **回源 OpenDota**；两者都失败才返回错误。同步写入仍只进 Turso（upsert，不删库）。

## 数据流

```
OpenDota API ──┐
               ├──► POST/GET /api/sync ──► Turso ──┐
STRATZ GraphQL ┘         ▲                        ├──► page.tsx / /api/matches
                         │                        │         │
                   Vercel Cron（每天一次）          │         ▼（Turso 失败/过旧）
                                                   └──── OpenDota 只读回源
```

1. **展示**：`page.tsx` / `GET /api/matches` 走 `getMatchesWithFallback` / `loadBootstrapWithFallback`（`src/lib/matchRead.ts`）。热路径 Turso 只 `SELECT` slim 列；回源时用 OpenDota 列表接口转 CompactMatch。`slim` / `days` / `from` / `to` 参数保持。
2. **同步**：`/api/sync` 增量拉取 OpenDota（以及可选 STRATZ），按 `match_id` upsert 进 Turso。OpenDota 失败则 **跳过本次 OpenDota**，不截断/清空 Turso；STRATZ 仍可继续。
3. **英雄常量**：静态映射；不依赖 OpenDota `/heroes` 关键路径。

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `TURSO_DATABASE_URL` | 是（有库时） | `libsql://…`；缺省则读路径直接回源 OpenDota |
| `TURSO_AUTH_TOKEN` | 是（有库时） | Turso DB token |
| `STRATZ_API_TOKEN` | 否 | STRATZ Bearer；缺省则跳过 STRATZ 同步 |
| `CRON_SECRET` | 生产建议 | `Authorization: Bearer <secret>`；Vercel Cron 会自动带 |

## Schema

见 `src/lib/db/schema.sql`：

- `ranked_matches` — 天梯对局：slim 展示列 + 富统计列 + `raw_json`
- `sync_state` — 同步水位 / 元信息（`opendota_last_sync` 用于判断是否过旧）
- `player_meta` — 头像、昵称、段位

### 同步策略

- **OpenDota**：列表字段入库；失败时整次跳过，不写假成功水位。
- **STRATZ**：独立 try/catch；与 OpenDota 互不影响。
- Upsert `ON CONFLICT`：无 `DELETE` / `TRUNCATE`。

## Sync schedule

Vercel Hobby 每天只能跑一次 Cron；`vercel.json` 使用 `0 16 * * *`（Asia/Shanghai 00:00）。**不要**改回每小时。更近实时可用 `npx tsx scripts/sync-now.ts` 或外部调度。

## 相关代码

- `src/lib/matchRead.ts` — 读路径降级
- `src/lib/turso.ts` / `src/lib/db/matches.ts` / `src/lib/matchCache.ts`
- `src/lib/sync/opendotaSync.ts` / `stratzSync.ts`
- `src/app/api/sync/route.ts` / `src/app/api/matches/route.ts`
