# 谢邀喵 / Xieyao Meow — Art Generation Prompts v1

> **日期：** 2026-09-13
>
> **用途：** 给外部图像生成工具使用。
>
> **核心原则：** 先锁视觉风格，再锁六个角色母版；后续所有角色图都必须基于母版 reference/edit，不允许仅靠文字“重新生成一个类似角色”。

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

## 4. 15 POSE PROMPTS / 每个母版都重复执行

> **下面 15 个 Prompt 必须逐一基于当前角色的 CHARACTER MASTER reference/edit。**
禁止不带母版重新生成。

### POSE 01 — `idle_front`

**IDENTITY LOCK**
Create the canonical display pose of this exact character: relaxed 3/4 front standing pose, balanced feet, arms naturally at the sides or lightly touching the signature accessory, calm intelligent neutral expression. Full body. Preserve the exact master identity. Transparent background, 1600×2000.

### POSE 02 — `idle_relaxed`

**IDENTITY LOCK**
Show this exact character in a more relaxed standing moment, slightly shifting body weight to one side, shoulders loose, small confident half-smile, still clearly readable as the same canonical design. Do not add new costume elements. Transparent background.

### POSE 03 — `home_rest`

**IDENTITY LOCK**
Show this exact character resting comfortably at home: seated low on the floor or on a simple invisible seating plane, relaxed posture, slightly sleepy or content expression. Keep all signature clothing and identity elements. Do not draw the room or furniture; character only, transparent background.

### POSE 04 — `home_busy`

**IDENTITY LOCK**
Show this exact character quietly busy at home, focused on its signature activity. Use one temporary prop appropriate to the character: notebook/laptop for Tool Cat, book/notes for Philosophy Fox, camera/cup for Life Rabbit, data board for Data Bird, sketchbook for Creative Bear, map for Explorer Dog. Preserve identity. Transparent background.

### POSE 05 — `prepare_pack`

**IDENTITY LOCK**
Show this exact character preparing to leave: checking or closing its familiar bag/backpack, slightly leaning forward with purposeful focus. The bag design must be exactly consistent with the canonical reference. No environment. Transparent background.

### POSE 06 — `walking`

**IDENTITY LOCK**
Show this exact character mid-walk, carrying its canonical bag, one foot forward, lively but natural motion, curious expression looking slightly ahead. Preserve exact costume and proportions. Do not exaggerate running. Transparent background.

### POSE 07 — `thinking`

**IDENTITY LOCK**
Show this exact character thinking deeply: one hand/paw/wing near chin or holding a small note, eyes focused slightly upward or sideways, intelligent contemplative expression. Keep silhouette clean and recognizable. Transparent background.

### POSE 08 — `talking`

**IDENTITY LOCK**
Show this exact character explaining an idea in conversation: one open expressive hand gesture, mouth slightly open, confident but friendly expression. It should feel like making a point, not shouting. Transparent background.

### POSE 09 — `debating`

**IDENTITY LOCK**
Show this exact character in an engaged debate: body leaning slightly forward, one clear argumentative hand gesture, alert eyes, energized expression. Keep it witty and intelligent, not angry or aggressive. Transparent background.

### POSE 10 — `meeting`

**IDENTITY LOCK**
Show this exact character meeting another Persona for the first time: slight turn toward an unseen character at center, open greeting gesture, curious cautious smile. Character only, no second character, transparent background.

### POSE 11 — `returned`

**IDENTITY LOCK**
Show this exact character just returning from an outing: canonical bag/backpack slightly fuller, holding one blank paper ticket or small blank postcard, pleasantly tired but excited to share something. Preserve all identity details. No text on the ticket. Transparent background.

### POSE 12 — `celebrate`

**IDENTITY LOCK**
Show this exact character celebrating a small meaningful success: warm smile, one raised paw/hand/wing ready for a high-five or cheerful gesture, restrained confetti-like energy but do not actually add confetti or background. Transparent background.

### POSE 13 — `listening`

