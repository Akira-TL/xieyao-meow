# 项目上下文

## 项目

**谢邀喵（xieyao-meow）** 是知乎黑客松 2026 校园新锐季参赛项目。核心设想是：依据用户在知乎的兴趣、收藏、关注与创作等行为，孵化一个具有独特外观、性格、口头禅与表达方式的 AI 数字人格；该人格可以浏览知乎内容、回答真实问题，并与其他用户的数字人格互动。

## 当前阶段

- 已完成官方比赛手册、Hackathon Skill、开放平台 API 与官方素材的本地归档和能力核验。
- 已有技术 PoC 证明两条能力可行：知乎数据 → Persona → Knowledge/回答卡；以及 Persona × Persona → Agent 社交事件。**这些 PoC 不是最终产品页面或信息架构。**
- 目标产品架构已经冻结：**B「AI 社交匹配」承担首访拉新与传播，A「宠物养成」承担身份资产与长期留存，知乎真实内容连接两者。**
- 视觉主方向已选择 **Direction C「人格剧场 / Personality Theatre」**：首访采用高戏剧浓度，长期页面逐步收敛。角色 IP 已进一步收敛为：**玩家 Persona 统一为不同的黑猫，差异由模块化外观、装备、贴纸、称号和经历痕迹表达；狐、兔、鸟、熊、汪作为社区 NPC / Resident。**
- 长期留存采用**自主出门循环**：宠物会自己离开、浏览真实知乎内容、可选遇见其他 Persona，并在回来时带回问题票根、关系票根、观点碎片等可追溯资产，同时形成一条可被用户纠正的 `JourneyInsight`（“它对你的一个新发现”）；用户只提供弱路线引导，不完全控制结果。
- 首访目标是 60–90 秒完成：OAuth → 人格化验 → 宠物孵化 → 第一次可解释匹配 → Agent × Agent 短互动 → 分享/连接意愿。
- 激活后的产品壳固定为四个入口：`窝 / 逛 / 遇见 / 图鉴`；其中「窝」由 `AT_HOME / PREPARING / AWAY / RETURNED` 的 outing 状态决定。
- 首访、OAuth callback、真实开发账号数据、日常 outing、Explore / Encounter / Atlas 等主链已可运行；当前进入**真实视觉资产接入阶段**。双端 UX 继续遵守 `docs/product/responsive-attention-spec-v1.md`，角色资产严格遵守 `docs/product/persona-art-system-v1.md`：STEP 1–3 既有素材保留，后续转为“统一黑猫玩家母体 + 模块化元素 + 动作底板”；其他动物缩编为 NPC 素材。
- 公开比赛环境已上线：`https://xieyao-meow.babelbeast.com`，Nginx 反向代理到本机 `127.0.0.1:8082`，Let's Encrypt 已签发并通过续期 dry-run；OAuth callback 固定为 `https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback`。知乎 OAuth 已配置并完成 production authenticated flow，真实开发账号数据链路可在公网运行。
- 产品体验、系统架构、比赛信息与知乎 API 说明分别维护在 `docs/product/`、`docs/architecture/` 与 `docs/reference/`；本文件只保存稳定领域词汇与当前阶段边界。

## 领域词汇

### 谢邀喵

产品品牌名。用户实际孵化的是统一世界观中的「谢邀人格」；正式玩家 Persona 统一表现为黑猫，不再随机成不同动物。用户差异由 Archetype、眼神、眼镜、领饰、包、手持物、兴趣贴纸、称号徽章、旅途和关系痕迹等模块表达。狐、兔、鸟、熊、汪作为社区 NPC / Resident；刘看山仍只作为官方向导 NPC。

### 知乎成分

对用户知乎兴趣、关注、收藏与创作特征的结构化总结，用于后续人格生成。它不是官方知乎概念，而是本项目的产品表达。

### Persona

