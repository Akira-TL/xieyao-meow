# 06｜申请知乎 OAuth 应用凭证

Type: task
Status: ready-for-human
Blocked by: 07

## 目标

按知乎数据开放平台官方要求申请「谢邀喵」OAuth 应用的 `app_id` / `app_key`，用于终端用户第三方登录与授权用户公开数据读取。

## 官方申请入口

发送邮件至：`openplatform@zhihu.com`

邮件主题：`<公司/组织/产品名称>申请接入知乎 OAuth 服务`

## 本项目申请范围

只申请 **C：公开内容**，覆盖个人创作内容、关注用户列表与公开收藏夹。当前 Persona 不需要邮箱或手机号权限。

## 官方要求材料

- 应用名称：谢邀喵；
- 应用简介；
- 应用图标，分辨率 >= 256×256，以附件发送；
- OAuth 回调地址 `redirect_uri`；
- 申请人姓名；
- 申请人手机号；
- 申请人知乎个人中心地址；
- 申请权限：C. 公开内容。

## 已准备资产

- 申请包：`docs/oauth/application-package.md`；
- 官方 OAuth 本地快照：`docs/reference/zhihu-open-platform/core/oauth.md`；
- readiness 检查：`./scripts/check-oauth-readiness.sh`，只输出变量存在性与 redirect URI 形状，不输出任何凭证值；
- 项目 callback 路径固定为：`/api/auth/zhihu/callback`。

当前仍缺少人工申请所需的最终公开部署域名、申请人手机号、知乎个人主页 URL 与 >=256×256 应用图标附件。

## 完成标准

- 获得 `app_id` / `app_key`；
- 凭证进入本地 Secret / 部署 Secret，不写入 Git；
- 确认获批的 `redirect_uri`；
- 在 issue 02 的实现中完成真实 Authorization Code Flow；
- 实测 callback 对 HTTPS 与 localhost/127.0.0.1 的边界；
- 成功使用 `X-OAuth-Token` 读取一个已授权测试用户的公开数据。

## 说明

这是外部人工审批依赖。它不阻塞 Access Secret 级 API、Persona Normalizer、热榜/搜索/Knowledge Layer 与直答能力的开发，但会阻塞“任意知乎用户登录并生成自己的谢邀喵”的最终验收。
