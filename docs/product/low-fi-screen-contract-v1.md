# 「谢邀喵」低保真页面契约 v1

> 2026-09-12。本文不是视觉稿，而是前端实现前的页面契约：每个页面解决什么问题、由哪些区块组成、有哪些状态、CTA 去哪里、需要什么 ViewModel。
>
> 原则：页面只消费谢邀喵自己的 ViewModel，不直接理解知乎 API 返回结构。

## 1. 体验壳分三层

### Public Shell｜公开入口

适用：`/`、公开 `/explore`、`/share/:id`、`/privacy`。

特点：

- 无需登录也能完整打开；
- 不展示四大主导航；
- 目标是让用户理解“这是什么”并产生孵化欲望；
- 可以展示明确标记的公共 resident persona / 公开事件。

### Activation Shell｜首访激活

适用：`/hatch/*`、`/encounter/first`。

特点：

- 没有四大主导航；
- 顶部只保留 Logo、进度和必要退出；
- 强制连续体验，不把用户提前扔进 Dashboard；
- 当前状态由服务端 ActivationState 决定，不能靠 URL 猜。

### App Shell｜激活后产品

适用：`/home`、`/explore`、`/encounter`、`/atlas`。

主导航固定：

```text
窝    逛    遇见    图鉴
```

页面只突出一个主要任务，不把成长值、Feed、关系、知乎内容全部挤在首页。

---

# 2. Screen A｜Landing `/`

## 用户问题

> “为什么我现在就想点？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 谢邀喵                     先逛逛 │
│                                  │
│             [刘看山]             │
│          [会呼吸的人格蛋]         │
│                                  │
│  你在知乎这些年，其实已经偷偷     │
│  养出了一只东西。                 │
│                                  │
│  关注、收藏和创作决定它是什么，   │
│  也决定它最容易和谁一见如故。     │
│                                  │
│      [ 看看我养出了什么 ]         │
│       先逛逛别人养出的东西         │
│                                  │
│  ───── 一件真实公共事件 ─────     │
│  工具猫刚和哲学狐因为 AI 吵起来了 │
└──────────────────────────────────┘
```

## 组件

- `BrandMark`
- `KanshanGuide`
- `PersonaEgg`
- `ActivationHook`
- `PublicEventTeaser`

## ViewModel

```text
LandingVM
  publicEvent?: PublicEventSummary
  residentCount?: number  // 没有真实值就不显示
  oauthAvailability
```

## CTA

- 主 CTA `看看我养出了什么` → `/hatch/consent`
- 次 CTA `先逛逛` → `/explore?mode=public`

## 状态

- `ready`
- `public_event_unavailable`：隐藏事件，不阻塞页面
- `oauth_pending_approval`：主 CTA 仍可进入 Consent，在 Consent 解释等待状态

---

# 3. Screen B｜Consent `/hatch/consent`

## 用户问题

> “为什么值得把知乎公开数据给你？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ ←                         孵化 1/4│
│                                  │
│      孵化需要一点你的知乎成分      │
│                                  │
│  ✓ 公开创作   用来理解你的表达     │
│  ✓ 关注       用来理解兴趣方向     │
│  ✓ 公开收藏   用来理解长期偏好     │
│                                  │
│  不读取：私信 / 手机号 / 邮箱      │
│  不替你自动发布内容                │
│                                  │
│      [ 用知乎孵化我的分身 ]        │
│             权限说明               │
└──────────────────────────────────┘
```

## 组件

- `ActivationProgress`
- `PermissionPurposeList`
- `PrivacyBoundaryNote`
- `OAuthAvailabilityBanner`

## ViewModel

```text
ConsentVM
  oauthAvailability
  readableSources[]
  excludedSources[]
  approvalStatus?
```

## CTA

- OAuth 可用：`用知乎孵化我的分身` → OAuth authorize
- OAuth 尚未获批：按钮文案变为 `先逛公园` → 公开 `/explore`
- 返回 → Landing

## 规则

Consent 页不能承诺官方没有开放的数据；权限文案必须与实际 OAuth / 用户 API 能力一致。

---

