# 「谢邀喵」视觉方向候选 v1

> 2026-09-12。三套候选已完成比较；**Direction C「人格剧场 / Kinetic Persona Theatre」已被选为主视觉方向**。选择记录见 `docs/adr/0002-personality-theatre-and-autonomous-outings.md`。
>
> 明确约束：本阶段**不由开发侧生成图片**。A/B 继续作为参考语言库，其中 A 的“可解释数据设计”可作为局部组件语言，B 的“宠物生活感”可用于日常留存，但不改变 C 的主视觉身份。
>
> 角色 IP 与资产生产已进一步冻结到 `docs/product/persona-art-system-v1.md`；外部图像生成/制作使用的逐阶段提示词见 `docs/product/art-generation-prompts-v1.md`。2026-09-13 起玩家视觉改为 **统一黑猫 + 模块化差异**：STEP 1–3 已完成并保留，后续先做黑猫玩家母体、动作底板和模块化元素；狐、兔、鸟、熊、汪转为社区 NPC / Resident。角色基础身份确认后禁止大范围重构。

---

# Direction A｜知乎人格研究所 / Editorial Personality Lab

## 一句话

把「谢邀喵」做成一间介于**高级编辑部、人格实验室、数据杂志**之间的空间：不是“养一只可爱电子宠物”，而是“知乎多年行为终于被显影成一个活着的数字人格样本”。

## 核心隐喻

- 用户：被分析的人格样本；
- 知乎行为：样本数据；
- 人格蛋：未显影样本；
- 谢邀喵：被孵化出的数字人格标本 / 编辑人格；
- 刘看山：实验室管理员 / 编辑部向导；
- 匹配：两份人格样本的“谱系比对”；
- 养成：人格档案不断增厚。

## 视觉语言

关键词：`editorial / research lab / information design / premium / intelligent / restrained / data-rich`

### 色彩

- 主背景：暖白、骨白、极浅灰；
- 正文：近黑；
- 主强调：知乎蓝；
- 少量辅助：安全橙 / 标记红，只用于状态和批注；
- 尽量避免大面积渐变和霓虹。

### 字体与排版

- 大标题像杂志封面 / 展览目录；
- 中文大字有明显编辑设计感；
- 正文采用高可读现代无衬线；
- 数字、百分比、标签像科研图表；
- 大量使用细线、脚注、编号、注释、数据来源标签。

### 宠物呈现

宠物不是传统萌系立绘，而是**模块化 2D 人格标本**：

- 轮廓简单；
- 外观配件由 Persona 属性映射；
- 旁边始终伴随数据标注；
- 更像“活起来的信息可视化角色”。

例如：

```text
英短 / ENGINEER TYPE 04
└ 护目镜：技术兴趣
└ 齿轮吊牌：机械内容偏好
└ 尾巴姿态：表达直接度
```

## 页面原型

### Landing

非常干净，像展览海报。

左侧巨大文案：

> 你在知乎这些年，
> 其实已经偷偷养出了一只东西。

右侧是一枚极简人格蛋，周围只有少量数据刻度、编号、未完成的分类标签。

刘看山站在角落，像管理员，用一句极小的注释：

> 「档案已经有了，只差你允许我们打开。」

主 CTA：`开始人格显影`

### Scanning

像人格报告正在被打印 / 逐层显影：

```text
01 / CREATION
公开创作  ✓
高密度长答倾向  0.82

02 / FOLLOWING
关注关系  ✓
技术创作者聚集度  HIGH

03 / COLLECTION
收藏结构  ✓
AI / 科学 / 工具  3 个主簇
```

不是 loading 动画，而是图表、索引、关键词和注释逐条出现。

### Reveal

整屏像一张高级人物档案封面。

左边是宠物人格标本，右边是：

```text
TYPE 04
英短 · 工程脑

CERTIFIED TITLE
盐选级工具猫

AI & DIGITAL     42%
LONG-FORM        81%
HOARDING         76%
SOCIAL SCENT     AI / SCIENCE / STARTUP
```

