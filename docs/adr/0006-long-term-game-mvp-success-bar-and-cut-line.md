# ADR-0006：长期游戏化 MVP 的成功闭环与砍项线

- Status: Accepted
- Date: 2026-09-14

## Context

谢邀喵已经分别验证过 Persona、知乎真实内容、回答卡片和 Agent × Agent，但这些单点能力不等于长期游戏化成立。首版需要用最小范围证明：用户的知乎人格会持续自主生活、留下长期资产，并能和另一名真实用户 Persona 形成可持续关系历史。

## Decision

1. 长期游戏化 MVP 的硬验收闭环是：`真实知乎 User -> 稳定 Root Persona -> 自主 Journey -> 真实知乎内容 -> RETURNED -> JourneyPostcard + JourneyLog + 可选 ReturnArtifact -> Inventory/Atlas 可回看 -> 可再次出门`。
2. 闭环必须由服务端 Game State 驱动，并能跨刷新和重新登录恢复；纯前端定时动画、localStorage 单机状态或预置结果不能视为长期循环成立。
3. 每个完成的 Journey 至少形成一份 JourneyPostcard 和 JourneyLog；额外 ReturnArtifact 可以为 0，避免把长期体验做成固定掉落奖励。
4. MVP 必须额外证明一次真实用户之间的异步社交：至少两名真实 User 的 Persona 围绕一个真实知乎问题完成一场 Shared Encounter，双方读取同一事件，并形成服务端持久的 PersonaRelationship。
5. Persona 成长的 P0 证明是 Journey / Shared Encounter 能写入有来源的 Persona Memory，同时单次模型输出不能直接改 Root Persona。MVP 不要求现场一定触发一次 Root Persona version promotion。
6. P0 必须保留的长期状态至少包括：稳定 User/Session ownership、CatProfile、Root Persona/version、Game State、Journey、JourneyPostcard/JourneyLog、Artifact/Inventory、Persona Memory、Shared Encounter、PersonaRelationship。
7. 以下功能不阻塞长期游戏化 MVP：Push/邮件、复杂通知中心、完整装备解锁树、完整陌生人发现网络、关系数量玩法、排行榜、PvP、复杂货币经济、商城、真人实时聊天、自动代用户发布知乎内容、复杂社交 Feed。
8. 后续票若与 P0 闭环发生资源冲突，优先保证稳定账号、Journey materialization、回家产物、长期资产、Persona Memory 和一次真实 Shared Encounter。

## Consequences

- Demo 和实现拥有统一的端到端验收标准，不再用多个 PoC 拼接成“长期玩法已成立”。
- 社交保留为核心竞争力，但首版只要求一次真实 Shared Encounter 与持久关系证明，不要求先建完整社区。
- Persona 演化只需要证明安全的记忆/证据管线和版本边界，不需要为了演示强行快速变人格。
- 回访、社交安全、外观解锁负责优化留存和表现，但不能重新扩大 P0 验收面。

## Rejected alternatives

- 只把 OAuth、孵化和回答卡片当作长期游戏化 MVP：这只能证明一次性生成体验。
- 要求每个 Journey 都产生收藏或社交：会把弱控制体验变成奖励任务系统。
- 把完整社区、通知、装备和经济同时列为 P0：范围过大，且不是长期循环成立的必要条件。
