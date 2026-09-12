# 「谢邀喵」前端应用契约 v1

> 2026-09-12。目标：让页面结构、领域逻辑、知乎接口和交互状态解耦。本文定义目标前端架构，不要求现有 PoC 代码立即迁移。

## 1. 总原则

前端页面不直接拼知乎 API，不直接计算 Persona，不直接计算 Match。

推荐分层：

```text
Route / Page
    ↓
Screen Loader / Action
    ↓
Application Facade
    ↓
Domain Services
    ↓
Infrastructure
    ├─ ZhihuGateway
    ├─ App Repository
    └─ Cache
```

页面看到的永远是产品语言：

```text
PersonaRevealVM
FirstMatchVM
HomeVM
ExploreVM
EncounterHubVM
AtlasVM
```

而不是：

```text
知乎 Data.Items / Paging / X-OAuth-Token
```

---

## 2. Next.js 页面组织建议

目标目录只表达结构，不要求当前回合修改代码：

```text
src/app/
├─ (public)/
│  ├─ page.tsx                    # Landing
│  ├─ explore/page.tsx            # Public park / activated Explore 共用 loader
│  ├─ share/[cardId]/page.tsx
│  └─ privacy/page.tsx
│
├─ (activation)/
│  ├─ hatch/consent/page.tsx
│  ├─ hatch/scanning/page.tsx
│  ├─ hatch/reveal/page.tsx
│  └─ encounter/first/page.tsx
│
├─ (app)/
│  ├─ home/page.tsx
│  ├─ encounter/page.tsx
│  └─ atlas/page.tsx
│
└─ api/
   ├─ auth/zhihu/start
   ├─ auth/zhihu/callback
   ├─ hatch/
   ├─ encounter/
   ├─ connection-intent/
   └─ share/
```

`/explore` 是唯一可能同时服务游客和激活用户的页面；Shell 根据身份选择 Public/App 模式，而不是复制两个 Explore。

---

## 3. 三个 Layout

### PublicLayout

只提供：

- 品牌；
- 必要导航；
- CTA；
- 公共内容。

不加载用户 Persona。

### ActivationLayout

只提供：

- 品牌；
- `1/4` 等激活进度；
- 当前状态恢复能力。

不得出现底部四导航，防止用户在未完成第一次 Encounter 前被打散。

### AppLayout

提供：

- App session；
- Persona 摘要；
- 四大导航；
- 全局状态 Banner（上游降级、离线缓存等）。

---

## 4. Route Guard：URL 不是状态真相

服务端维护 `ActivationState`，访问激活页面时统一校正。

示例：

```text
用户状态 = PROFILE_SCANNING

访问 /hatch/reveal
→ 重定向 /hatch/scanning

用户状态 = HATCH_REVEAL

访问 /hatch/consent
→ 重定向 /hatch/reveal

用户状态 = ACTIVATED

访问 /
→ 可以显示 Landing，但主 CTA 变为“回我的窝”

访问 /home
→ 正常
```

推荐定义：

```text
VISITOR
PRE_AUTH
OAUTH_PENDING
PROFILE_SCANNING
HATCH_REVEAL
FIRST_MATCH_READY
FIRST_ENCOUNTER
ACTIVATED
```

异常标签与主状态分离：

```text
upstreamStatus:
  healthy
  oauth_pending_approval
  zhihu_degraded
  demo_fallback

profileStatus:
  sufficient
  sparse
```

避免把所有异常塞进一个巨大状态枚举。

---

## 5. 首访 Orchestration

Scanning 需要渐进反馈，但不能假装上游已经完成。

第一版建议使用**会话绑定、幂等的流式孵化任务**，而不是让浏览器自己调用四个知乎接口。

逻辑：

```text
POST /api/hatch
  session-bound
  idempotency key = current app user + persona version

Server
  ├─ 并行获取 contents
  ├─ 并行获取 followees
  ├─ 并行获取 favlists
  ├─ 并行获取 collections
  ├─ 逐项形成真实 finding
  ├─ 形成 Composition
  └─ 形成 Persona
```

流式事件语义：

```text
hatch.started
source.started
source.completed
source.failed
composition.partial
persona.ready
hatch.completed
```

传输实现可以是 SSE / NDJSON streaming HTTP；不使用 WebSocket。

如果部署环境下流式恢复成本过高，可以降为：

```text
POST /api/hatch
→ 单请求完成

页面仍展示 loading 阶段
但只有响应中真实完成的 finding 才显示为“发现”
```

不能为了动画硬编码虚假的“扫描发现”。

### 幂等与额度保护

同一用户同一孵化版本：

- 已完成 → 直接返回已持久化 Persona；
- 正在进行 → 复用同一 in-flight promise / task；
- 上游部分失败 → 保存成功来源与失败来源，不重复全量重试；
- 用户主动“重新化验”才创建新 version。

---

## 6. 页面 Loader 与 Mutation 分离

### Loader

负责“这一屏现在长什么样”。

```text
loadLanding()
loadConsent(user?)
loadPersonaReveal(userId)
loadFirstMatch(userId)
loadHome(userId)
loadExplore(userId?)
loadEncounterHub(userId)
loadAtlas(userId)
loadShareCard(cardId)
```

### Mutation

负责“用户做了一件事”。