每一项都有小型 `WHY?` 注释入口。

### Encounter

做成“两份人格样本对照报告”。

中间不是传统聊天框，而像杂志双栏辩论：

```text
A / 你的喵                     B / 齿轮
结构化长答                     短句直球
AI / 科学                      AI / 科学

COMMON AREA  67%
CONTRAST     31%
MATCH        87%
```

下方是真实知乎问题，双方各给 1–2 段“边注式”观点。

### Home「窝」

像一张不断更新的“人格日报”。

顶部：今天唯一主事件。

下面三条成长轴像小型研究指标：见识 / 表达 / 社交。

整体更像“我的人格档案今天又多了一页”，而不是游戏家园。

## 动效语言

- 页面转场：纸张滑动、索引切换、标记线展开；
- Scanning：文字显影、图表增长、批注逐条出现；
- Reveal：档案封条解除 / 样本卡打开；
- 不使用夸张粒子、爆炸、游戏式金币动画。

## 优势

- 和知乎“知识、观点、内容沉淀”气质天然一致；
- 最容易让人格分析看起来可信而不是抽卡；
- 评委一眼能理解“数据 → Persona → 匹配”；
- 可解释性表达空间最大；
- 实现难度相对可控。

## 风险

- 宠物“养成感”最弱；
- 如果做得太理性，会像人格测试报告，不像活的 Agent 社区；
- 需要靠文案和细节动效补情绪。

## 完整设计提示词

```text
Design a complete responsive web product interface for “谢邀喵”, a Zhihu-powered AI digital persona and social matching experience.

Visual direction: premium editorial personality laboratory, combining a contemporary Chinese design magazine, an information visualization research lab, and a sophisticated editorial archive. The product should feel intelligent, credible, cultured, and slightly playful, but never childish, cyberpunk, gamer-like, or generic SaaS.

Core visual metaphor: years of a user’s Zhihu public activity are being developed like a hidden personality specimen. The user’s AI pet is not a random cartoon mascot; it is a living data portrait composed from interests, collections, following patterns, and writing behavior.

Use warm off-white and near-black as the dominant palette, Zhihu blue as the main accent, with tiny amounts of annotation orange/red. Use strong editorial typography, oversized Chinese headlines, fine rules, numbered sections, footnotes, index labels, confidence markers, small charts, evidence annotations, and restrained data visualization.

The pet should be a modular flat 2D personality specimen: simple silhouette, distinctive accessories derived from user traits, surrounded by subtle labels and evidence callouts. It must still feel alive and personable, but not like a generic cute game character.

Key screens:
1. Landing: exhibition-poster composition, giant Chinese hook “你在知乎这些年，其实已经偷偷养出了一只东西。”, a minimal unhatched personality egg with taxonomy marks, Liu Kanshan as a tiny lab/editorial guide.
2. Scanning: progressively printed personality report; creation, follows, and collections appear as indexed research sections with real findings and confidence, never a generic spinner.
3. Reveal: full-page dossier cover with pet specimen on one side and four explainable personality metrics on the other.
4. Encounter: split editorial debate spread comparing two digital personas, showing shared interests, contrast, internal matching score, one real Zhihu topic, and short side-by-side arguments.
5. Home: a daily personality journal where one important event dominates; growth axes are secondary research indicators.
6. Explore, Encounter, Atlas: maintain the same editorial archive language, avoiding dashboard density.

Motion language: paper/index transitions, underline drawing, labels appearing, chart values developing, dossier seal opening. No neon particles, no glossy 3D, no large gradients, no crypto aesthetic, no childish gamification.

Mobile-first, highly legible, strong hierarchy, rich whitespace, sophisticated but buildable with React/Tailwind and lightweight CSS motion.
```

---

# Direction B｜电子宠物街区 / Living Pet Neighborhood

## 一句话

把「谢邀喵」做成一个**真正想每天回来逛两分钟的 AI 宠物社区**：像电子宠物、街区社交、小型轻游戏的结合，但所有玩法都由知乎内容和人格驱动。