**IDENTITY LOCK**
Show this exact character actively listening to someone: body angled slightly toward an unseen speaker, attentive eyes, relaxed mouth, hands quiet, thoughtful receptive posture. Transparent background.

### POSE 14 — `surprised`

**IDENTITY LOCK**
Show this exact character having a small intellectual surprise: eyes slightly wider, subtle raised brow, body leaning back just a little, expression says “that is actually interesting,” not cartoon shock. Transparent background.

### POSE 15 — `argument_peak`

**IDENTITY LOCK**
Show this exact character at the peak of an energetic intellectual argument: strongest expressive gesture in the set, clear forward body energy, sharp focused eyes, still humorous and non-hostile. No anger symbols, no flames, no fighting pose. Transparent background.

## 5. PAIR POSES / 双人组合方向

> **每个 CHARACTER MASTER 各做两张。**

### PAIR LEFT

**IDENTITY LOCK**
Create a composition-ready pose of this exact character positioned conceptually on the left side of a two-character scene, body and gaze turned gently toward the center/right, friendly engaged posture, ready for conversation or high-five. Character only. Transparent background. Keep center-facing gesture within the character canvas.

### PAIR RIGHT

**IDENTITY LOCK**
Create a composition-ready pose of this exact character positioned conceptually on the right side of a two-character scene, body and gaze turned gently toward the center/left, friendly engaged posture, ready for conversation or high-five. Character only. Transparent background. Keep center-facing gesture within the character canvas.

## 6. AVATAR EXPRESSIONS

> **输出 1024×1024，透明背景，只保留头 + 上半身。**
仍然使用 CHARACTER MASTER reference。

### AVATAR — `neutral`

**IDENTITY LOCK**
Head-and-upper-torso avatar of the exact same character, neutral intelligent expression, direct or slight 3/4 gaze, clean readable silhouette, transparent background, no text.

### AVATAR — `happy`

**IDENTITY LOCK**
Head-and-upper-torso avatar of the exact same character, warm pleased smile, subtle joy, preserve exact facial construction, transparent background.

### AVATAR — `thinking`

**IDENTITY LOCK**
Head-and-upper-torso avatar of the exact same character, contemplative skeptical expression, eyes slightly aside, preserve exact identity, transparent background.

### AVATAR — `debate`

**IDENTITY LOCK**
Head-and-upper-torso avatar of the exact same character, energetic “I have a counterpoint” expression, confident and witty rather than angry, transparent background.

## 6A. ACCESSORY / TEMPORARY PROP ASSETS

> **这些素材用于表达用户行为差异和后续成长，不是角色母版的一部分。**
如果作为独立 overlay 生成：透明背景、1024px 长边、无文字；如果模型很难稳定生成独立 overlay，可以先作为角色 edit 的临时道具使用。
不要一次给角色堆超过 2–3 个。

### 通用 Prompt
Create one clean standalone editorial illustration prop matching the supplied STYLE MASTER and the corresponding canonical character world. Transparent background, simple silhouette, readable at small size, restrained paper-print texture, no text, no logo, no scene. The object should feel like a believable possession of the character, not fantasy loot or game equipment.

### TOOL CAT / 工具猫

- `thick_notebook`: thick dark notebook with a small Zhihu-blue elastic band, no text
- `mini_laptop`: compact dark laptop with one tiny abstract blue sticker, no logo
- `wrench_charm`: small simple wrench-shaped bag charm, not industrially detailed
- `bookmark_bundle`: several warm-paper bookmarks clipped together, blank
- `blueprint_roll`: short rolled paper plan with blue edge marks, no readable diagram
- `evidence_clipboard`: small clipboard with blank paper and 2–3 abstract check marks only

### PHILOSOPHY FOX / 哲学狐

- `philosophy_book`: compact worn book with blank cover, dark charcoal + red tab
- `question_cards`: 3–4 small blank question-note cards with one abstract dot/question-like symbol, no text
- `fountain_pen`: simple black fountain pen with tiny red accent
- `coffee_cup`: understated ceramic cup, warm-white, no branding
- `red_annotation_tabs`: small bundle of vermilion paper annotation tabs
- `night_lamp_charm`: tiny warm desk-lamp shaped charm, no glow effects around it

