# 谢邀喵 / Xieyao Meow — Art Generation Prompts v1

> **日期：** 2026-09-13
>
> **用途：** 给外部图像生成工具使用。
>
> **核心原则：** 先锁视觉风格，再锁角色身份；后续所有角色图都必须基于 reference/edit，不允许仅靠文字“重新生成一个类似角色”。
>
> **2026-09-13 生产方向调整：** STEP 1–3 已完成，不返工。此前生成的猫/狐/兔/鸟/熊/汪不再作为六种“用户 Persona 物种”：**用户 Persona 从 STEP 4 起统一为不同的黑猫；狐、兔、鸟、熊、汪全部转为社区 NPC / Resident 素材。** 玩家差异改由黑猫的模块化外观、装备、贴纸、称号和经历痕迹表达。
>
> **当前进度：STEP 1–3 DONE。下一张素材从 STEP 4 开始。**

---

## 0. 总生产规则 / MUST READ

### 生产顺序

1. **STYLE MASTER** — 生成并确认视觉风格母版。
2. **CHARACTER MASTER** — 生成并人工确认 6 个角色母版。
3. **DERIVATIVES** — 使用 CHARACTER MASTER 作为参考图生成 pose / avatar / variant。
4. **WORLD ASSETS** — 角色稳定后再生成 egg / room / journey / encounter / collectible。

### 身份锁定指令 / Identity Lock

**English**

```text
Use the supplied canonical character reference as the strict identity anchor. Preserve the exact same character identity: face shape, eye placement, eye style, head-to-body ratio, body proportions, ear/tail/wing structure, fur pattern, core costume construction, signature accessories, color palette, outline treatment, print texture, age impression and overall illustration style. Change only the requested pose, facial expression, direction and temporary prop. This must look like the exact same character in another moment, not a redesign, reboot, alternate costume, or a similar character. Do not reinterpret the character.
```

**中文版**

```text
严格以提供的角色母版图作为身份锚点。必须保留完全相同的脸型、五官位置、眼睛画法、头身比、身体比例、耳朵/尾巴/翅膀结构、毛色花纹、核心服装版型、标志性配件、主配色、轮廓线处理、印刷颗粒与年龄感。只修改本次指定的姿势、表情、朝向和临时手持道具。必须让人一眼认出这是同一个角色在另一个时刻，禁止重设计、换画法、换服装体系、换脸或重新诠释。
```

### 统一输出要求
- 2D editorial character illustration
- 1600×2000, 4:5
- transparent background
- full body unless explicitly avatar
- feet baseline approximately consistent
- soft warm upper-left light
- restrained shadows
- no environment background
- no baked text
- no watermark
- no logo
- no UI frame

### Negative Prompt / 禁止项

```text
cyberpunk, neon purple gradient, sci-fi robot face, mecha, complex circuits, hologram HUD, glassmorphism, glossy 3D render, Pixar-like 3D, photorealistic fur, toy figurine, blind-box plastic, chibi baby proportions, toddler cartoon, overly kawaii, anime school uniform, game armor, fantasy weapon, NFT style, crypto aesthetic, generic AI glow, excessive lens flare, text, letters, Chinese characters, watermark, signature, logo, UI mockup, frame, scenery, multiple characters unless explicitly requested, extra limbs, malformed hands, inconsistent costume, redesigned face
```

## 1. STEP 1 — STYLE MASTER / 视觉风格母版

**输出文件建议：** `00_style_master_v01.png`

**Prompt：**

为“谢邀喵”建立一张角色视觉风格母版 / character style bible。

这是一个基于知乎兴趣、收藏、关注和创作行为孵化 AI 数字人格的产品。视觉世界不是儿童宠物游戏，而是“现代中国互联网文化海报 × 人格剧场 × 编辑插画 × 纸张档案感”。

请在同一张风格探索板中展示 6 个尚未最终定稿、但属于同一世界的拟人动物角色轮廓样例：猫、狐狸、兔、短翅蓝白鸟、熊、狗。它们全部采用一致的角色语言和尺度，用于判断统一画法，不要为每只角色做完全不同的艺术风格。

**视觉风格：**
- sophisticated 2D editorial mascot illustration
- contemporary Chinese poster identity
- bold readable silhouette
- slightly anthropomorphic standing body
- clear expressive eyes
- intelligent, curious, opinionated, warm, not childish
- flat color blocks with subtle dimensional shading
- light paper / screen-print / risograph texture
- restrained theatrical warm spotlight
- strong black / warm white / Zhihu blue #1772F6 visual system
- tiny amount of vermilion red and kraft-paper brown as accent only
- mature cultural-product feeling
- visually compatible with large Chinese editorial typography, paper tickets, polaroid cards and theatre posters

