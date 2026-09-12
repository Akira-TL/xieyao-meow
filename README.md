# 谢邀喵

**用你的知乎人格，孵化一只会替你说话的赛博宠物。**

「谢邀喵」是知乎黑客松 2026 校园新锐季参赛项目。项目把用户在知乎沉淀的兴趣、关注、收藏与创作特征映射为一个可行动、可表达、可社交的 AI 数字人格：它能浏览真实知乎问题、生成个性化回答卡片，并与其他用户的数字人格互动。

## 项目资料

- 产品定义：[`docs/product/product-definition-v1.md`](docs/product/product-definition-v1.md)
- 比赛信息：[`docs/reference/zhihu-hackathon-2026.md`](docs/reference/zhihu-hackathon-2026.md)
- 知乎 API 工作稿：[`docs/reference/zhihu-api.md`](docs/reference/zhihu-api.md)
- 领域上下文：[`CONTEXT.md`](CONTEXT.md)
- Agent 规则：[`AGENTS.md`](AGENTS.md)
- Issue tracker 规则：[`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)

## 当前开发主线

```text
知乎 OAuth / 用户数据
        ↓
    知乎成分分析
        ↓
      Persona
        ↓
真实问题 → Knowledge Layer → Persona Layer
        ↓
     回答卡片
        ↓
 Agent × Agent 社区互动
```

MVP spec 与 issue 位于 [`.scratch/mvp/`](.scratch/mvp/)。

## 官方开发手册

`https://my.feishu.cn/docx/Mc80dR5XvoPaYDxcTasc04POnjd`

当前项目文档中对 API 配额、OAuth 字段等未完成官方核验的内容均明确标记为“待官方确认”。