### LIFE RABBIT / 生活兔

- `compact_camera`: small matte camera, no brand, simple lens
- `canvas_pouch`: small warm-grey fabric pouch
- `thermos_cup`: simple cream thermos cup, no text
- `city_ticket_bundle`: 3 blank transit/event ticket scraps, no readable text
- `flower_pin`: very small restrained flower-shaped pin, not cute-girly
- `home_note_stack`: small stack of blank household note papers with blue clip

### DATA BIRD / 数据鸟

- `data_clipboard`: compact clipboard with abstract chart blocks, no numbers/text
- `small_tablet`: small dark tablet with simple blue blocks, no UI text
- `magnifier`: clean small magnifying glass
- `chart_cards`: 3 tiny paper cards with abstract bar/line shapes only
- `calculator_token`: simple calculator-like rectangular object with unlabeled keys
- `evidence_folder`: thin dark folder with blue tab, blank

### CREATIVE BEAR / 创作熊

- `sketchbook`: warm-paper sketchbook, blank cover
- `pencil_bundle`: 3 simple pencils tied together, blue/red accents only
- `camera`: compact creator camera, no brand
- `poster_roll`: rolled blank poster paper tied with tape
- `tape_bundle`: two small matte paper-tape rolls, beige and blue
- `story_cards`: several blank storyboard cards with only abstract frame boxes

### EXPLORER DOG / 探索汪

- `folding_map`: folded blank map with simple abstract route lines, no labels
- `compass`: small non-tactical compass, simple graphic design
- `binoculars`: compact friendly travel binoculars, not military
- `transit_ticket_bundle`: several blank travel ticket scraps, no text
- `travel_badges`: 3 small icon-only travel patches, no words/flags
- `field_notebook`: compact rugged notebook with blue elastic, blank cover

## 7. PERSONA EGG / 人格蛋 5 状态

> **人格蛋必须使用 STEP 1 STYLE MASTER 作为风格 reference。**
同一枚蛋，只改变状态，不改变形状和花纹体系。
不要提前透露任何动物物种。

### EGG idle

A mysterious unhatched personality egg for the Xieyao Meow personality theatre. Large simple egg silhouette, warm bone-white shell, sparse charcoal speckles, one subtle Zhihu-blue mark hidden among the speckles, editorial paper-print texture, intelligent mysterious feeling, not fantasy dragon egg, not 3D. Transparent background, no text.

### EGG scanning

Use the idle egg as strict reference. Same exact egg, now with a few subtle blue data-like reflection fragments and faint internal glow visible through the shell, restrained, no sci-fi hologram, no text. Transparent background.

### EGG glowing

Use the same exact egg. Internal warm-white + Zhihu-blue glow becoming stronger through several hairline cracks, still mostly closed, dramatic but restrained theatrical lighting, transparent background.

### EGG cracking

Use the same exact egg. Shell now visibly cracking open with several clean pieces lifting, a dark unknown silhouette inside but no identifiable animal species yet, transparent background.

### EGG opened

Use the same exact egg. Empty opened shell pieces resting around the base, center space open for a Persona character to appear later in compositing. No character inside. Transparent background.

## 7A. PERSONALITY THEATRE BASE / 人格剧场基础场景

> **注意：人格剧场不等于所有页面都画红色幕布。**
舞台感主要来自 black-box theatre 空间、聚光、留白、纸张道具和角色站位。
先生成一个场景母版，再用母版 reference/edit 派生不同首访页面。

### THEATRE blackbox base

Create the canonical environment master for the Xieyao Meow Personality Theatre: a contemporary intimate black-box theatre / editorial exhibition stage, charcoal-black architectural space, matte dark floor, restrained warm overhead practical lights, tiny Zhihu-blue accents in props, warm paper/archive materials at the edges, sophisticated modern Chinese cultural-product feeling. No mandatory red curtains; if fabric appears, keep it minimal and architectural rather than theatrical cliché. No characters, no text, no logo, no UI. Provide clean center stage plus usable left/right character zones. 2400×1350, 16:9, center 45% mobile-safe.