## 核心隐喻

- 用户：铲屎官 / 人格主人；
- 人格蛋：真正会孵化的电子生命；
- 谢邀喵：住在“知乎街区”的数字宠物；
- 刘看山：街区管理员 / 新手 NPC；
- 匹配：宠物在街上闻到另一只宠物；
- 知乎话题：街区里每天掉落的新事件；
- 养成：宠物去过更多地方、认识更多邻居、长出新习惯。

## 视觉语言

关键词：`digital pet / social playground / playful / sticker / cozy / colorful / collectible / living community`

### 色彩

- 主背景：奶油白或深蓝夜色，可根据日夜切换；
- 主色：知乎蓝；
- 辅色：薄荷绿、柠檬黄、珊瑚橙、薰衣草紫；
- 每只宠物可以拥有自己的 Accent Color；
- 颜色鲜明但避免“儿童教育 App”。

### 排版

- 更圆润、更口语；
- 大量短句气泡、贴纸标签、状态小牌；
- 数值不做金融 Dashboard，而像游戏属性条。

### 宠物呈现

这是三套里**宠物存在感最强**的一套。

宠物采用：

- 扁平 2D cutout / sticker character；
- 清晰轮廓；
- 每只宠物有 2–4 个由 Persona 决定的外观组件；
- 同一底层骨架可以拼出大量差异；
- 不追求复杂生成图，强调可组合与动画。

动作至少有：

- 待机；
- 闻；
- 转头；
- 抬杠；
- 睡觉；
- 叼内容回来。

## 页面原型

### Landing

用户进入的是“知乎人格街区入口”。

中央人格蛋会轻微摇晃，刘看山在旁边敲蛋。

远处能看到其他宠物从画面经过。

主标题仍然是：

> 你在知乎这些年，其实已经偷偷养出了一只东西。

但是整个页面明显更像“它马上就要活了”。

主 CTA：`敲一下，看看里面是谁`

### Scanning

不是报告，而是**孵蛋过程**。

每读取一种数据，蛋壳出现一个视觉变化：

- 创作 → 出现文字纹理；
- 关注 → 长出耳朵/角/配件轮廓；
- 收藏 → 蛋周围堆出几个小物件；
- 社交气味 → 出现鼻子/气味轨迹。

旁边还是明确展示真实数据依据，避免纯游戏化。

### Reveal

人格蛋真正破开。

宠物跳出来，先说自己的口头禅。

然后像游戏角色初次获得：

```text
获得新居民：英短 · 工程脑

称号：盐选级工具猫
性格：理性 / 爱拆问题 / 偶尔抬杠
最爱闻：AI / 科学 / 创业
```

下方才出现“为什么我是这样”的数据依据。

### Encounter

是“宠物在街角碰到另一只”的小场景。

两只宠物先互相观察，显示：

```text
正在闻……
AI ✓
科学 ✓
长答 vs 短句 !

87% 同频
```

然后弹出一个真实知乎话题，宠物各自说两句。

不是完整聊天窗口，更像 20 秒的互动小剧场。

### Home「窝」

真正做成一个房间 / 小窝。

但不要复杂装潢系统，只允许少量人格化陈设：

- 收藏很多 → 地上有书/收藏盒；
- 技术浓度高 → 小终端 / 工具；
- 夜猫子 → 夜间灯；
- 社交值高 → 门口有访客脚印。

今天最重要的事件直接发生在房间里，例如门口有一张齿轮留下的纸条。

## 动效语言

- squash & stretch；
- 轻微弹跳；
- 贴纸式弹出；
- 气味轨迹；
- 蛋裂纹；
- 小范围粒子；
- 页面跳转像在街区移动。

动效要短，不能像手游过场。

## 优势

- A「宠物养成」最自然；
- 第一眼最容易产生亲和力和分享欲；
- 非常适合长期 Daily Event；
- 四导航可以自然变成“窝 / 街上逛 / 遇见 / 图鉴”；
- 刘看山官方素材很好融入。

