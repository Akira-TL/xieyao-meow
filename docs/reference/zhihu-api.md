# 知乎 API 使用说明

> 状态：2026-09-12 已根据知乎数据开放平台官方文档核验主要接口。
>
> 官方文档中心：`https://developer.zhihu.com/docs`
>
> 调查证据与页面级来源：`docs/research/zhihu-open-platform-2026-09-12.md`
>
> 官方接口正文的本地可检索快照：`docs/reference/zhihu-open-platform/README.md`。实现时优先用 `rg` 检索该目录核对字段与错误码。

## 1. 本项目需要的知乎能力

「谢邀喵」把知乎开放平台能力分成三层：

1. **应用级数据能力**：热榜、搜索、问题回答、直答 Agent。使用 Access Secret 调用。
2. **用户授权数据能力**：终端用户的创作摘要、关注、收藏、收藏夹。使用 Access Secret，并对其他已授权用户额外携带 `X-OAuth-Token`。
3. **项目内部 Persona 能力**：把官方 API 结果 Normalize 为“知乎成分”和 Persona。该层是项目自定义逻辑，不是知乎官方 API。

## 2. 鉴权模型

### 2.1 通用数据 API

官方统一 Bearer 鉴权：

```http
Authorization: Bearer <your_access_secret>
X-Request-Timestamp: <unix_seconds>
Content-Type: application/json
```

`X-Request-Timestamp` 为秒级 Unix 时间戳；额度查询文档明确要求与服务端时间相差不超过 10 分钟。

Access Secret 从知乎开放平台个人中心获取。

### 2.2 OAuth 用户身份

OAuth **不是**搜索、热榜、直答等 API 的基础鉴权方式。它用于：

- 知乎第三方登录；
- 在应用 Access Secret 基础上读取被授权终端用户的个人数据。

读取其他已授权用户的数据时：

```http
Authorization: Bearer <your_access_secret>
X-OAuth-Token: <oauth_access_token>
X-Request-Timestamp: <unix_seconds>
```

不传 `X-OAuth-Token` 时，用户数据 API 查询 Access Secret 所属账号本人。

## 3. OAuth 2.0

官方页面：`https://developer.zhihu.com/docs?key=zhihu_oauth_integrated`

### 3.1 申请 app_id / app_key

当前需邮件申请：

```text
openplatform@zhihu.com
```

必填材料包括应用名称、简介、>=256×256 图标、`redirect_uri`、申请人姓名、手机号、知乎个人主页和申请权限。

权限选项：

- A：邮箱；
- B：手机；
- C：公开内容（个人创作、关注用户列表、公开收藏夹）。

**谢邀喵只需要申请 C。**

### 3.2 Authorization Code Flow

授权入口：

```text
https://openapi.zhihu.com/authorize?redirect_uri={redirect_uri}&app_id={app_id}&response_type=code
```

回调：

```text
{redirect_uri}?authorization_code={authorization_code}
```

换 token：

```http
POST https://openapi.zhihu.com/access_token
Content-Type: application/x-www-form-urlencoded
```

参数：

```text
app_id
app_key
grant_type=authorization_code
redirect_uri
code=<authorization_code>
```

成功响应关键字段：

