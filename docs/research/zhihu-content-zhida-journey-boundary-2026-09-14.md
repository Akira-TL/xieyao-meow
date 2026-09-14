# 知乎内容发现与知乎直答在 Journey 中的职责边界 — 2026-09-14

## 研究问题

Journey 如何从真实知乎内容形成候选池？规则层、Persona、问题回答摘要与知乎直答分别负责 eligibility、排序、语义理解、表达和事实边界的哪一层？一次 Journey 应消费多少内容与上游额度，才能保持“猫替你错过大多数内容”的反 Feed 价值？

本研究只建立官方能力事实、当前实现差距与可实施边界；最终决策以 Wayfinder 决策票「定义知乎内容发现与知乎直答的旅行职责边界」的 resolution comment 为准。

## 一手来源

- `docs/reference/zhihu-api.md`：已按知乎开放平台官方文档核验并记录真实调用结果
- `docs/reference/zhihu-hackathon-capability-map.md`
- `docs/product/travel-frog-loop-v1.md`
- `docs/architecture/product-system-v1.md`
- `src/lib/zhihu/gateway.ts:122-173`
- `src/lib/experience/service.ts:20-75,104-166`
- `src/lib/experience/types.ts:11-58`

## 官方能力事实

### 热榜是公共候选池，不是个性化推荐器

官方 `GET /api/v1/content/hot_list` 最多返回 30 条当前热点，当前包含问题和文章；项目 Gateway 已实现 `getHotList(limit)`。

热榜适合作为“今天世界正在发生什么”的共享公共池，但它不认识当前终端用户 Persona，因此不能直接把热榜第一条当成用户 Journey 结果。

### 知乎搜索适合做 Persona 驱动的主题召回

官方 `GET /api/v1/content/zhihu_search` 需要 `Query`，单次最多 10 条，能返回标题、内容类型、摘要、链接与互动/权威等信号。

项目文档已明确：终端用户个性化推荐应由谢邀喵自己根据 Persona 对热榜/搜索结果排序，而不是依赖 `/user/question_recommendations`，因为后者没有文档化 `X-OAuth-Token` 用户切换合同。

### `question_answers` 提供真实知乎回答摘要，但额度相对稀缺

官方 `GET /api/v1/content/question_answers` 以 Question URL 为输入，返回回答链接、ContentToken 和 Summary；Summary 是服务返回的摘要/截取，不是回答全文，也不是额外 AI 摘要。

它使用独立额度。项目 2026-09-12 实测租户快照为 100 次/日，但运行时必须以 `/quota` 为准，不能把 100 写死成长期合同。

因此不能对候选池里的十几条问题逐条调用 `question_answers`；它应只用于**已经选中的主问题**，并通过 question URL 共享缓存。

### 知乎直答是生成/语义能力，不是原始事实记录

官方 `POST /v1/chat/completions` 提供 `zhida-fast-1p5`、`zhida-thinking-1p5`、`zhida-agent`。

项目当前已把直答定位为 Knowledge Layer 来源之一，并明确 Persona Layer 不得修改 Knowledge Layer 的事实边界。

这意味着直答可以：

- 整理选中问题的背景、主要解释框架和分歧；
- 在给定真实知乎摘要的前提下生成语义综合；
- 帮 Persona 把已建立的 Knowledge Context 转为个性表达。

但直答不能成为：

- “这条内容是否真实存在”的证明；
- 知乎官方观点或官方评分；
- 用户 Persona 兴趣的权威标签；
- 在没有来源证据时自行创造 Journey 发生过的知乎内容。

## 当前 PoC 与目标架构的差距

`src/lib/experience/service.ts` 当前流程是：

```text
getUserProfile
→ build Persona
→ getHotList(30)
→ 找到第一条 question
→ getQuestionAnswers(question, 5)
→ Zhida Knowledge synthesis
→ 第二次 Zhida Persona answer
```

这作为能力 PoC 合理，但不是长期 Journey 的目标行为：

1. 选题只取热榜第一题，没有 Persona 排序；
2. 没有兴趣搜索召回；
3. 没有最近 Journey 去重、route bias、关系上下文；
4. Knowledge 与 Persona 两次直答都发生在每次生成链路上，未利用“同题知识可跨用户共享缓存”的优势；
5. 如果把这套逻辑对候选池批量执行，会快速消耗 `question_answers` / `zhida_openai` 配额；
6. “直答生成结果”与“真实知乎问题/回答摘要证据”需要更明确的 provenance 分层。