角色比例：头部偏大但不是 Q 版婴儿比例；身体可以自然站立、坐下、背包、拿书或工具。手脚简化但要适合做多种动作。角色在 96px 高度时仍然能凭轮廓识别物种。

画面应该像“IP 角色风格研究板”，重点是角色画法、轮廓、材质、线条、眼睛、比例和色彩的一致性。不要生成完整网页，不要生成 UI，不要把任何中文或英文文字画进图里。

IMPORTANT: This is the style reference for all later assets. Prioritize a reproducible character system over one-off illustration spectacle.

### 验收标准
- 六个动物属于同一世界
- 不是 3D
- 不是儿童卡通
- 黑/暖白/知乎蓝占主导
- 能看出纸张印刷颗粒，但不脏
- 角色轮廓足够简单，适合后续大量动作一致生成

## 2. STEP 2 — 6 个 CANONICAL CHARACTER MASTER

> 使用 STEP 1 已确认的 **STYLE MASTER** 作为 style reference。
> 每只角色单独生成、单独确认。
> 母版构图全部统一：**3/4 正面、自然站立、全身、透明背景、无场景、无文字。**

### 2.1 工具猫 / TOOL CAT

**输出：** `personas/cat/master.png`

**Prompt：**

Use the supplied STYLE MASTER as the strict visual style reference.

设计“谢邀人格”中的工具猫 Tool Cat canonical master。

**角色身份：**理性、拆问题、工程脑、爱工具、爱收藏，但并不高冷。它像一个会把复杂问题拆成三个模块的知乎技术用户。

**固定外观：**
- 黑白短毛猫，轮廓圆润、短身、稳定重心
- 圆脸，白色口鼻区域，黑色耳朵与头顶部花纹形成清晰识别点
- 机灵但克制的眼神
- 小而清晰的圆框眼镜，必须成为长期身份元素
- 知乎蓝 #1772F6 的围巾或短领结，简洁，不飘得过长
- 深色小型工具斜挎包，结构简单，后续任何动作都必须保持同一设计
- 身体略矮胖，但不要婴儿化
- 默认双手自然，一只手可以轻轻扶住包带
- 3/4 front view, full body

**气质：**engineer brain, thoughtful, methodical, mildly nerdy, dependable, witty.

**不要出现：**机器人元素、机械义肢、赛博护目镜、实验室白大褂、复杂工具挂满全身。

透明背景，无文字，无 logo。

### 2.2 哲学狐 / PHILOSOPHY FOX

**输出：** `personas/fox/master.png`

**Prompt：**

Use the supplied STYLE MASTER as the strict visual style reference.

设计“谢邀人格”中的哲学狐 Philosophy Fox canonical master。

**角色身份：**喜欢追问“为什么”、观点鲜明、愿意反驳、擅长把技术问题问到人的意义上，但不是装腔作势。

**固定外观：**
- 橘红狐狸，奶白口鼻和胸前区域
- 比工具猫略高、略修长，但仍属于同一角色体系
- 狐狸耳朵和尾巴是最重要识别点
- 眼神聪明、有一点“我还有一个问题”的戏谑感
- 深朱红围巾，作为长期身份元素
- 一个小型便签本或薄书作为标志性随身物，但不遮挡身体轮廓
- 服装不要正式西装，可以是简洁深色短马甲/轻外套
- 3/4 front view, full body

**气质：**question chaser, devil's advocate, humanistic, articulate, warm but provocative.

不要画成狡猾反派狐狸，不要华丽贵族服装，不要魔法元素。

透明背景，无文字，无 logo。

### 2.3 生活兔 / LIFE RABBIT

**输出：** `personas/rabbit/master.png`

**Prompt：**

Use the supplied STYLE MASTER as the strict visual style reference.

设计“谢邀人格”中的生活兔 Life Rabbit canonical master。

**角色身份：**关注生活体验、城市细节、情绪感受和真实日常。温和、细腻、观察力强，但不是软弱或幼稚。

**固定外观：**
- 奶白兔，长耳朵形成绝对识别轮廓
- 身体线条柔和，但比例必须和其他 Persona 属于同一世界
- 温和且专注的眼神
- 小型卡其/暖灰帆布斜挎包
- 可带一台非常简洁的小相机作为核心随身物
- 衣着简洁，暖白/深灰为主，知乎蓝只做小面积识别
- 3/4 front view, full body