```json
{
  "access_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

OAuth code 交换和用户 token 使用都必须在服务端完成。

### 3.3 仍待实测/官方确认

当前官方 OAuth 页面没有说明：

- `state`；
- URL `scope` 参数；
- PKCE；
- refresh token；
- revoke；
- callback 必须 HTTPS；
- localhost / `127.0.0.1` 是否允许。

因此旧记录“OAuth 必须公网 HTTPS、127.0.0.1 不能完成真实登录”**不能作为官方合同**。真实 app_id/app_key 到手后再验证 callback 限制。

## 4. Persona 用户数据

### 4.1 用户内容

```text
GET https://developer.zhihu.com/api/v1/user/contents
```

主要参数：

| 参数 | 说明 |
|---|---|
| `ContentType` | 必填：`all/answer/article/zvideo/pin/question` |
| `Offset` | 默认 0 |
| `Limit` | 默认 20，最大 50 |
| `SortField` | `like_count/ts`，默认 `ts` |
| `SortOrder` | `asc/desc`，默认 `desc` |

主要字段：`ContentType`、`Url`、`CreatedAt`、`LikeCount`、`CommentCount`、`FavoriteCount`、`Title`、`Summary`。

**注意：OAuth 用户这里只能拿标题/摘要等列表数据，不是全文。**

### 4.2 用户关注

```text
GET https://developer.zhihu.com/api/v1/user/followees
```

Offset/Limit 分页，Limit 最大 50。返回用户名、UrlToken、主页、头像、Headline、Gender、FollowerCount。

### 4.3 近期收藏

```text
GET https://developer.zhihu.com/api/v1/user/collections
```

`Limit` 默认 20。返回收藏内容的类型、标题、摘要、作者、互动指标、收藏时间及所属收藏夹。

### 4.4 收藏夹列表

```text
GET https://developer.zhihu.com/api/v1/user/favlists
```

返回 `UrlToken`、链接、标题、描述、公开状态。

### 4.5 收藏夹内容

```text
GET https://developer.zhihu.com/api/v1/user/favlist_contents
```

`FavlistUrlToken` 必填，支持 Offset/Limit 分页。

### 4.6 Persona 数据映射建议

| 官方信号 | 项目内部特征 |
|---|---|
| 收藏/收藏夹标题与摘要 | 兴趣主题分布、囤积癖彩蛋 |
| 关注用户及 Headline | 关注圈层、偏好答主类型 |
| 创作标题/摘要/内容类型 | 表达主题、长短答倾向、语体 |
| CreatedAt / FavTime | 活跃时段与作息倾向 |
| Like/Comment/FavoriteCount | 创作影响力与表达密度辅助特征 |

不需要把完整官方响应长期保存；Persona 生成后优先保留聚合特征。

## 5. 真实问题与知识基础

### 5.1 知乎搜索

```text
GET https://developer.zhihu.com/api/v1/content/zhihu_search
```

- `Query` 必填；
- `Count` 默认 10、最大 10；
- `SortBy` 可按 `CommentCount`、`VoteUpCount`、`EditTime` 排序/过滤；
- 当前文档明确 `HasMore=false`，不能依赖翻页。

可返回标题、内容类型/ID、摘要、链接、互动指标、作者、发布时间、精选评论、权威等级和排序分数。

### 5.2 热榜

```text
GET https://developer.zhihu.com/api/v1/content/hot_list
```

`Limit` 默认 30、最大 30。当前返回问题和文章两类，字段包括标题、知乎 URL、缩略图和摘要。

### 5.3 问题回答摘要

```text
GET https://developer.zhihu.com/api/v1/content/question_answers
```

参数：

- `QuestionUrl` 必填；
- `Offset` 默认 0；
- `Limit` 默认 20，范围 1–50。

返回回答链接、ContentToken、Summary 和分页状态。

`Summary` 是服务返回的摘要或截取文本，不是回答全文，也不是本接口额外生成的 AI 摘要。

该接口使用独立 `question_answers` 额度。官方文档写明默认 100 次/自然日、低额度用户 10 次；实际额度以 `/api/v1/quota` 为准。

### 5.4 问题推荐

```text
GET https://developer.zhihu.com/api/v1/user/question_recommendations
```

- 不传 `Query`：按 Access Secret 所属账号画像推荐；
- 传 `Query`：按主题推荐；
- `Count` 默认 5、范围 1–20；
- 不支持分页。

该接口没有文档化 `X-OAuth-Token` 用户切换，因此**不要用它实现每个终端用户的个性化问题推荐**。谢邀喵应自己根据 Persona 对热榜/搜索结果排序。

## 6. 直答 Agent

```text
POST https://developer.zhihu.com/v1/chat/completions
```

当前正式支持：

```text
model
messages
stream
```

模型：

```text
zhida-fast-1p5
zhida-thinking-1p5
zhida-agent
```

`stream=false` 返回 Chat Completions 风格 JSON；`stream=true` 返回 SSE，并以 `data: [DONE]` 结束。

项目侧把直答作为 Knowledge Layer 的一种来源，不让 Persona Layer 修改事实基础。

## 7. 本人创作增强能力

以下能力**仅支持 Access Secret 所属账号本人，不接受 OAuth 身份切换**：

```text
GET /api/v1/user/content_detail
GET /api/v1/user/content_comments
GET /api/v1/user/creator_account_stats
GET /api/v1/user/creator_content_stats
```

其中：

- `content_detail` 可返回本人创作全文 `Body`；
- `content_comments` 可读取本人创作下评论；
- 创作统计可返回阅读、互动、粉丝和部分受众画像。

这些接口不能作为任意谢邀喵用户 Persona 的必需数据源。

## 8. 官方额度

```text
GET https://developer.zhihu.com/api/v1/quota
```

该查询不消耗业务额度。

可查询 ID：

```text
global_search
zhihu_search
hot_list
question_answers
user_data
creator
zhida_openai
knowledge
tools
```

返回：

```text
TotalQuota
TotalUsed
RemainingQuota
```

**实际额度以当前 Access Secret 查询结果为准。** 不再把“搜索 1000/天”等旧记录硬编码为事实。

2026-09-12 使用本项目真实 Access Secret 查询得到的额度快照：

| API ID | 每日总额度 | 首轮黑盒测试后已用 |
|---|---:|---:|
| `zhihu_search` | 5000 | 1 |
| `hot_list` | 100 | 2 |
| `question_answers` | 100 | 1 |
| `user_data` | 10000 | 6 |
| `creator` | 100 | 1 |
| `zhida_openai` | 100 | 1 |

其中 `/api/v1/quota` 本身不消耗业务额度。该快照只代表当日当前账号/租户，不应作为所有部署环境的固定常量；运行时仍应查询 quota。

官方对应页面另明确写明：

- `question_answers`：默认 100/自然日，低额度账号 10；
- `creator`：默认 100/自然日，低额度账号 10。

## 9. 错误码与重试

常见：

| Code | 含义 | 项目策略 |
|---:|---|---|
| 0 | 成功 | 正常处理 |
| 10001 | 参数错误 | 不重试，修请求 |
| 20001 | 鉴权/授权失败 | 停止调用，检查凭证/用户授权 |
| 30001 | 频率、并发或当日额度限制 | 先查 quota，区分短时限制与日额度 |
| 30002 | 配额/累计成功次数额度耗尽 | 降级或等待额度恢复 |
| 30003 | 风控拒绝 | 不自动高频重试 |
| 90001 | 服务内部错误 | 有限退避重试，保留 fallback |

未携带有效 Access Secret 实测 `/api/v1/quota` 已返回 `Code=20001`。

## 10. 项目内部 Gateway

官方响应应隔离在 adapter 后面：

```ts
interface ZhihuGateway {
  getAuthorizationUrl(input: AuthorizationRequest): Promise<string>;
  exchangeAuthorizationCode(code: string): Promise<AuthSession>;
  getUserContents(session: AuthSession): Promise<ZhihuContent[]>;
  getUserFollowees(session: AuthSession): Promise<ZhihuFollowee[]>;
  getUserCollections(session: AuthSession): Promise<ZhihuCollection[]>;
  getUserFavlists(session: AuthSession): Promise<ZhihuFavlist[]>;
  getTrendingQuestions(): Promise<ZhihuHotItem[]>;
  searchZhihu(query: string): Promise<ZhihuSearchItem[]>;
  getQuestionAnswers(questionUrl: string): Promise<ZhihuAnswerSummary[]>;
  askZhida(input: ZhidaRequest): Promise<KnowledgeContext>;
  getQuota(): Promise<ZhihuQuota[]>;
}
```

以上 TypeScript 名称属于项目内部抽象，不是官方 SDK。

## 11. 推荐 L0 调用链路

```text
应用 Access Secret
   │
   ├── /quota
   ├── 热榜 / 搜索 / question_answers / 直答
   │
   └── OAuth app_id/app_key
           ↓
       用户授权
           ↓
       OAuth access_token
           ↓