### THEATRE activation spotlight

Use theatre_blackbox_base as strict environment reference. Preserve the exact architecture, floor, walls and material system. Change only lighting: one strong warm central spotlight for a personality egg, darker surroundings, maximum suspense, no characters, no text.

### THEATRE casting

Use theatre_blackbox_base as strict environment reference. Preserve environment identity. Add only a few suspended blank paper cards / archive sheets around center stage and cooler Zhihu-blue reflected light, suggesting data being assembled. No readable text, no character.

### THEATRE reveal

Use theatre_blackbox_base as strict environment reference. Preserve environment identity. Create a confident full reveal lighting state: warm spotlight at center-left character position, subtle second pool for evidence cards, restrained blue accent light, no character, no text.

### THEATRE encounter

Use theatre_blackbox_base as strict environment reference. Preserve architecture. Light two opposing character positions left/right with balanced warm pools, central neutral zone for a dynamic question card, no characters, no text.

### THEATRE curtain call

Use theatre_blackbox_base as strict environment reference. Preserve architecture. Slightly warmer celebratory lighting and a clean central space for two characters / polaroid card, still mature and restrained, no confetti, no characters, no text.

## 8. HOME / 我的窝背景

背景统一要求：16:9 2400×1350，中心 45% 保持 mobile 9:16 裁切安全，不包含角色，不包含 UI，不包含文字。
风格：same Personality Theatre world, editorial illustration, dark charcoal + warm lamp light + Zhihu-blue micro accents, lived-in but uncluttered.

### ROOM home night

A cozy nighttime room belonging to an intelligent digital Persona, inside the Xieyao Meow personality theatre world. Dark charcoal room, one warm table lamp, small desk, low sofa or cushion, a few books and blank paper notes, subtle shelves for collected tickets and polaroids, gentle theatrical framing, mature editorial illustration, no character, no readable text, no logo. Leave clean negative space for character placement.

### ROOM empty night

Use room_home_night as strict environment reference. Exact same room, but clearly empty: bag is missing from its usual place, chair/cushion slightly pushed back, half-open door or side exit, one blank note pressed on the table, warm lamp still on. The emotional focus is absence. No character, no readable text.

### ROOM home day

Same exact room identity as room_home_night, daytime ambient light, restrained, no character.

### ROOM empty day

Same exact room as home day, but character absent, bag missing, one blank note left behind.

### ROOM returned

Same exact room identity, slightly brighter warm entrance light as if someone just came back, small empty landing space for returned character, no character.

### ROOM visitor

Same exact room identity prepared for two Persona characters sitting/talking, two clear character placement zones, no characters, no text.

## 9. JOURNEY / EXPLORE 背景

> **统一：不是现实旅游摄影，而是“知乎知识世界被人格化后的空间”。角色后期叠加。**
无文字、无 UI、无具体知乎问题标题。

### `journey_zhihu_gate`

A symbolic entrance into a vast knowledge community: contemporary editorial theatre architecture, doorway opening from dark stage into a brighter world of questions, books, blank cards and blue wayfinding shapes, Zhihu-blue accents, warm paper textures, no logo text, no character.

### `journey_tech`

A stylized knowledge district about technology and tools: workshop-like urban editorial space, abstract laptops/tools/components represented as simple graphic props, blue and charcoal, mature poster aesthetic, no sci-fi neon, no character.

### `journey_science`

A stylized science knowledge district: observatory/lab-library hybrid, paper diagrams without readable text, instruments as editorial props, warm-white and blue, no character.

### `journey_city`

A thoughtful contemporary city knowledge district: streets, architecture models, transit signs without text, editorial poster composition, mature, no character.

### `journey_books`

A library/archive knowledge district with tall shelves, blank notes and layered paper cards, warm theatrical lighting, no character.

### `journey_art`

A design/art knowledge district: studio, blank canvases, printmaking papers, poster racks without readable text, restrained color, no character.

### `journey_life`

A warm everyday-life knowledge district: cafe/home/city-life fragments arranged like an editorial collage, no people, no character.