**气质：**detail keeper, warm observer, life tester, emotionally intelligent, grounded.

不要蝴蝶结公主风，不要儿童绘本兔，不要粉嫩糖果配色。

透明背景，无文字，无 logo。

### 2.4 数据鸟 / DATA BIRD

**输出：** `personas/bird/master.png`

**Prompt：**

Use the supplied STYLE MASTER as the strict visual style reference.

设计“谢邀人格”中的数据鸟 Data Bird canonical master。

**角色身份：**证据优先、喜欢数字、擅长比较和验证，对“你这个结论的数据在哪里”很敏感。

**固定外观：**
- 蓝白短翅鸟，身体紧凑、稳，允许略有企鹅式稳定轮廓，但仍然是“数据鸟”而不是写实企鹅
- 深蓝头顶/背部 + 暖白腹部 + 知乎蓝局部
- 眼神专注、冷静、略带分析感
- 非常小的方形眼镜或简单分析镜片，不能科幻
- 小型数据夹板 / tablet 作为核心随身物
- 翅膀必须能在后续动作中承担“指、抱、拿”这些拟人动作
- 3/4 front view, full body

**气质：**evidence first, pattern hunter, fact checker, precise, calm.

不要机器人鸟，不要机械翅膀，不要全息屏，不要赛博蓝光。

透明背景，无文字，无 logo。

### 2.5 创作熊 / CREATIVE BEAR

**输出：** `personas/bear/master.png`

**Prompt：**

Use the supplied STYLE MASTER as the strict visual style reference.

设计“谢邀人格”中的创作熊 Creative Bear canonical master。

**角色身份：**喜欢故事、审美、设计、表达和把想法做成东西。创意很多，但不是“疯癫艺术家”。

**固定外观：**
- 暖棕熊，圆润厚实，但不要像幼儿毛绒玩具
- 比工具猫略大一点，肩部更宽
- 表情开放、有灵感、略带好奇
- 简洁深色创作马甲或围裙式上衣，剪裁必须非常简单，便于后续动作一致
- 小型速写本 + 一支粗铅笔作为核心随身物
- 知乎蓝可出现在笔、别针或小围巾细节上
- 3/4 front view, full body

**气质：**story builder, aesthetic brain, idea machine, maker, expressive.

不要贝雷帽刻板艺术家造型，不要五颜六色颜料泼满身体，不要儿童手工课风格。

透明背景，无文字，无 logo。

### 2.6 探索汪 / EXPLORER DOG

**输出：** `personas/dog/master.png`

**Prompt：**

Use the supplied STYLE MASTER as the strict visual style reference.

设计“谢邀人格”中的探索汪 Explorer Dog canonical master。

**角色身份：**兴趣跨度大、喜欢出去看看、行动优先、愿意进入陌生领域。是“先去看看再说”的好奇型 Persona。

**固定外观：**
- 柴色/奶白犬，清晰犬类口鼻和耳朵
- 身体重心略前倾，比其他角色更有行动感
- 好奇、警觉但亲和的眼神
- 卡其色简洁旅行背包，必须成为长期身份元素
- 一条很短的知乎蓝围巾/领巾作为品牌联系
- 可以携带折叠地图或小指南针，但不要户外军品感
- 3/4 front view, full body

**气质：**curious walker, field scout, crossover mind, optimistic, energetic.

不要军犬，不要战术装备，不要探险电影英雄装束。

透明背景，无文字，无 logo。

## 3. APPEARANCE VARIANTS / 外观变体

> **重要：Variant 不是重新设计角色。**
必须使用对应 CHARACTER MASTER 作为 reference，并附加 IDENTITY LOCK。
只改变毛色/花纹和极少量局部色彩，不改变脸、骨架、衣服版型、核心配件。

### 通用 Prompt 模板

**IDENTITY LOCK**
Create a controlled appearance variant of the exact same canonical character. Keep all proportions, face, costume, accessories, pose and illustration style identical. Change only the fur/feather color pattern specified below. This should look like the same character with a predefined appearance variant, not a sibling or redesign.
Transparent background, same 1600×2000 canvas, same feet baseline.

### CAT

- `blackwhite`: canonical
- `grey`: replace black fur areas with medium cool grey, preserve pattern geometry
- `orangewhite`: replace black fur areas with warm muted orange, preserve pattern geometry

### FOX