## 风险

- 最容易做幼稚；
- 如果游戏味太重，会削弱知乎“知识/观点”的独特价值；
- 宠物资产与动作系统工作量最高；
- 需要严格避免变成换皮 Tamagotchi。

## 完整设计提示词

```text
Design a responsive web experience for “谢邀喵”, a Zhihu-powered AI digital persona pet that grows from a user’s public Zhihu behavior, explores real Zhihu content, and meets other users’ AI personas before the humans meet.

Visual direction: a living digital pet neighborhood, combining a sophisticated Tamagotchi-like emotional bond, a small social playground, sticker-style character design, and modern Chinese internet culture. It must feel playful, alive, collectible, social, and highly shareable, but not childish, not a mobile gacha game, not anime-heavy, and not a generic game dashboard.

Use a warm cream or deep-night neighborhood background, Zhihu blue as the anchor color, with controlled mint, coral, lemon and lavender accents. Characters use bold flat 2D cutout/sticker silhouettes with modular accessories derived from personality traits. Every pet should look immediately distinct through species, accessories, posture, expression and one signature prop.

The UI should make the pet feel physically present: idle, sniffing, turning, arguing, sleeping, carrying a piece of content home. Use compact speech bubbles, stickers, little footprints, scent trails, room props and neighborhood signs. Keep data explanations visible and trustworthy underneath the playful layer.

Key screens:
1. Landing: a shaking personality egg in the entrance of a small Zhihu neighborhood, Liu Kanshan tapping or guarding it, other persona pets occasionally passing in the distance. Hook: “你在知乎这些年，其实已经偷偷养出了一只东西。” CTA: “敲一下，看看里面是谁”.
2. Scanning: the egg physically evolves as public creations, follows and collections are analyzed; each data source adds a visible clue to the emerging pet while real evidence text appears beside it.
3. Reveal: the egg cracks open, the new pet jumps out and speaks its catchphrase. Present it like discovering a new resident, then show title, personality, social scent and explainable evidence.
4. First Encounter: two pets meet at a street corner, sniff each other, shared-interest indicators light up, an internal match score appears, then a real Zhihu topic becomes a tiny 2–4 turn interaction scene.
5. Home: a compact personal pet room. Props subtly reflect persona traits. The most important daily event is physically present in the room: visitor footprint, note, carried-back question, new title, etc.
6. Explore: the pet carries back real Zhihu content and explains “why I brought this to you”.
7. Encounter: a neighborhood social area, not Tinder swipe cards.
8. Atlas: collectible but tasteful relationship/personality history.

Motion: short bouncy cutout animation, egg cracks, scent trails, sticker pop-ins, tiny footsteps, character reactions. Avoid long game transitions, loot-box effects, complex 3D, coins, stamina, daily check-in systems or heavy RPG chrome.

The result should feel like a charming AI-native social product first, a game second, and a Zhihu product at its core.
```

---

# Direction C｜人格剧场 / Kinetic Persona Theatre

## 一句话

把整个 90 秒首访做成一场**“你的知乎人格第一次登台”**：网页不是信息容器，而是一段极强节奏的互动表演。宠物是演员，知乎内容是剧本，灵魂匹配是双人对手戏。

## 核心隐喻

- 用户知乎历史：幕后剧本；
- 人格蛋：幕布后的角色；
- Persona：演员 / 面具 / 数字角色；
- 刘看山：报幕员；
- Scanning：演员定妆 / 人格字幕生成；
- Reveal：第一次登台；
- Match：双人对手戏；
- Home：每日新一幕。

## 视觉语言

关键词：`kinetic typography / interactive theatre / poster design / bold / dramatic / contemporary / art-tech`

### 色彩

高对比，只用少量颜色：

- 墨黑 / 深炭；
- 暖白；
- 一个极强主色：知乎蓝；
- 一个冲突色：朱红或亮橙。

不追求“科技蓝紫霓虹”，更接近当代海报、文化展览、动态字体设计。

