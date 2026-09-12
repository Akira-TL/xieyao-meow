# 「谢邀喵」首访 90 秒 Storyboard v1

> 目标：冻结“用户第一眼看到什么、点什么、后台发生什么、调用什么知乎能力、失败时怎么办”。
>
> 原则：首访不是介绍功能，而是连续制造两个高潮——**“这只宠物真的像我”** 和 **“它真的替我遇见了一个人”。**

## 总目标

首访结束时用户必须得到：

1. 一只属于自己的知乎人格宠物；
2. 一次可解释的同频/冤家匹配；
3. 一段 Agent × Agent 互动；
4. 一张可以分享的结果卡；
5. 一个明确的第二天回访理由。

目标总时长：**60–90 秒。**

---

## Screen 0｜项目广场外部入口

### 用户从哪里来

- 知乎黑客松项目广场；
- 好友分享的人格卡/匹配卡；
- 直接 Demo URL。

### 项目广场卡片必须传达

**标题：** 谢邀喵

**一句话：**

> 你在知乎这些年，到底偷偷养出了一只什么？

**副信息：**

> 用你的关注、收藏和创作孵化一个会替你逛知乎、替你认识人的数字分身。

### 目标

不是解释技术，是让用户产生“我也想测一下”的欲望。

---

## Screen 1｜Landing：人格蛋

**时间：0–8 秒**

### 视觉

- 中心是一枚会轻微抖动/呼吸的“知乎人格蛋”；
- 刘看山透明 GIF 在旁边待机或打招呼；
- 背景有极少量其他人格宠物从远处经过，暗示这是一个活着的社区。

### 文案

> **你在知乎这些年，其实已经偷偷养出了一只东西。**
>
> 你的关注、收藏和回答，决定它是什么脾气，也决定它最容易和谁一见如故。

### 操作

主 CTA：**看看我养出了什么**

次 CTA：**先逛逛别人养出了什么**

### 后台

不请求用户数据。

可以请求/读取：

- 本地统计；
- 公共 resident persona；
- 已缓存的公开事件。

### 失败降级

首屏不依赖知乎实时 API，因此必须 100% 可打开。

---

## Screen 2｜Consent：为什么值得授权

**时间：8–15 秒**

### 文案

> **孵化需要一点你的知乎成分。**

只读取公开范围：

- 公开创作；
- 关注；
- 公开收藏 / 收藏夹。

明确：

> 不读取私信，不读取手机号或邮箱，不替你发布内容。

### 操作

主 CTA：**用知乎孵化我的分身**

次操作：查看权限说明。

### 后台

启动知乎 OAuth Authorization Code Flow。

### 请求

浏览器跳转：

```text
https://openapi.zhihu.com/authorize
```

后端 callback 再交换 OAuth token。

### 失败降级

- OAuth 未开放：明确显示“知乎登录正在等待官方应用审批”，允许进入游客公园；
- 用户拒绝授权：返回 Landing，不制造错误弹窗。

---

## Screen 3｜Scanning：人格化验

**时间：15–30 秒**

### 关键原则

这里绝不能出现普通 spinner。

用户应该看到“它正在怎么理解我”。

### 动画阶段

#### 3A 创作扫描

> 正在看你公开写过什么……
>
> `发现：回答偏长 / 信息密度较高`

知乎能力：

```text
GET /api/v1/user/contents
```

#### 3B 关注扫描

> 正在闻你的关注列表……
>
> `发现：技术型创作者浓度明显`

知乎能力：

```text
GET /api/v1/user/followees
```

#### 3C 收藏扫描

> 正在翻你的收藏夹……
>
> `AI / 开发工具 / 科学 是高频主题`

知乎能力：

```text
GET /api/v1/user/favlists
GET /api/v1/user/collections
```

必要时只对少量代表收藏夹请求：

```text
GET /api/v1/user/favlist_contents
```

### 后台并行

```text
contents ─┐
followees ├─→ ZhihuContextSnapshot
favlists  ┤
collections┘
              ↓
       ZhihuComposition
              ↓
          Persona
```

### 展示纪律

页面只能展示已经有数据证据支持的结果。

例如“夜猫子”如果官方数据无法支持，就不能为了好玩展示。

### 失败降级

某一路失败不阻断全部孵化：

```text
创作 ✓
关注 ✓
收藏 暂时闻不到
```

只用成功数据生成较低置信度 Persona，并标明“以后可以重新化验”。

---

## Screen 4｜Reveal：第一高潮

**时间：30–45 秒**

### 转场

人格蛋破开。

### 核心显示

```text
[谢邀喵形象]

英短 · 工程脑
「盐选级工具猫」

别急，让本喵先把问题拆成三个模块。
```

### 只展示 4 个关键属性

示例：

```text
主兴趣      AI 与数码 42%
表达方式    高密度长答
收藏癖      76%
社交气味    AI × 科学 × 创业
```

每项都有：**为什么？**

展开后说明数据来源，不展示用户全部原始数据。

### 主操作

**让它出去逛逛**

此按钮其实进入第一次社交，而不是普通内容 Feed。

### 后台预取

Reveal 展示期间并行：

1. 从应用自己的 Persona 池取候选；
2. 计算兴趣相似度；
3. 计算表达/观点 contrast；
4. 预排 Top 3 candidate。