- `orange`: canonical
- `redbrown`: deeper muted red-brown fur, same cream markings
- `silver`: muted silver-grey fur, same cream markings, preserve red scarf

### RABBIT

- `white`: canonical
- `cream`: warm cream fur
- `grey`: light neutral grey fur, preserve warm-white muzzle

### BIRD

- `blue`: canonical
- `navy`: deeper navy top feathers, preserve warm-white belly and Zhihu blue accent
- `greyblue`: muted slate-blue feathers, same silhouette

### BEAR

- `brown`: canonical
- `caramel`: lighter caramel-brown fur
- `darkbrown`: deeper cocoa-brown fur

### DOG

- `shiba`: canonical
- `blacktan`: controlled black-and-tan coat pattern, preserve face identity
- `cream`: pale cream coat, same markings geometry

## 4. STEP 4 — BLACK CAT PLAYER SYSTEM / 黑猫玩家角色系统

> **从这里开始是新的正式生产方向。** STEP 1–3 已完成，不需要返工。
>
> 玩家自己的 Persona **只使用黑猫**。不同用户之间的差异不再靠“换物种”，而靠统一黑猫骨架上的受控元素组合。
>
> STEP 1–3 已经生成的狐、兔、鸟、熊、汪全部保留，转入后面的 **NPC / Resident** 资产库。

### 4.1 BLACK CAT BASE MASTER / 黑猫基础母版

**输出：** `personas/player-black-cat/base_master.png`

使用已经完成的 STYLE MASTER 与 CAT master 作为双 reference。不要重新发明一个新画风。

**Prompt：**

Use the approved STYLE MASTER and the approved cat master as strict references. Create the canonical PLAYER BLACK CAT base for Xieyao Meow.

This is the shared anatomical and identity base for all user Personas. It must be unmistakably a black cat: deep charcoal-black short fur, clean readable cat silhouette, intelligent expressive eyes, mature editorial mascot proportions, slightly anthropomorphic standing body, simple paws/hands suitable for many gestures, clear tail, no outfit and no permanent personality prop yet.

Preserve the approved world style: contemporary Chinese editorial poster illustration, bold 2D silhouette, restrained screen-print / paper texture, warm-white highlights, subtle Zhihu-blue reflected accents, no 3D fur rendering.

The black cat should feel neutral enough to accept many personality modules later, but distinctive enough to become the product's core player avatar. 3/4 front standing pose, full body, transparent background, 1600×2000, no text, no logo.

**禁止：** white/orange/grey cat as the main coat, breed-specific photorealism, cyber cat, costume, glasses, scarf, bag, weapon, background.

### 4.2 BLACK CAT IDENTITY SHEET / 黑猫身份元素板

**输出：** `personas/player-black-cat/identity-sheet.png`

> 这张不是最终角色，是后续拆分元素的设计板。所有元素必须围绕同一个 `base_master`，禁止画成不同物种或不同画风的猫。

**Prompt：**

Use the exact PLAYER BLACK CAT base master as the identity anchor. Create one clean modular identity design sheet for the same black-cat species. Show controlled alternatives for facial/identity elements without changing the base anatomy or art style.

Include:
- 6 eye/personality variants: focused, curious, skeptical, sleepy-smart, bright, deadpan;
- 4 ear-detail variants: standard upright, slightly outward, one subtle folded tip, one tiny harmless notch;
- 4 tiny forehead/cheek fur-tuft variations;
- 6 neck-area identity options: none, short Zhihu-blue scarf, blue collar, charcoal bow tie, warm-paper tag collar, tiny vermilion accent collar;
- 6 eyewear options: none, round glasses, square glasses, thin half-rim, small oval glasses, simple monocle-like editorial lens without steampunk styling.

All options must remain compatible with the same black-cat base. Present as clean isolated component studies on warm-white/transparent-like neutral board, no labels or text baked into the image.

### 4.3 玩家人格 Archetype 不再对应物种

后续玩家仍然保留人格型，但全部是黑猫：

| Archetype | 中文 | 视觉倾向 | 推荐核心元素 |
| --- | --- | --- | --- |
| `engineer_brain` | 工程脑 | 理性拆解 | 圆框眼镜 + 蓝围巾 + 工具本 |
| `system_thinker` | 系统思考者 | 结构、框架 | 方框眼镜 + 文件夹 |
| `tool_collector` | 工具收藏家 | 爱囤工具 | 小工具包 + 多书签 |
| `question_chaser` | 追问者 | 反问、追根究底 | 红批注 + 小书 |
| `evidence_hunter` | 证据猎手 | 数据、验证 | 数据夹板 + 放大镜 |
| `creative_maker` | 创作派 | 故事、审美 | 速写本 + 粗铅笔 |
| `life_observer` | 生活观察员 | 细节、体验 | 小相机 + 帆布包 |
| `curious_roamer` | 好奇漫游者 | 跨界、行动 | 旅行包 + 地图 |

