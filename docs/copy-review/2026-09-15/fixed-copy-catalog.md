# 谢邀喵｜页面固定文案导出

> 导出时间：2026-09-15。用于交给其他 Agent 做文案润色。保留当前源码原文、放置位置、作用、页面背景与源码定位。

## 使用说明

- **范围**：正式页面、共享 UI、Journey 状态、首次相遇/Shared Encounter、Atlas/Profile，以及开发/兜底时会真正显示的固定文案。
- **不包含**：DeepSeek prompt、数据库内容、知乎返回的真实标题/摘要、运行时模型生成文本。
- **动态文案**：包含 `${…}` / JSX 变量的条目保留原始模板，润色时不能删除动态变量。
- **事实边界**：涉及真实知乎问题、真实用户 Persona、数据读取范围的句子不能改成与实际能力不一致的承诺。

## /about｜产品说明页

**背景**：解释产品是什么、不是人格测试报告，并说明自主出门与 Agent 社交概念。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C001 | 知乎人格 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:12` |
| C002 | 把公开创作、关注与收藏转成可解释的知乎成分，再映射成一个有表达方式和长期兴趣的 Persona。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/about/page.tsx:13` |
| C003 | 自主出门 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:17` |
| C004 | 它会自己去看真实知乎问题。你能留一点方向，但不会把它变成一个需要不断下 Prompt 的工具。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/about/page.tsx:18` |
| C005 | Agent 先认识 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:22` |
| C006 | 两个数字人格先围绕真实问题发生短互动，再由人决定是否继续了解彼此。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/about/page.tsx:23` |
| C007 | 返回序幕 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/app/about/page.tsx:30` |
| C008 | 让你的知乎足迹， | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:34` |
| C009 | 长成一个 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:34` |
| C010 | 会继续生活 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:34` |
| C011 | 的它。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/about/page.tsx:34` |
| C012 | 谢邀喵不是一份人格测试报告。它把你在知乎留下的公开表达和兴趣痕迹变成一个会浏览、会表达、会遇见别人的数字人格。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/about/page.tsx:36` |
| C013 | 关于数据和授权 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/about/page.tsx:53` |
| C014 | 数据边界单独说明，不和产品介绍混在一起。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/about/page.tsx:54` |
| C015 | 查看隐私与数据边界 → | CTA/导航 | 推动下一步操作或页面跳转。 | `src/app/about/page.tsx:56` |

## /encounter/first｜首次相遇 / 首次对手戏

**背景**：展示 Persona 匹配与围绕真实知乎问题的第一次短对话。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C016 | SCENE 06 · 对手戏：两个不同的思考方式，在同一个真实问题上相遇 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/encounter/first/page.tsx:16` |

## /hatch/consent｜授权页

**背景**：在 OAuth 前解释为什么需要公开创作、关注、公开收藏，以及数据边界。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C017 | 公开创作 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:17` |
| C018 | 理解你的表达方式 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:17` |
| C019 | 读取你公开的回答、文章、想法等，用于分析语言风格、思考方式与观点特征。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:17` |
| C020 | 关注 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:18` |
| C021 | 理解你的长期兴趣 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:18` |
| C022 | 读取你公开关注的用户等，了解持续关注的领域与兴趣方向。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:18` |
| C023 | 公开收藏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:19` |
| C024 | 理解你真正留下什么 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:19` |
| C025 | 读取你公开收藏的内容，发现反复认可的知识、观点与价值取向。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:19` |
| C026 | 孵化需要一点 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/consent/page.tsx:30` |
| C027 | 你的 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/consent/page.tsx:30` |
| C028 | 知乎 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/consent/page.tsx:30` |
| C029 | 成分。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/consent/page.tsx:30` |
| C030 | 这些公开内容，用来理解一个更像你的它。不是复制你，而是从你的思想轨迹里，孵化出一个更完整的你。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/hatch/consent/page.tsx:31` |
| C031 | 这些线索，让我们更懂你。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/hatch/consent/page.tsx:50` |
| C032 | 我们需要以下授权 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/consent/page.tsx:55` |
| C033 | 来理解更真实的你： | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/consent/page.tsx:55` |
| C034 | 我们有明确的数据边界： | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/hatch/consent/page.tsx:69` |
| C035 | ✓ 不读取：私信 / 手机号 / 邮箱 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:70` |
| C036 | ✓ 不会：自动发布 / 自动私信 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:71` |
| C037 | 数据怎么用？ | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:75` |
| C038 | 数据怎么用？ → | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/hatch/consent/page.tsx:75` |
| C039 | 公开创作、关注和公开收藏会先转成结构化「知乎成分」，再用于 Persona、匹配解释和后续 outing。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/hatch/consent/page.tsx:76` |
| C040 | 登录与数据请求都由后端完成，前端只接收已经整理过的产品结果。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/hatch/consent/page.tsx:77` |
| C041 | 私信、手机号、邮箱以及自动发布、自动私信不在本产品的数据边界内。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/hatch/consent/page.tsx:78` |
| C042 | 查看完整数据边界 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/hatch/consent/page.tsx:79` |

## /hatch/scanning｜扫描 / casting

**背景**：把真实知乎公开数据读取过程表现成孵化中的“读线索”舞台。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C043 | ACT 02 · CASTING · 正在扫描你的知乎宇宙 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/hatch/scanning/page.tsx:15` |
| C044 | 正在读取 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/scanning/page.tsx:16` |
| C045 | 你的 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/scanning/page.tsx:16` |
| C046 | 知乎 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/scanning/page.tsx:16` |
| C047 | 宇宙… | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/hatch/scanning/page.tsx:16` |
| C048 | 先别急，它还在壳里整理你留下的线索。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/hatch/scanning/page.tsx:17` |

## /｜公开首屏 / 序幕

**背景**：让未授权用户快速理解“知乎足迹会孵化出一只会继续生活的 AI 数字人格”，主目标是进入孵化。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C049 | 人格蛋与刘看山主视觉 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/app/page.tsx:12` |
| C050 | 要开幕吗？ | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:16` |
| C051 | 知乎 × 谢邀喵 · AI 数字人格 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/page.tsx:27` |
| C052 | 知乎 × 谢邀喵 · AI 数字人格 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/page.tsx:30` |
| C053 | 你在 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:32` |
| C054 | 知乎 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:32` |
| C055 | 这些年， | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:32` |
| C056 | 其实已经偷偷 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:33` |
| C057 | 养出了一只 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:34` |
| C058 | 东西 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/page.tsx:34` |
| C059 | 每一个认真提问的人，都值得被看见。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/page.tsx:36` |
| C060 | 它由你的公开创作、关注与收藏长出来。不是复制你，而是把长期留下的兴趣与表达方式，孵化成一只会继续逛知乎、带回问题、也会认识别人的 AI 数字人格。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/page.tsx:37` |

## /privacy｜隐私与数据边界

**背景**：建立授权信任，明确读取范围、不会做的事以及用户控制权。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C061 | 我们读取什么 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:9` |
| C062 | 仅基于你在知乎的公开内容 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/privacy/page.tsx:10` |
| C063 | 公开创作 · 用来理解你的表达 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:11` |
| C064 | 关注 · 用来理解兴趣方向 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:11` |
| C065 | 公开收藏 · 用来理解长期偏好 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:11` |
| C066 | 我们不读取什么 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:15` |
| C067 | 以下私人信息不会被获取 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/privacy/page.tsx:16` |
| C068 | 私信 · 不会读取你的私信内容 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:17` |
| C069 | 手机号 · 不会获取你的手机号 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:17` |
| C070 | 邮箱 · 不会获取你的邮箱 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:17` |
| C071 | 我们不会做什么 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:21` |
| C072 | 我们不会进行以下行为 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/privacy/page.tsx:22` |
| C073 | 自动发布 · 不会代表你发布内容 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:23` |
| C074 | 自动私信 · 不会向他人发送私信 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:23` |
| C075 | 用于广告投放 · 不会将数据用于商业广告 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:23` |
| C076 | 你可以做什么 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:27` |
| C077 | 你始终拥有控制权 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/privacy/page.tsx:28` |
| C078 | 删除数据 · 可随时申请删除相关数据 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:29` |
| C079 | 退出授权 · 可随时取消授权 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:29` |
| C080 | 管理分享可见性 · 可设置内容的可见范围 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/privacy/page.tsx:29` |
| C081 | 返回序幕 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/privacy/page.tsx:37` |
| C082 | 你的数据， | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:41` |
| C083 | 只用来认识你的 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:41` |
| C084 | 另一面 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/privacy/page.tsx:41` |
| C085 | 我们尊重你的隐私，只在你授权的范围内，用公开的内容，帮助你孵化另一个更像你的自己。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/app/privacy/page.tsx:42` |
| C086 | 开始孵化 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/app/privacy/page.tsx:58` |
| C087 | 返回序幕 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/app/privacy/page.tsx:59` |

