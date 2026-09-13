# 「谢邀喵」产品系统架构 v1

> 2026-09-12。目标：在继续 UI 和业务开发前，冻结产品壳、核心状态机、服务边界与知乎能力映射。
>
> 本文描述目标产品架构。仓库中已经存在的 L0/L1 PoC 仅用于证明接口和核心算法可行，不反向约束本文。

## 1. 架构目标

谢邀喵不是“AI 回答器 + 宠物皮肤”，而是一个由知乎 Context 驱动的数字人格产品：

- **B「AI 社交匹配」承担首访即时价值、传播和人与人连接；**
- **A「宠物养成」承担身份资产、持续事件和留存；**
- **知乎真实内容承担每天让宠物“有事发生”的世界输入。**

第一版只需要证明三件事：

1. 用户愿意为了“我在知乎养出了什么”完成授权；
2. 孵化结果有足够强的“这就是我”感；
3. Agent 先替两个人相遇，比普通兴趣匹配更有趣、更愿意继续连接。

## 2. 产品运行拓扑

```text
知乎站内项目广场 / 分享卡
          │
          │ Demo URL
          ▼
┌──────────────────────────────┐
│       谢邀喵 Web App         │
│                              │
│  Landing / Hatch / Home      │
│  Park / Encounter / Atlas    │
└─────────────┬────────────────┘
              │ HTTPS
              ▼
┌──────────────────────────────┐
│       谢邀喵 Server          │
│                              │
│ Auth / Persona / Match       │
│ Explore / Growth / Event     │
│ Share / Cache                │
└──────┬────────┬──────────────┘
       │        │
       │        └──────────────→ App DB / Cache
       │
       ├────────→ developer.zhihu.com
       │          搜索 / 热榜 / 用户数据 / 直答
       │
       └────────→ openapi.zhihu.com
                  OAuth authorize / access_token
```

### 浏览器永远不直接持有

- `ZHIHU_ACCESS_SECRET`；
- OAuth `app_key`；
- OAuth access token。

浏览器只持有谢邀喵自己的会话身份。

## 3. 产品状态机

不要把页面理解成一组独立功能。用户必须处在明确状态中：

```text
VISITOR
  │ 点击“看看我养出了什么”
  ▼
PRE_AUTH
  │ 了解权限并授权
  ▼
OAUTH_PENDING
  │ callback 成功
  ▼
PROFILE_SCANNING
  │ 用户数据 → 知乎成分
  ▼
HATCH_READY
  │ Persona 已生成
  ▼
HATCH_REVEAL
  │ 用户看见第一只宠物
  ▼
FIRST_OUTING
  │ 第一次自动匹配
  ▼
FIRST_ENCOUNTER
  │ Agent × Agent 首次互动
  ▼
ACTIVATED
  │ 分享/保存后进入长期产品
  ▼
DAILY_HOME
```

异常状态必须是显式状态，不靠空白页：

```text
OAUTH_PENDING_APPROVAL
PROFILE_TOO_SPARSE
ZHIHU_API_DEGRADED
NO_MATCH_YET
DEMO_FALLBACK
```

## 4. 页面/信息架构

### 4.1 未登录区

```text
/
├─ Landing                  第一眼 Hook
├─ /explore                 先逛别人养出了什么（无需登录）
└─ /privacy                 授权说明 / 数据边界
```

Landing 只负责拉起好奇心，不放产品 Dashboard。

### 4.2 首访激活链路

```text
/hatch/consent              授权前说明
/hatch/scanning             人格化验过程
/hatch/reveal               宠物孵化 Reveal
/encounter/first            第一次灵魂匹配 + Agent 互动
/share/:cardId              首次结果卡
```

这一段必须能连续演示，不能被四大导航打断。

### 4.3 激活后的主产品壳

主导航固定为四个：

```text
/home        「窝」
/explore     「逛」
/encounter   「遇见」
/atlas       「图鉴」
```

#### 窝 Home

回答：“它今天发生了什么？”

只突出一个每日主事件；成长数值退到次级信息。

#### 逛 Explore

回答：“它今天为什么把这条内容叼回来了？”

不是复制知乎 Feed，而是人格化内容探索。

#### 遇见 Encounter

回答：“它今天遇见了谁？为什么会同频/互怼？”

展示匹配证据、Agent 互动、关系变化和真人双向 opt-in。

#### 图鉴 Atlas

回答：“我的知乎人格这些天变成了什么？”

沉淀人格成分、称号、成长、关系和历史事件。

## 5. 核心领域对象

### UserIdentity

谢邀喵自己的用户身份。不要把知乎 OAuth token 当用户主键。

```text
userId
sessionId
zhihuAuthStatus
createdAt
lastSeenAt
```

### ZhihuContextSnapshot

某次孵化/刷新时，从知乎获取的公开 Context 快照。

```text
contents[]
followees[]
favlists[]
collections[]
sourceFetchedAt
sourceVersion
```

保留最小必要摘要，不长期保存无关原始数据。

### ZhihuComposition

“知乎成分”，可解释的结构化特征层。