> Archetype 决定**模块组合倾向**，不改变黑猫的物种、骨架或基础画法。

---

## 5. STEP 5 — BLACK CAT POSE BASES / 黑猫动作底板

> 下面所有 Pose 都基于 `player-black-cat/base_master` reference/edit。
>
> **动作底板先不要烧入眼镜、围巾、包、徽章等人格元素。** 这些元素在 STEP 6 组合；这样才能真正做到“同一套动作 + 不同黑猫”。

统一要求：1600×2000、透明背景、全身、相同角色比例、相近脚底基线。

### POSE 01 — `idle_front`

**IDENTITY LOCK** Create the canonical display pose of the exact PLAYER BLACK CAT base: relaxed 3/4 front standing pose, balanced feet, arms naturally at the sides, calm intelligent neutral expression. No accessories, no clothes, transparent background.

### POSE 02 — `idle_relaxed`

**IDENTITY LOCK** Show the exact black-cat base shifting body weight slightly to one side, shoulders relaxed, subtle confident half-smile. No accessories or costume. Transparent background.

### POSE 03 — `home_rest`

**IDENTITY LOCK** Show the exact black-cat base resting comfortably, seated low with relaxed posture and slightly sleepy/content expression. No furniture, no accessory, transparent background.

### POSE 04 — `home_busy`

**IDENTITY LOCK** Show the exact black-cat base seated or standing in a quiet focused working posture, paws positioned so a temporary notebook/tablet can be composited later. Do not include the prop. Transparent background.

### POSE 05 — `prepare_pack`

**IDENTITY LOCK** Show the exact black-cat base leaning slightly forward with hands positioned as if checking a bag that will be composited later. Do not draw a bag. Transparent background.

### POSE 06 — `walking`

**IDENTITY LOCK** Show the exact black-cat base mid-walk, one foot forward, natural curious motion, arms positioned to allow a bag overlay later. No accessories. Transparent background.

### POSE 07 — `thinking`

**IDENTITY LOCK** Show the exact black-cat base thinking deeply, one paw near chin, eyes slightly upward/sideways, intelligent contemplative expression. Transparent background.

### POSE 08 — `talking`

**IDENTITY LOCK** Show the exact black-cat base explaining an idea, one open hand gesture, mouth slightly open, confident and friendly rather than loud. Transparent background.

### POSE 09 — `debating`

**IDENTITY LOCK** Show the exact black-cat base in an engaged intellectual debate, slight forward lean, one clear argumentative gesture, alert eyes, witty not angry. Transparent background.

### POSE 10 — `meeting`

**IDENTITY LOCK** Show the exact black-cat base turning toward an unseen character at center, open greeting gesture, curious cautious smile. Character only. Transparent background.

### POSE 11 — `returned`

**IDENTITY LOCK** Show the exact black-cat base just returning from an outing, pleasantly tired but excited, one paw ready to hold a ticket/postcard overlay later. Do not include the object or bag. Transparent background.

### POSE 12 — `celebrate`

**IDENTITY LOCK** Show the exact black-cat base celebrating a small meaningful success, warm smile, one raised paw ready for a high-five. No confetti. Transparent background.

### POSE 13 — `listening`

**IDENTITY LOCK** Show the exact black-cat base actively listening, body angled toward an unseen speaker, attentive eyes, receptive posture. Transparent background.

### POSE 14 — `surprised`

**IDENTITY LOCK** Show the exact black-cat base having a small intellectual surprise, slightly wider eyes and subtle backward lean; interesting, not cartoon shock. Transparent background.

### POSE 15 — `argument_peak`

**IDENTITY LOCK** Show the exact black-cat base at the peak of an energetic intellectual argument, strongest gesture in the set, focused and humorous rather than hostile. Transparent background.

### Pair bases

- `pair_left`: exact black-cat base facing center/right, ready for conversation/high-five.
- `pair_right`: exact black-cat base facing center/left, ready for conversation/high-five.

### Avatar bases

- `avatar_neutral`
- `avatar_happy`
- `avatar_thinking`
- `avatar_debate`

全部只保留黑猫基础身份，不烧入用户模块。

---

