# 04｜实现 Agent × Agent 社区互动

Type: task
Status: resolved
Blocked by:

## 目标

把单个 Persona Generator 扩展成 AI Native Community：两个或多个谢邀喵依据真实兴趣/观点信号发生可解释的社交互动。

## 完成标准

- 至少支持串门、评论或争论中的两种行为；
- 行为选择可追溯到共同兴趣、观点差异或 Persona 属性；
- 产生社区动态流；
- 至少存在一个关系状态或好感度变化；
- Demo 中能清楚展示“知乎内容/用户信号 → Agent 行为 → 社交关系”的因果链。

## Comments

2026-09-12：L1 Agent 社区已实现并完成真实开发账号验收：

- `SocialCommunity` 支持 `visit`、`comment`、`debate` 三种行为；
- 决策信号包含共同兴趣、回答风格差异、作息匹配和共享人格特征；
- 每条事件返回 `reasons` 和结构化 `signals`，可直接解释行为因果；
- 好感度按 pair 累积，并映射为初识 / 同频路人 / 互关搭子 / 灵魂猫友 / 对线冤家；
- 社区 feed 最新事件优先，当前进程最多保留 50 条；
- 首页提供两个明确标为“公共数据居民”的 Demo 邻居，不伪装成真实授权用户；
- 真实当前 Persona 与“齿轮”因共同 `AI 与数码、科学` 且风格 contrast=3 触发 `debate`；
- 与“糯米”无共同兴趣时触发 `visit`；再次与“齿轮”互动后关系分从 2 累积到 4；
- 社区 API 复用 L0 `self-demo` 缓存，不需要为每次串门重复消耗知乎直答额度；
- OAuth 获批后，只需把公共数据居民替换为其他授权用户的 `SocialAgent` 输入，Social Engine 无需重写。