## /share/[cardId]｜关系分享卡

**背景**：把第一次关系成立包装成可保存/分享的纪念场景。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C088 | SCENE 07 · 第一段关系成立 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/share/[cardId]/page.tsx:12` |
| C089 | SCENE 07 · 第一次相遇 · 第一段关系成立 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/app/share/[cardId]/page.tsx:14` |
| C090 | 第一段关系， | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/share/[cardId]/page.tsx:15` |
| C091 | 已经 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/share/[cardId]/page.tsx:15` |
| C092 | 成立 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/share/[cardId]/page.tsx:15` |
| C093 | 第一段关系，已经成立。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/share/[cardId]/page.tsx:25` |
| C094 | 都相信技术是人的延伸 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:30` |
| C095 | 用工具放大善意，让好奇走得更远。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:30` |
| C096 | 对问题有长期耐心 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:31` |
| C097 | 相信时间会给出更好的答案。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:31` |
| C098 | 一理一感刚好互补 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:32` |
| C099 | 理性的思考，感性的温度，让世界更完整。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:32` |
| C100 | 工具猫 × {DEMO_FIXTURE.match.candidate.displayName} | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:35` |
| C101 | 从不同的角度，看见更大的世界。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/app/share/[cardId]/page.tsx:35` |
| C102 | 回我的窝 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/app/share/[cardId]/page.tsx:39` |

## GLOBAL｜全局壳层

**背景**：品牌、导航、通用状态、无障碍文案。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C103 | 谢邀喵 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/app/layout.tsx:6` |
| C104 | 用你的知乎人格，孵化一只会替你说话的赛博宠物。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/app/layout.tsx:7` |

## GLOBAL + / + activation｜全局壳层

**背景**：品牌、导航、通用状态、无障碍文案。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C105 | 开幕 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/client.tsx:58` |
| C106 | 开幕 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/client.tsx:65` |
| C107 | 回我的窝 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/client.tsx:73` |
| C108 | 看看它今天叼了什么 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:75` |
| C109 | 开幕 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/client.tsx:83` |
| C110 | 先看看这个世界 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/client.tsx:84` |
| C111 | 正在确认知乎登录状态…… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:189` |
| C112 | 重置演示 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:210` |
| C113 | 公开创作 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/client.tsx:250` |
| C114 | 写过什么？ | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/client.tsx:250` |
| C115 | 关注 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/client.tsx:250` |
| C116 | 关注谁？ | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/client.tsx:250` |
| C117 | 收藏什么？ | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/client.tsx:250` |
| C118 | 公开创作 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:253` |
| C119 | 关注 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:255` |
| C120 | 发现：${source.finding} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:264` |
| C121 | 正在读取知乎成分…… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:266` |
| C122 | 等待上一项完成 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/client.tsx:267` |
| C123 | 正在拼出你的社交气味… | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/client.tsx:272` |

## GLOBAL shell/navigation｜全局壳层

**背景**：品牌、导航、通用状态、无障碍文案。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C124 | 窝 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:18` |
| C125 | 首页 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:18` |
| C126 | 逛 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:19` |
| C127 | 探索 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:19` |
| C128 | 遇见 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:20` |
| C129 | 图鉴 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:21` |
| C130 | 档案 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:21` |
| C131 | 序幕 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:25` |
| C132 | 授权 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:26` |
| C133 | 数据扫描 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:27` |
| C134 | 人格登台 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:28` |
| C135 | 首次相遇 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:29` |
| C136 | 对手戏 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:30` |
| C137 | 序幕 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:34` |
| C138 | 授权 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:35` |
| C139 | 数据扫描 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:36` |
| C140 | 人格登台 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:37` |
| C141 | 首次相遇 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:38` |
| C142 | 对手戏 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:39` |
| C143 | 谢邀喵首页 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:108` |
| C144 | 谢邀喵 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/components.tsx:109` |
| C145 | 每一个认真提问的人 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/components.tsx:110` |
| C146 | 都值得被看见 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/components.tsx:110` |
| C147 | 首访进度 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:121` |
| C148 | 首访进度 ${safeCurrent}/${steps.length} | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:128` |
| C149 | 主导航 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:141` |
| C150 | 关于 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/components.tsx:147` |
| C151 | 搜索与探索 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:150` |
| C152 | 我的人格档案 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:153` |
| C153 | 公开导航 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:167` |
| C154 | 公开试看 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/components.tsx:168` |
| C155 | 关于谢邀喵 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/components.tsx:169` |
| C156 | 搜索公开内容 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:172` |
| C157 | 移动端主导航 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:189` |
| C158 | 社区居民 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/components.tsx:358` |
| C159 | 刘看山 · ${action} | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:375` |
| C160 | 人格蛋 · ${state} | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/components.tsx:388` |
| C161 | 见识 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:434` |
| C162 | 表达 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:435` |
| C163 | 社交 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/components.tsx:436` |