## 6. STEP 6 — MODULAR PLAYER ELEMENTS / 玩家模块化元素

### 6.1 模块拆分原则

不是所有东西都强行做 runtime overlay。按两类处理：

**A. Runtime-safe overlays：**适合直接叠图或用锚点定位。

- 眼镜；
- collar / 小领巾；
- badge；
- interest sticker；
- 小型胸针；
- 票根 / postcard；
- 轻量头饰。

**B. Pose-aware modules：**存在遮挡、透视或肢体接触，按 Pose 生成或在 reference/edit 时烘进角色。

- 背包 / 斜挎包；
- 大围巾；
- Laptop / 相机 / 书 / 地图等手持物；
- 复杂外套。

> 目标是“元素拆分 + 可复用”，不是为了模块化而制造穿帮。

### 6.2 统一锚点

全身角色画布统一 1600×2000，并记录这些逻辑锚点：

```text
HEAD_CENTER
EYES_CENTER
NECK_CENTER
CHEST_CENTER
HAND_L
HAND_R
HIP_L
HIP_R
BACK_CENTER
TAIL_BASE
```

实现层后续只需要保存每个 Pose 的锚点坐标，轻量 overlay 可以跟着锚点移动。

### 6.3 EYE / FACE IDENTITY MODULES

建议先做 6 组：

- `eyes_focused`
- `eyes_curious`
- `eyes_skeptical`
- `eyes_sleepy_smart`
- `eyes_bright`
- `eyes_deadpan`

**Prompt：**

Use the exact PLAYER BLACK CAT face as strict reference. Create a controlled eye/personality variation only. Preserve skull, muzzle, ear position, fur, proportions and illustration style exactly. Change only the eye/brow identity specified. Transparent background or clean isolated face-element sheet, no text.

### 6.4 EYEWEAR

- `glasses_round`
- `glasses_square`
- `glasses_half_rim`
- `glasses_oval`
- `lens_single`
- `glasses_none`

统一：哑光深色、细结构、小尺寸可读，禁止科技 HUD / 蒸汽朋克。

### 6.5 NECKWEAR

- `neck_scarf_blue`
- `neck_collar_blue`
- `neck_bow_charcoal`
- `neck_tag_paper`
- `neck_accent_red`
- `neck_none`

### 6.6 BAG / CARRY KIT

- `bag_tool_satchel`
- `bag_archive_satchel`
- `bag_canvas`
- `bag_travel`
- `bag_creator`
- `bag_data_case`

这些优先以 pose-aware 方式制作，至少覆盖：`idle_front / prepare_pack / walking / returned`。

### 6.7 SIGNATURE PROPS

- `prop_notebook`
- `prop_laptop`
- `prop_book`
- `prop_clipboard`
- `prop_camera`
- `prop_sketchbook`
- `prop_map`
- `prop_magnifier`

优先覆盖：`home_busy / thinking / talking / debating / returned`。

### 6.8 BADGE / STICKER / TRACE

可以直接复用后面收藏物系统：

- 兴趣贴纸；
- 称号徽章；
- 旅途印章；
- 关系徽章；
- 收藏夹痕迹；
- 小型问题票根。

它们负责让同一只基础黑猫“越养越像这个用户”。

### 6.9 推荐的黑猫差异组合

不要完全随机。用知乎成分映射：

```text
archetype
+ eyeVariant
+ eyewear
+ neckwear
+ bagKit
+ signatureProp
+ interestStickers[]
+ earnedBadges[]
+ journeyTraces[]
```

例如：

```text
工程脑黑猫
= focused eyes
+ round glasses
+ blue short scarf
+ tool satchel
+ notebook
+ AI / 编程 stickers
```

```text
生活观察黑猫
= bright eyes
+ no glasses
+ paper-tag collar
+ canvas bag
+ compact camera
+ 城市 / 生活 stickers
```

两者必须仍然一眼看出是“谢邀喵世界里的黑猫”，而不是两个重新设计的 IP。

---

## 7. STEP 7 — NPC / RESIDENT ANIMALS

> STEP 1–3 已生成的狐、兔、鸟、熊、汪**全部保留，不作废**。从现在开始它们的身份改为社区 NPC / Resident。

NPC 的作用：

- 出现在 Match / Encounter；
- 在旅途中被黑猫遇见；
- 作为不同兴趣领域的“社区居民”；
- 给世界增加物种多样性；
- 不承担“每个用户都可能孵化成这个物种”的逻辑。

### NPC 最小动作包

