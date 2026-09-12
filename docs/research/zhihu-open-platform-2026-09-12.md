# 知乎开放平台调查记录｜2026-09-12

> 调查目标：为「谢邀喵」核验知乎开放平台的鉴权、OAuth、用户数据、热榜、搜索、问题回答与直答能力。
>
> 一手来源：知乎数据开放平台官方文档 `https://developer.zhihu.com/docs`。本文所列页面均通过官方文档中心实际读取；查询参数 `key` 用于稳定定位对应文档页。

## 1. 结论摘要

1. **通用数据 API 与 OAuth 是两层不同鉴权。** 搜索、热榜、直答等通用接口使用开放平台 **Access Secret**，请求头为 `Authorization: Bearer <your_access_secret>`，并同时要求 `X-Request-Timestamp` 秒级 Unix 时间戳。
2. **OAuth 用于第三方登录和访问“被授权用户”的个人数据。** 当读取当前 Access Secret 所属账号本人数据时，不需要 OAuth；读取其他用户公开范围内的创作、关注、收藏与收藏夹时，除 Access Secret 外，再通过 `X-OAuth-Token` 传入该用户 OAuth token。
3. **谢邀喵的 Persona 数据来源在官方 API 中确实存在。** 官方提供用户内容、关注、近期收藏、收藏夹列表和收藏夹内容 API，基本覆盖产品定义需要的行为信号。
4. **OAuth 最小权限只需要“公开内容”。** 官方申请材料把权限分为：A 邮箱、B 手机、C 公开内容（个人创作、关注用户列表、公开收藏夹）。本项目原则上无需邮箱和手机号。
5. **OAuth token 官方示例有效期为 3600 秒。** 当前 OAuth 文档没有说明 refresh token、revoke、PKCE、`state` 或 `scope` 参数。
6. **官方文档没有声明 callback 必须 HTTPS，也没有声明 localhost/127.0.0.1 禁止。** 只能确认 `redirect_uri` 必须在申请应用时提交，并在授权与换 token 时使用。此前项目中的“公网 HTTPS/127.0.0.1 不可用”应保留为待实测项，而不是官方事实。
7. **配额应通过官方 `/api/v1/quota` 动态查询，不应写死。** 该接口不消耗业务额度；不同账号/租户实际额度可能不同。问题推荐与问题回答文档明确给出默认 100 次/自然日、低额度账号 10 次，其余能力应以真实 quota 响应为准。
8. **知乎问题回答 API 很适合 Knowledge Layer。** 可直接根据完整问题 URL 获取回答摘要列表，不需要先用搜索猜回答。
9. **问题推荐 API 不等同于 OAuth 用户个性化推荐。** 官方文档描述它基于“当前 Access Secret 所属用户画像”或显式 Query 主题推荐，没有说明支持 `X-OAuth-Token` 身份切换。因此谢邀喵不能假定它会按每个终端用户画像推荐问题。
10. **本人创作全文/评论/创作统计仅支持 Access Secret 所属账号，不支持 OAuth 身份切换。** 对普通终端用户，Persona 需要基于 `user/contents` 返回的标题、摘要、互动指标及收藏/关注数据构建，不能假定能读取其全部创作正文。

## 2. 通用 Bearer 鉴权

官方页面：`https://developer.zhihu.com/docs?key=authorization`

知乎开放平台当前推荐的数据 API 鉴权：

```http
Authorization: Bearer <your_access_secret>
X-Request-Timestamp: <unix_seconds>
Content-Type: application/json
```

其中 `X-Request-Timestamp` 为秒级 Unix 时间戳。额度查询页进一步说明，与服务端时间相差不能超过 10 分钟。

未携带有效 Access Secret 调用 `GET https://developer.zhihu.com/api/v1/quota` 的实际响应已验证为：

```json
{"Code":20001,"Message":"Authorization failed","Data":null}
```

这证明业务 API 的 Bearer 鉴权路径真实存在；但这不等价于“已完成有效凭证调用”。

## 3. OAuth 2.0

官方页面：`https://developer.zhihu.com/docs?key=zhihu_oauth_integrated`

### 3.1 用途

官方明确说明：OAuth 用于集成知乎第三方登录，以及访问被授权用户的个人信息。若仅调用知乎数据开放平台通用 API、或只查看 Access Secret 所属账号本人的相关数据，不需要接入 OAuth。