```text
startOAuth()
startHatch()
selectNextMatch()
runFirstEncounter(matchId)
expressConnectionInterest(matchId)
createShareCard(type, refId)
markDailyEventSeen(eventId)
createContentReaction(contentRef)
```

不要做一个万能 `/api/action`。

---

## 7. ViewModel 设计规则

### ViewModel 必须已经完成产品翻译

坏例子：

```json
{
  "Items": [],
  "Paging": {"IsEnd": true}
}
```

好例子：

```text
HomeVM
  heroEvent.headline = “昨晚齿轮来你窝里串门了”
  heroEvent.detail = “它不同意你对一个 AI 问题的看法”
  heroEvent.target = /relationship/abc
```

### 页面不重新推理

如果 `为什么推荐这条内容` 是 ExploreService 的结果，前端直接展示 `whyPicked`，不再在客户端二次分析关键词。

### 来源透明

可能受上游降级影响的 ViewModel 统一包含：

```text
provenance
  live | cached | demo
sourceFetchedAt?
```

页面根据 provenance 显示小型来源提示，不把 Demo 数据冒充实时用户数据。

---

## 8. 客户端状态边界

适合客户端 state：

```text
当前哪个 Drawer 展开
对话动画播到第几句
分享面板是否打开
当前 Top-N 候选位置
页面内 transition
```

不适合仅存在客户端：

```text
Persona
ActivationState
Growth
Relationship
Connection Intent
OAuth auth state
```

这些必须由服务端/持久化层权威管理。

---

## 9. 页面请求预算

### Landing

0 个知乎用户 API。

最多读本地/缓存公共事件。

### Consent

0 个知乎数据 API。

只检查 OAuth availability。

### Scanning

首访最多：

```text
contents      1
followees     1
favlists      1
collections   1
favlist items 0–2
```

### Reveal

不再拉用户 Context。

只读取已生成 Persona / Composition；后台可预计算 Match。

### First Match

不重新抓 Profile。

候选来自 App Persona 池；按需要最多一次知乎 Search/共享 Hot cache 找讨论话题。

### First Encounter

最多：

```text
question answers 0–1
zhida            0–1
```

同 topic 结果可跨用户缓存 Knowledge Context。

### Home / Explore

热榜共享缓存；Search 按兴趣 query 缓存，不按每次页面刷新重新烧额度。

---

## 10. 失败状态由 Shell 接住

### `OAuthPendingApprovalBanner`

只出现在需要授权的位置。

文案：当前知乎第三方登录尚未开放；公共公园仍可体验。

### `ZhihuDegradedBanner`

显示：

> 知乎上游暂时打了个盹，现在展示的是最近一次缓存结果。

不要弹阻塞 Modal。

### `DemoResidentBadge`

只用于预置 resident persona：

> 演示居民

不能让评委误以为这是真实已注册用户。

### `SparseProfileSheet`

公开 Context 不足时，用户可以显式补 2–3 个兴趣。

所有补充结果标记：

> 你自己告诉我们的

---

## 11. 目标组件目录

第一版推荐 feature-first，而不是全局 components 无限制增长：

```text
src/features/
├─ landing/
├─ hatch/
│  ├─ components/
│  ├─ view-model.ts
│  └─ actions.ts
├─ encounter/
├─ home/
├─ explore/
├─ atlas/
└─ share/

src/components/
├─ pet/
├─ zhihu/
└─ shell/
```

放到 `src/components/` 的只应该是跨 feature 真正共享的东西：

- `PetStage`
- `PetAvatar`
- `ZhihuTopicCard`
- `StatusBanner`
- `AppBottomNav`

业务组件留在 feature 内。

---

## 12. 后端目标目录边界

不要求立即重构，目标语义是：

```text
src/lib/
├─ domain/
│  ├─ persona/
│  ├─ matching/
│  ├─ relationship/
│  └─ growth/
├─ application/
│  ├─ hatch/
│  ├─ first-encounter/
│  ├─ daily-home/
│  └─ explore/
└─ infrastructure/
   ├─ zhihu/
   ├─ persistence/
   └─ cache/
```

现有 `src/lib/persona`、`src/lib/social`、`src/lib/experience` 是 PoC 资产，后续按功能迁移，不在搭壳阶段做大规模重命名。

---

## 13. 低保真实现阶段禁止事项

搭页面壳时暂时禁止：

- 为了好看先实现复杂 CSS 动效；
- 重新设计 Persona 算法；
- 重写 OAuth；
- 接数据库迁移；
- 做商城、金币、签到；
- 做复杂宠物生成；
- 为每个页面各自重新调用知乎 API；
- 把 PoC API response 直接打印到页面。

第一轮实现只验证：

> “按这套页面和状态走一遍，用户是否能无解释地理解自己正在经历什么？”

---

## 14. 前端壳验收标准

低保真前端壳完成时，即使后端全部使用固定 fixture，也必须可以从浏览器走通：

```text
Landing
→ Consent
→ Scanning
→ Reveal
→ First Match
→ Encounter
→ Activation Result
→ Home
→ Explore / Encounter / Atlas
```

并满足：

1. 浏览器前进/后退不会把激活状态搞乱；
2. 未激活用户不能直接进入 `/home`；
3. 已激活用户刷新页面不丢 Persona；
4. 每一屏只有一个清晰主 CTA；
5. Demo fixture 与 live 数据有明确 provenance；
6. 手机与桌面都可操作；
7. 不需要任何人解释按钮在哪、下一步是什么。