# 4. Screen C｜Scanning `/hatch/scanning`

## 用户问题

> “它现在到底怎么理解我？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 谢邀喵                     孵化 2/4│
│                                  │
│           [人格蛋持续变化]        │
│                                  │
│  ● 公开创作                      │
│    发现：偏结构化长答             │
│                                  │
│  ● 关注                          │
│    发现：AI / 科学型创作者偏多    │
│                                  │
│  ◌ 公开收藏                      │
│    正在翻收藏夹……                 │
│                                  │
│  ───────────────                 │
│  正在拼出你的社交气味              │
└──────────────────────────────────┘
```

## 组件

- `ScanPetStage`
- `ScanSourceRow`
- `CompositionPreview`
- `PartialFailureNotice`

## ViewModel

```text
ScanningVM
  phase
  sources[]
    key: contents | followees | favlists | collections
    state: waiting | loading | complete | failed
    finding?: string
    confidence?: low | medium | high
  partialComposition?
  canReveal
```

## 交互

无主 CTA。完成最低充分数据后自动进入 `/hatch/reveal`。

用户可以展开某条“发现”的依据摘要，但不在这里展示完整知乎原始数据。

## 规则

- 不能用假的定时动画先显示不存在的结论；
- 可以用动画表示“正在读取”，只有实际完成后才出现 finding；
- 单一路失败不阻断全部流程；
- 数据过少进入 `PROFILE_TOO_SPARSE` 补充页/底部 Sheet，而不是造一个结论。

---

# 5. Screen D｜Reveal `/hatch/reveal`

## 用户问题

> “这真的是我吗？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 谢邀喵                     孵化 3/4│
│                                  │
│            [宠物本体]             │
│                                  │
│          英短 · 工程脑            │
│       「盐选级工具猫」             │
│                                  │
│  “别急，先拆成三个模块。”          │
│                                  │
│  AI 与数码 42%   [为什么]         │
│  高密度长答       [为什么]         │
│  收藏癖 76%       [为什么]         │
│  AI×科学×创业     [为什么]         │
│                                  │
│        [ 让它出去闻闻 ]            │
└──────────────────────────────────┘
```

## 组件

- `PetStage`
- `PersonaIdentity`
- `CompositionStat`
- `EvidenceDrawer`
- `PersonaCatchphrase`

## ViewModel

```text
PersonaRevealVM
  persona
    species
    archetype
    title
    catchphrase
    visualSeed
  highlights[3..5]
    label
    value
    explanation
    evidenceRefs[]
  confidence
```

## CTA

- 主 CTA `让它出去闻闻` → `/encounter/first`
- “为什么” → `EvidenceDrawer`

比赛首访默认不在此处分叉去 Home，避免第二高潮被跳过。

---

# 6. Screen E｜First Match `/encounter/first?phase=match`

## 用户问题

> “它为什么觉得我们会合得来？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 谢邀喵                     孵化 4/4│
│                                  │
│      [我的宠物]  87%  [TA 的宠物] │
│                                  │
│  共同气味                        │
│  AI ●  科学 ●                    │
│                                  │
│  最大差异                        │
│  长答工程脑  ↔  短句直球型        │
│                                  │
│  关系预判                        │
│  「很可能边吵边加好友」           │
│                                  │
│        [ 让它们先聊两句 ]         │
│             换一个                │
└──────────────────────────────────┘
```

## 组件

- `PetPairStage`
- `MatchScore`
- `SimilarityRow`
- `ContrastRow`
- `RelationPrediction`

## ViewModel

```text
FirstMatchVM
  selfPersonaSummary
  candidatePersonaSummary
  score
  similarities[]
  contrasts[]
  relationPrediction
  explanations[]
  candidateKind: user | demo_resident
