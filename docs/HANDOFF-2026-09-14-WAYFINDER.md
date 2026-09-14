# 谢邀喵项目 Handoff — 2026-09-14 / Wayfinder 游戏化阶段

> 用于下一个会话直接续接。当前会话到这里停止，不再继续做产品决策或实现。

## 0. 最重要的工具要求

**项目工作只使用 `@ForgeRelay`。**

不要使用：
- `ForgeRelay-dev`
- 其他 ForgeRelay 变体

Workspace：
- Repo: `/home/Akira/Projects/xieyao-meow`
- Workspace ID: `ws_406c37a348`
- Branch: `main`
- Current HEAD: `d4c12e7 DOCS: (auth) define stable account ownership`

每个新的 ForgeRelay Host Turn：
1. `api_tool.list_resources(paths=["ForgeRelay"])`
2. `ForgeRelay.open_workspace(workspaceId="ws_406c37a348", context="auto")`
3. **恰好一次** `ForgeRelay.activity_panel(workspaceId="ws_406c37a348")`
4. 再开始工作

代码定位优先使用 CodeGraph：
- `codegraph explore "<query>" --max-files N`
- `codegraph query <term>`
- `codegraph node <symbol-or-file>`

提交只能使用 Akira Guard：

```bash
uv run ~/.agents/skills/akira-guard/scripts/guard.py commit -m 'TYPE: (scope) detail'
```

不要直接 `git commit`。

---

## 1. 当前运行状态

本地 dev watcher 正在运行：

- `http://127.0.0.1:3001`
- `next-server` 正在监听 3001

不要额外再启动第二个 `next dev`。之前已经验证：两个 dev server 共用 `.next` 会互相踩构建产物，导致 React hydration/chunk 404。

当前 tracked 工作树干净。

仅剩两个原始 untracked ZIP，**不要 stage / delete / overwrite**：

- `public/xieyao_p0_assets_two_generations.zip`
- `public/xieyaomiao_assets_renamed.zip`

---

## 2. 当前项目阶段

项目已经从“页面原型/视觉补齐”进入：

**长期游戏化 / 异步养成 / 账号隔离 / Journey Engine** 阶段。

产品长期方向参考《旅行青蛙》，但不复制任务经济：

> 我的猫在我不看的时候也会生活：自己出门、逛真实知乎、带东西回来、遇见其他 Persona、关系和人格慢慢变化。

核心留存不是“每日任务”，而是：

> 每天都有一些我没参与的事情发生。

相关文档：
- `docs/product/travel-frog-loop-v1.md`
- `docs/product/account-isolation-audit-v1.md`
- `docs/product/effect-sheet-implementation-audit-2026-09-14.md`
- `CONTEXT.md`
- `docs/adr/0002-personality-theatre-and-autonomous-outings.md`
- `docs/adr/0003-stable-account-session-and-user-ownership.md`

---

## 3. GitHub Issue Tracker / Wayfinder

项目已经由本地 Markdown tracker 迁移到 **GitHub Issues**。

Repo：
- `Akira-TL/xieyao-meow`

Canonical Agent 文件：
- `AGENTS.md`

Tracker 配置：
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`

已配置 Wayfinder labels：
- `wayfinder:map`
- `wayfinder:research`
- `wayfinder:prototype`
- `wayfinder:grilling`
- `wayfinder:task`

以及 triage labels：
- `needs-triage`
- `needs-info`
- `ready-for-agent`
- `ready-for-human`
- `wontfix`

### 主地图

GitHub Issue：

**#1 — `WAYFINDER: 谢邀喵长期游戏化 MVP`**

URL：
`https://github.com/Akira-TL/xieyao-meow/issues/1`

Destination：

> 形成一套可以直接转入 spec / implementation tickets 的长期游戏化 MVP 决策基线：稳定账号 → 用户专属游戏资产 → 异步旅行 → 知乎内容探索 → 明信片/收藏 → Persona 相遇 → 关系 → Persona 成长 → 回流。

原则：
- 弱控制
- 不做排行榜/PvP
- 不做连续签到惩罚
- 不做体力条/强制每日任务
- 不把「逛」做成第二个知乎 Feed
- 第一版不做复杂货币/抽卡/商城
- 第一版不做实时聊天室
- 用户离开时世界仍继续
- Journey 第一版允许“时间戳 + 惰性 materialize”，不要求常驻后台 Agent

