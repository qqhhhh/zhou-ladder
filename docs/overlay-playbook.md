# Overlay 天梯分截图处理手册

给接手本仓库的助手 / 开发者：用户发来直播或鱼吧截图时，按本手册处理。
**不要**把 OpenDota 的 `computed_mmr` 当成天梯分写入或展示。

相关代码：`src/lib/parseOverlayScore.ts`、`src/lib/overlayScore.ts`、`src/app/api/overlay-score/route.ts`。
对局列表仍靠 `/api/sync` → Turso（见 `docs/data-architecture.md`）。

## 1. 分数从哪来

| 来源 | 长什么样 | 用途 |
|------|----------|------|
| 斗鱼直播间 overlay | 黄字分表：总分 + `1、英雄±分` | 日常更新首选 |
| 鱼吧视频封面 | 封面右上角同一套黄字分表 | 回填历史 |
| OpenDota / STRATZ | 只有对局，没有真实天梯分 | 只用来对英雄、对 `match_id` |

站点自用入口（备案期间自定义域名已卸）：`https://zhou-ladder.vercel.app/zhou`。

## 2. 文本格式（OCR / 手抄）

```
7657
1、CK+26
2、先知+26
3、天怒-23
…
```

规则：

- 第一行纯数字 = 当前总分（可缺）。
- 其后每行：`序号、英雄名[+-]整数`。名字后的 `-` 是**负号**，不是分隔符（`风行-26` → value `-26`）。
- `TB` = 恐怖利刃。更多简称见 `OVERLAY_ALIASES`（`overlayScore.ts`），含：小刘/小鹿→魅惑魔女、剑圣→主宰、夜魔→暗夜魔王、剃刀→雷泽、岩王→兽王、末日→末日使者、天怒→天怒法师、斯文→斯温、小鱼人→斯拉克、敌法→敌法师、CK→混沌骑士等。缺别名就补进该表再提交。

## 3. 时间与名单顺序（易错）

- **封面 / 帖子发布时间 ≠ 对局时刻。** 不能按发布时间直接对齐比赛。
- 分表名单顺序 = **开局正序（旧 → 新）**：表顶较早，表底较新。
- 锁定方法：用**已知总分 + 已知对局英雄序列**当锚点，从**最新**一场往旧匹配；锁住一帧后，再用相邻帧的分差与名单变化往外推。
- 近期对局行上的 ± 分：**优先** `matchDeltas` 里按 `match_id` 精确命中；否则才用英雄名在当前分表里查找。

## 4. 用户发截图时你要做的事

1. 读图 / OCR 出总分与英雄±列表；看不清就问用户，不要猜。
2. 拉近期天梯对局（站点数据或先触发同步），按英雄序列从新往旧对齐。
3. **对得上**：为每场写出 `{ match_id, name, value, total_after? }`，合并进已有 `matchDeltas`（按 `match_id` 去重更新），再写入 API。
4. **对不上**：把读到的原文和不确定点告诉用户，**先不要 POST**。
5. 写入后打开 `/zhou` 看 KPI「当前天梯分数」和近期对局 ± 是否正确。

### KPI 何时显示总分

仅当**时间上最近一场**的英雄，能在当前 overlay 的 `heroes` 名单里匹配到时，才显示 `total`。
否则只显示对局统计，不显示该天梯总分。

胜/负颜色（UI）：正/胜 `#05cd99`，负/败 `#ee5d50`。

## 5. 写入 API

- `GET /api/overlay-score` — 公开读，前端轮询。
- `POST /api/overlay-score` — 写入；生产环境 `Authorization: Bearer <CRON_SECRET>`。
- Body 任选其一：
  - `{ "text": "7657\n1、风行-26\n…" }`（可附带 `matchDeltas` / `ledger`）
  - `{ "total", "heroes", "matchDeltas?", "ledger?" }`
  - `{ "clear": true }` 清空
- 落库键（Turso `sync_state`）：`overlay_score`（展示用 payload）、`overlay_ledger`（可选对账快照）。
- 示例（勿把密钥写进仓库或聊天记录）：

```bash
curl -sS -X POST "https://zhou-ladder.vercel.app/api/overlay-score" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"total":7657,"heroes":[{"rank":1,"name":"风行","value":-26}],"matchDeltas":[{"match_id":9013002104,"name":"风行","value":-26,"total_after":7657}]}'
```

## 6. 不要做的事

- 不要用 OpenDota MMR / computed_mmr 冒充天梯分。
- 不要在匹配不确定时静默写库。
- 不要把 `CRON_SECRET`、Turso token、直播 cookie 提交进 git。
- 不要把鱼吧封面大图、本机 `ledger.json` / OCR venv 当站仓内容（那些是本地对账缓存）。

## 7. 日常节奏建议

- 用户：**分数有变化时截 overlay 发助手**（省 token）。
- 对局增量：Vercel Cron 每天一次 `/api/sync`；也可用助手半小时 `POST /api/sync`（Hobby 限制下的补充）。
- 历史回填：批量扫鱼吧封面 → 按第 3 节锚点锁定 → 再写 `matchDeltas`。
