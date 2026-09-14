# ADR-0005：Persona 采用版本化根人格、衰减心境与证据化记忆

- Status: Accepted
- Date: 2026-09-14

## Context

当前 `buildPersona()` 会从一次 `ZhihuComposition` 直接重建整份 Persona；现有 `PersonaExperienceMemory` 则主要是客户端提交的近期话题、Resident 和自由文本 notes，其中 `memory_note` 甚至可以直接来自一次知乎直答生成。如果把这些 PoC 形状直接升级为长期游戏状态，一次 Journey、一次 Shared Encounter 或一次模型输出就可能改写核心人格，产生人格漂移、来回横跳和不可解释的长期状态。

长期产品已经要求 Persona 是稳定但可演化的身份资产，Journey / Shared Encounter 是可追溯事件，长期 Game State 由服务端 `user_id` 权威持有。因此“经历影响人格”必须经过明确的状态层次与证据门槛，而不能让生成模型直接写人格真相。

## Decision

1. Persona 拆成三层长期语义：**Root Persona、Persona Mood、Persona Memory**。三层都属于服务端 Game State，但生命周期和写入规则不同。
2. **Root Persona** 是版本化的稳定身份。它承载 archetype、核心 traits、稳定兴趣结构、answer style、visual identity 等长期特征；一次 Journey、一次 Shared Encounter、一次 ReturnArtifact 或一次 LLM 输出都不得直接修改当前 Root Persona。
3. Root Persona 每次演化都创建新 version，而不是原地无痕覆盖。版本必须保存 `derivedFromVersion + evidenceRefs + changedFields + explanation + createdAt`，使用户和系统都能回答“为什么这只猫变了”。旧版本保留为历史事实。
4. **Persona Mood** 是短生命周期、可衰减的近期状态。它由最近若干有效 Journey / Shared Encounter / Return 事件投影，用于调整近期表达、探索权重和 UI 表现；Mood 不修改 Root Persona，也不作为长期人格证据的唯一来源。
5. **Persona Memory** 是结构化、可追溯的经历记忆。每条长期记忆至少包含 `type + sourceEventId + observation + weight + createdAt`，并可带 `topicRef / otherPersonaId / expiresAt`。Memory 必须能追溯到真实 Journey、Shared Encounter、Relationship milestone 或其他服务端事件。
6. 知乎直答或其他生成模型只能提出 **Memory Candidate** 或演化候选，不能直接写 Persona Memory，更不能直接修改 Root Persona。服务端规则先验证来源、类型、重复性、敏感边界和可归因性，再决定是否将候选转成正式 Memory。
7. Root Persona 的自动演化采用**累积证据门槛**。单次事件只能影响 Mood 或产生 Memory；新兴趣、表达习惯或其他长期变化必须由多次独立有效事件支持，并且至少跨多趟 Journey 或多个来源重复出现。
8. 一次 Root Persona version 最多只允许 1 个主要变化；必须生成面向用户可解释的证据摘要。具体阈值属于可调产品规则，不写死在领域模型，但不得退化成单次随机升级。
9. 演化采用迟滞：证据暂时减少时不立即反向回滚，避免人格在相邻 Journey 之间抖动。反向变化需要新的独立累计证据，而不是简单减掉上一轮分数。
10. 黑猫物种、稳定视觉母体、用户明确设定的猫名以及其他身份锚点不参与自动演化。装备、徽章、旅途痕迹可以随经历增加，但不等同于 Root Persona 核心身份被重写。
11. 当前浏览器 `PersonaExperienceMemory` 与直答返回的自由文本 `memory_note` 只能继续作为 PoC 输入/显示层；正式实现必须迁移到按稳定 `user_id` 持久化的服务端 Memory，并由事件来源而非客户端文本决定其真实性。

## Consequences

- 用户会感到“它经历过这些，所以慢慢变了一点”，而不是每次打开重新随机一只猫。
- Journey 和 Shared Encounter 可以即时改变 Mood，同时长期人格保持稳定。
- LLM 负责语言化和候选归纳，不拥有长期身份写权限；模型偶发幻觉不会直接污染 Persona。
- Persona 演化需要 evidence aggregation、versioning 与 promotion gate，但这些机制都可以在模块化单体内实现，不要求复杂事件溯源基础设施。
- Atlas 可以展示 Persona version 的重要变化及其证据，而不必展示所有内部 Memory。

## Rejected alternatives

- 每次重新抓知乎数据就整份覆盖 Persona：会破坏长期身份连续性。
- Journey / Encounter 结束后直接让模型改 traits 或 interests：一次生成即可造成不可解释漂移。
- 把近期心境永久累加进 Root Persona：短期噪声会逐渐固化成错误身份。
- 把自由文本 `memory_note` 直接当长期数据库真相：缺少稳定来源、结构和写入护栏。
- 证据一消失就立即反向回滚：会造成人格在相邻事件之间来回横跳。