---

## 4. 已关闭 Wayfinder 决策

### #2 — 确认知乎 OAuth 的稳定用户身份标识 ✅

结论：

- `sessionId` **不能**作为长期用户身份
- `access_token` **不能**作为长期用户身份
- `authorization_code` **不能**作为长期用户身份
- 内容/收藏夹等 `UrlToken` **不能**作为当前用户 identity
- 正式模型使用：**内部 UUID `user_id` + 外部 `provider_subject`**
- `provider_subject` 只能来自知乎 OAuth “获取用户信息”接口中被官方确认稳定的用户 subject 字段
- 当前官方 OAuth 文档明确有“获取用户信息”步骤，但项目本地官方快照没有公开 endpoint / 字段名，因此实现必须保持 provider abstraction，不得猜字段

研究文档：
- `docs/research/zhihu-oauth-stable-identity-2026-09-14.md`

提交：
- `3134853 DOCS: (auth) record OAuth identity contract`

### #3 — 决定稳定账号、Session 与用户归属模型 ✅

核心决策：

- `User`：内部稳定 UUID，是所有长期资产唯一 owner
- `OAuth Identity`：知乎账号 → User 的稳定映射
- `Session`：只证明“当前请求是谁”，**永远不再充当 User ID**
- Session 持久化到服务端 SQLite，不再依赖 Node 内存 Map 作为唯一真相
- 猫资料、Persona、Journey、收藏、关系等全部挂 `user_id`
- 正式用户 API 从服务端 session 解析 owner；客户端不能提交 owner `userId` 决定自己读写谁

已固化：
- `docs/adr/0003-stable-account-session-and-user-ownership.md`
- `CONTEXT.md`

提交：
- `d4c12e7 DOCS: (auth) define stable account ownership`

---

## 5. 当前仍开放的 Wayfinder tickets

按当前地图：

- #4 `决定匿名猫与知乎账号的绑定和合并规则`
- #5 `定义用户专属 Game State 的服务端边界`
- #6 `定义 Journey Engine 的生命周期、时间和弱控制`
- #7 `定义知乎内容发现与知乎直答的旅行职责边界`
- #8 `定义旅途明信片、纪念物与收藏模型`
- #9 `定义真实用户 Persona 的异步相遇与关系模型`
- #10 `定义 Persona 长期演化与记忆护栏`
- #11 `确定长期游戏化 MVP 的成功闭环与砍项线`
- #12 `定义回访节奏、离线累积和留存反馈`

依赖关系已通过 GitHub native blocked-by 写入。

当前建议推进顺序：

1. #4 匿名猫合并规则
2. #5 User Game State 服务端边界
3. #6 Journey Engine
4. #7 知乎内容 / 直答职责
5. #8 明信片 / 收藏
6. #9 真实 Persona 异步社交
7. #10 Persona 演化
8. #12 回访节奏
9. #11 MVP Gate / 砍项

> 用户已经明确授权：**不需要其亲自裁决的决策，由 Agent 直接决定并自动关闭；只有真正涉及产品价值取舍、且缺乏足够依据时才暂停询问。**

不要每关一票就停下来问用户“下一张做哪一个”。

---

## 6. 下一会话第一步

直接继续 Wayfinder，不要重新解释项目。

建议第一批自动解决：

### A. #4 匿名猫与账号合并规则

推荐原则：

- 安全优先：**宁可不合并，也不能串号**
- 匿名资料绑定到 browser anonymous subject
- OAuth 登录后：
  - 若该稳定 User 还没有猫资料，可迁移匿名的**低风险资料**：猫名、appearance preference
  - Journey / Relationship / Persona memory / Inventory 等长期资产不要无条件从匿名状态自动并入
  - 若 User 已有长期资料，则以服务端 User 数据为唯一真相，不覆盖
- logout / account switch 必须清除所有 `xieya-*` 用户态 browser cache
- 同一匿名状态最多消费一次，避免重复 merge

### B. #5 用户专属 Game State 服务端边界

推荐原则：

服务端唯一真相：
- `cat_profile`
- `persona_state`
- `game_state`
- `journeys`
- `artifacts / inventory`
- `relationships / encounters`
- Persona experience memory

客户端只允许缓存：
- 当前请求的 view-model
- 短生命周期 optimistic UI
- 非敏感的静态素材偏好