```

## CTA

- `让它们先聊两句` → 同路由 `phase=encounter` 或进入 Encounter 状态
- `换一个` → 取 Top N 下一候选，不重新抓整套知乎 Context

## 规则

- 分数必须明确为谢邀喵算法结果，不冒充知乎官方评分；
- `demo_resident` 必须可见标注。

---

# 7. Screen F｜Agent Encounter `/encounter/first?phase=encounter`

## 用户问题

> “这两个数字人格真的有不同吗？”

## 低保真布局

```text
┌──────────────────────────────────┐
│            真实知乎话题            │
│  AI Agent 是否应该替用户做决定？   │
│  来自知乎 · 查看原问题             │
│ ──────────────────────────────── │
│ [我的喵]                          │
│  “先区分可逆和不可逆决策……”       │
│                                  │
│                 [TA]              │
│  “你又开始把简单事做成框架了。”   │
│                                  │
│ [我的喵]                          │
│  “框架至少比拍脑袋可靠。”          │
│ ──────────────────────────────── │
│ 为什么会这么聊？                   │
│ 共同兴趣 AI / 表达风格差异         │
│                                  │
│ [ 想认识 TA ]     [ 再看一个 ]     │
└──────────────────────────────────┘
```

## 组件

- `ZhihuTopicCard`
- `PetDialogueTurn`
- `EncounterExplanation`
- `ConnectionIntentButton`

## ViewModel

```text
FirstEncounterVM
  topic
    title
    url
    sourceLabel
  turns[2..4]
  explanation
  relationshipSeed
  connectionIntentState
```

## 规则

- 不是自由聊天室；
- 2–4 回合封顶；
- Knowledge Context 与 Persona 表达分离；
- 直答失败时可使用已有知乎摘要对比，但页面必须标记降级来源；
- 不自动向真人发消息。

---

# 8. Screen G｜Activation Result `/share/:id`（首次可公开）

## 用户问题

> “这结果值得我保存/分享吗？”

## 低保真布局

```text
┌──────────────────────────────────┐
│          你们已经留下第一段关系    │
│                                  │
│  [我的喵]  同频路人  [TA]          │
│                                  │
│  同频 87%                         │
│  好感 +4      争议 +7             │
│                                  │
│  AI / 科学                        │
│  “很可能边吵边加好友”             │
│                                  │
│      [ 生成我的匹配卡 ]            │
│      [ 回到我的窝 ]                │
└──────────────────────────────────┘
```

## 公开分享访问时

底部 CTA 改为：

> **那你在知乎养出了什么？**

→ Landing / Consent。

## ViewModel

```text
ShareCardVM
  cardId
  cardType: persona | match | relationship
  publicPayload
  ownerView: boolean
  createdAt
```

公开 Payload 不携带原始 OAuth 用户数据。

---

# 9. Screen H｜Home `/home`：「窝」

## 用户问题

> “我不在的时候，它今天干了什么？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 谢邀喵                      [头像] │
│                                  │
│            [活着的宠物]           │
│       今天状态：有点想抬杠         │
│                                  │
│ ┌──── 今天最值得看的一件事 ─────┐ │
│ │ 昨晚齿轮来你窝里串门了。       │ │
│ │ 它不同意你对一个 AI 问题的看法 │ │
│ │                 [去看看 →]    │ │
│ └──────────────────────────────┘ │
│                                  │
│ 见识 Lv3    表达 Lv2    社交 Lv4 │
│                                  │
│    窝        逛       遇见    图鉴 │
└──────────────────────────────────┘
```

## 组件

- `HomePetStage`
- `DailyEventHero`
- `GrowthStrip`
- `AppBottomNav`

## ViewModel

```text
HomeVM
  personaSummary
  moodLine
  heroEvent
    type
    headline
    detail
    target
    occurredAt
  growth
  unseenEventCount
```

## 规则

Home 首屏最多一个 Hero Event。不要做成十张卡的 Feed。

---

# 10. Screen I｜Explore `/explore`：「逛」

## 用户问题

> “它为什么把这些知乎内容叼给我？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 逛                               │
│ 本喵今天给你叼回来了 3 个东西      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 知乎问题标题                  │ │
│ │ 因为：AI × 你最近收藏过 Agent │ │
│ │ [听本喵怎么想]   [看原内容]    │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ……                           │ │
│ └──────────────────────────────┘ │
│                                  │
│    窝        逛       遇见    图鉴 │
└──────────────────────────────────┘
```

## ViewModel

```text
ExploreVM
  items[]
    contentRef
    title
    sourceType
    whyPicked
    sourceUrl
    reactionStatus