## 目标流水线

Journey 的内容链路应分成五层：

```text
A. Shared Recall
   hot list cache
   + Persona-derived Zhihu search cache

B. Rule Eligibility
   source/type/URL validity
   quota/cost budget
   freshness
   duplicate/recent-history exclusion
   safety/provenance requirements

C. Persona Ranking
   root interests
   recent memory
   journey history
   route bias
   novelty / contrast
   relationship context

D. Evidence + Knowledge
   selected main question only
   → question_answers cache (0–5 summaries)
   → optional/cached Zhida Knowledge synthesis

E. Persona Expression
   Knowledge boundary + Persona style
   → postcard / reaction / Encounter turn / artifact copy
```

每一层职责不可倒置。

## A. Shared Recall：先召回，不做大模型逐条理解

### 公共池

使用共享 `hot_list` 缓存，作为“今天全体猫都可能经过的公共世界”。热榜缓存可被所有 Journey 共用，不为每个用户重复请求。

### 兴趣池

从**结构化 Persona 兴趣标签**生成 1–2 个短搜索 query；不要把整份用户 Profile、收藏原文或私密 Session 数据塞进搜索输入。

MVP 单 Journey 最多发起 2 个知乎搜索 query，每个官方最多 10 条；同 query 使用 30–120 分钟共享缓存。

这给出一个原始候选池，而不是用户可见 Feed。

## B. Rule Eligibility：规则层拥有硬边界

规则层先于 Persona/LLM，负责：

- 只接受可追溯的真实知乎 URL / content ref；
- 主 Journey 目标优先/限定为可解析的**知乎问题**，因为后续 `question_answers` 和多人讨论都以 Question URL 为最稳定知识锚点；
- 搜索中不能归一到问题的回答/文章可作为 0–2 个侧发现，但不升级为主问题；
- 去掉最近若干 Journey 已使用的同题/高重复主题；
- 执行 source freshness、缓存 TTL 与 provenance；
- 根据运行时 quota 决定本趟是否允许调用 question answers / Zhida；
- 执行一次 Journey 的内容数量预算；
- 过滤明显无效、空标题、坏 URL 或无法追溯的候选。

这些是产品约束与成本约束，不能交给 LLM“自行遵守”。

## C. Persona Ranking：Persona 决定偏好，不决定事实

在通过规则层的候选上，应用使用结构化特征评分：

```text
interest affinity
+ route bias
+ novelty / anti-repeat
+ recent Persona memory
+ journey history
+ optional relationship/topic opportunity
+ public salience
```

可以让“陌生一点 / 深挖 / 找反方”等 route bias 改变权重，但它仍是应用内部 ranking，不是知乎官方推荐分。

第一版优先使用可解释的确定性/可测试评分函数；不要为候选池里的每一项调用直答做“这个猫会不会喜欢”的判断。否则成本、可重复性、调试与 provenance 都会失控。

## D. Evidence + Knowledge：只为最终主问题付高成本

### 真实证据锚点

选中主问题后，持久化/引用至少：

- question title；
- canonical Zhihu URL；
- source fetched/cache timestamp；
- candidate source（hot/search/cache）；
-必要的摘要；
- 如果调用 `question_answers`，保留回答 URL/ContentToken 或可追溯摘要引用所需的最小信息。

不长期复制无必要的整份官方响应。

### Question answers

每趟最多对**一个主问题**读取回答摘要；MVP 建议请求上限 5 条，并按 question URL 缓存 30–120 分钟或合理 source version。

0–2 个侧发现不再额外调用 `question_answers`。

### Zhida Knowledge

Knowledge synthesis 针对**已经选中的主问题**，使用 question title/summary + 真实回答摘要作为输入。相同问题、相同 evidence version 的 Knowledge Context 可跨 User/Journey 缓存 1–24 小时。

如果已经有可接受的缓存 Knowledge，就不再因为另一只猫经过同一问题重复调用直答。

