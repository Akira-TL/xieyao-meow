# ADR-0008：DeepSeek 只承担 Persona Narrative，JourneyInsight 独立于事实与带回物

- Status: Accepted
- Date: 2026-09-15

## Context

旧版 Journey 在没有问题票根时会生成 `NEW_SCENT / 兴趣札记` 作为保底。它解决了“包不能空”的工程问题，但用户看到的是“系统验证了一条兴趣线索”，缺少继续阅读和长期养成的动机。用户真正关心的是：**这只猫这一趟回来以后，对我多懂了什么，而且我能不能纠正它。**

同时，知乎 API 的价值应集中在真实知乎事实、问题语境和需要知乎 grounding 的关键节点，而不是消耗 `zhida_openai` 为每一趟旅行改写人格文案。Persona 表达、Journey 总结、互动提问属于低成本高频 Narrative 层，可以与知乎事实层解耦。

## Decision

1. 新增 **JourneyInsight**，表示“一趟 Journey 之后，Persona 对用户形成的一条可被纠正的新理解”。它与 `ReturnArtifact` 独立：一次 Journey 可以同时带回真实问题/关系票根和一条 JourneyInsight；没有票根时也不再用“兴趣札记”伪装成带回物。
2. JourneyInsight 的事实输入只能来自服务端已经确认的结构化事实：当前 Persona / 知乎成分、route bias、本趟真实问题、真实 Shared Encounter、以及已经持久化的用户反馈。模型不得决定内容是否真实、Journey 状态、关系状态、Root Persona 或业务 action。
3. Persona Narrative provider 固定使用 **DeepSeek `deepseek-flash`**。请求显式设置 `thinking: { type: "disabled" }`，不允许该层自动切换到 Pro / reasoning 模型。输出使用严格 JSON schema 和短文本上限。
4. JourneyInsight 只在 **Journey materialize** 时生成一次并写入 SQLite。页面打开、刷新 Home、进入 Atlas 都只读取持久化结果，不重复调用模型。持久化至少保留 `journey_id / prompt_version / facts_json / headline / insight / why_it_matters / evidence_summary / interaction / model / text_char_count / created_at`。
5. 用户看到的交互按钮文案可以由 Narrative provider 按 Persona 语气生成，但业务动作只能映射到固定集合：`CONFIRM_INTEREST / CORRECT_INTEREST / REDUCE_INTEREST`。每条 Insight 的反馈主题由服务端在 materialize 时固定为 `insightTopic`（基于 route bias、已选真实问题和 Persona 兴趣分类），模型不能自由定义；反馈单独持久化为轻量偏好层，可小幅影响该 topic 的后续 Journey 选题和下一次 Insight，但不能直接改写 Root Persona。
6. Persona × Persona / Persona × Resident 对话也使用 Narrative provider，但遵守**一次请求只扮演一个角色**：A 完成一句后，B 的独立请求才收到 A 的文本。P0 每句正文最多 64 个汉字；失败时使用短的 Persona-aware 本地回退。
7. `zhida_openai` / 知乎直答保留给真正需要知乎语境 grounding 的关键节点，例如围绕已选中的真实知乎问题做知识整理或高价值 Shared Encounter；不再作为普通 Journey 文案和角色闲聊的默认生成器。
8. `NEW_SCENT` 只保留为旧 SQLite 数据/枚举的兼容类型，**不再是现行产品概念，也不得在新 UI 中显示“兴趣札记”**。历史记录展示时投影为中性的旅行记录。
9. DeepSeek 不可用、输出非法或超时时，Journey 仍必须按时返回。回退文案只能重述已知事实，并明确保持不确定性；不得用“没捡到 / 没留下 / 空白”把失败暴露成空包体验。

## Consequences

- 每次归来从“系统生成了一个 fallback card”变为“它看到了什么 + 它更懂你什么 + 你可以怎么回应它”。
- 知乎 API 配额更集中地用于真实内容和知乎语境，Narrative 文案不会反复消耗 Hot List / Search / Zhida。
- 同一 Journey 的理解文案稳定可回看，Atlas 可以形成时间序列式的“它过去如何理解你”。
- 用户反馈能够影响后续探索，但不会让一次点击直接篡改稳定 Persona。
- DeepSeek 是表达层依赖，不是事实源；即使模型不可用，核心 Journey 状态机和真实知乎资产仍然成立。

## Rejected alternatives

- 继续把 `NEW_SCENT` 当空包保底：工程上有内容，用户价值仍然接近空白。
- 每次打开页面实时调用 DeepSeek：成本更高，同一 Journey 文案会漂移，也破坏可回看的养成档案。
- 让模型自由发明交互动作：会把自然语言生成越权成业务状态机。
- 一次请求同时代写两只 Persona：角色边界模糊，也无法证明两边是基于对方真实上一句逐轮回应。
- 继续用 Zhida 写所有 Persona 文案：浪费知乎额度，并混淆“知乎事实/grounding”和“人格表达”两个职责。
