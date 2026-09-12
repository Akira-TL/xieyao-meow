# 知乎 API 使用说明（项目工作稿）

> 官方开发手册：`https://my.feishu.cn/docx/Mc80dR5XvoPaYDxcTasc04POnjd`
>
> 2026-09-12 初始化时，公开抓取该链接会跳转飞书登录页，当前无法读取正文。因此本文档把**项目已有记录**与**项目侧实现约定**分开书写；任何标记为“待官方确认”的字段、接口和配额，在真实实现前都必须回到官方开发手册核验。

## 1. 使用目标

知乎 API 在「谢邀喵」中承担四类职责：

1. **身份与用户数据**：取得用户授权，并读取可用于“知乎成分”与 Persona 构建的公开/授权数据。
2. **真实问题来源**：通过热榜、搜索等接口取得真实知乎问题。
3. **知识基础**：通过知乎内容或直答 Agent 获得问题背景、事实和观点，作为 Knowledge Layer 输入。
4. **作品回流**：若官方接口允许，进一步探索回答卡片、分享或社区回流能力；具体写入权限待官方确认。

## 2. 当前已有记录

以下内容来自现有《谢邀喵产品定义 v1》，尚未在本次初始化中通过官方开发手册逐条核验：

| 能力 | 项目当前记录 | 核验状态 |
|---|---:|---|
| 热榜 | 约 100 次/天 | 待官方确认 |
| 搜索 | 约 1000 次/天 | 待官方确认 |
| 直答 Agent | 约 100 次/天 | 待官方确认 |
| OAuth `app_id` | 项目记录为纯数字 | 待官方确认 |
| OAuth 回调 | 需要公网 HTTPS，项目记录称 `127.0.0.1` 无法完成真实登录 | 待官方确认 |
| 应用凭证 | 项目记录提到 `app_id` / `app_key` / Access Secret | 待官方确认具体字段名与用途 |

**不要依据上表直接硬编码生产逻辑。** 第一优先级 issue 是取得官方手册正文并真实调用接口。

## 3. 项目侧适配层

无论官方最终字段如何，应用内部都应通过 adapter 隔离知乎 API，避免页面和 Persona 逻辑直接依赖原始响应。

建议的内部接口：

```ts
interface ZhihuGateway {
  getAuthorizationUrl(input: AuthorizationRequest): Promise<string>;
  exchangeAuthorizationCode(code: string): Promise<AuthSession>;
  getCurrentUser(session: AuthSession): Promise<ZhihuUserProfile>;
  getTrendingQuestions(): Promise<ZhihuQuestion[]>;
  searchQuestions(query: string): Promise<ZhihuQuestion[]>;
  getKnowledgeContext(questionId: string): Promise<KnowledgeContext>;
}
```

这些 TypeScript 名称是**本项目内部抽象**，不是知乎官方 SDK 字段。

## 4. 推荐调用链路

### OAuth / Persona

```text
用户点击登录知乎
  ↓
生成知乎授权 URL
  ↓
知乎 OAuth
  ↓
公网 HTTPS callback
  ↓
后端换取授权态
  ↓
拉取当前用户可访问数据
  ↓
Normalize 为项目内部 UserProfile
  ↓
成分分析
  ↓
Persona JSON
```

### 问题回答

```text
热榜 / 搜索
  ↓
Question Normalizer
  ↓
Knowledge Layer
  ├─ 知乎内容
  ├─ 直答 Agent
  └─ 必要时自备 LLM fallback
  ↓
Persona Layer
  ↓
回答卡片
```

## 5. 配额与缓存策略

由于项目记录显示部分接口存在较低日配额，黑客松 Demo 不应把稳定性建立在实时无限调用上。

### 推荐策略

- 热榜结果落盘或进入短期缓存；
- 搜索结果按 query 缓存；
- 直答 Agent 结果按 `questionId` 缓存；
- Demo 题库在开发早期预热；
- 保留一组已真实请求成功的演示问题作为 fallback；
- 官方直答不可用时，可切换自备 LLM，但 UI 必须能区分数据来源，避免把自备结果伪装成知乎官方结果。

### 建议缓存键

```text
zhihu:trending:<date>
zhihu:search:<normalized-query>
zhihu:question:<question-id>
zhihu:knowledge:<question-id>:<source-version>
```

缓存格式属于项目内部设计，不是官方要求。

## 6. OAuth 与部署

项目当前记录认为 OAuth 需要公网 HTTPS callback，因此开发环境应尽早部署一个可重复访问的测试环境，不要等到前端完成后才验证登录。

当前候选部署环境：**Sealos**。

项目侧建议环境变量：

```text
ZHIHU_APP_ID=
ZHIHU_APP_KEY=
ZHIHU_ACCESS_SECRET=
ZHIHU_OAUTH_REDIRECT_URI=
```

以上变量名是本项目约定，官方真实凭证名称和是否全部需要仍待开发手册确认。

### 安全要求

- Access Secret 等服务端凭证只能保存在服务端环境变量或 Secret 管理系统；
- 不写入 Git；
- 不透传到浏览器；
- OAuth callback 必须校验项目所采用的防伪状态参数；具体字段名依据官方协议实现；
- 日志不得输出完整 token、secret 或授权 code。

## 7. Persona 数据最小化

只有实际用于 Persona 的知乎数据才进入内部结构，避免把完整 API 响应长期保存。

建议内部只保留：

- 兴趣主题分布；
- 关注对象的类别统计；
- 创作长度与表达风格统计；
- 活跃时间段；
- 收藏行为的聚合特征；
- 为 Demo 明确需要的公开用户信息。

最终可用字段由 OAuth scope 和官方 API 实际返回决定。

## 8. Windows 初始化问题记录

现有项目记录表明，官方 `init_project.mjs` 在 Windows 曾出现兼容问题：

- 脚本硬编码 `/usr/bin/unzip`；
- Node `path.join` 在 Windows 产生反斜杠路径；
- Unix `unzip` 无法识别对应路径。

此前已验证的绕过方式：

1. 手动复制官方模板；
2. 手动解压官方 skill 到 `.codex/skills/zhihu`；
3. 手动创建 `hackathon.config.json`。

该记录用于复现环境问题，不代表官方当前版本仍然存在同样缺陷。

## 9. 官方手册补全清单

取得开发手册正文后，至少补齐以下内容：

- [ ] OAuth authorize endpoint；
- [ ] token endpoint；
- [ ] scope 列表；
- [ ] callback 参数；
- [ ] token 生命周期与刷新机制；
- [ ] 当前用户接口及可返回字段；
- [ ] 关注、收藏、创作相关接口与权限；
- [ ] 热榜 endpoint、响应结构、配额；
- [ ] 搜索 endpoint、响应结构、配额；
- [ ] 直答 Agent endpoint、输入输出、配额；
- [ ] API 错误码与重试策略；
- [ ] Token 支持的申请和使用方式；
- [ ] 内容写入、分享、发布权限；
- [ ] 比赛环境与正式环境是否存在差异；
- [ ] `hackathon.config.json` 正式 schema；
- [ ] 官方 Skill 的调用方式；
- [ ] 提交作品时的 API 使用合规要求。

## 10. 实现门槛

在以下事实得到真实接口验证前，不把 OAuth / API 集成视为完成：

1. 成功获得应用凭证；
2. 公网 HTTPS callback 能收到真实 OAuth 回调；
3. 能换取有效授权态；
4. 能取得至少一个真实用户数据接口响应；
5. 能取得至少一个真实问题；
6. 能取得 Knowledge Layer 所需的真实内容或直答结果；
7. 明确每个关键 endpoint 的配额、错误码和降级路径。