### 3.2 应用申请

当前文档要求通过邮件申请 `app_id` 与 `app_key`：

- 邮箱：`openplatform@zhihu.com`
- 邮件主题：`<公司/组织/产品名称>申请接入知乎 OAuth 服务`
- 必填材料：
  - 应用名称；
  - 应用简介；
  - 应用图标，分辨率不低于 256×256，附件发送；
  - OAuth 回调地址 `redirect_uri`；
  - 申请人姓名；
  - 申请人手机号；
  - 申请人知乎个人中心地址；
  - 申请的用户权限。

用户权限选项：

- A：邮箱；
- B：手机；
- C：公开内容，包括个人创作内容、关注用户列表、公开收藏夹。

**谢邀喵建议仅申请 C。**

### 3.3 Authorization Code Flow

官方文档声明采用 OAuth 2.0 Authorization Code Flow。

授权 URL：

```text
https://openapi.zhihu.com/authorize?redirect_uri={redirect_uri}&app_id={app_id}&response_type=code
```

授权完成后回调：

```text
{redirect_uri}?authorization_code={authorization_code}
```

注意：回调参数名称是 `authorization_code`，而换 token 接口的请求字段名称是 `code`。

### 3.4 换取 Access Token

```text
POST https://openapi.zhihu.com/access_token
Content-Type: application/x-www-form-urlencoded
```

表单字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `app_id` | 是 | 申请获得的第三方 APP_ID |
| `app_key` | 是 | 申请获得的第三方 APP_KEY |
| `grant_type` | 是 | 固定 `authorization_code` |
| `redirect_uri` | 是 | 申请 APP_ID 时填写的回调地址 |
| `code` | 是 | 用户授权得到的 `authorization_code` |

成功响应示例字段：

```json
{
  "access_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

官方要求 authorization code 的交换和 OAuth access token 的使用均在应用后端完成，避免泄露 `app_key` 与用户令牌。

### 3.5 当前文档未说明的 OAuth 能力

本次读取到的官方 OAuth 页面**没有说明**：

- `state`；
- `scope` URL 参数；
- PKCE；
- refresh token；
- revoke endpoint；
- callback 是否必须 HTTPS；
- localhost / `127.0.0.1` 是否允许。

实现时不得自行假设这些能力存在。callback 限制需要真实应用凭证后实测或向官方确认。

## 4. Persona 所需用户数据 API

这些接口都要求 Access Secret。默认读取 Access Secret 所属账号本人；若读取已授权的其他用户，再附加：

```http
X-OAuth-Token: <oauth_access_token>
```

### 4.1 用户内容

官方页面：`https://developer.zhihu.com/docs?key=user_contents`

```text
GET /api/v1/user/contents
```

主要参数：

- `Offset`：默认 0；
- `Limit`：默认 20，最大 50；
- `ContentType`：必填，`all | answer | article | zvideo | pin | question`；
- `SortField`：`like_count | ts`，默认 `ts`；
- `SortOrder`：`asc | desc`，默认 `desc`。

每条内容可返回：`ContentType`、`Url`、`CreatedAt`、`LikeCount`、`CommentCount`、`FavoriteCount`、`Title`、`Summary`。

**产品含义：** 对普通 OAuth 用户可以分析创作主题、时间分布、标题/摘要风格、互动强度，但本接口并不返回全文。

### 4.2 用户关注

官方页面：`https://developer.zhihu.com/docs?key=user_followees`

```text
GET /api/v1/user/followees
```

返回关注用户的 `Fullname`、`UrlToken`、`Url`、`AvatarUrl`、`Headline`、`Gender`、`FollowerCount`，支持 Offset/Limit 分页，Limit 最大 50。

### 4.3 近期收藏

官方页面：`https://developer.zhihu.com/docs?key=user_collections`

```text
GET /api/v1/user/collections
```

`Limit` 默认 20。每条可返回内容类型、链接、创建/收藏时间、点赞/评论/收藏数、标题、摘要、作者以及所属收藏夹列表。

### 4.4 收藏夹列表

官方页面：`https://developer.zhihu.com/docs?key=user_favlists`

```text
GET /api/v1/user/favlists
```

返回：`UrlToken`、`Url`、`Title`、`Description`、`IsPublic`。`UrlToken` 可用于读取收藏夹内容。

