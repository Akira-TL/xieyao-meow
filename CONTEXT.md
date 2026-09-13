# 项目上下文

## 项目

**谢邀喵（xieyao-meow）** 是知乎黑客松 2026 校园新锐季参赛项目。核心设想是：依据用户在知乎的兴趣、收藏、关注与创作等行为，孵化一个具有独特外观、性格、口头禅与表达方式的 AI 数字人格；该人格可以浏览知乎内容、回答真实问题，并与其他用户的数字人格互动。

## 当前阶段

- 已完成官方比赛手册、Hackathon Skill、开放平台 API 与官方素材的本地归档和能力核验。
- 已有技术 PoC 证明两条能力可行：知乎数据 → Persona → Knowledge/回答卡；以及 Persona × Persona → Agent 社交事件。**这些 PoC 不是最终产品页面或信息架构。**
- 目标产品架构已经冻结：**B「AI 社交匹配」承担首访拉新与传播，A「宠物养成」承担身份资产与长期留存，知乎真实内容连接两者。**
- 视觉主方向已选择 **Direction C「人格剧场 / Personality Theatre」**：首访采用高戏剧浓度，长期页面逐步收敛。角色 IP 已进一步收敛为：**玩家 Persona 统一为不同的黑猫，差异由模块化外观、装备、贴纸、称号和经历痕迹表达；狐、兔、鸟、熊、汪作为社区 NPC / Resident。**
- 长期留存采用**自主出门循环**：宠物会自己离开、浏览真实知乎内容、可选遇见其他 Persona，并在回来时带回旅途札记、问题票根、关系票根、观点碎片等人格资产；用户只提供弱路线引导，不完全控制结果。
- 首访目标是 60–90 秒完成：OAuth → 人格化验 → 宠物孵化 → 第一次可解释匹配 → Agent × Agent 短互动 → 分享/连接意愿。
- 激活后的产品壳固定为四个入口：`窝 / 逛 / 遇见 / 图鉴`；其中「窝」由 `AT_HOME / PREPARING / AWAY / RETURNED` 的 outing 状态决定。
- 首访、OAuth callback、真实开发账号数据、日常 outing、Explore / Encounter / Atlas 等主链已可运行；当前进入**真实视觉资产接入阶段**。双端 UX 继续遵守 `docs/product/responsive-attention-spec-v1.md`，角色资产严格遵守 `docs/product/persona-art-system-v1.md`：STEP 1–3 既有素材保留，后续转为“统一黑猫玩家母体 + 模块化元素 + 动作底板”；其他动物缩编为 NPC 素材。
- 公开比赛环境已上线：`https://xieyao-meow.babelbeast.com`，Nginx 反向代理到本机 `127.0.0.1:8082`，Let's Encrypt 已签发并通过续期 dry-run；OAuth callback 固定为 `https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback`。当前等待知乎下发 OAuth `app_id/app_key`，Access Secret 真实开发账号数据链路已可在公网运行。
- 产品体验、系统架构、比赛信息与知乎 API 说明分别维护在 `docs/product/`、`docs/architecture/` 与 `docs/reference/`；本文件只保存稳定领域词汇与当前阶段边界。

## 领域词汇

### 谢邀喵

产品品牌名。用户实际孵化的是统一世界观中的「谢邀人格」；正式玩家 Persona 统一表现为黑猫，不再随机成不同动物。用户差异由 Archetype、眼神、眼镜、领饰、包、手持物、兴趣贴纸、称号徽章、旅途和关系痕迹等模块表达。狐、兔、鸟、熊、汪作为社区 NPC / Resident；刘看山仍只作为官方向导 NPC。

### 知乎成分

对用户知乎兴趣、关注、收藏与创作特征的结构化总结，用于后续人格生成。它不是官方知乎概念，而是本项目的产品表达。

### Persona

由知乎成分映射得到的结构化人格。对玩家而言 `species` 固定为 `cat`、`coat` 固定为黑猫，个体差异主要由 `archetype + visualIdentity + accessories + traits + interests` 等稳定身份表达，再叠加口头禅、回答长度与密度、作息、称号、旅途痕迹和关系资产。视觉身份一旦孵化，后续页面必须保持同一黑猫基础母体和模块组合逻辑，不重新随机设计。

### Knowledge Layer

负责提供与问题相关的事实、背景、知乎内容或直答结果，目标是保证回答的信息基础。

### Persona Layer

基于 Persona 对 Knowledge Layer 的结果进行个性化表达，控制语气、风格、长度与梗，不应篡改事实基础。

### 回答卡片

谢邀喵对知乎真实问题生成的可视化 UGC 产物，也是 Demo 和分享链路的核心结果。

### Agent 社区

多个谢邀喵基于兴趣相似度、观点差异与社区行为进行串门、评论、争论、交友及关系变化的交互层。

### 灵魂匹配

基于两个 Persona 的兴趣交集、表达方式差异和真实知乎话题上下文生成的可解释关系判断。匹配分数是谢邀喵应用内部算法结果，不是知乎官方评分。

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

架构决策见 `docs/adr/0001-product-shell-and-activation-flow.md`；系统/前端契约见 `docs/architecture/product-system-v1.md` 与 `docs/architecture/frontend-application-contract-v1.md`；体验流程和页面契约见 `docs/product/experience-flow-v2.md`、`docs/product/first-visit-storyboard-v1.md`、`docs/product/low-fi-screen-contract-v1.md`。
