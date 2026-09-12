# ADR-0001：以「B 拉新、A 留存」作为产品壳与激活主线

- Status: Accepted
- Date: 2026-09-12

## Context

谢邀喵同时存在两个有价值的方向：

- A：知乎人格宠物与长期养成；
- B：基于真实知乎兴趣/表达的 AI 社交匹配与 Agent × Agent 交流。

如果 A、B 被做成两个并列模块，首访会失去主线；如果先要求用户长期养成再开放社交，黑客松 Demo 的即时价值过弱；如果把“AI 回答知乎问题”作为主入口，又会退化成常见 LLM 套皮体验。

官方赛道明确鼓励基于兴趣、观点与内容行为的匹配，以及数字分身 / Agent 与 Agent 的社区连接机制。

## Decision

采用以下产品结构：

1. **B 负责首访拉新、第一次高潮和传播。** 用户孵化后立即获得一次可解释匹配和 Agent × Agent 互动，不设置养成门槛。
2. **A 负责身份资产和长期留存。** 宠物随真实内容探索、表达与社交事件成长，而不是通过传统喂食/签到成长。
3. **知乎真实内容连接 A 与 B。** 热榜、搜索和知识上下文既是宠物每天的世界输入，也是 Agent 互动的话题基础。
4. 激活后的产品壳固定为四个入口：`窝 / 逛 / 遇见 / 图鉴`。
5. 现有回答卡 PoC 降级为 `逛`/内容事件中的一种产物，不再承担产品主页和首访主线。
6. 第一版采用模块化单体后端，不拆微服务。

## Consequences

### Positive

- 首访在 60–90 秒内同时证明 Persona 和 Social 两个核心价值；
- 产品与“灵魂匹配局”赛道更直接对齐；
- 宠物养成有真实知乎内容和关系变化驱动，不是独立小游戏；
- 已有 Persona、Knowledge、Social PoC 可以继续复用为底层能力，而不用保留旧页面结构。

### Negative

- 需要应用自己的 Persona/关系数据库，不能只做无状态 API Demo；
- “匹配解释”必须可追溯，产品逻辑比简单相似度更复杂；
- 首访需要并行处理 OAuth、用户 Context、Persona、Match 与 Agent 互动，性能预算更严格。

## Rejected alternatives

### A 与 B 做并列菜单

拒绝。用户不知道应该先做什么，首访缺乏连续高潮。

### 先养宠物，再解锁社交

拒绝。即时回报不足，不适合黑客松项目广场拉新和现场 Demo。

### 把 AI 回答卡作为产品核心

拒绝。生成回答本身差异化弱，应作为宠物“逛知乎”和表达成长的一种能力。

### Tinder 式纯兴趣滑卡

拒绝。无法体现 Agent × Agent 和知乎内容生态的独特价值。

## References

- `docs/product/experience-flow-v2.md`
- `docs/product/first-visit-storyboard-v1.md`
- `docs/architecture/product-system-v1.md`
- `docs/reference/zhihu-hackathon-capability-map.md`
