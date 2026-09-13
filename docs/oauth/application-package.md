# 知乎 OAuth 申请包｜谢邀喵

> 状态：公开部署域名与 HTTPS callback 已就绪；待补申请人手机号、知乎个人主页与应用图标附件后即可发送申请。
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
| redirect_uri | `https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback` | 已确定并已启用 HTTPS |
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

当前比赛环境已经固定公开部署 origin：

```text
https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback
```

该域名已解析并启用 Let's Encrypt HTTPS，比赛期间保持不变。OAuth token 交换请求会再次携带 `redirect_uri`，部署环境应与申请配置保持完全一致。

## 5. 申请邮件

收件人：`openplatform@zhihu.com`

主题：

```text
【谢邀喵｜知乎黑客松 2026 参赛项目】申请接入知乎 OAuth 服务（比赛联调紧急）
```

正文：

```text
知乎开放平台团队您好：

我们正在参加「知乎黑客松 2026｜校园新锐季」，参赛项目为「谢邀喵」。这是一个面向知乎真实社区场景的 AI 数字人格产品：用户授权后，系统会依据其知乎公开创作、关注用户与公开收藏等信息生成结构化“知乎成分”，孵化对应的 AI 数字人格；该数字人格可以浏览真实知乎问题、形成个性化表达，并与其他用户的数字人格发生基于共同兴趣与观点差异的可解释互动。

现申请接入知乎 OAuth 服务，申请信息如下：

应用名称：谢邀喵
应用简介：基于用户知乎公开内容、关注与收藏数据孵化 AI 数字人格，并用于知乎真实内容探索、人格表达与 Agent 社区互动。
授权回调地址：https://xieyao-meow.babelbeast.com/api/auth/zhihu/callback
申请人姓名：谭朗
申请人手机号：<手机号>
申请人知乎个人主页：<知乎主页 URL>
申请权限：C. 公开内容（个人创作内容、关注用户列表、公开收藏夹）

我们仅申请 C「公开内容」权限，不申请邮箱和手机号权限。OAuth authorization_code 交换、app_key 与用户 access token 均只在服务端处理，不会下发至浏览器；公开回调地址已完成 DNS、HTTPS 与服务端 callback 部署，可在凭证下发后立即进行真实联调。

本项目当前正处于黑客松 48 小时开发阶段：比赛已于 9 月 13 日 10:00 开始，最终提交时间为 9 月 15 日 10:00。OAuth 是我们完成“用户授权 → 真实知乎公开数据 → 数字人格孵化”核心体验闭环的关键能力，因此时间非常紧迫。如条件允许，恳请协助加急审核或优先处理本次 OAuth 接入申请，以便我们能在最终提交前完成真实用户授权链路的联调与验收，非常感谢。

应用图标（>=256×256）随邮件附件提供。

如还需要补充任何材料，我们可以第一时间配合提供。

感谢支持！
谢邀喵项目组
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