```text
interestVector
expressionProfile
collectionProfile
socialScent
activityHints
explanations[]
```

`explanations[]` 是关键：每个对用户展示的结论必须能回答“为什么”。

### Persona

孵化后的数字人格。

```text
personaId
species
archetype
traits[]
catchphrase
title
interestVector
expressionProfile
visualSeed
visualIdentity
version
```

玩家 Persona 的 `species` 当前固定为 `cat`，正式视觉统一为黑猫；用户差异由 `archetype + visualIdentity` 表达。`species` 字段继续保留，主要用于社区 NPC / Resident（狐、兔、鸟、熊、汪等）的统一建模。

`visualIdentity` 至少可承载：

```text
eyeVariant
earDetail
eyewear
neckwear
bagKit
signatureProp
interestStickers[]
earnedBadges[]
journeyTraces[]
relationshipMarks[]
```

Persona 不是每次打开都重新随机生成；用户的身份资产必须稳定、可演化。

### PetGrowth

只保留三条与知乎行为有关的成长轴：

```text
knowledgeXp   见识
expressionXp  表达
socialXp      社交
```

成长值只用于解锁行为/区域/称号，不做无意义签到经济。

### ContentEncounter

宠物与一条知乎内容发生的事件：

```text
contentRef
reasonWhyPicked
knowledgeContext
personaReaction
createdAt
```

现有“回答卡片”属于该对象的一种展示结果，不再承担整个产品主入口。

### SocialMatch

```text
matchId
personaA
personaB
similarities[]
contrasts[]
score
relationPrediction
explanations[]
```

### AgentEncounter

两只宠物真正发生的一次互动：

```text
matchId
topicRef
turns[]
relationDelta
summary
createdAt
```

### Relationship

长期关系，而不是一次匹配结果：

```text
personaA
personaB
affinity
status
encounterCount
lastEncounterAt
```

### Outing

宠物一次有限的自主出门。它不是无限自治 Agent，而是受预算约束的事件图。

```text
outingId
personaId
state              AT_HOME / PREPARING / AWAY / RETURNED
routeBias           用户留下的弱引导，可为空
startedAt
returnedAt
contentEncounterId?
socialEncounterId?
returnArtifactId?
growthDelta?
```

一次 outing 最多产生 1 个内容发现、0–1 个社交 Encounter、1 个带回物和 0–1 个成长变化。

### ReturnArtifact

宠物回家时带回的长期资产，不使用随机金币/普通道具。

```text
artifactId
outingId
type                NOTE / QUESTION_TICKET / RELATION_TICKET / OPINION_FRAGMENT / NEW_SCENT
title
summary
sourceRef?
createdAt
```

### JourneyLog

`逛`与`图鉴`使用的长期旅途记录索引：

```text
personaId
outingId
artifactId?
visitedTopics[]
metPersonaIds[]
createdAt
```

### DailyEvent

首页“今天最值得看的事情”。在采用自主出门后，它更多是 Outing / Return / Relationship 的投影，而不是独立生成的推荐 Feed：

```text
type
priority
headline
payloadRef
occurredAt
seenAt
```

`type` 可为：出门、归来、内容发现、被串门、关系变化、称号解锁、公共热点事件。

## 6. 服务边界

第一版后端保持模块化单体，不拆微服务。

```text
AuthService
├─ OAuth start/callback
└─ App session

ZhihuGateway
├─ User Context
├─ Search / Hot
├─ Question / Knowledge
└─ Zhida

PersonaService
├─ Context normalization
├─ Composition extraction
├─ Explainability
└─ Persona hatch/evolve

MatchService
├─ Candidate retrieval
├─ Similarity
├─ Contrast
└─ Explainable ranking

EncounterService
├─ Shared-topic selection
├─ Agent × Agent exchange
└─ Relationship update

ExploreService
├─ Personalized content candidate pool
└─ “为什么叼回来” explanation

OutingService
├─ route bias normalization
├─ finite outing plan
├─ content / social event selection
├─ return artifact assembly
└─ outing state transition

GrowthService
├─ XP rules
├─ unlock rules
└─ title evolution

EventService
├─ Daily event generation
├─ event priority
└─ inbox/home feed

ShareService
└─ Persona / match / relationship share cards
```

## 7. 官方能力映射

| 产品动作 | 官方能力 | 是否首版硬依赖 |
|---|---|---:|
| 孵化人格 | OAuth + 用户创作/关注/收藏 | 是 |
| 公共事件池 | 热榜 | 是，但可缓存 |
| 兴趣内容搜索 | 知乎搜索 | 是 |
| 第一次 Agent 讨论 | 搜索/问题回答 + 直答 | 是 |
| 自主出门 / “叼回来” | 热榜 + 搜索 + 应用 Persona 池 | 是 |
| 外部事实补充 | 全网搜索 | 否 |
| 更真实关注流 | 关注流 | 合同确认后再接 |
| 宠物副本 | 知乎故事 | 否 |
| 知识玩法 | 知乎知识 | 否 |
| 新手引导视觉 | 刘看山素材 | 推荐 |

## 8. 首访数据流

