# 知乎 OAuth 申请包｜谢邀喵

> 状态：申请材料已准备；等待确定公开部署域名，并补申请人手机号、知乎个人主页与应用图标附件。
>
> 官方依据：`docs/reference/zhihu-open-platform/core/oauth.md`

## 1. 申请目标

为「谢邀喵」申请知乎 OAuth `app_id` / `app_key`，用于：

1. 用户通过知乎完成第三方授权；
2. 服务端取得用户 OAuth access token；
3. 在知乎开放平台 Access Secret 基础上，通过 `X-OAuth-Token` 读取该已授权用户的公开创作、关注用户与公开收藏夹；
4. 将这些数据 Normalize 为“知乎成分”，孵化用户自己的 Persona。

不申请邮箱和手机号权限。

## 2. 官方要求字段

| 字段 | 本项目填写值 | 状态 |
|---|---|---|
| 应用名称 | 谢邀喵 | 已确定 |
| 应用简介 | 基于用户知乎公开内容、关注与收藏数据孵化 AI 数字人格；数字人格可浏览真实知乎问题、生成个性化回答，并与其他数字人格发生可解释的社区互动。 | 已确定 |
| 应用图标 | 需提供 >= 256×256 图片附件 | 待附件 |
| redirect_uri | `https://<最终部署域名>/api/auth/zhihu/callback` | 待部署域名 |
| 申请人姓名 | 谭朗 | 已确定 |
| 申请人手机号 | `<申请人手机号>` | 待填写 |
| 知乎个人主页 | `https://www.zhihu.com/people/<url-token>` | 待填写 |
| 权限 | C. 公开内容 | 已确定 |

## 3. 为什么只申请 C：公开内容

当前 Persona 数据链路只依赖：

- 用户创作列表；
- 用户关注列表；
- 用户近期收藏；
- 用户公开收藏夹及收藏夹内容。

这些能力用于兴趣主题、表达习惯、关注圈层、作息和收藏行为等“知乎成分”分析。项目不需要邮箱或手机号，因此不申请 A/B 权限，保持最小授权面。

## 4. 回调地址

项目代码已经固定 OAuth callback 路径：

```text
/api/auth/zhihu/callback
```

因此申请时只需要确定公开部署 origin，例如：

```text
https://example.com/api/auth/zhihu/callback
```

**不要在申请邮件中使用临时域名，除非确定比赛期间会保持不变。** OAuth token 交换请求会再次携带 `redirect_uri`，应与申请配置保持一致。

## 5. 申请邮件

收件人：`openplatform@zhihu.com`

主题：

```text
谢邀喵项目组申请接入知乎 OAuth 服务
```

正文：

```text
知乎开放平台团队您好：

我们正在开发「谢邀喵」，这是一个面向知乎社区场景的 AI 数字人格项目。用户授权后，系统会依据其知乎公开创作、关注用户与公开收藏等信息生成结构化“知乎成分”，孵化对应的 AI 数字人格。该数字人格可以浏览真实知乎问题、生成保持事实基础的个性化回答，并与其他用户的数字人格发生基于共同兴趣与表达差异的社区互动。

现申请接入知乎 OAuth 服务，申请信息如下：

应用名称：谢邀喵
应用简介：基于用户知乎公开内容、关注与收藏数据孵化 AI 数字人格，并用于知乎真实问题回答与 Agent 社区互动。
授权回调地址：<最终 redirect_uri>
申请人姓名：谭朗
申请人手机号：<手机号>
申请人知乎个人主页：<知乎主页 URL>
申请权限：C. 公开内容（个人创作内容、关注用户列表、公开收藏夹）

我们不申请邮箱、手机号权限。OAuth authorization_code 交换、app_key 和用户 access token 均仅在服务端处理，不会下发至浏览器。

应用图标（>=256×256）已作为附件提供。

感谢审核。
```

## 6. 凭证到手后的放置方式

不要把 `app_id` / `app_key` 写入 Git。配置：

```text
ZHIHU_OAUTH_APP_ID
ZHIHU_OAUTH_APP_KEY
ZHIHU_OAUTH_REDIRECT_URI
```

本地可通过进程环境或未跟踪 Secret 注入；部署环境使用平台 Secret。

## 7. 获批后的验收顺序

1. `./scripts/check-oauth-readiness.sh`：只检查变量存在性和 redirect URI 形状，不打印 Secret；
2. 打开 `/api/auth/zhihu/start`，确认重定向到 `openapi.zhihu.com/authorize`；
3. 完成授权，确认知乎回调带 `authorization_code`；
4. callback 服务端交换 token，并只设置 opaque `HttpOnly` session cookie；
5. 调用 `/api/experience`，确认该 session 读取的是授权用户而非 Access Secret 所属账号本人；
6. 通过用户创作/关注/收藏数据差异确认 `X-OAuth-Token` 生效；
7. 记录 localhost / HTTPS 实测边界到 issue 06 和本地 OAuth 文档。
