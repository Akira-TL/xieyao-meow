# 匿名 Profile 与稳定账号合并研究 — 2026-09-14

## 研究问题

在「用户可先匿名体验、改猫名或选择外观，再通过知乎 OAuth 绑定稳定账号」的前提下，当前实现有哪些串号与错误合并风险？哪些数据可以安全迁移，哪些数据必须留在稳定 `User` 所有权边界之外？

本研究只建立事实与安全约束，最终产品决策以 Wayfinder 决策票「决定匿名猫与知乎账号的绑定和合并规则」的 resolution comment 为准。

## 一手来源

- `src/app/api/profile/route.ts:20-52,56-86`
- `src/lib/profile/store.ts:35-48,51-88,99-124`
- `src/app/api/auth/zhihu/callback/route.ts:53-64`
- `src/app/api/auth/zhihu/logout/route.ts:8-21`
- `src/lib/auth/request-session.ts:7-25`
- `src/lib/auth/session-store.ts:18-52`
- `src/features/demo/client.tsx:117-118`
- `src/features/demo/outing-client.tsx:28-39`
- `src/features/demo/interaction-client.tsx:34-57,560`
- `src/features/demo/live-client.tsx:29-31,38-60,78-100`
- `docs/adr/0003-stable-account-session-and-user-ownership.md`

## 事实

### 1. 匿名 Profile 已经有独立浏览器标识，但它目前被当成“用户 subject”使用

`/api/profile` 在未登录时读取 `xieyao_profile_id`；不存在时生成随机 UUID，并以 `anon:<uuid>` 作为 `subjectId`。该 cookie 为 HttpOnly、SameSite=Lax，默认保存一年。见 `src/app/api/profile/route.ts:20-21,32-52`。

这说明当前实现已经具备“一个浏览器匿名主体对应一个 Profile”的基础，但它仍与正式用户共用同一个 `subjectId` 抽象，而不是一个独立的 pre-auth 领域对象。

### 2. OAuth 登录不会合并匿名 Profile，而是直接切到基于 Session 的另一个 subject

只要 `getRequestOAuthIdentity()` 返回登录态，`/api/profile` 就改用 `oauth:${identity.sessionId}`，完全绕过匿名 cookie。见 `src/app/api/profile/route.ts:32-41`。

`getRequestOAuthIdentity()` 当前只从 OAuth cookie 取 `sessionId`，再从内存 Session Store 取 access token；返回值没有稳定 `user_id`。见 `src/lib/auth/request-session.ts:7-25`。Session Store 本身也是进程内 `Map`。见 `src/lib/auth/session-store.ts:18-52`。

因此当前行为不是“匿名猫绑定账号”，而是“匿名 Profile 与每次 OAuth Session 分裂成两个主体”。这与 ADR-0003 已接受的 `User` / `OAuth Identity` / `Session` 三层模型冲突。

### 3. 当前 SQLite schema 把匿名主体和 OAuth Session 主体塞进同一个 `users(subject_id)`

`CatProfileStore` 的 `users` 与 `cat_profiles` 都以 `subject_id` 为主键/外键；Store 不区分 `anon:*`、`oauth:*` 和未来稳定 UUID `user_id`。见 `src/lib/profile/store.ts:35-48`。

读写也全部以调用方给入的 `subjectId` 为所有权键。见 `src/lib/profile/store.ts:51-88,99-124`。

所以正式实现不能简单把现有 `subject_id` 字段继续扩展为更多前缀；ADR-0003 已明确长期资产必须归属于内部稳定 UUID `user_id`。

### 4. OAuth callback 当前只创建 Session，不处理稳定 User，也不消费匿名状态

OAuth callback 交换 authorization code 后直接创建 Session 并写 `xieyao_oauth_session` cookie。见 `src/app/api/auth/zhihu/callback/route.ts:53-64`。

因此未来“匿名 → 稳定账号”的迁移点应发生在：OAuth provider subject 已确认、内部 `User` 已解析/创建之后，正式 App Session 建立之前或同一服务端事务内；不能在仍只有临时 Session 标识时做迁移。

### 5. Logout 只清 OAuth cookie，不能构成换号隔离

当前 logout 删除内存 Session 并清 `xieyao_oauth_session`，没有清 `xieyao_profile_id`，也没有任何客户端用户态缓存清理协议。见 `src/app/api/auth/zhihu/logout/route.ts:8-21`。

同时客户端仍保存多组全 origin 状态：

- activation / outing：`src/features/demo/client.tsx:117-118`、`src/features/demo/outing-client.tsx:28-39`
- Persona experience memory：`src/features/demo/interaction-client.tsx:34-57,560`
- live Persona / question / experience：`src/features/demo/live-client.tsx:29-31,38-60,78-100`

因此仅靠服务端 Session ownership 仍不足以避免共享浏览器 A → logout → B 时看到 A 的残留 UI。

## 安全约束

基于以上事实与 ADR-0003，匿名绑定必须满足以下约束：

1. **匿名状态不是 `User`。** 它只能是浏览器绑定的 pre-auth 临时资料，不能成为 Journey、Relationship、Inventory、Encounter、Persona memory 等长期资产 owner。
2. **只有解析出稳定 `user_id` 后才能迁移。** access token、authorization code、OAuth `sessionId` 都不能作为合并目标。
3. **迁移必须是白名单复制，不是对象合并。** MVP 只需要迁移猫名和外观选择这类低风险孵化偏好；其他长期状态不自动进入正式账号。
4. **同一匿名状态最多消费一次。** 服务端必须有可事务化的一次性 claim/consume 记录；仅删除浏览器 cookie 不足以保证幂等与防重放。
5. **已有正式资料永远优先。** 若目标 `User` 已有 Cat/Profile，匿名数据不得覆盖；重复授权只恢复该 `User` 的服务端状态。
6. **失败时宁可不合并。** 匿名状态已被其他 `User` 消费、owner 不明确、事务冲突或任何校验异常时，必须保留正式 `User` 数据并放弃匿名迁移。
7. **绑定完成后切断匿名继承链。** 无论匿名数据是被迁移还是被丢弃，成功登录后都应使原匿名 subject 不再能被下一个账号消费；退出后若继续匿名体验，应生成新的匿名主体。
8. **账号切换必须清客户端用户态缓存。** 所有 `xieya-*` / outing / Persona memory / live experience 等用户派生缓存都应在 logout/account switch 时清除或按当前稳定 `user_id` 命名空间隔离；浏览器缓存不能作为长期真相。

## 对后续实现的最小数据需求

不在本研究中冻结最终表结构，但实现至少需要能表达：

- 一个独立于 `User` 的 anonymous subject；
- anonymous Cat/Profile 中允许迁移的低风险字段；
- anonymous subject 是否已被消费、何时消费、消费到哪个稳定 `user_id`；
- 在同一事务中完成“检查未消费 → 可选复制白名单字段 → 标记已消费”；
- 稳定 `User` 已有资料时的 no-overwrite 分支。

## 未解决事实

知乎 OAuth provider subject 的具体 endpoint / 字段名仍以 `docs/research/zhihu-oauth-stable-identity-2026-09-14.md` 的结论为准；在官方字段确认前，匿名合并流程只能依赖 provider abstraction，不能猜测知乎用户 ID 字段。
