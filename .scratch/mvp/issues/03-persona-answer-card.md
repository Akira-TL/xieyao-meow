# 03｜跑通 Persona → 真实问题 → 回答卡片主链路

Type: task
Status: resolved
Blocked by: 02

## 目标

完成 L0 核心体验：知乎成分生成 Persona，Persona 选择或接收真实知乎问题，经 Knowledge Layer 与 Persona Layer 生成回答卡片。

## 完成标准

- 用户 Profile 可生成稳定的“知乎成分”结构；
- Persona 包含外观/品种、性格、口头禅、回答风格、兴趣与彩蛋属性；
- 问题来自已验证的知乎真实数据源；
- Knowledge Layer 与 Persona Layer 明确分离；
- Persona Layer 不修改 Knowledge Layer 的核心事实；
- 生成至少一种可分享回答卡片；
- 直答/问题数据具备缓存和 Demo fallback；
- 主链路可在路演环境连续执行。

## Comments

2026-09-12：L0 主链路已完成并通过真实接口端到端验收：

- `UserProfile → 知乎成分 → Persona` 为确定性映射；
- `ZhihuGateway` 已接入真实热榜、问题回答摘要与直答；
- `AnswerExperienceService` 明确分离 Knowledge Layer / Persona Layer；
- `POST /api/experience` 已在开发与生产模式真实返回 `mode=live`；
- 实测链路使用 5 条真实知乎回答摘要生成 Knowledge Layer，再生成 Persona 回答；
- 首页已具备可视化 Persona、知乎成分、回答卡片与复制分享能力；
- `src/data/demo-fallback.ts` 使用真实公开知乎问题和知乎直答结果，不包含用户个人 Profile 数据；
- 服务端缓存已验证：同一进程首轮真实生成约 23 秒，后续缓存命中约 14 ms；
- 并发同 key 请求会合并为单次上游调用，防止重复消耗额度；
- 生产环境忽略客户端 `forceRefresh`，避免公开部署被反复刷新消耗知乎额度；
- `pnpm test`、`pnpm typecheck`、`pnpm build` 均通过。