```

## 操作

- `听本喵怎么想` → 生成/读取 `ContentEncounter`
- `看原内容` → 知乎原链接
- 后续可加 `丢给某个朋友的宠物讨论`

## 规则

不是复制知乎 Feed；每一条必须回答“为什么推荐给你”。

---

# 11. Screen J｜Encounter `/encounter`：「遇见」

## 用户问题

> “今天有谁可能和我同频/互怼？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 遇见                             │
│                                  │
│ 今日最值得闻的一只                │
│ [宠物]  82% 同频                 │
│ AI / 科学 · 最大差异：表达直接度  │
│ [让它们先聊]                     │
│                                  │
│ 最近关系                         │
│ 齿轮   同频路人  好感 +4          │
│ 糯米   串门邻居  好感 +1          │
│                                  │
│    窝        逛       遇见    图鉴 │
└──────────────────────────────────┘
```

## ViewModel

```text
EncounterHubVM
  featuredCandidate?
  relationships[]
  pendingConnectionIntents[]
  residentFallbackAvailable
```

## 规则

不是左右滑陌生人；先展示“为什么值得遇见”。

---

# 12. Screen K｜Atlas `/atlas`：「图鉴」

## 用户问题

> “我的知乎人格现在是什么样，它怎么变过来的？”

## 低保真布局

```text
┌──────────────────────────────────┐
│ 图鉴                             │
│                                  │
│ [宠物证件]                        │
│ 英短 · 工程脑                    │
│ 盐选级工具猫                      │
│                                  │
│ 知乎成分                         │
│ AI 42  科学 21  创业 16          │
│ [为什么是这些？]                  │
│                                  │
│ 已解锁称号                        │
│ 工具猫 / 收藏夹考古学家 / ……      │
│                                  │
│ 关系图鉴  3                       │
│ 成长历史  12 条事件               │
│                                  │
│    窝        逛       遇见    图鉴 │
└──────────────────────────────────┘
```

## ViewModel

```text
AtlasVM
  persona
  composition
  explanations[]
  titles[]
  growth
  relationshipSummaries[]
  evolutionHistory[]
```

---

# 13. 共享组件清单

第一版组件不要无限拆分，核心共享件控制在：

```text
PetStage
PetAvatar
KanshanGuide
ActivationProgress
CompositionStat
EvidenceDrawer
ZhihuTopicCard
MatchScore
PetDialogueTurn
RelationshipBadge
DailyEventHero
GrowthStrip
ContentReasonCard
ShareCard
StatusBanner
AppBottomNav
```

只有同时出现在两个以上页面、或拥有独立状态逻辑的东西才提升为共享组件。

---

# 14. 全局状态与页面状态

## 服务端权威状态

```text
UserIdentity
ActivationState
Persona
Composition
Growth
Relationships
```

## 页面本地状态

```text
展开哪个“为什么”
当前动画阶段
当前对话 turn 动画
是否打开分享面板
当前候选索引
```

不要把 Persona、匹配关系、OAuth 状态只存在 React 客户端状态里。

---

# 15. 响应式原则

主体验优先按移动端竖屏设计，因为项目广场、分享卡和 OAuth 很容易从知乎移动端进入；同时评委也可能桌面体验，因此：

- 移动端：单列、底部四导航；
- 桌面端：内容区域最大宽度约 960–1120px；
- Reveal / Encounter 可以在桌面变成左右双列，但信息层级不变；
- 不为桌面单独设计另一套产品结构。

---

# 16. 第一版低保真验收

只要这 11 个 Screen 在不看视觉稿的情况下已经能回答以下问题，就可以开始写前端壳：

1. 用户现在处于哪个产品状态？
2. 这一屏唯一主要任务是什么？
3. 主 CTA 去哪里？
4. 页面要什么数据？
5. 数据来自哪个领域 ViewModel，而不是哪个知乎 JSON？
6. 上游失败时这一屏怎么继续活着？
7. 这一步是否让用户更接近 Reveal、Encounter 或留存？