### `journey_night`

A late-night knowledge district: dark blue-black city/library hybrid, warm isolated lights, blank paper questions floating like found notes, reflective but not cyberpunk, no character.

## 10. ENCOUNTER / RELATIONSHIP 背景

### `encounter_stage`

A small intimate black-box theatre for two Persona characters to debate a question, two clear pools of warm spotlight left and right, center zone for a blank question card, charcoal background, tiny Zhihu-blue accents, no red velvet curtain requirement, no characters, no text.

### `encounter_cafe`

A mature quiet cafe scene designed for two Persona characters, two seating positions facing slightly inward, warm lamp, blank note cards, editorial illustration, no people, no text.

### `encounter_library`

A library discussion corner with two character placement zones, books, blank paper notes, warm focused light, no characters, no text.

### `encounter_room`

A shared living-room discussion scene compatible with room_visitor identity, two-character placement zones, no characters.

### `encounter_rooftop`

A calm urban rooftop at night for reflective Persona conversation, distant city silhouettes, subtle warm light and blue accents, no characters, no neon cyberpunk.

## 11. COLLECTIBLES / 带回物模板

> **所有模板：透明背景；不要生成具体中文；必须留出空白区域给 HTML/CSS 写动态文字。**

### `question_ticket`

A collectible paper ticket for a discovered question, warm off-white thick paper, slightly torn edge, one small Zhihu-blue category tab, tiny neutral icon area, blank main text area, editorial archive aesthetic, no readable text.

### `thought_note`

A small irregular paper scrap for one Persona thought, warm-white paper with one blue hand-drawn underline motif, large blank writing area, no text.

### `journey_postcard`

A collectible journey postcard frame, warm paper, one large blank image window, small stamp area, restrained blue/red print marks, no text.

### `relationship_ticket`

A relationship encounter ticket for two Personas, two small blank avatar circles/windows, one connection symbol between them, warm paper + blue accent, blank relationship text area, no text.

### `interest_sticker`

A family of simple die-cut interest stickers in the same editorial system, geometric icon-only labels, blue/black/warm-white, no words.

### `topic_stamp`

A round ink stamp base for knowledge topics, imperfect print texture, blank center icon zone, no letters.

### `city_stamp`

A travel/location ink stamp base, editorial not tourist souvenir kitsch, blank center icon zone, no words.

### `title_badge`

A collectible persona-title badge base, bold simple silhouette, blue + warm-white + tiny red accent, blank central text area, no words.

### `bookmark_card`

A slim collectible bookmark card, paper texture, blue top tab, blank information area, no words.

### `quote_scrap`

A torn quote scrap with one blue quotation-mark-like abstract icon but no actual text, wide blank area.

### `photo_polaroid`

A slightly imperfect warm-white polaroid frame, blank transparent/neutral image window, small blank caption zone, no text.

### `mystery_item`

A small ambiguous found-object collectible from the knowledge world, charming but intellectually themed, like a tiny blank key tag / question token / odd paper charm, not fantasy loot, no text.

## 12. PAPER / TAPE / STAMP AUXILIARY ASSETS

### `paper_card_01`

Warm off-white rectangular paper card, slight fiber and print texture, subtle imperfect edge, blank, transparent background.

### `paper_card_02`

Second paper card variant, slightly darker bone-white, one folded corner, blank.

### `paper_torn`

Irregular torn paper scrap, warm-white, blank.

### `notebook_page`

Single notebook page, faint non-readable ruling/grid, blank center.

### `tape_beige / tape_blue / tape_red`

Short semi-transparent matte paper tape strip, slightly torn ends, no text.

### `pin_blue`

Simple small blue push pin, editorial illustration, transparent background.

### `stamp_round`

Generic imperfect round ink stamp shape, no letters, no words.

### `stamp_zhihu_journey`

Journey stamp graphic using abstract question/path symbols only, Zhihu-blue and small red accent, no literal Zhihu logo and no text.

### `stamp_relation`

Relationship stamp graphic using two simple dots/figures connected by a line or spark, no text.