### 4.5 收藏夹内容

官方页面：`https://developer.zhihu.com/docs?key=favlist_contents`

```text
GET /api/v1/user/favlist_contents
```

参数：

- `FavlistUrlToken`：必填；
- `Offset`：默认 0；
- `Limit`：默认 20。

返回内容字段与近期收藏相近，并提供分页信息。

### 4.6 用户数据 API 的共同错误码

| Code | 含义 |
|---:|---|
| 0 | 成功 |
| 10001 | 参数错误 |
| 20001 | 鉴权失败 |
| 30001 | 频率限制 |
| 30002 | 配额限制 |
| 90001 | 内部错误 |

## 5. 搜索、热榜与 Knowledge Layer

### 5.1 知乎搜索

官方页面：`https://developer.zhihu.com/docs?key=zhihu_search`

```text
GET /api/v1/content/zhihu_search
```

参数：

- `Query`：必填；
- `Count`：默认 10，最大 10；
- `SortBy`：支持 `CommentCount`、`VoteUpCount`、`EditTime` 的方向与数值区间过滤/排序。

返回的 `Items` 包含：标题、内容类型、内容 ID、摘要、知乎链接、评论数、赞同数、作者信息、时间、精选评论、权威等级、排序分数等。

当前官方文档明确写明：`HasMore` 当前固定返回 `false`。因此不能把该搜索接口当作可持续翻页的数据源。

### 5.2 热榜

官方页面：`https://developer.zhihu.com/docs?key=hot_list`

```text
GET /api/v1/content/hot_list
```

参数 `Limit` 默认 30、最大 30；越界会回退为 30。

返回 `Title`、`Url`、`ThumbnailUrl`、`Summary`。当前仅返回问题和文章两类热榜内容。

### 5.3 问题回答

官方页面：`https://developer.zhihu.com/docs?key=question_answers`

```text
GET /api/v1/content/question_answers
```

参数：

- `QuestionUrl`：完整知乎问题 URL，必填；
- `Offset`：默认 0；
- `Limit`：默认 20，范围 1–50。

返回回答 `ContentToken`、链接和 `Summary`，以及分页状态。官方特别说明 `Summary` 是服务返回的摘要或截取文本，**不是回答全文，也不是额外生成的 AI 摘要**。

该接口使用独立的“知乎问题回答”额度：官方文档写明默认每租户每自然日 100 次，未实名等低额度用户为 10 次；实际仍以 `/api/v1/quota` 为准。

### 5.4 问题推荐

官方页面：`https://developer.zhihu.com/docs?key=question_recommendations`

```text
GET /api/v1/user/question_recommendations
```

- 不传 `Query`：按当前 Access Secret 所属用户画像推荐；
- 传 `Query`：按主题推荐；
- `Count` 默认 5，范围 1–20；
- 不支持分页。

该能力与本人创作全文、评论、账号统计、单篇统计共用“创作能力”额度，官方文档写明默认 100 次/自然日，低额度用户 10 次。

**限制：** 文档没有说明可用 `X-OAuth-Token` 切换为终端用户画像，因此当前不能把它设计成“每个谢邀喵自动按自己的主人画像找问题”的基础能力。

## 6. 直答 Agent

官方页面：`https://developer.zhihu.com/docs?key=zhida`

```text
POST /v1/chat/completions
```

当前正式支持三个请求字段：

- `model`；
- `messages`；
- `stream`。

模型：

- `zhida-fast-1p5`；
- `zhida-thinking-1p5`；
- `zhida-agent`。

非流式响应为 OpenAI Chat Completions 风格；流式响应为 SSE，并以 `data: [DONE]` 结束。流式期间可能包含 `reasoning_content` 与 `content`，服务端还会发送 `: keep-alive` 心跳。

官方文档提醒：当前只保证 `model/messages/stream` 三个字段；其他请求字段不属于正式支持合同。实际可用模型还受租户授权配置影响。

## 7. 本人创作增强 API：不能用于 OAuth 用户身份切换

### 7.1 本人创作全文

官方页面：`https://developer.zhihu.com/docs?key=user_content_detail`

```text
GET /api/v1/user/content_detail
```

根据 `ContentUrl` 获取当前 Access Secret 所属账号自己发布的回答、文章、想法或视频关联正文，返回 `ContentType`、`ContentToken`、`Url`、`Title`、`Body`。

