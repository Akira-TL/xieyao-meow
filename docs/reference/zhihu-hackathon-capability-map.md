# 知乎黑客松 2026｜官方能力地图

> 状态：2026-09-12 官方开发者手册 + 官方 Hackathon Skill + 开放平台文档交叉整理。
>
> 目的：先弄清楚比赛到底给了什么，再决定产品，不把 PoC 实现反过来当产品定义。

## 1. 作品运行形态

官方开发者手册明确要求网页类作品提交 **公网可访问的可运行 Demo 链接**，供评委直接上手完整体验。

因此作品结构应理解为：

```text
知乎站内项目广场
    ↓ 作品曝光 / 人气 / Demo 入口
团队自己的公网 Web App
    ↓ 服务端调用
知乎开放平台 API / OAuth / 直答
```

知乎项目广场不是前端托管平台。作品真正运行在参赛团队自己的网页、App、插件、桌面客户端或硬件载体中。

官方手册同时说明：

- 9 月 13 日项目广场在知乎站内正式曝光；
- idea 阶段也建议尽早提交占位；
- 网页项目推荐接入知乎 OAuth；
- OAuth 登录人数会作为人气奖评定因素之一；
- 必交材料是“可运行体验链接”和“产品说明计划书”；代码仓库与演示视频是选交加分材料。

## 2. 官方手册列出的七类能力 + 刘看山 IP

### 2.1 知乎热榜

官方定位：把握中文互联网实时热点。

手册列出 `GET /api/v1/content/hot_list`，适合热点发现、内容背景、话题入口。

产品可能用途：

- 宠物每天“出去逛”时的公共事件池；
- 社区里所有宠物共同遭遇的当天话题；
- 首次体验时给 Agent 一个真实知乎问题，而不是自造题。

### 2.2 知乎故事

官方手册描述：开放五个品类的故事内容，包含标题、摘要、作者、标签、导语、正文等，可做改编、续写和互动表达。

**当前状态：比赛手册明确提供该能力，但当前下载的官方 `zhihu` Skill 0.2.1 没有把故事接口暴露为日常 CLI 能力；具体 HTTP 合同还需要继续从最新开放平台文档确认。**

产品可能用途：宠物冒险、小游戏、事件副本；不是 AB 主链路必需能力。

### 2.3 知乎关注流

官方手册给出的示例：

```text
GET /openapi/feed/following
GET /openapi/user/following
GET /openapi/user/followers
```

用途是关注关系、关注内容流、真实社交关系与个性化推荐。

**当前状态：手册明确写出这些接口，但当前下载的 `zhihu` Skill 用户 API 文档使用的是另一组正式用户数据接口，例如 `/api/v1/user/followees`；两组合同不能直接视为同一套，需继续核验最新开发平台。**

### 2.4 知乎搜索

官方正式接口：

```text
GET https://developer.zhihu.com/api/v1/content/zhihu_search
```

用于搜索知乎问题、回答和文章，可获得摘要、作者、互动数据、权威度等信号。

产品可能用途：

- 根据用户兴趣给宠物寻找内容；
- 为“为什么你们匹配”提供共同话题证据；
- 为 Agent 讨论寻找真实知乎上下文。

### 2.5 全网搜索

官方正式接口：

```text
GET https://developer.zhihu.com/api/v1/content/global_search
```

可按站点、发布时间等过滤全网内容。

产品可能用途：知识补充和事实核验；对于主赛道“灵魂匹配局”不是首屏能力。

### 2.6 知乎知识

官方手册描述：把知识内容以易理解形式呈现、支持热点知识讨论等。

**当前状态：手册确认了“知乎知识”这一类能力，但当前下载的 `zhihu` Skill 0.2.1 中没有足够资料确定单一 HTTP endpoint；需要继续对最新开放平台页面逐项核验，不能自行猜接口。**

### 2.7 直答 Agent

官方正式接口：

```text
POST https://developer.zhihu.com/v1/chat/completions
```

用于基于知乎优质内容生成回答，可与搜索、内容上下文结合。

产品可能用途：

- Agent 对真实话题的理解与总结；
- 让宠物在知识边界内形成个性化表达；
- Agent × Agent 交流前的内容理解。

### 2.8 刘看山 IP

官方手册额外提供刘看山三视图和透明动态素材。

本项目已归档：

```text
docs/reference/official-assets/
```

动态包包含待机、打招呼、晃悠、电脑、瞌睡、运球六个动作。它非常适合作为新手引导 NPC、项目入口角色或“知乎世界”的官方向导，而不必取代用户自己的谢邀喵。

## 3. 用户自己的知乎 Context（OAuth / 用户数据）

官方用户数据 API 当前确认：

```text
GET /api/v1/user/contents
GET /api/v1/user/followees
GET /api/v1/user/favlists
GET /api/v1/user/favlist_contents
GET /api/v1/user/collections
```

同一接口支持两种身份：

```text
Access Secret only
→ Access Secret 所属知乎账号本人

Access Secret + X-OAuth-Token
→ 当前完成 OAuth 授权的第三方用户
```

对「谢邀喵」而言，这一组数据比公共内容 API 更接近核心 Persona 输入：

- 创作标题/摘要与互动数据；
- 关注用户；
- 收藏夹主题；
- 收藏内容；
- 最近收藏行为。

## 4. 已验证与待核验边界

### 已经有正式合同或真实调用验证

- Access Secret Bearer 鉴权；
- 知乎搜索；
- 全网搜索（官方 Skill 文档合同已落地，本项目仍应做最小真实调用验收）；
- 热榜；
- 问题回答摘要；
- 直答 Agent；
- 用户创作 / 关注 / 收藏夹 / 收藏内容 / 最近收藏；
- quota 查询；
- OAuth Authorization Code Flow 的文档合同。

### 仍需继续查死

- “知乎故事”的最新正式 HTTP endpoint 与字段；
- “知乎知识”的最新正式 HTTP endpoint 与字段；
- 比赛手册里的 `/openapi/feed/following`、`/openapi/user/following`、`/openapi/user/followers` 与当前开放平台用户 API 的关系；
- OAuth app_id/app_key 实际申请与最终第三方用户真实授权边界。

## 5. 额度信息不要混用

比赛手册曾写：知乎搜索 1000 次/天；当前官方 `zhihu` Skill 的开放平台说明写的是 5000 次/天；本项目 2026-09-12 对自己的 Access Secret 调 `/api/v1/quota` 得到知乎搜索 5000 次/天。

因此：

- 手册中的数字作为比赛材料历史记录；
- 实现时以最新开放平台合同与 `/api/v1/quota` 实际返回为准；
- 不把历史手册额度写死到产品逻辑。