Knowledge 输出必须标明 provenance：至少区分 `question_answers + zhida`、`zhida_without_answer_summaries`、`cached`、`demo/fallback` 等语义；不能让用户误以为生成文本就是知乎原文。

## E. Persona Expression：个性化只改变表达

Persona Layer 可以基于同一个 Knowledge Context 产生不同：

- 一句话旅途反应；
- 明信片文案；
- Encounter 中这一只 Persona 的发言；
- ReturnArtifact 的标题/注释。

它可以体现语气、篇幅、好奇点和立场倾向，但不得：

- 新增 Knowledge Layer 没支持的事实；
- 把不确定性改写为确定结论；
- 假装引用不存在的知乎回答；
- 把应用内部 Persona 判断写成知乎官方判断。

Persona expression 不一定每次都需要第二次 Zhida。低价值短文案可以由本地模板/规则生成；只有当互动或表达质量值得额外调用时才使用第二次生成，并受运行时 quota 策略控制。

## 一趟 Journey 的内容与调用预算

延续既定反 Feed 原则：

- **主问题：恰好 0–1 个**；正常成功 Journey 目标为 1，降级时允许 0；
- **侧发现：0–2 个**，只保存 title/summary/ref 等轻量信息；
- **Persona Encounter：0–1 个**，它复用主问题 Knowledge Context，不另外开启另一条高成本知识链；
- **ReturnArtifact：1 个**，必须可追溯到主问题/Encounter/本趟证据；
- **question_answers：每趟最多 1 个主问题，建议最多 5 条摘要**；
- **Zhida Knowledge：每趟最多 1 个 cache miss 调用**；
- **Persona Zhida expression：0–1 次，按需要与 quota；短反应优先不调用**；
- **Zhihu search：每趟最多 2 个 query，命中共享 cache 时为 0 次上游调用**；
- **hot_list：共享窗口缓存，不按 Journey 重复调用**。

具体“每天还能花多少”必须读取 runtime quota 和缓存命中情况，不能把历史额度快照硬编码进产品逻辑。

## 降级梯度

### 热榜失败

用最近的合规 hot cache；仍不可用时只用 search pool。

### 搜索失败

只用 hot pool + Persona ranking；不因此把随机内容伪装成个性化搜索结果。

### `question_answers` 失败/额度不足

主问题仍是真实知乎问题。Knowledge 可以基于问题标题/摘要调用直答，但 provenance 必须降级；若风险较高则只展示“这题值得带回来”式非事实扩写反应。

### Zhida 失败/额度不足

保留真实 question ref、摘要和规则选择理由；Persona 使用不添加新事实的模板反应。Journey 仍可完成，不能因为大模型不可用永久卡住。

### 所有实时内容源不可用

允许使用带时间戳/provenance 的已缓存真实知乎候选；再无合格候选则本趟“空手回来”，不伪造问题。

## Provenance 与用户可见事实

任何用户可见 Journey 内容至少区分：

```text
content source: live | cached | demo
knowledge source: question_answers+zhida | zhida | none/template
source fetched at
canonical Zhihu URL (if real content)
```

产品文案可以人格化，但链接与 provenance 不得人格化到不可辨认。

“知乎直答”是知乎提供的生成能力；它的生成文本仍应作为 Knowledge/AI synthesis 展示，不能称为“知乎官方结论”“知乎认证观点”或“知乎评分”。

## 与 Journey Engine 的接口

Journey plan 在 PREPARING/AWAY 中可以先冻结召回 query、候选池版本和 plan seed；在 materialize 主内容 milestone 时执行规则过滤和 Persona ranking，并把最终主问题 ID/URL 固定下来。

一旦主问题被 materialize，后续刷新不得因为热榜变化重新抽题。Knowledge Context 的缓存升级可以改善表达，但不得偷偷更换本次 Journey 的真实主问题。

## 实施结论

目标不是“让直答替猫逛知乎”，而是：

```text
知乎真实内容负责：世界里有什么
规则层负责：什么有资格进入这趟 Journey
Persona 负责：这只猫更可能走向什么
question_answers 负责：选中问题有哪些真实回答摘要证据
知乎直答 Knowledge 负责：在证据边界内整理语义
Persona Layer 负责：这只猫怎么说出来
```

任何一层越权，都会分别导致 Feed 化、不可解释推荐、事实污染或 API 配额失控。