这一步不应额外消耗大量知乎 API。

---

## Screen 5｜Scent：它闻到了谁

**时间：45–55 秒**

### 转场

宠物离开“窝”，进入公园。

### 文案

> **你的喵刚出门，就闻到了一只 87% 同频的东西。**

这里的“87%”必须是应用算法分数，不冒充知乎官方评分。

### 展示

```text
你                     TA
AI 与数码       ●       AI 与数码
科学             ●       科学
创业                     游戏

共同气味：AI、科学
最大差异：长答工程脑 vs 短句暴论型

关系预判：
「很可能边吵边加好友」
```

### 关键 CTA

**让它们先聊两句**

### 后台

选择一个有真实内容基础的共同/分歧话题。

候选来源优先级：

1. 两个人兴趣交集对应的知乎搜索结果；
2. 当天热榜；
3. 已缓存的问题池。

### 知乎能力

```text
GET /api/v1/content/zhihu_search
GET /api/v1/content/hot_list   (缓存优先)
```

---

## Screen 6｜Encounter：第二高潮

**时间：55–75 秒**

### 不是聊天室

只做 2–4 回合的短互动，重点是让用户看见：

> “原来两个数字人格真的因为我们的不同而说出了不一样的话。”

### 页面组成

顶部：真实知乎话题卡。

中间：两个宠物对话。

底部：系统解释。

示例：

> 你的喵：你真的觉得 Agent 应该替人把所有决定做完？
>
> TA：我没这么说，是你又把自动化做成宗教了。

然后展示：

```text
为什么它们会这么聊？

共同兴趣：AI / Agent
你的表达：结构化、偏长
TA 的表达：短句、立场直接
```

### Knowledge Layer

Agent 不得只靠 Persona 凭空争论。

```text
知乎搜索 / 问题回答摘要
        ↓
Knowledge Context
        ↓
Persona A / Persona B
        ↓
短互动
```

可用能力：

```text
zhihu_search
question_answers
zhida
```

### 用户操作

- **想认识 TA**
- **再看看别的家伙**

第一版不自动暴露真人。

---

## Screen 7｜Activation：把关系种下去

**时间：75–85 秒**

### 用户看到

> 你们的第一段关系已经生成。

例如：

```text
当前关系：同频路人
共同气味：AI / 科学
好感：+4
争议度：+7
```

### 关键提示

> 如果 TA 也想认识你，我们再把真人身份交给彼此。

### 操作

- 想认识 TA；
- 保存这段关系；
- 生成匹配卡。

### 后台

持久化：

- SocialMatch；
- AgentEncounter；
- Relationship seed；
- social XP。

---

## Screen 8｜Share：第一次传播

**时间：85–90 秒**

### 默认生成两张卡之一

#### 人格卡

> 我在知乎偷偷养了一只「盐选级工具猫」。

#### 匹配卡

> 我的谢邀喵刚出门，就遇到了一个 87% 同频、但大概率会和我吵起来的人。

### 分享链接行为

别人点进分享链接时：

1. 先看到分享者的人格/匹配摘要；
2. CTA 不是“注册”，而是：

> **那你在知乎养出了什么？**

形成闭环。

---

# 激活完成后的第一次 Home

用户不是被扔进 Dashboard。

进入「我的窝」后只强调三件事：

```text
[宠物活着]

今天已经发生：1 件事
认识了：1 个家伙
成长：社交 +1
```

底部预告第二天：

> **明天它会自己出去逛。**
>
> 有东西来串门，我会留在窝里给你看。

这才是 A「宠物养成」正式开始的地方。

---

# 首访 API 预算

一次完整新用户首访，理想预算：

| 能力 | 调用策略 |
|---|---|
| user contents | 1 次 |
| followees | 1 次 |
| favlists | 1 次 |
| collections | 1 次 |
| favlist contents | 0–2 次，必要时 |
| hot list | 共享缓存，不按用户请求 |
| zhihu search | 1 次左右 |
| question answers | 0–1 次 |
| zhida | 0–1 次 |

不能为了动画效果重复请求 API。

---

# 关键性能预算

| 阶段 | 目标 |
|---|---:|
| Landing 可交互 | < 2 s |
| OAuth callback 后出现扫描 UI | < 1 s |
| 第一条“发现”反馈 | < 2 s |
| Persona Reveal | callback 后 5–12 s |
| Match 结果 | Reveal 后 1–3 s |
| Agent 对话首句 | 用户点击后 2–5 s |

如果上游真实响应更慢，使用阶段性扫描反馈遮蔽延迟，但不能假装不存在的分析已经完成。

---

# 首访埋点

为验证产品假设，第一版只需要这些事件：

```text
landing_view
hatch_cta_click
consent_view
oauth_start
oauth_success
scan_started
persona_revealed
persona_explanation_opened
first_outing_started
match_revealed
agent_encounter_started
connection_interest_clicked
share_card_created
share_link_opened
activation_completed
```

核心漏斗：

```text
Landing
→ Hatch CTA
→ OAuth success
→ Persona reveal
→ Match reveal
→ Agent encounter
→ Share / Connection intent
```

人气奖关心 OAuth 登录数，我们自己更应该关心 **Reveal→Encounter** 和 **Encounter→Share/Connect**，因为它们决定产品本身是否成立。