用户当前可见的数字人格整体，由稳定 Root Persona、短期 Persona Mood、可追溯 Persona Memory 与关系/旅途痕迹共同投影。对玩家而言黑猫身份与视觉母体保持稳定，经历只能在受控证据门槛下让长期人格缓慢演化。

### Root Persona

Persona 的版本化稳定身份层，承载 archetype、核心 traits、长期兴趣结构、answer style 与 visual identity 等慢变量。一次 Journey、Shared Encounter 或模型生成不能直接改写 Root Persona；长期变化必须由多次独立证据晋升为新 version。

### Persona Mood

由近期 Journey、Shared Encounter 与归来事件投影出的短生命周期心境，会随时间和新经历衰减或替换。它只影响近期表达、探索权重和表现，不直接成为 Root Persona。

### Persona Memory

由真实 Journey、Shared Encounter、关系里程碑等服务端事件产生的结构化经历记忆，每条都能追溯来源。模型输出只能提出 Memory Candidate，不能把自由文本直接写成长期人格真相。

### User

谢邀喵内部的长期用户主体。`User` 由应用生成的稳定 `user_id` 标识，是猫资料、Persona、旅行、收藏和关系等长期资产的唯一 owner；它不等同于一次 OAuth Session。

### OAuth Identity

外部知乎账号与内部 `User` 的稳定映射。正式绑定只能使用知乎官方确认稳定的 provider subject；`sessionId`、`access_token`、`authorization_code` 等临时凭据都不能充当用户身份。

### Session

一次登录会话，只负责证明当前请求对应哪个 `User`，不承担长期身份语义。Session 可以轮换、过期或删除，而长期游戏资产仍归属于稳定 `user_id`。

### Anonymous Profile

授权前的临时猫资料，只保存猫名与外观偏好，不属于长期用户资产。绑定正式 `User` 时最多迁移一次，若正式资料已存在则不得覆盖。

### Game State

稳定 `User` 的服务端长期运行状态总称，覆盖激活进度、当前 Journey/Outing、Persona 演化与记忆、收藏资产、Shared Encounter / PersonaRelationship / HumanConnection 及 Daily Event 等会影响后续体验的事实。浏览器只能缓存短生命周期 view-model、交互状态和 optimistic projection，不能成为 Game State 的唯一真相。

### Journey

一趟由谢邀喵自主完成的有限旅途，是长期循环的服务端持久化事件单元；现有 ADR/PoC 中的 `Outing` 指同一领域概念。用户最多提供弱路线倾向，最终内容、相遇与产物由 Persona、近期记忆、旅途历史和当时的知乎候选共同决定；主生命周期保持 `AT_HOME / PREPARING / AWAY / RETURNED`。

### 行囊准备

一次 Journey 出门前的弱影响准备层，固定由 1 个可反复使用的主道具、1 个单趟消耗的小物和 1 张一次性短纸条组成。它们只改变探索方式或旅途事件的概率倾向，不能指定具体知乎问题、Persona、目的地或产物；空包旅行始终合法。

### 主道具

行囊中的长期旅行工具，解锁后可反复装备，只影响“怎么逛”的探索倾向，例如深挖、找反方、跨领域、追证据或更偏向带图内容，不作为消耗品。

### 小物

行囊中的单趟消耗型补给或护符，只影响旅途中发生明信片、相遇、远行或额外纪念物等事件的概率；只有猫真正从 `PREPARING` 进入 `AWAY` 时才消耗。

### Knowledge Layer

围绕已经选中的真实知乎问题建立可追溯的信息基础：知乎问题/回答摘要是证据锚点，知乎直答可以在这些证据与不确定性边界内做语义整理，但不是内容是否真实存在的证明，也不代表知乎官方观点。

### Persona Layer

基于 Persona 对既定 Knowledge Layer 进行个性化表达，控制语气、关注点、风格、长度与梗；它不负责候选内容 eligibility，也不得新增或篡改事实基础。

### Persona Narrative Layer

