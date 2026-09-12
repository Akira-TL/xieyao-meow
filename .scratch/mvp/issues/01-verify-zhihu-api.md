# 01｜核验知乎 API 与 OAuth 真值

Type: research
Status: resolved
Blocked by:

## 目标

取得官方开发手册正文并用真实应用凭证验证本项目依赖的 OAuth、用户数据、热榜、搜索与直答能力。

## 完成标准

- 官方手册可在仓库中以引用或整理文档追溯；
- 明确 authorize / token 流程与 callback 要求；
- 明确 scope、用户可读字段与 token 生命周期；
- 明确热榜、搜索、直答 Agent 的 endpoint、响应结构、配额与错误码；
- 至少完成一次真实 OAuth 或最小接口调用；
- 更新 `docs/reference/zhihu-api.md`，把已验证项从“待官方确认”改为确定事实；
- 所有凭证只进入本地 Secret / 环境变量，不写入 Git。

## Comments

2026-09-12：公开抓取飞书开发手册链接会跳转登录页，后续可使用已登录浏览器能力继续核验。

2026-09-12：已通过 `https://developer.zhihu.com/docs` 官方文档中心完成第一轮一手核验，并将完整记录写入 `docs/research/zhihu-open-platform-2026-09-12.md`。已确认：

- 通用 API 使用 Access Secret Bearer 鉴权，并要求 `X-Request-Timestamp`；
- OAuth 为 Authorization Code Flow，用于第三方登录和被授权用户个人数据；
- OAuth 应用当前需邮件申请 `app_id` / `app_key`，谢邀喵最小权限为“C. 公开内容”；
- OAuth token 响应文档化 `expires_in=3600`，但未文档化 state/PKCE/refresh/revoke；
- 官方没有声明 callback 必须 HTTPS 或 localhost/127.0.0.1 禁止，需真实应用凭证实测；
- 已确认 `/user/contents`、`/user/followees`、`/user/collections`、`/user/favlists`、`/user/favlist_contents` 可通过 `X-OAuth-Token` 读取已授权用户公开数据；
- 已确认热榜、知乎搜索、问题回答摘要、问题推荐、直答 Agent、quota 等正式 endpoint 与主要响应合同；
- `/user/content_detail`、评论和创作统计仅支持 Access Secret 所属账号，不支持 OAuth 用户身份切换；
- 未授权调用 `/api/v1/quota` 已真实返回 `Code=20001 Authorization failed`。

2026-09-12：真实 Access Secret 已由用户提供并迁移到 Git 忽略的本地 Secret 目录；没有查看或输出 Secret 内容。真实调用已完成：quota、热榜、搜索、问题回答、本人内容/关注/收藏/收藏夹、问题推荐与 `zhida-fast-1p5` 均成功，且 quota 的 `TotalUsed` 与调用次数一致。

本 issue 的 API 真值核验目标已完成。OAuth 应用 `app_id/app_key` 仍需按官方要求通过邮件申请；真实终端用户 OAuth、callback HTTPS/localhost 边界转为独立外部依赖，不再阻塞 Access Secret 级能力开发。
