# 对局数据怎么管才快

参考开源里常见做法（如 NextStats 用 SQLite 落库、dlt→DuckDB 增量管道）：

1. **不要每次请求都翻页打 OpenDota**  
   全量约 1 万场，串行翻页又慢又易 429。

2. **持久化 + 增量**  
   - 首次：拉全量，写入缓存/库（SQLite / Turso / Vercel Blob / DuckDB）  
   - 之后：只拉最新几页，直到撞上已有 `match_id` 就停（watermark）

3. **本站当前实现**  
   - 首屏：`fetchRecentRankedMatches(~45天)` 快速出数  
   - 后台：`GET /api/matches` + `unstable_cache` 拉全量并缓存 1h  
   - 前端：筛选/输入天数在浏览器内存里算，不回源

4. **下一步可升级**  
   - Turso/libSQL 或 Vercel Blob 存 compact JSON，Cron 每小时增量同步  
   - 按日预聚合 KPI，查询近 N 天 O(1)