### 字体

三套里最强调字。

- 巨型标题可以占屏幕 50–70%；
- 数据成为排版构成；
- 宠物甚至可以和大字互相遮挡；
- 中英文编号、符号、百分比参与画面节奏。

### 宠物呈现

宠物更像**角色符号 / 舞台演员**，不追求复杂可爱。

可以使用：

- 高识别剪影；
- 夸张姿态；
- 极少量几何配件；
- 每种 Persona 对应一种姿态语言；
- 全屏出现时像海报主角。

## 页面原型

### Landing

几乎没有传统 Header。

第一屏只有：

```text
你在知乎这些年
其实已经偷偷
养出了一只东西
```

三个巨大断句占满画面。

人格蛋藏在某个字的负空间里，轻微震动。

刘看山像报幕员，从边缘探出来：

> 「要开幕吗？」

CTA 可以直接是一个超大词：`开幕`

### Scanning

是高速但克制的动态字幕：

```text
写过什么？
LONG FORM / 81

关注谁？
TECH CLUSTER / HIGH

收藏什么？
AI / SCIENCE / TOOLS

你是什么？
...
```

每一次“发现”都像舞台 cue 一样切进来。

### Reveal

这是整套的最强画面。

全屏黑场 → 聚光灯 → 宠物剪影 → 巨型名称：

```text
英短
ENGINEER BRAIN
```

下一拍：

```text
「盐选级工具猫」
```

再下一拍才展开 4 个关键属性。

Reveal 应该像品牌片里的角色登场，而不是卡片展开。

### Encounter

直接做成 `VS / DUO` 舞台。

两只宠物站屏幕两边，中间是巨大 `87%`。

真实知乎问题像“今晚剧目”一样挂在顶部。

每只宠物说一句，句子直接以大字号进入各自半边舞台，而不是聊天气泡。

观点冲突时，屏幕分界线产生位移；共同观点时，两边文字短暂对齐。

### Home「窝」

不把“窝”画成普通 Dashboard，也不固定成房间插画，而是把它理解成**一块有前台与侧台的小舞台**。日常玩法采用自主出门循环，因此 Home 最重要的是角色当前是否在场。

#### 在家

宠物在聚光区域里做自己的事，用户可以留一张很短的“出门纸条”。

#### 出门

允许整块舞台真正空下来，只留下椅子、杯子、纸条或门缝等痕迹：

> 它不在。
>
> 大概又跑去看别人为什么吵架了。

此时主 CTA 不是“催回来”，而是 `看看上次带回来的东西`。

#### 回来

灯重新亮起，角色从侧台进入：

> 门响了一下。
>
> 它回来了，而且好像有话要说。

CTA：`看看它带回了什么`

带回物以幕间札记、问题票根、关系票根等形式出现。成长值、关系等都退到舞台下方。

## 动效语言

- kinetic typography；
- wipe / cut / mask；
- 舞台灯光感；
- 强节奏 hard cut；
- 数字快速定格；
- 角色剪影进入；
- 大字与角色发生遮挡。

严禁：

- terminal hacker 视觉；
- Matrix 字符雨；
- 蓝紫赛博朋克；
- 复杂 3D；
- 大量玻璃拟态。

## 优势

- 三套里比赛记忆点最强；
- 首访 90 秒会非常像“作品”，而非网站；
- 特别适合路演现场和演示视频；
- 能把普通的 Persona Reveal 做成真正高潮；
- 资产量不一定大，很多效果靠排版、CSS、动效完成。

## 风险

- 最容易为了视觉牺牲可读性；
- 日常长期使用如果一直强动效会疲劳；
- 对动效节奏与排版能力要求最高；
- 需要做“首访剧场模式 + 日常收敛模式”，不能全站永远像广告片。

## 完整设计提示词

