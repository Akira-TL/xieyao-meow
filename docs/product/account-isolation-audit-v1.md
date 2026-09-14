# 谢邀喵账号与数据隔离审计 v1

> 2026-09-14。结论：现在已经有“资料存储”，但还不能称为完整的长期账号系统。正式游戏化前必须先补稳定身份、持久 session 和用户数据 ownership。

## 已有能力

当前已有 OAuth callback、HttpOnly OAuth cookie、SQLite `users` / `cat_profiles`、匿名 profile cookie、Profile API。

关键代码：
- `src/lib/auth/request-session.ts`
- `src/lib/auth/session-store.ts`
- `src/app/api/auth/zhihu/callback/route.ts`
- `src/app/api/profile/route.ts`
- `src/lib/profile/store.ts`

匿名 Profile 的 cookie 隔离是有效的：使用两个独立 cookie jar 实测，A 修改猫名为“甲喵”后，B 仍然读取默认“小谢”。

## P0 问题

### 1. OAuth subject 不是稳定用户

`/api/profile` 当前登录用户的 subject 是 `oauth:${sessionId}`。sessionId 每次授权都会重新生成，因此它代表一次登录会话，不代表一个稳定知乎用户。同一知乎账号重新登录会获得新的资料主体。

### 2. OAuth session 只存在 Node 进程内存

`OAuthSessionStore` 当前使用 `Map`。部署、重启或多实例会导致浏览器还留着 cookie，但服务端已经找不到 session；不同实例也无法共享登录态。

### 3. 正式 App 页面没有真正的服务端登录门禁

`DemoRouteGuard` 只使用 `xieyao-demo-stage` localStorage 判断流程阶段，不校验 OAuth。当前未登录直接请求 `/home` 仍返回 200。它是演示流程 guard，不是账号权限边界。

### 4. 长期游戏状态仍放在不分用户的浏览器存储

当前存在全 origin 共用的 key，包括 activation stage、outing state、Persona experience memory，以及若干 sessionStorage 的 live experience / persona / question。共享浏览器切换账号时有串状态风险。

### 5. Logout 没有清完整的用户状态

当前 logout 只删除 OAuth session/cookie，不会同步清除浏览器里的 `xieya-*` 长期缓存，也不会处理匿名 profile 的回退。因此共享浏览器退出 A 后进入 B，仍可能看到 A 的旧 UI/游戏状态。

### 6. 未登录 experience 使用固定 demo cache key

`/api/experience` 在没有 OAuth 身份时使用固定 `self-demo` cache key。公共试玩和正式用户数据必须拆成完全不同的数据管线，不能让任何“用户型数据”走共享未登录 key。

## 正式账号模型

需要一个稳定内部 `user_id`，映射到知乎 OAuth 提供的稳定 provider subject。当前代码没有提取这个稳定标识；在官方 OAuth 文档确认具体字段/接口之前，不应拿 access token 或 sessionId 冒充用户 ID。

建议表结构职责：

- `users`: 内部 user_id + provider subject
- `oauth_sessions`: session id + user_id + expires_at + 服务端保存的授权凭据
- `cat_profiles`: user_id FK
- `persona_states`: user_id FK
- `game_states`: user_id FK
- `journeys`: user_id FK
- `artifacts`: user_id FK
- `inventory`: user_id FK
- `relationships`: owner_user_id + peer_user_id
- `encounters`: 双方用户 / Persona + 公共知乎话题

所有正式 API 都从服务端 session 取得 user_id；客户端请求不允许自己传一个 userId 来决定读谁的数据。

## P0 修复顺序

1. 确认知乎 OAuth 可用的稳定用户标识，并建立内部 user_id。
2. 将 OAuth session 持久化，不再使用单进程 Map 作为唯一真相。
3. 为 `/home`、`/explore?mode=app`、`/encounter`、`/atlas` 和所有用户 API 增加真实身份校验；dev bypass 只能在 development。
4. 将 outing、Persona memory、relationship、journey 等长期状态迁到服务端数据库。
5. 登录时显式处理匿名资料迁移；退出/换号时清除所有 `xieya-*` 浏览器缓存。
6. 增加 `/api/me` 与明确的退出入口，让 UI 始终知道“现在是谁”。
7. 增加 A/B 隔离集成测试：两个独立会话不能互读 Profile、Journey、Relationship；A 退出后 B 不能看到 A 的缓存。

## 结论

目前“不同浏览器默认不会共享同一个匿名猫资料”已经成立，但“一个稳定知乎账号对应一只长期谢邀喵，并在换设备、重新登录、多人访问时绝不串号”尚未成立。正式旅行、收藏、关系和人格成长系统必须建立在这次账号改造之后。