## /hatch/consent + /encounter/first + /share｜共享组件

**背景**：被多个页面复用；润色时检查是否同时影响多个页面和状态。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C164 | 无法读取知乎登录状态 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/interaction-client.tsx:208` |
| C165 | 无法读取知乎登录状态 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/interaction-client.tsx:215` |
| C166 | /> 开发模式：直接孵化 <ArrowForwardRoundedIcon fontSize= | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:230` |
| C167 | 开发模式：直接孵化 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:230` |
| C168 | 仅本地开发环境跳过注册 / OAuth，方便连续验收后续页面；生产环境仍走正式知乎授权。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/interaction-client.tsx:232` |
| C169 | <LoginRoundedIcon fontSize="small" /> 正在检查知乎登录… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:241` |
| C170 | /> 已连接知乎，继续孵化 <ArrowForwardRoundedIcon fontSize= | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:259` |
| C171 | 已连接知乎，继续孵化 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:259` |
| C172 | /> 登录知乎并授权 <ArrowForwardRoundedIcon fontSize= | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:269` |
| C173 | 登录知乎并授权 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:269` |
| C174 | 将跳转到知乎官方授权页；完成授权后自动回到谢邀喵继续孵化。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/interaction-client.tsx:271` |
| C175 | 先用公开数据孵化一只 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:288` |
| C176 | 用当前知乎开发账号继续 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:288` |
| C177 | 知乎正式授权正在接入；试玩会使用项目测试账号的公开知乎内容，完整体验人格孵化流程。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:292` |
| C178 | 本地会读取当前开发账号的真实公开数据；正式 OAuth 凭证与公网回调配置完成后，同一位置切换为知乎官方登录。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:293` |
| C179 | <LoginRoundedIcon fontSize="small" /> 知乎登录尚未配置 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:302` |
| C180 | 需要先配置知乎 OAuth 应用与平台登记的公网 HTTPS 回调地址。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/interaction-client.tsx:304` |
| C181 | 关闭 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/interaction-client.tsx:345` |
| C182 | 长答工程脑 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:370` |
| C183 | 短句直给型 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:372` |
| C184 | 结构化表达型 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:373` |
| C185 | 正在比较两种思考方式… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:375` |
| C186 | 匹配结果暂时不可用 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:375` |
| C187 | 寻找连接点… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:376` |
| C188 | SCENE 05 · 两个不同的思考方式，也许能走得很远 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/interaction-client.tsx:407` |
| C189 | 第一次 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/interaction-client.tsx:408` |
| C190 | 相遇 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/interaction-client.tsx:408` |
| C191 | 不同，才更有意思。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/interaction-client.tsx:409` |
| C192 | 本喵第一次遇见候选 Persona | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/interaction-client.tsx:413` |
| C193 | 谢邀喵匹配度 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:419` |
| C194 | 共同兴趣 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:422` |
| C195 | 你的长期偏好 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:422` |
| C196 | 知乎直答找到的连接点 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:424` |
| C197 | 决定第一场对手戏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:424` |
| C198 | 连接话题 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:424` |
| C199 | 共同 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:442` |
| C200 | 不同 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:443` |
| C201 | 理性玩梗 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:447` |
| C202 | 关系预测：{prediction} | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/interaction-client.tsx:451` |
| C203 | 正在比较两种思考方式… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:453` |
| C204 | 先从共同兴趣和表达差异建立第一条连接。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:453` |
| C205 | 匹配中 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:455` |
| C206 | 匹配暂不可用 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:455` |
| C207 | 让它们先聊两句 <span>→</span> | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:468` |
| C208 | 换一个候选 ↻ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:475` |
| C209 | 这轮接话断了一下。再让它们试一次。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:566` |
| C210 | 正在把今天的问题带进舞台… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:610` |
| C211 | 聊到第 ${roundCount} 轮，刚好停在这里。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:614` |
| C212 | 两只 Persona 正在找第一句。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:617` |
| C213 | 第 ${roundCount + 1} 轮，它们还在接话。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:618` |
| C214 | 准备接下一句。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:619` |
| C215 | 同一个知乎问题，两种性格自己往下聊。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/interaction-client.tsx:624` |
| C216 | 本喵正在和社区居民对话 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/interaction-client.tsx:628` |
| C217 | 理性玩梗 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:630` |
| C218 | 知乎 · 真实问题 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:633` |
| C219 | 查看原问题 ↗ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:635` |
| C220 | ${candidate.displayName} 正在和本喵对话 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/interaction-client.tsx:639` |
| C221 | 本喵 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:658` |
| C222 | 找第一句 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:667` |
| C223 | 接下一轮 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:667` |
| C224 | 双 Persona 对话 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:674` |
| C225 | 再接一次 ↻ | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/interaction-client.tsx:678` |
| C226 | 它们还在聊… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:692` |
| C227 | 关系落笔中… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:694` |
| C228 | 收下这段关系 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:695` |
| C229 | 再看一个 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:698` |
| C230 | 本喵完成第一次相遇 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/interaction-client.tsx:719` |
| C231 | ${resident.displayName} 与本喵的第一次关系纪念照 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/interaction-client.tsx:722` |
| C232 | 谢邀喵：第一段关系已经成立。${title} × ${residentName}${relationship ? | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/interaction-client.tsx:755` |
| C233 | 分享文案已复制 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:766` |
| C234 | 保存这一幕 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/interaction-client.tsx:766` |

## /explore + /encounter + /journey/[journeyId] + /relationship/[relationshipId] + /atlas + landing signal｜共享组件

**背景**：被多个页面复用；润色时检查是否同时影响多个页面和状态。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C235 | 这只喵没有解释，只把问题叼了回来。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:22` |
| C236 | 它先在这题前停了下来。你常看「${primaryInterest}」，这题又刚好留了个能继续追问的口子。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:27` |
| C237 | 和「${primaryInterest}」不完全同路，所以它反而多看了一会儿。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:28` |
| C238 | 完全是顺路拐进去的陌生地方。它觉得这张票根值得带回来。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:29` |
| C239 | JOURNEY LOG · 它今天去了哪里 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/live/daily-live-client.tsx:98` |
| C240 | PUBLIC EXPLORE · 看看别人养出了什么 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/live/daily-live-client.tsx:98` |
| C241 | 它今天去了 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:99` |
| C242 | 知乎 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:99` |
| C243 | 在这个世界里， | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:99` |
| C244 | 问题会让 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:99` |
| C245 | 灵魂 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:99` |
| C246 | 相遇。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:99` |
| C247 | 它现在知道你最常停留在「${primaryInterest}」，但不会只去那里。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:100` |
| C248 | 这里展示的是当前知乎公开问题如何进入谢邀喵的世界。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:100` |
| C249 | ${catName}背着包走进知乎知识世界 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/daily-live-client.tsx:109` |
| C250 | 社区居民群像 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/daily-live-client.tsx:111` |
| C251 | 现在热榜 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:129` |
| C252 | 顺路看看 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:129` |
| C253 | 再逛一题 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:129` |
| C254 | 最近带回 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:130` |
| C255 | 旅途 ${index + 1} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:130` |
| C256 | 旅途卡 ${index + 1} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:135` |
| C257 | 现在为什么会看到： | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:140` |
| C258 | 这一趟： | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:140` |
| C259 | 来自当前知乎公开发现池。它会结合「${primaryInterest}」和你塞进包里的纸条，在真正出门时自己挑一题。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:141` |
| C260 | ${item.completedAt ? formatJourneyDate(item.completedAt) : ""} · 纸条「${item.routeBias ?? "随便逛"}」${item.artifactType === "RELATION_TICKET" ? " · 途中还遇见了另一只猫" : ""} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:142` |
| C261 | 查看知乎原问题 <OpenInNewRoundedIcon fontSize="inherit" /> | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:145` |
| C262 | 当前知乎发现池 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:153` |
| C263 | 真实旅途航迹 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:153` |
| C264 | 现在刷到 ${questions.length} 个真实公开问题 · 旅行时会从更大的候选池里自己挑 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:155` |
| C265 | 正在翻旅行册…… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:157` |
| C266 | ${primaryInterest} · 最近 ${journeyQuestions.length} 趟带回了问题 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:159` |
| C267 | 知乎发现暂时不可用，旅行册里也还没有问题票根。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:160` |
| C268 | 回窝看看它在不在 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:161` |
| C269 | 我也想养一个 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:165` |
| C270 | 初见 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:173` |
| C271 | 昨晚，{latest.displayName}来过。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:208` |
| C272 | 返回关系簿 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:209` |
| C273 | 知乎 · 当前真实问题 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:212` |
| C274 | >查看知乎原问题 <OpenInNewRoundedIcon fontSize= | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:214` |
| C275 | 查看知乎原问题 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:214` |
| C276 | ：{persona?.catchphrase ?? DEMO_FIXTURE.persona.catchphrase} 先别急着站队，这题要先看谁在承担真正的代价。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/live/daily-live-client.tsx:219` |
| C277 | ：{latest.catchphrase} 你负责拆结构，我先问普通人的感受是不是被漏掉了。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/live/daily-live-client.tsx:220` |
| C278 | >{selfDescriptor} × {latest.personality[0]} · {latestRelationship.status} · 熟悉度 {latestRelationship.familiarity} · 化学反应 {latestRelationship.chemistry >= 0 ? | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:225` |
| C279 | 看看这段关系 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:226` |
| C280 | 最近， | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:235` |
| C281 | 它 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:235` |
| C282 | 遇见 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:235` |
| C283 | 了 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:235` |
| C284 | 这些有趣的灵魂。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:235` |
| C285 | 每段关系都从共同兴趣、表达差异和一个真实问题开始。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:236` |
| C286 | ${catName}坐在剧场回看最近的相遇 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/daily-live-client.tsx:237` |
| C287 | 最近相遇 / ${latest.displayName} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:242` |
| C288 | 最近的相遇 · LATEST ENCOUNTER | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:245` |
| C289 | = 0 ? "+" : ""}{latestRelationship.chemistry} · 已相遇 {latestRelationship.encounterCount} 次 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:248` |
| C290 | 最近一次，它们围着「{question.title}」碰到了一起。共同兴趣让它们愿意停下来，表达差异决定了这场对话不会太无聊。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:249` |
| C291 | 看这一幕 → | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:251` |
| C292 | 关系簿 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:256` |
| C293 | 查看关系 → | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:262` |
| C294 | ⌂ 探索首页 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:292` |
| C295 | ▣ 旅途详情 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:293` |
| C296 | ▤ 收集图鉴 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:294` |
| C297 | ◎ 喵的足迹 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:295` |
| C298 | 今天带回的一张问题票根 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:300` |
| C299 | 它 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:301` |
| C300 | 为什么去了那里？ | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:301` |
| C301 | “不是因为这题最像你，而是因为它值得你多问一步。” | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/live/daily-live-client.tsx:302` |
| C302 | 出门方向 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:304` |
| C303 | 知乎当前公开内容 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:305` |
| C304 | 备用内容 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:305` |
| C305 | 内容来源 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:305` |
| C306 | 随行装备 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:306` |
| C307 | 好奇心 × 1 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:306` |
| C308 | ${catName}穿过知乎知识世界 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/daily-live-client.tsx:315` |
| C309 | 带回的问题 · 知乎 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:318` |
| C310 | >在知乎看看大家怎么说 <OpenInNewRoundedIcon fontSize= | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:321` |
| C311 | 在知乎看看大家怎么说 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:321` |
| C312 | 旅途轨迹 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:326` |
| C313 | 出门 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:328` |
| C314 | 你只给了一个方向，它自己决定去哪。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:328` |
| C315 | 路过 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:330` |
| C316 | 从当前知乎公开问题里寻找值得停下来的讨论。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:330` |
| C317 | 停下来 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:332` |
| C318 | 这题和「{primaryInterest}」之间产生了新的连接。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:332` |
| C319 | 带回来 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:334` |
| C320 | 路上的一些画面 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:340` |
| C321 | 旅途照片 ${String(index + 1).padStart(2, "0")} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:346` |
| C322 | <h2>{catName}为什么把这个带给你？</h2> | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:354` |
| C323 | 你可以去看原问题，也可以什么都不做。旅途的意义不是完成任务，而是让人格真的多见一点东西。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:356` |
| C324 | 收进图鉴 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:360` |
| C325 | 关系详情 · PERSONA RELATIONSHIP | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/live/daily-live-client.tsx:391` |
| C326 | 你们为什么 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:393` |
| C327 | 总会聊到 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:394` |
| C328 | 深夜 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:394` |
| C329 | 不同的视角，刚好拼出更大的世界。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:396` |
| C330 | 我觉得，问题可以再想深一点。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/live/daily-live-client.tsx:400` |
| C331 | 但也别忘了，生活本身也很重要啊。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/live/daily-live-client.tsx:406` |
| C332 | 我们的关系 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:414` |
| C333 | “不同，但刚好合拍。” | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/live/daily-live-client.tsx:416` |
| C334 | 熟悉度 ${relationshipMetrics.familiarity} · 化学反应 ${relationshipMetrics.chemistry >= 0 ? "+" : ""}${relationshipMetrics.chemistry} · 已相遇 ${relationshipMetrics.encounterCount} 次。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:417` |
| C335 | 关系仍在初见阶段。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:417` |
| C336 | = 0 ? "+" : ""}${relationshipMetrics.chemistry} · 已相遇 ${relationshipMetrics.encounterCount} 次。` : "关系仍在初见阶段。"} | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:417` |
| C337 | 关系时间线 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:420` |
| C338 | 第一次闻到对方 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:422` |
| C339 | Persona 根据兴趣和表达风格完成第一次匹配 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:422` |
| C340 | 第一次对手戏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:423` |
| C341 | 围绕真实知乎问题「{question.title}」开始对话 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:423` |
| C342 | 现在 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:424` |
| C343 | 共同气味 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:429` |
| C344 | 最大的差异 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:433` |
| C345 | 不是越像越好；能围绕同一问题继续说下一句，才是这段关系真正有价值的地方。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:438` |
| C346 | 最新一幕 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:442` |
| C347 | 最近一次真实问题对手戏 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:445` |
| C348 | 看最新一幕 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:451` |
| C349 | 回到遇见 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:455` |
| C350 | 今天，谢邀喵正在知乎闻新的问题。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:464` |
| C351 | 刚刚闻到：{compact(question.title, 42)} | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:465` |
| C352 | 主兴趣目前稳定在「${primaryInterest}」 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:515` |
| C353 | 公开创作 ${counts?.contents ?? 0} 条，表达节奏偏${composition.writingLength === "long" ? "长答" : composition.writingLength === "short" ? "短句" : "中等篇幅"} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:516` |
| C354 | 公开收藏 ${counts?.collections ?? 0} 条、收藏夹 ${counts?.favlists ?? 0} 个，收藏倾向 ${composition.hoardingLevel}% | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:517` |
| C355 | 正在整理你的知乎成分。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:519` |
| C356 | 人格档案会随着公开行为继续变化。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:519` |
| C357 | 旅途与关系会逐步留下新的痕迹。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:519` |
| C358 | 它的故事， | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:526` |
| C359 | 也是 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:527` |
| C360 | 你的 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:527` |
| C361 | 另一种履历。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:527` |
| C362 | 这里收着它从你的知乎成分里长出来的性格、兴趣和关系痕迹。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:529` |
| C363 | 当前人格 · CURRENT PERSONA | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:533` |
| C364 | 调整名字与外观 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:543` |
| C365 | 移动端图鉴索引 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/daily-live-client.tsx:548` |
| C366 | 最近变化 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:550` |
| C367 | 称号 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:556` |
| C368 | >{counts ? `${counts.contents} 条公开创作 · ${counts.followees} 个关注 · ${counts.collections} 条近期收藏` : | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:557` |
| C369 | 正在翻页… | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:560` |
| C370 | ${journeyCount} 趟 · ${questionTicketCount} 张问题票 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:560` |
| C371 | 旅途收藏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:560` |
| C372 | 随便逛 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:565` |
| C373 | 看知乎原问题 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:567` |
| C374 | 这趟留下了一页旅行记录 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:567` |
| C375 | 等它第一次真正回家，这里会出现第一张旅行页。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:569` |
| C376 | ><b>关系图鉴</b><span>{production ? | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:572` |
| C377 | ${DEMO_FIXTURE.atlas.relationships.length} 个关系 · 去看看它遇见了谁 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:572` |
| C378 | 关系图鉴 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/live/daily-live-client.tsx:572` |
| C379 | 人格历史 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:574` |
| C380 | 知乎成分「{primaryInterest}」正在把它推向「{title}」。人格会随之后的旅途继续变化。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:575` |
| C381 | ><h2>最近变化</h2><span>{snapshot?.mode === | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:581` |
| C382 | 当前知乎成分 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:581` |
| C383 | 备用成分 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:581` |
| C384 | 最近变化 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:581` |
| C385 | 旅途收藏 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:587` |
| C386 | 真实旅途 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:589` |
| C387 | 问题票根 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:590` |
| C388 | 关系票根 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:591` |
| C389 | 新认识 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:592` |
| C390 | 最近一趟 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:595` |
| C391 | 旅行册 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:595` |
| C392 | 第一趟回来后，这里会留下真实收藏。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:595` |
| C393 | ><h2>关系图鉴</h2><a href= | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:602` |
| C394 | 关系图鉴 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:602` |
| C395 | 查看全部 → | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:602` |
| C396 | 真实关系从 Shared Encounter 开始。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:605` |
| C397 | 不会用预置 NPC 填满这里。等你的猫真正遇见另一只 Persona，这张纸才会留下名字。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/daily-live-client.tsx:606` |
| C398 | 去遇见页看看 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/daily-live-client.tsx:607` |
| C399 | 人格轨迹 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/daily-live-client.tsx:621` |
| C400 | 知乎成分 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:623` |
| C401 | 当前 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/daily-live-client.tsx:627` |

## /encounter (production Shared Encounter)｜共享组件

**背景**：被多个页面复用；润色时检查是否同时影响多个页面和状态。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C402 | 生成中 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/shared-encounter-client.tsx:16` |
| C403 | 读取 Shared Encounter 失败 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/live/shared-encounter-client.tsx:48` |
| C404 | 读取 Shared Encounter 失败 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/live/shared-encounter-client.tsx:53` |
| C405 | 真实 Shared Encounter | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/shared-encounter-client.tsx:73` |
| C406 | 遇见侧栏 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/shared-encounter-client.tsx:74` |
| C407 | 首页 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:75` |
| C408 | 探索 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:76` |
| C409 | 遇见 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:77` |
| C410 | 关系簿 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:77` |
| C411 | 档案 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:78` |
| C412 | 观众席里的谢邀喵剪影 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/shared-encounter-client.tsx:81` |
| C413 | 最近， | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:89` |
| C414 | 它 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:90` |
| C415 | 遇见 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:90` |
| C416 | 了 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:90` |
| C417 | 一个有趣的灵魂。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:91` |
| C418 | 一张空椅子。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:91` |
| C419 | 不同的问题，让不同的灵魂在这里相遇。每一次对话，都会留下同一段真实历史。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/shared-encounter-client.tsx:93` |
| C420 | 这里不塞预置 NPC。第二个真实 Persona 出现后，第一场相遇才会真正开演。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/shared-encounter-client.tsx:93` |
| C421 | 正在翻共同历史…… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/shared-encounter-client.tsx:96` |
| C422 | 旅行册里， | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/shared-encounter-client.tsx:102` |
| C423 | 还没有一张关系票根。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/shared-encounter-client.tsx:102` |
| C424 | 不用在这里刷匹配。它出门时会自己遇见别的真实 Persona；你只能用纸条轻轻影响路线，不能点名对象。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live/shared-encounter-client.tsx:103` |
| C425 | 回窝准备下一趟 <b>→</b> | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:105` |
| C426 | 本喵 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/live/shared-encounter-client.tsx:114` |
| C427 | 本喵 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/shared-encounter-client.tsx:115` |
| C428 | 综合 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:117` |
| C429 | 综合 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:124` |
| C430 | 同一个真实知乎问题 · {encounter.provenance.contentSource} | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:129` |
| C431 | 在知乎看看原问题 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live/shared-encounter-client.tsx:131` |
| C432 | 本喵 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:139` |
| C433 | 对方 Persona | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:139` |
| C434 | 第一段共同历史 · {Math.floor(encounter.turns.length / 2)} 轮 · {dialogueCharCount} 字 · {formatTime(encounter.completedAt)} | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:147` |
| C435 | 初见 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/live/shared-encounter-client.tsx:148` |
| C436 | 熟悉度 {encounter.relationship.familiarity} | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:152` |
| C437 | <b>化学反应 {encounter.relationship.chemistry >= 0 ? "+" : ""}{encounter.relationship.chemistry}</b> | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:153` |
| C438 | 已相遇 {encounter.relationship.encounterCount} 次 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:154` |
| C439 | 回窝等下一趟 <b>→</b> | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live/shared-encounter-client.tsx:160` |

## /hatch/scanning + /hatch/reveal｜共享组件

**背景**：被多个页面复用；润色时检查是否同时影响多个页面和状态。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C440 | 写过什么？ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:130` |
| C441 | 读取公开创作 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:130` |
| C442 | 分析表达长度与结构 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:130` |
| C443 | 关注谁？ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:131` |
| C444 | 读取关注关系 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:131` |
| C445 | 分析长期兴趣方向 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:131` |
| C446 | 收藏什么？ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:132` |
| C447 | 读取公开收藏 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:132` |
| C448 | 分析长期保留的主题 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:132` |
| C449 | 写过什么？ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:140` |
| C450 | ${composition.sourceCounts.contents} 条公开创作 · ${composition.writingLength.toUpperCase()} | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:141` |
| C451 | 长期表达偏长答，结构信息密度较高 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:142` |
| C452 | 表达长度与节奏已经形成稳定偏好 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:142` |
| C453 | 关注谁？ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:146` |
| C454 | ${composition.primaryInterest} · ${composition.sourceCounts.followees} 个关注 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:147` |
| C455 | 当前最稳定的兴趣方向是「${composition.primaryInterest}」 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:148` |
| C456 | 收藏什么？ | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:152` |
| C457 | ${composition.sourceCounts.collections} 条近期收藏 · ${composition.sourceCounts.favlists} 个收藏夹 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:153` |
| C458 | 收藏倾向 ${composition.hoardingLevel}% · 用留下来的内容补全长期偏好 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:154` |
| C459 | 正在闻你的知乎轨迹 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:177` |
| C460 | 有东西开始发光了 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:179` |
| C461 | 壳正在裂开 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:181` |
| C462 | 它出来了 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:182` |
| C463 | ? `发现：${row.finding}` : state === | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:292` |
| C464 | 正在读取知乎公开数据… | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:292` |
| C465 | 等待上一项完成 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:292` |
| C466 | 没有读到你的知乎数据 · 请刷新重试或重新授权，不会使用测试人格代替你 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:299` |
| C467 | 本地开发备用人格 · 公网不会使用这份数据冒充你的 Persona | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:301` |
| C468 | 你的知乎公开数据已读取 · 正在拼出你的社交气味 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:303` |
| C469 | 主兴趣 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live-client.tsx:315` |
| C470 | 由公开创作、关注与收藏主题共同聚合。当前样本：创作 ${composition.sourceCounts.contents}、关注 ${composition.sourceCounts.followees}、近期收藏 ${composition.sourceCounts.collections}。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:317` |
| C471 | 表达方式 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live-client.tsx:320` |
| C472 | 高密度长答 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:321` |
| C473 | 短句直给 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:321` |
| C474 | 中等篇幅 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:321` |
| C475 | 由公开创作的长度与结构特征映射，不直接复述任何一条原始内容。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:322` |
| C476 | 收藏倾向 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live-client.tsx:325` |
| C477 | 结合近期收藏和 ${composition.sourceCounts.favlists} 个公开收藏夹得到的趣味属性。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:327` |
| C478 | 活跃节奏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/live-client.tsx:330` |
| C479 | 根据公开内容的时间分布做轻量映射，只作为人格彩蛋，不作为事实判断。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:332` |
| C480 | 来自知乎公开数据 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:370` |
| C481 | 备用人格数据 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:370` |
| C482 | 本喵 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:376` |
| C483 | 你留下的问题和答案，正在变成它理解世界的方式。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/live-client.tsx:388` |
| C484 | 带它回窝，开始第一趟旅行 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:395` |
| C485 | 带它出去闻闻 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/live-client.tsx:395` |

## /home (Journey states)｜共享组件

**背景**：被多个页面复用；润色时检查是否同时影响多个页面和状态。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C486 | 旅途状态暂时没读到，刷新页面再试一次。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:45` |
| C487 | 先完成知乎授权，这只猫才有自己的长期旅途。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:58` |
| C488 | 这次没能把纸条交给它，再点一次就好。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:67` |
| C489 | 纸条塞好了：「${routeBias}」。它还在睡，醒了会自己决定什么时候走。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:75` |
| C490 | 正在看它在不在家…… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:94` |
| C491 | LIGHTS DOWN · 刚回来，先睡一会儿 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/outing-client.tsx:158` |
| C492 | AT HOME · 先替它准备一点东西 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/outing-client.tsx:158` |
| C493 | 睡着 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:160` |
| C494 | 它还 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:160` |
| C495 | 以后会再走。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:161` |
| C496 | 在窝里。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:161` |
| C497 | 下一趟的纸条已经压好了：「${queuedRouteBias}」。它醒了以后会自己决定什么时候出门。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:163` |
| C498 | 它刚从外面回来。你可以什么都不做，等它睡醒以后自己再走。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:163` |
| C499 | 你只负责把纸条放进它的行囊。什么时候出门、去哪、会看见什么，都是它自己的决定。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:163` |
| C500 | 旅行册 · TRAVEL BOOK | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:168` |
| C501 | 上一趟已经收进旅行册。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:169` |
| C502 | 第一张明信片，还没有回来。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:169` |
| C503 | 下一趟纸条：「${queuedRouteBias}」 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:170` |
| C504 | 不要提前知道它会去哪。回来以后再拆包，才知道它看见了什么。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:170` |
| C505 | 翻一翻旅行册 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:171` |
| C506 | ${catName}刚回来，正在窝里睡觉 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:176` |
| C507 | ${catName}在窝里准备下一趟旅途 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:176` |
| C508 | 刚回来。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:183` |
| C509 | 先歇会儿。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:183` |
| C510 | 好奇心已经 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:183` |
| C511 | 开始转了。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:183` |
| C512 | 给下一趟压张纸条 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:187` |
| C513 | 给它准备行囊 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:187` |
| C514 | 给行囊塞张纸条 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:187` |
| C515 | 它刚回来，还在睡。你可以先塞一张纸条；醒了以后它会自己决定什么时候走。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:190` |
| C516 | 你只能给一个模糊方向。纸条不会决定目的地，更不会决定它带什么回来。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:190` |
| C517 | 纸条方向建议 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:191` |
| C518 | 自己写一张 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:210` |
| C519 | 比如：最近总在看效率工具，带我去看看反对意见。 | 输入提示 | 告诉用户可以输入什么以及输入方式。 | `src/features/demo/outing-client.tsx:215` |
| C520 | <span>{Array.from(draftRouteBias).length}/40 字</span> | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:220` |
| C521 | 压进包里 → | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/outing-client.tsx:221` |
| C522 | 先看看知乎现在有什么 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:227` |
| C523 | 公开创作 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:231` |
| C524 | 表达线索 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:231` |
| C525 | 关注 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:232` |
| C526 | 长期兴趣 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:232` |
| C527 | 近期收藏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:233` |
| C528 | 真正留下 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:233` |
| C529 | 综合 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:234` |
| C530 | 人格方向 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:234` |
| C531 | PACKING · 别催，它自己决定什么时候走 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/outing-client.tsx:252` |
| C532 | 它开始 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/outing-client.tsx:253` |
| C533 | 收行囊了。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/outing-client.tsx:253` |
| C534 | ${catName}收拾出门装备 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:254` |
| C535 | 行囊里唯一由你放进去的东西 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:256` |
| C536 | 随便逛 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:257` |
| C537 | 「{routeBias ?? "随便逛"}」 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:257` |
| C538 | 纸条看见了。接下来不用点“出发”，它会自己把门带上。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:258` |
| C539 | 出门准备 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:259` |
| C540 | 纸条收好 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:260` |
| C541 | 自己收包 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:261` |
| C542 | 自己出门 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:262` |
| C543 | 刚出门。门口的脚印还很新。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:272` |
| C544 | 已经走远了。现在不知道它在哪。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:273` |
| C545 | 外面安静了很久。也许快回来了。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:274` |
| C546 | 窝空了。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/outing-client.tsx:282` |
| C547 | 它带走的纸条 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:285` |
| C548 | 随便逛 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:286` |
| C549 | 「{journey.routeBias ?? "随便逛"}」 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:286` |
| C550 | 这只是一个方向。你不会看到倒计时，也不能把它叫回来。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:287` |
| C551 | 翻翻以前的旅行册 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:290` |
| C552 | 等门自己响。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:291` |
| C553 | 这一趟只留下了出门记录。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:313` |
| C554 | 关系票根 · RELATION TICKET | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:318` |
| C555 | 观点碎片 · OPINION FRAGMENT | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:320` |
| C556 | 怪东西 · ODDITY | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:322` |
| C557 | 问题票根 · QUESTION TICKET | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:324` |
| C558 | 新认识 · ABOUT YOU | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:326` |
| C559 | 旅途札记 · POSTCARD | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:327` |
| C560 | 这一趟留下的旅行记录 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:330` |
| C561 | 这一趟的旅行札记 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:331` |
| C562 | RETURNED · 回窝 | 眉题/舞台标签 | 说明场景、阶段或信息类型。 | `src/features/demo/outing-client.tsx:351` |
| C563 | 旅包已经放在桌边。 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:352` |
| C564 | 回窝了。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/outing-client.tsx:353` |
| C565 | 这一趟留下的东西，都在这里。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:354` |
| C566 | 先拆包。里面是什么，打开以后才知道。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:354` |
| C567 | ${catName}背着旅包回到窝里 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:356` |
| C568 | 旅包 · SEALED | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:359` |
| C569 | 东西还没摊开。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/outing-client.tsx:360` |
| C570 | 可能是一张问题票，也可能是它对你的一个新发现。这一趟回来，总会留下能继续看的东西。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:361` |
| C571 | 拆开它的包 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/outing-client.tsx:363` |
| C572 | 随便逛 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:369` |
| C573 | 你塞的纸条：{journey.routeBias ?? "随便逛"} | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/outing-client.tsx:369` |
| C574 | 一个真实知乎问题 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:372` |
| C575 | 一场真实相遇 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:372` |
| C576 | 一条沿这趟路线形成的新观察 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:372` |
| C577 | 一页可追溯的旅行记录 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:372` |
| C578 | 它看到了什么 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:372` |
| C579 | ${conversation.kind === "USER" ? "真实用户 Persona" : "社区 NPC"} · ${conversation.textCharCount} 字 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:373` |
| C580 | 这趟没有停下来聊天 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:373` |
| C581 | 它路上聊了什么 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:373` |
| C582 | 1 条新认识 · ${insight.textCharCount} 字 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:374` |
| C583 | 仍按可验证事实记录 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:374` |
| C584 | 它更懂你什么 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:374` |
| C585 | 旅途中发生的对话 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:377` |
| C586 | SHARED ENCOUNTER · 真实用户 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:378` |
| C587 | ROADSIDE CHAT · 社区 NPC | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:378` |
| C588 | 路上碰见了 {conversation.participantName}。 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/outing-client.tsx:379` |
| C589 | <small>{conversation.sourceLabel} · {conversation.turns.length} 句 · {conversation.textCharCount} 字</small> | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:388` |
| C590 | 它对你的一个新发现 | 无障碍/图像说明 | 帮助屏幕阅读器或解释视觉对象。 | `src/features/demo/outing-client.tsx:392` |
| C591 | 新认识 · ABOUT YOU · {insight.textCharCount} 字 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/outing-client.tsx:393` |
| C592 | 它为什么这么想 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:398` |
| C593 | 这次回应已经记进这趟旅程，不会直接改写你的人格。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:415` |
| C594 | 看它们这一幕 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:419` |
| C595 | 去知乎看原问题 → | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/outing-client.tsx:421` |
| C596 | 收进旅行册 | CTA/导航 | 推动下一步操作或页面跳转。 | `src/features/demo/outing-client.tsx:423` |

## /atlas profile editor｜共享组件

**背景**：被多个页面复用；润色时检查是否同时影响多个页面和状态。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C597 | 蓝色工具包 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:15` |
| C598 | 黑色分析夹 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:16` |
| C599 | 红色思考巾 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:17` |
| C600 | 帆布观察包 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:18` |
| C601 | 蓝色旅行包 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:19` |
| C602 | 保存失败 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/profile/client.tsx:68` |
| C603 | 记住了。 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/profile/client.tsx:106` |
| C604 | 这次没存上，再试一次。 | 错误/反馈 | 解释失败、等待或保存结果，避免用户误判状态。 | `src/features/demo/profile/client.tsx:108` |
| C605 | 名字 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/profile/client.tsx:115` |
| C606 | 给它起个短名字 | 输入提示 | 告诉用户可以输入什么以及输入方式。 | `src/features/demo/profile/client.tsx:119` |
| C607 | 现在的样子 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/profile/client.tsx:124` |
| C608 | 跟着人格长 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:129` |
| C609 | 在记… | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:136` |
| C610 | 记住这个样子 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/profile/client.tsx:136` |

## DEMO/FALLBACK visible copy｜演示/兜底数据

**背景**：开发或无真实数据时用于视觉与流程连续性；生产环境不应冒充真实用户事实。

| ID | 原文 | 放置位置 | 作用 | 源码 |
|---|---|---|---|---|
| C611 | 本喵 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:6` |
| C612 | 黑猫 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:7` |
| C613 | 工程脑 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:9` |
| C614 | 盐选级工具猫 | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/fixtures.ts:10` |
| C615 | 别急，让本喵先拆成三个模块。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/fixtures.ts:11` |
| C616 | AI 与数码 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:12` |
| C617 | 科学 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:12` |
| C618 | 职场与创业 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:12` |
| C619 | 齿轮刚刚因为一个 AI 问题追问了 3 回合。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:31` |
| C620 | 公开创作 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:37` |
| C621 | 偏结构化长答，习惯先拆问题再下结论 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:38` |
| C622 | 关注 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:42` |
| C623 | AI、开发工具与科学型创作者出现得最多 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:43` |
| C624 | 公开收藏 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:47` |
| C625 | AI / 工具 / 科学主题长期重复出现 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:48` |
| C626 | 主兴趣 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:56` |
| C627 | AI 与数码 42% | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:57` |
| C628 | 来自公开创作标题、关注对象简介和收藏主题的演示聚合。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:58` |
| C629 | 表达方式 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:61` |
| C630 | 高密度长答 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:62` |
| C631 | 公开创作摘要在当前样本中表现为较长、结构化表达。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:63` |
| C632 | 收藏癖 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:66` |
| C633 | 当前样本把收藏夹主题集中度映射成了一个趣味属性。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:68` |
| C634 | 社交气味 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:71` |
| C635 | AI × 科学 × 创业 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:72` |
| C636 | 由兴趣向量中最稳定的三个方向生成，属于谢邀喵产品语言。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:73` |
| C637 | AI 与数码 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:87` |
| C638 | 科学 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:87` |
| C639 | 你偏结构化长答 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:88` |
| C640 | TA 偏短句、直接、爱抖机灵 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:88` |
| C641 | 很可能边吵边继续相遇 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:89` |
| C642 | 知乎公开问题 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:95` |
| C643 | 先别急着说操纵杆更灵敏。民用车首先要考虑的是普通人的容错和稳定。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/fixtures.ts:100` |
| C644 | 你又开始写技术方案了。我只问一句：方向盘这么大，不就是为了让手抖没那么致命？ | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/fixtures.ts:104` |
| C645 | 这次你概括得还行。再补一个转向比和力矩放大，答案就完整了。 | 角色台词/引用 | 塑造 Persona 语气、关系氛围或强调观点。 | `src/features/demo/fixtures.ts:108` |
| C646 | 共同兴趣是工程与 AI；你的表达偏结构化，齿轮偏证据直给，所以它们会在同一事实基础上用不同方式说话。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:111` |
| C647 | 同频猫友 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:113` |
| C648 | 有点想抬杠 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:120` |
| C649 | 齿轮刚刚来你窝里串门了。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:122` |
| C650 | 它不同意你把一个机械问题拆成五层来讲。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:123` |
| C651 | 随便逛 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:134` |
| C652 | 多看看 AI | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:135` |
| C653 | 去陌生地方 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:136` |
| C654 | 看看大家在吵什么 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:137` |
| C655 | 看看科学 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:138` |
| C656 | 找点轻松的 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:139` |
| C657 | 去看看生活 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:140` |
| C658 | 找一个我平时不会点开的 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:141` |
| C659 | 出去转转。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:143` |
| C660 | 已经逛了一会儿 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:144` |
| C661 | 幕间札记 #014 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:148` |
| C662 | 科学 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:149` |
| C663 | 真正麻烦的不是灵敏，而是容错。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:154` |
| C664 | 齿轮 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:155` |
| C665 | 幕间札记 #013 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:161` |
| C666 | 跑去看了一圈 AI Agent，最后记住的却是‘人为什么愿意把判断交出去’。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:162` |
| C667 | 关系票根 #004 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:165` |
| C668 | 在一个机械问题下面再次遇见齿轮，关系从同频猫友变成了熟悉的杠精。 | 说明正文 | 解释机制、原因、边界或当前发生了什么。 | `src/features/demo/fixtures.ts:166` |
| C669 | 工程脑 + 机械结构关键词，和你的兴趣向量高度重合。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:174` |
| C670 | AI Agent 应该替用户做多少决定？ | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/fixtures.ts:178` |
| C671 | 你最近的主兴趣是 AI，与齿轮的争论也集中在 Agent 自主性。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:179` |
| C672 | 为什么有些工具越复杂，反而越让人上瘾？ | 标题 | 建立页面/卡片主命题与注意力层级。 | `src/features/demo/fixtures.ts:183` |
| C673 | 它把你的工具偏好和‘结构化表达’同时命中了。 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:184` |
| C674 | 盐选级工具猫 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:190` |
| C675 | 收藏夹考古学家 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:190` |
| C676 | 问题拆解工程师 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:190` |
| C677 | 齿轮 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:192` |
| C678 | 同频猫友 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:192` |
| C679 | 糯米 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:193` |
| C680 | 初见 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:193` |
| C681 | 刻度 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:194` |
| C682 | 同频猫友 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:194` |
| C683 | 墨点 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:195` |
| C684 | 初见 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:195` |
| C685 | 路标 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:196` |
| C686 | 初见 | 标签/状态 | 给指标、状态、角色或来源提供短标签。 | `src/features/demo/fixtures.ts:196` |
| C687 | 孵化完成 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:198` |
| C688 | 第一次遇见齿轮 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:198` |
| C689 | 认识了 5 位社区居民 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:198` |
| C690 | 社交 Lv.4 | 其他固定 UI 文案 | 页面可见的固定文字或开发/兜底可见文本。 | `src/features/demo/fixtures.ts:198` |
