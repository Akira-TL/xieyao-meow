# ADR-0004：真实用户 Persona 采用共享异步 Encounter，并分离猫关系与真人连接

- Status: Accepted
- Date: 2026-09-14

## Context

现有社交 PoC 主要面向“当前用户 Persona × 预置 Resident”，对话历史与 Persona memory 由客户端提交，关系模型只有单一 `affinity` 分数。这个形状无法直接承载两只真实用户 Persona：同一次相遇若可被双方各自重新生成，会产生不一致历史；单一 affinity 也无法表达“越吵越熟”；把猫之间自动演化的关系直接等同真人关系，则会把 Agent autonomy 错误扩张到真人社交授权。

产品已经确定社交优先是异步的：两只 Persona 围绕真实知乎公开问题短聊 2–4 轮，用户不需要同时在线；真人连接必须双向 opt-in；长期 Game State 与 Relationship/Encounter 由服务端持久化。

## Decision

1. 两个真实用户 Persona 的一次相遇建模为一个服务端权威的 **Shared Encounter**。服务端只生成一次并持久化同一组 `participants + topicRef + evidence/provenance + turns + summary + createdAt`，双方读取的是同一事件的各自视角。刷新、换设备、晚些时候打开都不能重抽这段对话。
2. Encounter 对话保持有限事件：正常 2–4 轮，围绕一个已经选定的真实知乎问题自然收束；Knowledge Layer 提供共同事实基础，两个 Persona Layer 分别负责表达。生成失败允许降级，但不得生成两份互相矛盾的“同一次相遇”。
3. 真人用户默认只看到对方的 **Persona Capsule**：猫名/视觉身份、Persona 标签、抽象兴趣与表达特征、为什么这次会遇见、共同的公开知乎问题及本次 Encounter。默认不暴露对方完整收藏、关注、创作明细或其他 OAuth 原始画像。
4. **PersonaRelationship** 与 **HumanConnection** 是两个不同的领域对象。前者描述两只猫的自动长期关系；后者描述两个真人是否愿意进一步连接。PersonaRelationship 的变化绝不能自动创建 HumanConnection。
5. PersonaRelationship 不再使用单一 affinity 作为唯一真相，而至少分为两轴：`familiarity` 表示共同经历的深度，随有效 Encounter 积累；`chemistry` 表示持续同频或分歧倾向，可正可负。用户看到的关系称号是这两轴和关系历史的投影，而不是独立可编辑状态。
6. Persona 关系称号避免使用暗示真人连接已经成立的“互关搭子”。P0 可投影为 `初见 / 同频猫友 / 熟悉的杠精 / 灵魂猫友 / 对线冤家` 等；具体阈值属于可调产品规则，不进入领域合同。
7. 用户不能直接把 PersonaRelationship 的分数加减或手动指定关系等级。用户可以“暂不再遇见”、降低未来匹配概率、对 Encounter 给轻量反馈，或表达自己的 HumanConnection intent；这些动作影响未来调度或真人连接，不篡改已经发生的共享历史。
8. HumanConnection 采用双方分别持久化的显式 opt-in。只有双方都表达继续连接意愿，才进入 mutual connected 状态；单方意愿不能向另一方伪装成已经建立真人关系。
9. 同一 Journey 内，同一 Persona pair 最多产生一次 Shared Encounter；上一场未完成时不得创建第二场。任一用户设为“暂不再遇见”后停止自动重遇。
10. 重遇采用硬约束 + 软冷却：刚相遇过的 pair 显著降权，随着时间、共同新话题和双方新经历逐步恢复；已形成 PersonaRelationship 的 pair 可以再次自然出现，但不能霸占所有 Journey。P0 内部可用约 24 小时最低自动重遇窗口作为调度参数，但 UI 不展示精确 cooldown，且该参数不是领域语义。
11. Shared Encounter、PersonaRelationship、双方各自 HumanConnection intent 均为服务端 Game State。API 必须从 Session 推导当前 `user_id`，并只允许参与者读取共享 Encounter、只允许本人写自己的 connection intent / suppression preference。

## Consequences

- 两个真人看到的是同一段可追溯的“猫先认识了”的历史，异步打开不会产生分叉剧情。
- 可以表达“很熟但很爱抬杠”，而不是把所有关系压成单一好感度。
- 猫的自主社交与真人隐私/授权边界被明确分开，避免自动加好友或过度泄露 OAuth 数据。
- Shared Encounter、PersonaRelationship、HumanConnection Intent 都需要从当前客户端/内存 PoC 迁移为服务端持久对象；现有 `SocialCommunity` 的单一 affinity 和客户端提交 history/memory 只能继续作为 PoC，不能作为正式真实用户模型。
- 匹配调度需要 pair suppression/cooldown 与多样性权重，但无需给用户精确计时器。

## Rejected alternatives

- 双方各自打开时重新生成同一次对话：会产生两套事实与关系历史。
- 用单一 affinity 同时表示熟悉程度和关系倾向：无法表达“熟悉的杠精”等长期关系。
- 猫关系自动升级为真人连接：越过用户明确同意边界。
- 默认向匹配对象展示完整收藏/关注/创作明细：超出 Persona 社交所需的最小披露范围。
- 让用户手动刷关系等级：削弱“猫自己生活、自己交朋友”的核心 agency。