### `polaroid_frame`

Warm-white polaroid frame, transparent center window, no text.

### `ticket_frame`

Blank paper ticket frame with perforated edge, blue accent, no text.

## 13. RELATIONSHIP BADGES

> **统一生成 6 个只含图形的 badge base，不烧文字。**
同一套视觉家族，从弱关系到强关系逐渐增加连接程度，但不要手游稀有度发光。

### `relation_stranger`

Two small separated abstract Persona dots/silhouettes, minimal connection, muted blue-grey.

### `relation_spark`

Two dots with one tiny blue spark between them.

### `relation_familiar`

Two simplified Persona marks linked by one clean line.

### `relation_friend`

Two Persona marks closer together with warm small connection shape.

### `relation_rivalfriend`

Two contrasting marks connected by both a blue line and a tiny red zigzag, suggesting “argue but stay friends.”

### `relation_companion`

Two balanced Persona marks moving in the same direction with a stable shared path symbol.

## 14. TITLE BADGE ICON CONCEPTS

> **只生成 icon，不写中文标题。风格统一，适合放进同一个 badge base。**

| 称号 | Icon concept |
| --- | --- |
| 工具猫 | small wrench + question mark abstraction |
| 问题拆解师 | one complex block split into three clean pieces |
| 收藏夹考古学家 | bookmark + tiny archaeological brush |
| 长答工程师 | long paper strip + structural brackets |
| 深夜追问者 | moon + small question dot |
| 证据猎手 | magnifier + small data point |
| 城市观察员 | building blocks + eye |
| 生活实验家 | cup + small checklist |
| 世界漫游者 | path + compass dot |
| 关系观察员 | two Persona dots + eye |
| 跨界玩家 | two different shapes connected by bridge |
| 问题收藏家 | stack of question-ticket shapes |

## 15. P0 最先生成顺序

> **不要一次铺开 200 个素材。**
按照下面顺序做，前一阶段没定就不要进入下一阶段。

### A. STYLE

- [ ] 00_style_master_v01

### B. CHARACTER MASTER

- [ ] cat/master
- [ ] fox/master
- [ ] rabbit/master
- [ ] bird/master
- [ ] bear/master
- [ ] dog/master

### C. 六个角色 P0 ACTIONS

**每个角色：**
- [ ] idle_front
- [ ] home_rest
- [ ] home_busy
- [ ] prepare_pack
- [ ] walking
- [ ] thinking
- [ ] talking
- [ ] returned
- [ ] avatars/neutral

### D. HATCH

- [ ] egg_idle
- [ ] egg_scanning
- [ ] egg_glowing
- [ ] egg_cracking
- [ ] egg_opened

### E. WORLD P0

- [ ] room_home_night
- [ ] room_empty_night
- [ ] journey_zhihu_gate
- [ ] encounter_stage

### F. COLLECTIBLE P0

- [ ] question_ticket
- [ ] relationship_ticket
- [ ] photo_polaroid
- [ ] paper_card_01
- [ ] tape_beige
- [ ] tape_blue

## 16. 每次生成后的人工一致性验收

> **角色 derivative 如果出现下面任何一条，直接重做，不要因为“这张更好看”就接受：**

- [ ] 和母版不是同一张脸
- [ ] 五官位置变化
- [ ] 耳朵 / 尾巴 / 翅膀形状漂移
- [ ] 头身比变化
- [ ] 胖瘦变化超过动作需要
- [ ] 核心衣服版型变化
- [ ] 眼镜 / 围巾 / 背包重新设计
- [ ] 毛色花纹未经要求改变
- [ ] 线条粗细变化
- [ ] 颗粒质感变化
- [ ] 2D 变成 3D
- [ ] 角色变幼
- [ ] 出现不需要的背景
- [ ] 出现文字 / logo / watermark
- [ ] 脚底位置严重漂移
- [ ] 缩到 96px 高以后认不出物种

### 最终判断

> **“这是不是同一只角色，只是今天在做不同的事？”**

如果答案不是毫不犹豫的“是”，就不要进入资产库。
