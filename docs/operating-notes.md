# 运行说明（给接手的人）

站点：`qqhhhh/zhou-ladder`，Next.js App Router，路径 `/zhou`，生产 `https://zhou-ladder.vercel.app/zhou`。自定义域名 `oldboys.games` / `ranked.oldboys.games` 已从 Vercel 卸掉（备案），不要加回去。

和用户用中文，短、准。先按原话做，不对再改。UI 自己验证，不要把截图丢回去让用户核对。做不到就直说。

## 已经在 git 里的

- 站点代码、`/api/sync`、Turso 读写、overlay 解析与写入。
- 数据流：`docs/data-architecture.md`。
- 截图分数怎么对、怎么写：`docs/overlay-playbook.md`。
- 英雄别名在 `src/lib/overlayScore.ts` 的 `OVERLAY_ALIASES`。

胜负色：胜/正 `#05cd99`，负/败 `#ee5d50`。不要用胜利红、失败灰。

顶栏：近 1/7/30 天 + 起止日期，一个「应用」按钮。趋势图在左、近期对局在右，悬停加宽。日期切换才做曲线 morph，松鼠标不要重播。

展示读 Turso，失败或超过 48 小时回源 OpenDota。同步只 upsert，不删库。`/api/sync` 不带 `Authorization: Bearer CRON_SECRET` 返回 401 是正常的。

Vercel Cron（`vercel.json`）每天一次，`0 16 * * *`（上海 0 点）。Hobby 套餐不能改成每小时，不要改。

## 不在 git 里的（配套没有齐）

这些是故意不进仓库的，换机器或换助手时要单独交接：

| 东西 | 在哪 | 说明 |
|------|------|------|
| Turso 库数据 | Turso，不在仓库 | 对局、overlay 分、段位都在库里 |
| 密钥 | 本机 `/workspace/zhou-ladder-keys.txt`，已 gitignore | `TURSO_*`、`CRON_SECRET`、`STRATZ_API_TOKEN`。Vercel 上 **没有** `STRATZ_API_TOKEN`，线上同步会跳过 STRATZ |
| 半小时同步 | Grok Bot 例程「Zhou 天梯半小时同步」 | 上海时间 8:02–23:32，每小时的 :02 和 :32 调 `/api/sync`。无新对局不通知。不在 `vercel.json` 里 |
| 鱼吧封面缓存、overlay ledger 原文 | 本机，不在仓库 | 流程见 overlay 手册；结果已写入 Turso 的才算数 |
| 杯赛数据 | 本机 `/workspace/zhou-stats/cup/` | `log.jsonl`（只存解析结果）、`players.json`（名单 ↔ 账号）。**与天梯库分开，未进 git，也未进 Turso / 站点** |

杯赛是自建房，OpenDota / STRATZ 基本收不到。用户发计分板截图，助手解析后写入上面两个文件。认人用数字账号 ID，网页显示名单里的叫法，游戏昵称只是备注。不要在文档、提交、聊天里写出账号 ID。

杯赛没有做上传识图后台。用户明确说过接模型太费劲，继续人工看图录入。

## 当前数据水位（2026-09-30）

- 天梯：10428 场，最大 `match_id` `9014449466`（9/25 之后没有新天梯）。
- 最近一次确认的当前分：7683（02:52 那场是雷泽，不是截图上的别的英雄）。
- 杯赛：40 人里约 31 个号已对上；自建房对局没有公开数据，只能靠截图。

水位会变。以 `/api/sync` 返回和 Turso 为准，不要把上面三行当永久事实。
