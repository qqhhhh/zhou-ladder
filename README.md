# Zhou · 鲷哥天梯看板 (oldboys.games)

Next.js App Router + TypeScript + Tailwind 的 Dota 2 天梯统计看板，展示 Zhou（鲷哥，OpenDota `account_id=90137663`）的 ranked（`lobby_type=7`）表现。

**重要：** 本站**不会**把 OpenDota 的 `computed_mmr` 当作「天梯分」展示。「上分」列固定为 `—`，真实 MMR 变动需要 Steam Game Coordinator 导出。

## 功能

- 深色玻璃拟态电竞仪表盘（zh-CN）
- 摘要：场次、W-L、胜率、场均 KDA
- 走势图：累计净胜 + 滚动胜率（**不是真实 MMR 曲线**）
- 英雄表：英雄、上分(—)、计数、W-L、净胜、场均 K/D/A、KDA、胜率
- 时间范围筛选（默认近 40 天）
- 服务端拉取，`revalidate` ≈ 180s；OpenDota 请求带 `User-Agent`

## 本地运行

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

生产构建：

```bash
npm run build
npm start
```

环境要求：Node.js 18+（建议 20）。

## 部署

### Vercel

1. Import GitHub 仓库 `qqhhhh/zhou-ladder`
2. Framework Preset: Next.js（默认即可）
3. Deploy
4. 在 Vercel 项目 Domains 添加 `oldboys.games` / `www.oldboys.games`

### Cloudflare Pages

1. Connect to Git → 选择本仓库
2. Build command: `npx @cloudflare/next-on-pages@1` 或使用 OpenNext Cloudflare 适配器（按你选用的适配方案）
3. 若使用 **Workers / OpenNext**：

   ```bash
   npx @opennextjs/cloudflare build
   ```

   也可先用 Cloudflare 的 Next.js 官方集成（Workers）一键导入。

4. 输出/兼容模式以你所选适配器文档为准；纯静态导出不适用（本站依赖服务端 `fetch` + ISR）。

> 推荐优先 Vercel 或 Cloudflare Workers(OpenNext)，以便保留 App Router 服务端拉取与 revalidate。

## DNSPod：绑定 oldboys.games（海外解析，无 ICP）

站点面向海外访问、不做国内 ICP 备案时，可用 DNSPod **海外线路** CNAME 到托管平台：

1. 登录 [DNSPod](https://console.dnspod.cn/) → 域名 `oldboys.games`
2. 添加记录（示例，以 Vercel 为准）：

   | 主机记录 | 记录类型 | 线路类型 | 记录值 | TTL |
   |---------|---------|---------|--------|-----|
   | `@` | CNAME | 境外 / 默认* | `cname.vercel-dns.com` | 600 |
   | `www` | CNAME | 境外 / 默认* | `cname.vercel-dns.com` | 600 |

   \* 若 DNSPod 提供「境外」线路，建议只给境外指向托管；国内线路可留空或指向说明页。无 ICP 时国内访问可能不稳定，属预期。

3. Cloudflare Pages 时记录值改为控制台给出的 `*.pages.dev` CNAME 目标。
4. 在托管平台完成域名所有权验证并签发 HTTPS 证书。

## 数据说明

- API: `https://api.opendota.com/api/players/90137663/...`
- 所有 OpenDota 请求携带自定义 `User-Agent`
- 英雄头像：Steam CDN `cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/...`

## License

MIT