```text
1. OAuth callback
       ↓
2. Fetch public Zhihu Context
       ↓
3. Normalize → ZhihuContextSnapshot
       ↓
4. Extract → ZhihuComposition
       ↓
5. Hatch → Persona
       ↓
6. Candidate personas from app DB
       ↓
7. Explainable Match ranking
       ↓
8. Select shared/divergent Zhihu topic
       ↓
9. Knowledge Layer
       ↓
10. Agent × Agent short encounter
       ↓
11. Relationship seed
       ↓
12. Share card + Activated state
```

### 并行化

为了让首访控制在 90 秒以内：

- 用户数据接口并行抓取；
- `ZhihuComposition` 能渐进展示就不要等全部完成；
- Persona 一旦有最低充分数据即可开始生成视觉/文案；
- 匹配候选可在 Reveal 展示时预计算；
- Knowledge Layer 在用户看匹配解释时预取。

## 9. 日常循环数据流

日常循环改为以 `Outing` 为中心，而不是每天现场生成一条推荐。

```text
宠物在家 AT_HOME
        ↓
用户可留一张短纸条（可选 route bias）
        ↓
OutingService 创建有限 outing
        ↓
AWAY
        ↓
公共内容候选（热榜缓存）
        +
人格兴趣检索（知乎搜索缓存）
        +
Persona / Relationship 候选
        ↓
选择 1 个 ContentEncounter
        +
可选 0–1 个 AgentEncounter
        ↓
生成 1 个 ReturnArtifact
        ↓
RETURNED
        ↓
EventService 将“它回来了”置为 Home 主事件
        ↓
用户查看旅途札记 / 票根 / 关系变化
        ↓
Growth 更新（最多一项主要变化）
        ↓
JourneyLog / Atlas 沉淀
        ↓
回到 AT_HOME，等待下一次出门
```

留存依赖的是“我不在的时候它自己出去经历了什么”和“它什么时候回来”，而不是签到或精准倒计时。

## 10. 数据存储分层

### 必须持久化

- App user identity；
- Persona + version；
- ZhihuComposition 的结构化结果与解释；
- Growth；
- Match / Relationship / Encounter；
- Outing 状态与历史；
- ReturnArtifact / JourneyLog；
- DailyEvent；
- ShareCard 元数据。

### 短期缓存

- 热榜；
- 搜索结果；
- 问题回答摘要；
- 直答 Knowledge 结果；
- quota；
- OAuth access token（比赛版可短期 server-side session，生产化再评审）。

### 不应持久化

- Access Secret；
- OAuth app_key；
- 不必要的完整知乎原始数据；
- 私信、手机号、邮箱等本项目不申请的数据。

## 11. 缓存策略

知乎 API 有有限额度，因此缓存不是优化，而是架构要求。

```text
hot:list                 5–15 min
search:<query>           30–120 min
question:<url>           30–120 min
knowledge:<topic>        1–24 h
profile:<user>:snapshot  用户主动刷新或 TTL
```

同一 key 并发必须合并，避免现场多人同时访问重复烧额度。

## 12. 降级策略

### OAuth 尚不可用

游客仍可进入 `/explore` 看预置公共人格与真实公开内容；不能伪装成“这是你的知乎人格”。

### 用户数据过少

进入 `PROFILE_TOO_SPARSE`：

- 告诉用户知乎公开数据不足；
- 允许用少量显式兴趣选择补齐；
- 所有补齐项标记为“你自己告诉我们的”，不伪装成知乎推断。

### 热榜/搜索失败

使用带时间戳的公开缓存，并在产品层标记“缓存事件”。

### 直答失败

Agent 互动退化到已有知乎摘要/观点对比；不凭空编事实。

### 暂无匹配对象

不是错误页。让宠物先去“公园”遇见预置 resident persona，明确标记为演示居民。

## 13. 第一版路由优先级

### P0：首访必须有

```text
/
/hatch/consent
/hatch/scanning
/hatch/reveal
/encounter/first
/home
/share/:id
```

### P1：形成完整产品壳

```text
/explore
/encounter
/atlas
```

### P2：后续留存强化

```text
/relationship/:id
/content/:id
/atlas/history
```

## 14. 第一版不进入架构的能力

- 复杂货币/商城；
- 喂食、洗澡等传统电子宠物系统；
- 用户自由创建无限聊天室；
- 自动向知乎发布；
- 自动私信真人；
- 复杂 3D 宠物生成；
- 真实宠物图片情绪识别（保留为后续彩蛋，不是核心架构）。

## 15. 架构验收标准

在画 UI 前，这套架构至少必须能回答：

1. 用户第一眼为什么点？
2. OAuth 为什么值得授权？
3. 等待 API 的时间用户看到什么？
4. 孵化后为什么立即继续？
5. 第一次匹配如何证明不是随机？
6. Agent 为什么比普通匹配更有价值？
7. 第二天回来首页看到什么？
8. 每一条用户可见结论能否解释来源？
9. 知乎 API 失败时页面怎么活着？
10. 哪些数据永久保存，哪些不能保存？

只有这些都能回答，才开始冻结具体视觉稿和前端实现。
