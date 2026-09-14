# ADR-0003：稳定账号、Session 与用户资产归属

- Status: Accepted
- Date: 2026-09-14

## Context

当前 OAuth `sessionId` 被临时当作 Profile subject，且 Session 只保存在 Node 进程内存。这样同一知乎用户重新授权会被视为新用户，部署/重启也会丢失登录态；长期旅途、关系、收藏和 Persona 成长无法可靠绑定到同一用户。

知乎 OAuth 文档只确认授权后应再调用“获取用户信息”接口取得当前授权用户基本信息，token 响应本身没有稳定用户 ID。因此系统必须把“用户身份”“OAuth 身份”“登录 Session”分开建模。

## Decision

1. `users.id` 使用应用内部生成的稳定 UUID，是所有长期游戏资产的唯一 owner key。
2. `oauth_identities` 保存 `provider + provider_subject + user_id`；`provider_subject` 只能来自知乎官方确认稳定的用户信息字段，`sessionId`、`access_token`、`authorization_code` 和内容 URL token 均不得作为用户主键。
3. `oauth_sessions` 单独保存不透明 session token、`user_id`、过期时间和服务端所需 OAuth 凭据。浏览器 Cookie 只持有 session token；Session 不承担身份语义。
4. MVP 使用服务端 SQLite 持久化 Session，替换单进程 `Map` 作为唯一真相；存储接口保持可替换，未来可迁移到共享数据库。
5. `cat_profiles`、Persona、Game State、Journey、Artifact、Inventory、Relationship、Encounter 等长期资产全部通过内部 `user_id` 归属。
6. 正式 API 从服务端 Session 解析当前 `user_id`；客户端不得通过提交 owner `userId` 决定读写谁的数据。
7. 登录成功后轮换 Session；退出时服务端删除 Session 并清 Cookie。匿名资料如何并入正式用户由独立决策处理。

## Consequences

- 同一知乎身份跨重新登录仍对应同一只谢邀喵。
- 部署/重启不再天然丢失登录态。
- 用户数据隔离从浏览器约定提升为服务端 ownership 边界。
- 需要新增身份映射与持久 Session 表，并迁移当前以 session/localStorage 为真相的状态。

## Rejected alternatives

- 继续使用 `sessionId` 作为用户 ID：Session 生命周期与用户生命周期不同。
- 使用 `access_token` 哈希作为用户 ID：token 会过期/轮换，也不是官方稳定身份合同。
- 仅靠 localStorage 区分用户：共享浏览器和换号场景会串数据。