**仅支持当前 Access Secret 所属账号，不接受 OAuth 身份切换。**

### 7.2 本人创作评论

官方页面：`https://developer.zhihu.com/docs?key=user_content_comments`

```text
GET /api/v1/user/content_comments
```

分页获取 Access Secret 所属账号本人创作内容下的评论，也明确不接受 OAuth 身份切换。

### 7.3 创作统计

`creator_account_stats` 与 `creator_content_stats` 同样只支持 Access Secret 所属账号，不接受 OAuth 身份切换。其数据可包含阅读、互动、粉丝、活跃时间、兴趣/地域等受众画像，但不能直接用于任意终端用户的 Persona。

## 8. 官方额度查询

官方页面：`https://developer.zhihu.com/docs?key=quota`

```text
GET /api/v1/quota
```

特点：

- 不消耗业务额度；
- 可选 `APIIDs`，逗号分隔；
- 不提供时返回全部可展示额度；
- 账号关联多个租户时会汇总相关租户额度；
- 返回 `TotalQuota`、`TotalUsed`、`RemainingQuota`。

可查询 API ID：

| API ID | 能力 |
|---|---|
| `global_search` | 全网搜索 |
| `zhihu_search` | 知乎搜索 |
| `hot_list` | 热榜 |
| `question_answers` | 知乎问题回答 |
| `user_data` | 用户创作、关注、收藏、收藏夹 |
| `creator` | 问题推荐、本人全文/评论、创作统计 |
| `zhida_openai` | 直答 |
| `knowledge` | 知识库 |
| `tools` | PDF/PPT 工具 |

**结论：项目不得再把搜索、热榜、直答等额度写死为固定值；启动或后台诊断时调用 `/api/v1/quota` 才是权威值。**

## 9. 错误处理

基础数据接口常见：

| Code | 含义 |
|---:|---|
| 0 | 成功 |
| 10001 | 参数错误 |
| 20001 | 鉴权/授权失败 |
| 30001 | 调用频率、并发或当日额度限制 |
| 30002 | 配额/额外累计成功次数额度耗尽（部分接口） |
| 30003 | 风控拒绝（部分接口） |
| 90001 | 服务内部错误 |

产品侧应区分：参数错误、凭证错误、短时限流、自然日额度耗尽、风控和服务故障，不应统一无脑重试。

## 10. 对「谢邀喵」架构的直接影响

### L0 推荐数据流

```text
应用 Access Secret
  ├─ 热榜 / 搜索 / 问题回答 / 直答
  └─ OAuth 应用入口
          ↓
用户授权得到 OAuth access_token
          ↓
Access Secret + X-OAuth-Token
          ├─ /user/contents
          ├─ /user/followees
          ├─ /user/collections
          ├─ /user/favlists
          └─ /user/favlist_contents
          ↓
Normalize → 知乎成分 → Persona
```

### Persona 能做什么

可稳定依赖的终端用户信号：

- 创作标题、摘要、内容类型、发布时间和互动量；
- 关注用户信息；
- 近期收藏主题、作者、收藏时间；
- 收藏夹名称、描述与公开内容。

当前不能依赖：

- OAuth 用户完整创作正文；
- OAuth 用户创作后台统计与受众画像；
- OAuth 用户个性化的官方问题推荐。

### 建议最小 OAuth 权限

只申请 **C：公开内容**。邮箱和手机号对 Persona 没有必要，不增加权限面。

## 11. 尚未完成的实测

本机目前没有发现已配置的知乎 Access Secret：

- `ZHIHU_ACCESS_SECRET` 环境变量不存在；
- `~/.config/zhihu-search/credentials.json` 不存在；
- `~/.zhihu/openapi-credentials.json` 不存在；
- `~/.zhihu-cli/config.toml` 不存在。

因此本轮尚不能完成：

1. 有效 Access Secret 的 `/api/v1/quota` 调用；
2. 搜索/热榜/直答的真实成功响应；
3. 本人 `user_data` 成功响应；
4. OAuth app_id/app_key 真实授权；
5. callback 对 HTTPS、localhost/127.0.0.1 的实际限制验证。

下一人工边界是：登录知乎开放平台个人中心并创建/取得 Access Secret；OAuth 应用则需要按官方文档发邮件申请。