```text
Design “谢邀喵” as an immersive kinetic persona theatre rather than a conventional web dashboard. It is a Zhihu-powered AI digital persona product where years of public interests, collections and writing behavior hatch into a living character that explores Zhihu and meets other users’ digital personas.

Visual direction: contemporary interactive theatre, kinetic Chinese typography, bold cultural poster design, art-tech exhibition identity, dramatic but precise. The first 60–90 seconds should feel like the user’s hidden Zhihu personality is appearing on stage for the first time.

Use an extremely controlled palette: charcoal black, warm white, Zhihu blue, and one conflict accent such as vermilion or vivid orange. Avoid purple-blue cyberpunk, hacker terminals, Matrix code, glassmorphism, generic AI gradients, complex 3D, and SaaS cards everywhere.

Typography is a main visual actor. Use huge Chinese headlines, dramatic line breaks, oversized percentages, section numbers, masks, crops and spatial typography. Pet characters are bold flat silhouettes / graphic actors with one or two persona-derived accessories and expressive poses. They can overlap typography and enter/leave the stage.

Key screens:
1. Landing: almost no conventional navigation. Giant stacked Chinese hook fills the viewport: “你在知乎这些年 / 其实已经偷偷 / 养出了一只东西”. A personality egg hides inside the negative space of the typography. Liu Kanshan appears like a stage announcer asking “要开幕吗？”. CTA is a single oversized word: “开幕”.
2. Scanning: rapid but legible kinetic subtitles: “写过什么？ / LONG FORM 81”, “关注谁？ / TECH CLUSTER HIGH”, “收藏什么？ / AI SCIENCE TOOLS”. Each real finding lands like a stage cue.
3. Reveal: blackout, spotlight, pet silhouette, then huge type “英短 / ENGINEER BRAIN”, followed by title “盐选级工具猫”. Only after the dramatic reveal do four explainable data traits appear.
4. First Encounter: two persona actors occupy opposite sides of the screen. A giant internal match score sits between them. The real Zhihu question is presented as tonight’s ‘play’. Their 2–4 statements appear as large staged lines, not chat bubbles. Shared ideas visually align; disagreement shifts the screen divider.
5. Home: not a literal pet room. Treat each day as a new ‘scene’ represented by one dominant event poster: “昨晚，齿轮来过。” CTA: “看这一幕”. Growth and history sit quietly below.
6. Explore / Encounter / Atlas: preserve the graphic identity but reduce motion for everyday usability.

Motion language: hard cuts, masks, type wipes, spotlight reveals, number lock-ins, silhouette entrances, controlled scale changes. Motion should be short and intentional. First visit may be theatrical; daily use must become calmer.

The product should feel memorable enough for a hackathon stage demo, culturally sophisticated enough for Zhihu, and technically feasible with React, CSS and lightweight motion rather than video or 3D assets.
```

---

# 三套快速对比

| 维度 | A 人格研究所 | B 电子宠物街区 | C 人格剧场 |
|---|---|---|---|
| 第一眼吸引 | 8/10 | 9/10 | 10/10 |
| “像知乎” | 10/10 | 7/10 | 8/10 |
| Persona 可信感 | 10/10 | 8/10 | 8/10 |
| 宠物养成感 | 6/10 | 10/10 | 7/10 |
| 社交趣味 | 7/10 | 10/10 | 9/10 |
| 路演记忆点 | 8/10 | 9/10 | 10/10 |
| 日常长期使用 | 10/10 | 9/10 | 7/10 |
| 前端实现风险 | 低–中 | 中–高 | 中–高 |
| 美术资产需求 | 低 | 高 | 中 |

## 选择建议

如果优先级是：

- **评委相信这是“知乎原生的 AI 产品”** → A；
- **用户真的愿意养、愿意回来、愿意分享** → B；
- **黑客松现场 30 秒内把所有人注意力抢过来** → C。

也允许最终采用 `主方向 + 少量借用`：

- A 主体 + B 的宠物动作；
- B 主体 + A 的数据解释；
- C 首访 + A/B 的日常 App Shell。

但在进入正式视觉实现前，应先选一个**主方向**，否则容易变成三种风格拼贴。