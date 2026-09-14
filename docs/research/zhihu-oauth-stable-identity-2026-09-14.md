# 知乎 OAuth 稳定用户身份标识研究 — 2026-09-14

## 结论

当前可核验的知乎官方 OAuth 文档**没有把稳定用户标识放在 access token 响应中**。token 响应只文档化：`access_token`、`token_type`、`expires_in`。

官方 OAuth 流程明确存在第 4 步：**“使用 access_token 调用获取用户信息接口，获取当前授权用户的基本信息”**。因此谢邀喵的长期账号必须以该用户信息接口返回的、经官方确认稳定的 provider subject 为绑定依据，而不是登录会话或 token 本身。

在该接口 endpoint / response schema 尚未从官方文档或一次真实授权响应确认前，代码层只定义抽象字段 `provider_subject`，不猜具体知乎字段名。

## 明确禁止作为长期 user id 的字段

- `sessionId`：谢邀喵自己每次登录生成，只代表一次会话。
- `access_token`：授权凭证且有 `expires_in`，不是公开稳定身份合同。
- `authorization_code`：一次性交换凭证。
- 用户内容 URL / ContentToken：标识内容，不标识授权用户。
- 收藏夹 `UrlToken`：官方定义为收藏夹 URL 标识，不是用户标识。
- followees 返回的 `UrlToken`：标识“被关注用户”，并不能证明当前授权用户自身身份。

## 官方证据

1. 知乎官方 OAuth 文档快照 `docs/reference/zhihu-open-platform/core/oauth.md`：
   - Authorization Code Flow 第 4 步明确要求使用 access token 调用“获取用户信息”接口。
   - access token 成功响应只列出 `access_token`、`token_type`、`expires_in`。
2. 官方用户内容接口 `docs/reference/zhihu-open-platform/user/user-contents.md`：`X-OAuth-Token` 仅用于切换到该 OAuth 凭证对应的已授权用户；响应内容项没有当前用户 id。
3. 官方关注接口 `docs/reference/zhihu-open-platform/user/user-followees.md`：返回的 `UrlToken` 属于关注列表中的用户。
4. 官方收藏夹接口 `docs/reference/zhihu-open-platform/user/user-favlists.md`：`UrlToken` 明确定义为收藏夹 URL 标识。

## 对账号设计的直接约束

正式模型采用：

`users.id (internal UUID) <- oauth_identities(provider='zhihu', provider_subject)`

`oauth_sessions` 只引用内部 `user_id`，永远不充当用户身份本身。

在真实“获取用户信息”响应确认前，生产环境不得把新 OAuth session 自动认作长期已有用户；开发/测试可使用显式 synthetic provider subject。

## 尚待运行时确认

知乎“获取用户信息”接口的具体 URL、稳定标识字段名及其稳定性合同，目前本地官方文档快照未包含。真实 app OAuth 可用时，应保存**字段名与非敏感结构**做一次契约核验，但不得记录 access token 或用户隐私数据。