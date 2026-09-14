# 用户专属 Game State ownership 研究 — 2026-09-14

## 研究问题

哪些状态必须从 `localStorage` / `sessionStorage` 迁移到按稳定 `user_id` 隔离的服务端持久层？客户端还能缓存什么？Home、Journey、Persona memory、Encounter、Relationship、Inventory 的 ownership contract 应如何划分？

本研究只建立现状事实与架构约束；最终决策以 Wayfinder 决策票「定义用户专属 Game State 的服务端边界」的 resolution comment 为准。

## 一手来源

- `docs/adr/0003-stable-account-session-and-user-ownership.md`
- `docs/architecture/product-system-v1.md`，尤其“核心领域对象”“日常循环数据流”“数据存储分层”
- `docs/architecture/frontend-application-contract-v1.md`，尤其“Route Guard”“客户端状态边界”
- `docs/product/account-isolation-audit-v1.md`
- `src/features/demo/activation.ts:1-22,54-109`
- `src/features/demo/outing.ts:1-50`
- `src/features/demo/live-client.tsx:29-60,73-116`
- `src/features/demo/interaction-client.tsx:34-76,85-124`
- `src/lib/social/types.ts:4-35`

## 事实

### 1. 已接受的账号模型要求长期资产全部归属于稳定 `user_id`

ADR-0003 已明确：`User` 的内部 UUID 是猫资料、Persona、Game State、Journey、Artifact、Inventory、Relationship、Encounter 等长期资产的唯一 owner key；正式 API 必须从服务端 Session 解析当前 `user_id`，客户端不能提交 owner `userId` 决定读写谁的数据。

这意味着“长期状态是否还可只放浏览器”已经不是开放问题：只要状态会跨页面、跨登录、跨设备、影响后续事件或对其他用户可见，就必须进入服务端 ownership 边界。

### 2. 目标架构已经把主要长期对象列为“必须持久化”

`docs/architecture/product-system-v1.md` 的数据存储分层要求持久化 App identity、Persona、ZhihuComposition、Growth、Match / Relationship / Encounter、Outing、ReturnArtifact / JourneyLog、DailyEvent 与 ShareCard 元数据。

同一文档还把 Home 定义为 Outing / Return / Relationship 等事件的投影，而不是独立推荐 Feed。因此 Home 不应拥有一份与 Journey / Relationship 平行的长期真相；它应通过服务端 loader/view-model 聚合当前状态与最高优先级事件。

### 3. 前端契约已经划定“客户端交互状态”和“服务端产品状态”

`docs/architecture/frontend-application-contract-v1.md` 明确允许客户端保存 Drawer、动画进度、分享面板、当前候选位置、页面 transition；同时明确 Persona、ActivationState、Growth、Relationship、Connection Intent、OAuth auth state 不能只存在客户端。

因此浏览器缓存可作为 view-model / optimistic state 的性能层，但不能成为写模型或恢复长期状态的唯一来源。

### 4. 当前实现仍有多项长期/半长期状态放在全 origin 浏览器存储

CodeGraph 当前源码显示：

- `xieyao-demo-stage` 保存 activation stage：`src/features/demo/activation.ts:109`；
- `xieyao-meow.demo.outing` 表达 `AT_HOME / PREPARING / AWAY / RETURNED` 与 `routeBias`：`src/features/demo/outing.ts:1-18,30-49`；
- `xieya-persona-experience-memory-v1` 保存 encounterCount、近期话题、Resident 与 notes：`src/features/demo/interaction-client.tsx:34-76`；
- live Persona / question / experience 快照保存在 `sessionStorage`：`src/features/demo/live-client.tsx:29-60,73-116`；
- selected resident 与 social event 也使用浏览器存储；现有 `SocialEvent` 已包含 affinity before/delta/after 与 relationship，因此其中一部分已经属于会影响长期关系的业务事实：`src/lib/social/types.ts:21-35`。

其中 activation、outing、Persona memory、关系变化若继续由全 origin browser storage 作为真相，共享浏览器换号时会串状态，且换设备/刷新/清缓存会丢资产。

## ownership 边界

### 必须由服务端 `user_id` 权威持有