Authorization: Bearer <Access Secret>
X-OAuth-Token: <user token>
           ↓
contents + followees + collections + favlists
           ↓
Normalize
           ↓
知乎成分
           ↓
Persona
           ↓
Persona 对热榜/搜索候选问题排序
           ↓
question_answers / 直答 → Knowledge Layer
           ↓
Persona Layer
           ↓
回答卡片
```

## 12. 配额与 Demo 稳定性

缓存建议：

```text
zhihu:quota:<date>
zhihu:hot:<date-or-window>
zhihu:search:<normalized-query>
zhihu:question-answers:<question-url>:<offset>
zhihu:knowledge:<question-id>:<source-version>
```

黑客松现场保留已真实请求成功的 Demo 题目和 Knowledge Layer 结果作为 fallback，但 UI/日志必须区分真实知乎数据与自备 LLM 降级结果。

## 13. Secret 约束

服务端建议使用：

```text
ZHIHU_ACCESS_SECRET=
ZHIHU_OAUTH_APP_ID=
ZHIHU_OAUTH_APP_KEY=
ZHIHU_OAUTH_REDIRECT_URI=
```

OAuth 用户 token 应作为用户会话级服务端 Secret 保存，而不是单一全局环境变量。

禁止：

- Secret/token 写入 Git；
- Secret/token 返回浏览器前端；
- 日志输出完整 Secret、OAuth token、authorization code；
- 把 Access Secret 与 OAuth app_key 混为同一个凭证。

## 14. 真实凭证黑盒验证

2026-09-12 已使用真实 Access Secret 做最小调用，测试过程中不输出、不提交 Secret，也不把本人内容写入仓库。

已成功验证：

- [x] `/api/v1/quota`：有效 Bearer 鉴权成功；
- [x] `/api/v1/content/hot_list`：真实热榜成功；
- [x] `/api/v1/content/zhihu_search`：真实搜索成功；
- [x] `/api/v1/content/question_answers`：从真实热榜问题取得回答摘要；
- [x] `/api/v1/user/contents`：本人公开内容列表成功；
- [x] `/api/v1/user/followees`：本人关注列表成功；
- [x] `/api/v1/user/collections`：本人近期收藏成功；
- [x] `/api/v1/user/favlists`：本人收藏夹列表成功；
- [x] `/api/v1/user/favlist_contents`：指定收藏夹内容成功；
- [x] `/api/v1/user/question_recommendations`：Access Secret 所属账号画像推荐成功；
- [x] `/v1/chat/completions` + `zhida-fast-1p5`：非流式直答成功。

首轮过程中出现过一次 TLS `SSL_ERROR_SYSCALL`，随后使用有限连接重试正常成功；因此项目 HTTP 客户端应针对连接层失败做有限退避，而不能把它误判成知乎业务错误码。

## 15. 当前未完成项

- [x] Bearer 鉴权方式；
- [x] OAuth authorize/token 流程；
- [x] OAuth token 生命周期字段；
- [x] 用户创作/关注/收藏/收藏夹接口；
- [x] 热榜接口；
- [x] 搜索接口；
- [x] 问题回答接口；
- [x] 问题推荐边界；
- [x] 直答 Agent 接口；
- [x] 官方 quota 查询方式与真实额度；
- [x] 主要错误码；
- [x] 有效 Access Secret 的真实成功调用；
- [x] 真实本人 user_data 响应；
- [ ] OAuth app_id/app_key 获批；
- [ ] OAuth callback HTTPS/localhost 限制实测；
- [ ] 完成一次终端用户 OAuth 并读取 `X-OAuth-Token` 用户数据。