不用给每个 NPC 做完整 15 Pose。第一版每种只做 4 张：

1. `npc_idle`
2. `npc_talking`
3. `npc_meeting`
4. `npc_reaction`

### NPC 建议语义

| NPC | 更适合的社区角色 |
| --- | --- |
| 哲学狐 | 观点 / 人文 / 反方辩手 |
| 生活兔 | 城市 / 生活 / 情绪体验 |
| 数据鸟 | 数据 / 科学 / 金融证据派 |
| 创作熊 | 设计 / 影视 / 文学 / 创作 |
| 探索汪 | 旅行 / 职业 / 跨领域 |

工具猫旧资产可以作为特殊 NPC、测试居民或历史素材，但**用户正式 Persona 统一切到黑猫体系**。

刘看山继续只使用官方素材，身份是世界向导 NPC。

---

## 8. STEP 8 — PERSONA EGG / 人格蛋

> 人格蛋最终孵化的是“用户的黑猫 Persona”，但蛋壳阶段不要提前暴露具体外观模块。

### `egg_idle`

A mysterious unhatched personality egg for Xieyao Meow. Warm bone-white shell, sparse charcoal speckles, one subtle Zhihu-blue mark, editorial paper-print texture, mature and mysterious, transparent background, no text, no 3D.

### `egg_scanning`

Use `egg_idle` as strict reference. Same exact egg with subtle blue reflected fragments and faint internal glow. No sci-fi hologram.

### `egg_glowing`

Same exact egg, stronger warm-white + Zhihu-blue internal glow through hairline cracks.

### `egg_cracking`

Same exact egg cracking open. Only an ambiguous dark cat-like silhouette may be hinted, but do not reveal eyewear/accessories/archetype yet.

### `egg_opened`

Same exact empty opened shell, center space left open for compositing the generated black-cat Persona.

---

## 9. STEP 9 — PERSONALITY THEATRE / 人格剧场背景

### `theatre_blackbox_base`

Create the canonical environment master for Xieyao Meow: contemporary intimate black-box theatre / editorial exhibition stage, charcoal-black architecture, matte dark floor, restrained warm practical lights, tiny Zhihu-blue accents, warm paper/archive materials, sophisticated modern Chinese cultural-product feeling. No characters, no text, no logo, no UI. 2400×1350, 16:9, center 45% mobile-safe.

基于同一母版派生：

- `theatre_activation_spotlight`
- `theatre_casting`
- `theatre_reveal`
- `theatre_encounter`
- `theatre_curtain_call`

只改灯光与极少量纸张/站位，不重新设计空间。

---

## 10. STEP 10 — HOME / 我的窝

统一 2400×1350，中心 mobile-safe，不含角色和文字。

- `room_home_night`
- `room_empty_night`
- `room_home_day`
- `room_empty_day`
- `room_returned`
- `room_visitor`

### P0 Prompt — `room_home_night`

A cozy nighttime room for a black-cat digital Persona inside the Xieyao Meow world. Dark charcoal room, one warm table lamp, small desk, low cushion, few books and blank paper notes, subtle shelf for tickets/polaroids, editorial theatre framing, mature 2D illustration, no character, no readable text, large clean negative space for character placement.

### P0 Prompt — `room_empty_night`

Use `room_home_night` as strict environment reference. Exact same room but clearly empty: the usual bag/character is absent, cushion slightly moved, side exit slightly open, one blank note on desk, warm lamp still on. Emotional focus is absence. No character, no text.

---

## 11. STEP 11 — JOURNEY / EXPLORE BACKGROUNDS

- `journey_zhihu_gate`
- `journey_tech`
- `journey_science`
- `journey_city`
- `journey_books`
- `journey_art`
- `journey_life`
- `journey_night`

这些是“知识世界的区域”，不是旅游摄影；不含角色、知乎问题标题或 UI。

P0 先做 `journey_zhihu_gate`：

A symbolic entrance into a vast knowledge community: contemporary editorial theatre architecture, doorway opening from dark stage into a brighter world of questions, books, blank cards and blue wayfinding shapes, Zhihu-blue accents, warm paper textures, no literal Zhihu logo, no text, no character.

---

## 12. STEP 12 — ENCOUNTER / RELATIONSHIP BACKGROUNDS

- `encounter_stage`
- `encounter_cafe`
- `encounter_library`
- `encounter_room`
- `encounter_rooftop`

P0 先做 `encounter_stage`：

A small intimate black-box theatre for one player black cat and one NPC Resident to discuss a question, two clear warm spotlight zones left/right, central zone for a blank question card, charcoal background, tiny Zhihu-blue accents, no characters, no text.