以下对象必须持久化，客户端只能读取其 view-model 或提交受约束 mutation：

- `CatProfile`：猫名、正式 appearance / visual identity；
- `ActivationState`：是否已孵化、是否完成首次 Encounter、是否已激活；
- `PersonaState`：根人格、版本、稳定视觉身份、成长 delta、近期心境；
- `GameState`：当前长期循环状态以及当前 Journey/Outing 的引用；
- `Journey / Outing`：状态、route bias、开始/结束时间、途中事件、结算状态；
- `Artifact / Inventory / JourneyLog`：所有可收藏、可回溯、会影响后续体验的产物；
- `PersonaExperienceMemory`：由 Journey / Encounter 累积并会影响后续选择或表达的记忆；
- `Encounter`：真实用户 Persona 之间已经发生的互动事实；
- `Relationship`：双方关系状态、affinity、encounter count、最近互动时间，以及双方各自 opt-in 状态；
- `DailyEvent` 与 seen/read 状态；
- Growth / title / earned badge 等长期演化结果。

### 多用户对象的 ownership

`Encounter` 和 `Relationship` 不能通过“客户端传 ownerUserId”归属：

- `Encounter` 是服务端创建的共享事件，记录明确的 participant user/persona IDs；只有参与者（或明确公开的 demo Resident 场景）可读取。
- `Relationship` 是两名稳定 User / Persona 之间的 pair 状态，服务端以规范化 pair key 或等价唯一约束维护；双方的继续连接意愿应分别保存，不能由任一方替另一方写入。
- 某一方的私有 Persona memory / read state 仍按该方 `user_id` 单独归属，不因 Encounter 共享而变成共享可写状态。

### 可以留在客户端的状态

只要丢失不会改变产品事实，就可以留在 React state 或短生命周期缓存：

- Drawer / Sheet / Modal 开关；
- 对话动画播到第几句；
- 当前轮播页、候选卡位置；
- 尚未提交的表单草稿、纸条草稿；
- mutation 的 optimistic projection，但必须等待服务端确认并可回滚；
- 服务端返回的 view-model 短 TTL cache。

一旦纸条/route bias 被提交并影响 Journey，它就从“草稿 UI”跨过边界，成为服务端 Journey 数据。

### 派生缓存而非长期真相

live Persona / question / experience snapshot 可以缓存，但必须满足：

1. 来源仍是服务端；
2. 按当前 session / `user_id` 做 namespace 或在账号切换时全部失效；
3. 有明确 TTL / version；
4. 缓存缺失只能导致重新加载，不能导致 Persona、Journey 或 Relationship 被重置；
5. 缓存内容不得包含浏览器不应持有的 OAuth 凭据或服务端秘密。

## Home 的特殊边界

Home 不新增 `home_state` 作为第二份业务真相。`HomeVM` 应由服务端根据以下来源投影：

- 当前 Cat / Persona；
- 当前 Journey / Outing 状态；
- 未读/最高优先级 DailyEvent；
- 最近 Relationship / Encounter 变化；
- 可领取/可查看的 ReturnArtifact。

Home 上的“已看过”“已收进旅途册”等动作如果会影响以后展示，则由 mutation 写回对应服务端对象。

## 对实现的直接约束

- API ownership 一律从 Session → `user_id` 推导，不接收 owner `userId`。
- repository/query 的第一过滤条件必须包含当前 owner / participant 边界。
- localStorage/sessionStorage 迁移时按“业务真相 vs UI projection”分类，而不是按 key 名机械搬表。
- logout/account switch 必须清所有旧用户派生缓存；新登录用户在任何页面 hydrate 前先建立当前 `user_id` 上下文。
- A/B account isolation 集成测试必须覆盖 Profile、Journey、Persona memory、Artifact/Inventory、Encounter/Relationship 与浏览器缓存残留。

## 未解决事项

Journey 的具体状态机、时间窗口和惰性 materialize 规则属于下一张 Wayfinder 决策「定义 Journey Engine 的生命周期、时间和弱控制」，本研究只冻结其 ownership：无论具体状态如何设计，Journey 的权威状态都在服务端且归属于稳定 `user_id`。