高频、低成本的理解与表达层。当前 provider 固定为 DeepSeek `deepseek-flash` 且显式关闭 thinking。它只接受结构化事实，为 JourneyInsight、Journey 总结、Persona 互动提问和逐角色对话生成短文本；不能决定知乎事实、Journey/关系状态、Root Persona 或业务 action。知乎直答继续负责需要知乎语境 grounding 的关键节点，不承担普通人格包装。

### JourneyInsight

一次 Journey materialize 时生成并持久化的一条“它对你的新理解”。它与问题票根/关系票根等 ReturnArtifact 独立，包含理解结论、意义、证据摘要、互动问题和固定 action 对应的显示文案；刷新页面不会重新生成。用户反馈只进入轻量偏好层并影响后续探索权重，不能由一次反馈直接改写 Root Persona。旧 `NEW_SCENT` 只作为历史数据兼容类型，不再是用户可见产品概念。

### 回答卡片

谢邀喵对知乎真实问题生成的可视化 UGC 产物，也是 Demo 和分享链路的核心结果。

### Agent 社区

多个谢邀喵基于兴趣相似度、观点差异与社区行为进行串门、评论、争论、交友及关系变化的交互层。

### 灵魂匹配

基于两个 Persona 的兴趣交集、表达方式差异和真实知乎话题上下文生成的可解释关系判断。匹配分数是谢邀喵应用内部算法结果，不是知乎官方评分。

### Shared Encounter

两只真实用户 Persona 围绕同一真实知乎问题发生的一次服务端共享异步相遇。它只生成一次并成为双方共同历史；双方可以在不同时间查看各自视角，但不能各自重抽同一次相遇。

### Persona Capsule

真实用户 Persona 在相遇场景中对另一方默认公开的最小人格名片，只包含猫的身份表现、抽象兴趣/表达特征、匹配原因与本次公共话题，不直接暴露完整收藏、关注或创作明细。

### PersonaRelationship

两只 Persona 的长期关系，由 Shared Encounter 自动演化；核心维度是共同经历的 `familiarity` 与同频/分歧倾向 `chemistry`。它属于猫的世界状态，不等同于两个真人已经建立连接。

### HumanConnection

两个真实用户是否愿意进一步建立连接的独立状态，双方意愿分别保存，只有 mutual opt-in 才成立。PersonaRelationship 的自动变化不能替用户创建 HumanConnection。

### 首次遇见

宠物孵化后立即发生的一次 Agent × Agent 短互动，用于证明“数字分身先替人认识”的产品价值；不要求先完成长期养成。

### 我的窝

激活后的默认首页。不是 Dashboard，而是展示宠物当前状态和“今天最值得看的一个事件”。

### Daily Event

由内容发现、被串门、关系变化、称号解锁或公共热点等产生的日常事件，是宠物养成和回访的主要驱动力。

## 范围原则

- 激活主线：授权 → 知乎成分 → Persona → 第一次灵魂匹配 → Agent × Agent → 分享/连接意愿。
- 长期主线：`窝 / 逛 / 遇见 / 图鉴`，成长只保留见识、表达、社交三条与知乎行为相关的轴。
- 回答卡片仍保留，但属于内容探索/表达的一种产物，不再是整个产品的主入口。
- 真实宠物图片情绪识别、复杂虚拟经济、传统喂食洗澡等不进入第一版核心架构。

架构决策见 `docs/adr/0001-product-shell-and-activation-flow.md`；JourneyInsight / DeepSeek Narrative 分工见 `docs/adr/0008-deepseek-persona-narrative-and-journey-insight.md`；系统/前端契约见 `docs/architecture/product-system-v1.md` 与 `docs/architecture/frontend-application-contract-v1.md`；体验流程和页面契约见 `docs/product/experience-flow-v2.md`、`docs/product/first-visit-storyboard-v1.md`、`docs/product/low-fi-screen-contract-v1.md`。