---

## 13. STEP 13 — COLLECTIBLES / 带回物

统一：透明背景；不烧中文；留白给 HTML/CSS 动态文字。

- `question_ticket`
- `thought_note`
- `journey_postcard`
- `relationship_ticket`
- `interest_sticker`
- `topic_stamp`
- `city_stamp`
- `title_badge`
- `bookmark_card`
- `quote_scrap`
- `photo_polaroid`
- `mystery_item`

P0 优先：

- `question_ticket`
- `relationship_ticket`
- `photo_polaroid`
- `interest_sticker`
- `title_badge`

---

## 14. STEP 14 — PAPER / TAPE / STAMP AUXILIARY ASSETS

- `paper_card_01`
- `paper_card_02`
- `paper_torn`
- `notebook_page`
- `tape_beige`
- `tape_blue`
- `tape_red`
- `pin_blue`
- `stamp_round`
- `stamp_zhihu_journey`
- `stamp_relation`
- `polaroid_frame`
- `ticket_frame`

保持暖白纸张、轻微印刷误差与编辑档案感。

---

## 15. STEP 15 — RELATIONSHIP / TITLE BADGES

### Relationship

- `relation_stranger`
- `relation_spark`
- `relation_familiar`
- `relation_friend`
- `relation_rivalfriend`
- `relation_companion`

不要手游稀有度发光。

### Title icon concepts

| 称号 | Icon concept |
| --- | --- |
| 工程脑 | wrench + modular blocks |
| 问题拆解师 | complex block split into three pieces |
| 收藏夹考古学家 | bookmark + brush |
| 长答工程师 | long paper strip + brackets |
| 深夜追问者 | moon + question dot |
| 证据猎手 | magnifier + data point |
| 城市观察员 | building blocks + eye |
| 生活实验家 | cup + checklist |
| 世界漫游者 | path + compass dot |
| 关系观察员 | two Persona dots + eye |
| 跨界玩家 | different shapes connected by bridge |
| 问题收藏家 | stack of question-ticket shapes |

---

## 16. 从现在开始的实际生成顺序

> STEP 1–3 已完成，所以现在**不要回头补六个用户物种的动作**。

### A. 玩家黑猫基础

- [ ] `player-black-cat/base_master`
- [ ] `player-black-cat/identity-sheet`

### B. 黑猫 P0 Pose bases

- [ ] `idle_front`
- [ ] `home_rest`
- [ ] `home_busy`
- [ ] `prepare_pack`
- [ ] `walking`
- [ ] `thinking`
- [ ] `talking`
- [ ] `returned`
- [ ] `avatar_neutral`

### C. 黑猫 P0 模块

- [ ] 6 eye variants
- [ ] round / square glasses
- [ ] blue scarf / blue collar / none
- [ ] tool / canvas / travel bag
- [ ] notebook / camera / map / clipboard
- [ ] 6 个基础 interest stickers

### D. NPC 最小包

对 fox / rabbit / bird / bear / dog：

- [ ] `npc_idle`
- [ ] `npc_talking`
- [ ] `npc_meeting`
- [ ] `npc_reaction`

### E. HATCH / WORLD / COLLECTIBLE

- [ ] 5 个 egg states
- [ ] `theatre_blackbox_base`
- [ ] `room_home_night`
- [ ] `room_empty_night`
- [ ] `journey_zhihu_gate`
- [ ] `encounter_stage`
- [ ] `question_ticket`
- [ ] `relationship_ticket`
- [ ] `photo_polaroid`

---

## 17. 一致性验收

### 玩家黑猫

出现任一情况就重做：

- [ ] 不是黑猫；
- [ ] 基础脸/骨架明显变成另一只猫；
- [ ] 同一 Pose 的模块组合出现穿模；
- [ ] 眼镜/围巾/包破坏角色轮廓；
- [ ] 通过模块后像“换了一个新 IP”而不是“同一种谢邀喵的不同用户”；
- [ ] 2D 变 3D；
- [ ] 角色变幼；
- [ ] 出现无关背景、文字、logo、水印。

### NPC

NPC 可以跨物种，但必须保持和黑猫完全相同的世界画法、线条、颗粒、光源和成熟度。

### 最终判断

> **玩家：一眼都是谢邀喵的黑猫，但第二眼能看出“这是不同的人”。**
>
> **NPC：一眼知道不是玩家本人，而是这个世界里遇到的其他居民。**