禁止把任何长期 owner state 只放在全 origin `localStorage/sessionStorage`。

正式 API 必须通过 session → `user_id` 决定 ownership。

代码里当前仍存在这些 browser storage，需要未来 implementation 阶段迁移：
- `xieya-demo-stage`
- outing state
- Persona experience memory
- selected resident
- social event
- live persona / question / experience sessionStorage

---

## 7. 账号安全当前结论

**当前还不能叫“完整账号系统”。**

已有：
- OAuth callback
- HttpOnly OAuth cookie
- SQLite `users / cat_profiles`
- 匿名 profile cookie

但 implementation 仍需完成：

1. OAuth stable provider subject 真正接入
2. `oauth_identities`
3. 持久化 `oauth_sessions`
4. 正式 App 服务端 auth guard
5. `/api/me`
6. logout 清用户缓存
7. 长期游戏状态全部 `user_id` 隔离
8. A/B account isolation integration tests

特别注意：

> 目前 `/home` 未登录仍可 HTTP 200；现有 `DemoRouteGuard` 是 Demo activation guard，不是 auth guard。

---

## 8. 当前游戏化核心产品结论

参考《旅行青蛙》，要学的是：

**弱控制 + 等待 + 不确定性 + 回来后的证据 + 收藏 + 陪伴感**。

不是复制：
- 三叶草货币
- 每日任务
- 登录奖励
- 排名

建议长期循环：

```text
在窝里
→ 留一张模糊纸条 / 准备一个东西
→ 猫自己选去哪
→ 离家
→ 中途可能寄明信片
→ 可能遇到另一只 Persona
→ 回家
→ 带回问题票根 / 观点碎片 / 纪念物
→ 关系或 Persona 发生小幅变化
→ 收进旅途册 / 图鉴
→ 下一次
```

知乎高信息密度的正确使用方式：

> 知乎每天发生很多事，但这只猫只替你叼回来极少数真正像“它会选的东西”。

一次 Journey 第一版建议最多：
- 1 个主问题
- 0–2 个路边发现
- 最多 1 次 Persona 相遇
- 1 个值得留下来的产物

不要做无限 Feed。

---

## 9. 视觉/页面已完成的重要改动

近期已完成并提交：

- `afde938` Home 恢复 Persona 为首屏视觉中心
- `d64232f` 正式桌面 App 改 Left Rail + Main Stage
- `7d69f30` Explore 恢复 Journey Log 主次层级
- `e457abe` 15 张效果图实施差距审计
- `ecbc71e` Home hero persona 首屏优先加载
- `2c41e89` 所有知乎直答 Prompt 接 Humanizer-zh 中文约束
- `2c9a91d` Cat Profile / SQLite 身份接正式 App

当前 tracked 工作树干净，因此下个会话不要以为还有一批未提交的页面 CSS 等待处理。

---

## 10. 重要工程约束

- 不要读取或输出 OAuth secret
- 如果检查 `.secrets/zhihu-access-secret`，只检查 set / missing
- 不要提交 `.scratch/`
- 不要提交/删除用户原始 ZIP
- 不要生成仿刘看山素材；刘看山只使用官方 GIF
- 玩家统一是黑猫 Persona，其他动物是 Resident/NPC
- Humanizer-zh 规则已经统一进入知乎直答 Prompt
- 页面视觉修改必须实际截图检查，不能只看 DOM 数字
- 用户偏好一次只精修一个页面，但当前阶段已转 Wayfinder 游戏化决策；不要重新回到无目的视觉打磨

---

## 11. 下个会话可直接使用的开场指令

```md
@ForgeRelay 继续 `/home/Akira/Projects/xieyao-meow`，Workspace `ws_406c37a348`。

先读取 `docs/HANDOFF-2026-09-14-WAYFINDER.md`，然后继续 GitHub Issue #1「WAYFINDER: 谢邀喵长期游戏化 MVP」。

用户已经授权：不需要我亲自拍板的决策由你直接裁决并关闭，不要每解决一票就停下来问我。只有真正涉及产品价值取舍、且现有资料无法判断时再问我。

优先顺序：#4 匿名猫合并 → #5 User Game State → #6 Journey Engine → #7 知乎内容/直答职责，然后继续向后推进。

项目工作只用 ForgeRelay；代码定位优先 CodeGraph；提交只用 Akira Guard。
```
