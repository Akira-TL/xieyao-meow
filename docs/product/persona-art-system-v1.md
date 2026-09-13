# 「谢邀喵」Persona 视觉资产系统 v1

> 2026-09-13。本文冻结「谢邀喵」当前角色 IP、资产生产顺序、角色一致性约束与文件规范。
>
> 视觉主方向继续采用 Direction C「人格剧场 / Personality Theatre」。
>
> **2026-09-13 方向调整：用户 Persona 从“多物种”改为“统一黑猫 + 模块化差异”。狐、兔、鸟、熊、汪不再作为玩家孵化结果，而作为社区 NPC / Resident。**
>
> **最高优先级原则：品牌识别 > 一致性 > 个体差异 > 单张惊艳度。**

---

# 1. 当前生产状态

已经完成：

- STEP 1：视觉风格母版；
- STEP 2：此前六个角色 Canonical Master；
- STEP 3：此前外观 Variant。

这些素材不作废，但重新分类：

| 已有素材 | 新用途 |
| --- | --- |
| Cat 系列 | 黑猫玩家系统的视觉参考 / 历史基础 |
| Fox 系列 | 社区 NPC / Resident |
| Rabbit 系列 | 社区 NPC / Resident |
| Bird 系列 | 社区 NPC / Resident |
| Bear 系列 | 社区 NPC / Resident |
| Dog 系列 | 社区 NPC / Resident |

**从下一批素材开始，不再为六个物种分别制作完整玩家动作库。**

新的生产顺序：

```text
STEP 1–3  DONE
          既有风格 / 角色 / Variant
               ↓
STEP 4    Player Black Cat Base
          冻结统一黑猫玩家母体
               ↓
STEP 5    Black Cat Pose Bases
          黑猫动作底板
               ↓
STEP 6    Modular Player Elements
          眼睛 / 眼镜 / 领饰 / 包 / 道具 / 徽章 / 贴纸
               ↓
STEP 7    NPC Resident Pack
          狐 / 兔 / 鸟 / 熊 / 汪最小动作包
               ↓
STEP 8+   Egg / Theatre / Home / Journey / Encounter / Collectibles
```

---

# 2. 核心产品判断

## 2.1 玩家为什么统一为黑猫

产品名字就是「谢邀喵」。玩家角色如果随机变成狐、兔、鸟、熊、汪，会削弱品牌识别，也让分享卡第一眼难以形成统一 IP。

因此正式规则调整为：

> **每个用户孵化出来的都是一只黑猫，但不是同一只黑猫。**

用户差异来自：

- 人格型 Archetype；
- 眼神 / 眉眼风格；
- 少量耳朵细节；
- 眼镜；
- 领饰；
- 包；
- 标志性手持物；
- 兴趣贴纸；
- 称号徽章；
- 旅途印章；
- 关系痕迹；
- 后续成长获得的收藏物。

视觉目标：

> **第一眼：这是谢邀喵。第二眼：这是“我的”那只。**

## 2.2 其他动物为什么变成 NPC

狐、兔、鸟、熊、汪仍然有价值，但更适合承担世界多样性：

- Match 对象；
- Encounter 社区居民；
- 出门途中遇到的角色；
- 不同兴趣领域的典型居民；
- 关系图鉴中的长期角色。

这样既保留已经完成的素材，又不会稀释玩家 IP。

刘看山继续保持官方世界向导身份，不进入玩家 Persona 池。

---

# 3. 世界视觉风格继续冻结

主方向：

> **现代中国互联网文化海报 × 人格剧场 × 编辑插画 × 纸张档案感。**

基础色：

- 知乎蓝：`#1772F6`；
- 炭黑：近 `#0B0D10`；
- 暖白 / 骨白：近 `#EEE9DE`；
- 少量朱红；
- 卡其 / 暖棕用于纸张、旅行、档案。

角色画法：

- 2D 编辑插画；
- 大块清晰色面；
- 清楚的外轮廓；
- 轻微纸张 / 丝网印刷颗粒；
- 允许轻体积感，不做 3D CGI；
- 表情聪明、有戏，不婴幼儿化；
- 96px 高时仍有可读性。

禁止：赛博朋克、紫蓝渐变、机器人脸、复杂机械义体、玻璃拟态、写实毛发、Pixar-like 3D、盲盒塑料、幼儿卡通、手游稀有度光效。

---

# 4. 玩家黑猫 Canonical Base

正式玩家物种固定：

```text
species = cat
coat = black
role = player_persona
```

建议数据层以后把“不同用户”从 `species` 转移到 `visualIdentity`：

```text
visualIdentity
├── archetype
├── eyeVariant
├── earDetail
├── eyewear
├── neckwear
├── bagKit
├── signatureProp
├── interestStickers[]
├── earnedBadges[]
├── journeyTraces[]
└── relationshipMarks[]
```

## 4.1 黑猫基础身份固定项

不可随用户改变：

- 黑色短毛主色；
- 基础脸型；
- 基础头身比；
- 身体比例；
- 基础耳朵位置；
- 尾巴长度和粗细体系；
- 爪 / 手的画法；
- 线条与颗粒；
- 年龄感；
- 世界光源语言。

允许受控变化：

- 眼神；
- 耳尖极小细节；
- 额头 / 脸颊小毛束；
- 眼镜；
- 领饰；
- 包；
- 手持物；
- badge / sticker / trace。

---

# 5. Archetype：不再绑定物种

第一版建议 8 个玩家人格型：

| ID | 中文 | 知乎信号 | 视觉倾向 |
| --- | --- | --- | --- |
| `engineer_brain` | 工程脑 | 技术、长答、工具 | 圆框眼镜、蓝围巾、工具本 |
| `system_thinker` | 系统思考者 | 框架、结构化表达 | 方框眼镜、文件夹 |
| `tool_collector` | 工具收藏家 | 收藏密度高 | 工具包、书签束 |
| `question_chaser` | 追问者 | 人文、观点、追问 | 红批注、小书 |
| `evidence_hunter` | 证据猎手 | 数据、科学、金融 | 数据夹板、放大镜 |
| `creative_maker` | 创作派 | 设计、影视、文学 | 速写本、铅笔 |
| `life_observer` | 生活观察员 | 城市、消费、生活 | 相机、帆布包 |
| `curious_roamer` | 好奇漫游者 | 兴趣跨度广、旅行 | 旅行包、地图 |

Archetype 的职责是控制“模块组合倾向”，而不是重新设计角色。

---

# 6. 模块化资产系统

## 6.1 两级模块

不是所有元素都要求像换装游戏一样实时叠 PNG。

### A. Runtime-safe Overlay

适合通过锚点定位直接叠加：

- 眼镜；
- 小领饰；
- 胸针；
- badge；
- interest sticker；
- ticket / postcard；
- 小型头饰。

### B. Pose-aware Module

会和身体产生遮挡，需要针对 Pose 生成或通过 reference/edit 烘进角色：

- 背包 / 斜挎包；
- 大围巾；
- 外套；
- Laptop；
- 相机；
- 书；
- 地图；
- 大型手持物。

原则：

> **拆分是为了复用和一致性，不是为了追求技术上的“每一像素都必须实时换装”。**

## 6.2 统一锚点

全身画布统一：`1600×2000`。

每个 Pose 记录：

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

Avatar 另外记录：

```text
AVATAR_EYES
AVATAR_NECK
AVATAR_CHEST
```

这些锚点用于后续 CSS / Canvas / SVG / 图片合成时放置轻量模块。

---

# 7. 玩家模块清单

## 7.1 Eye Variant

P0 六套：

- `eyes_focused`；
- `eyes_curious`；
- `eyes_skeptical`；
- `eyes_sleepy_smart`；
- `eyes_bright`；
- `eyes_deadpan`。

眼睛是用户人格最强的第一层差异之一，但不能改变基础脸型。

## 7.2 Ear Detail

只做小变化：

- `ears_standard`；
- `ears_outward`；
- `ears_one_folded_tip`；
- `ears_tiny_notch`。

不要做大耳猫、折耳猫、猞猁耳等会改变物种轮廓的版本。

## 7.3 Eyewear

- `glasses_none`；
- `glasses_round`；
- `glasses_square`；
- `glasses_half_rim`；
- `glasses_oval`；
- `lens_single`。

## 7.4 Neckwear

- `neck_none`；
- `neck_scarf_blue`；
- `neck_collar_blue`；
- `neck_bow_charcoal`；
- `neck_tag_paper`；
- `neck_accent_red`。

## 7.5 Bag Kit

P0：

- `bag_tool_satchel`；
- `bag_archive_satchel`；
- `bag_canvas`；
- `bag_travel`；
- `bag_creator`；
- `bag_data_case`。

至少覆盖：`idle_front / prepare_pack / walking / returned`。

## 7.6 Signature Prop

- `prop_notebook`；
- `prop_laptop`；
- `prop_book`；
- `prop_clipboard`；
- `prop_camera`；
- `prop_sketchbook`；
- `prop_map`；
- `prop_magnifier`。

至少覆盖：`home_busy / thinking / talking / debating / returned`。

## 7.7 成长层

随用户经历累积：

- 兴趣贴纸；
- 称号徽章；
- 旅途印章；
- 关系徽章；
- 收藏夹痕迹；
- 问题票根；
- Polaroid；
- 少量磨损 / 批注痕迹。

这部分让“同一只黑猫骨架”在长期使用后越来越像这个用户。

---

# 8. 黑猫动作库

玩家黑猫仍保留完整 15 Pose：

| # | ID | 场景 |
| --- | --- | --- |
| 01 | `idle_front` | Reveal / Atlas / Profile |
| 02 | `idle_relaxed` | Home / Share |
| 03 | `home_rest` | Home AT_HOME |
| 04 | `home_busy` | Home AT_HOME |
| 05 | `prepare_pack` | PREPARING |
| 06 | `walking` | Explore / Departure |
| 07 | `thinking` | Scanning / Question |
| 08 | `talking` | Encounter |
| 09 | `debating` | Encounter |
| 10 | `meeting` | Match / Relationship |
| 11 | `returned` | RETURNED |
| 12 | `celebrate` | Share / 关系建立 |
| 13 | `listening` | Encounter |
| 14 | `surprised` | Encounter |
| 15 | `argument_peak` | 对手戏高潮 |

另外：

- `pair_left`；
- `pair_right`；
- `avatar_neutral`；
- `avatar_happy`；
- `avatar_thinking`；
- `avatar_debate`。

**动作底板优先不烧入可变配饰。**

---

# 9. NPC / Resident 体系

已有狐、兔、鸟、熊、汪全部转为 NPC。

建议定位：

| NPC | 社区语义 |
| --- | --- |
| 哲学狐 | 人文 / 观点 / 反方辩手 |
| 生活兔 | 城市 / 生活 / 情绪体验 |
| 数据鸟 | 数据 / 科学 / 金融证据派 |
| 创作熊 | 设计 / 影视 / 文学 / 创作 |
| 探索汪 | 旅行 / 职业 / 跨领域 |

第一版每种只补 4 个动作：

- `npc_idle`；
- `npc_talking`；
- `npc_meeting`；
- `npc_reaction`。

不再为 NPC 全量制作 15 Pose，除非后续某个 NPC 被升级成主线长期角色。

---

# 10. 用户差异如何从知乎行为映射

推荐视觉映射：

| 行为信号 | 黑猫视觉结果 |
| --- | --- |
| 技术 / 工具高 | 工程脑 + 工具包 / Laptop |
| 长答明显 | 厚笔记本 / 长纸条 badge |
| 收藏密度高 | 收藏家 + 书签 / 更丰富背包贴纸 |
| 人文 / 社会高 | 追问者 + 红批注 / 小书 |
| 数据 / 科学高 | 证据猎手 + 夹板 / 放大镜 |
| 设计 / 影视 / 文学高 | 创作派 + 速写本 |
| 城市 / 生活高 | 生活观察 + 相机 / 帆布包 |
| 兴趣跨度大 | 好奇漫游 + 旅行包 / 地图 |
| 关系变化多 | relationship badges 增加 |
| 出门经历多 | journey stamps / stickers 增加 |

不要把用户差异做成完全随机换装；每一件主要视觉物都应有可解释来源。

---

# 11. 世界素材继续保持原计划

## 11.1 Persona Egg

- `egg_idle`
- `egg_scanning`
- `egg_glowing`
- `egg_cracking`
- `egg_opened`

蛋最终孵化黑猫，但在 cracking 前不暴露用户具体模块。

## 11.2 Personality Theatre

- `theatre_blackbox_base`
- `theatre_activation_spotlight`
- `theatre_casting`
- `theatre_reveal`
- `theatre_encounter`
- `theatre_curtain_call`

## 11.3 Home

- `room_home_night`
- `room_empty_night`
- `room_home_day`
- `room_empty_day`
- `room_returned`
- `room_visitor`

## 11.4 Journey

- `journey_zhihu_gate`
- `journey_tech`
- `journey_science`
- `journey_city`
- `journey_books`
- `journey_art`
- `journey_life`
- `journey_night`

## 11.5 Encounter

- `encounter_stage`
- `encounter_cafe`
- `encounter_library`
- `encounter_room`
- `encounter_rooftop`

## 11.6 Collectibles

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

---

# 12. 文件目录

```text
public/art/
├── personas/
│   ├── player-black-cat/
│   │   ├── base/
│   │   │   ├── master.webp
│   │   │   └── poses/
│   │   ├── avatars/
│   │   ├── eyes/
│   │   ├── eyewear/
│   │   ├── neckwear/
│   │   ├── bags/
│   │   ├── props/
│   │   ├── badges/
│   │   ├── stickers/
│   │   └── traces/
│   └── residents/
│       ├── fox/
│       ├── rabbit/
│       ├── bird/
│       ├── bear/
│       └── dog/
├── hatch/
├── theatre/
├── rooms/
├── journeys/
├── encounters/
├── collectibles/
├── paper/
└── official/
    └── liukanshan/
```

---

# 13. 实现层建议

用户 Persona 不再用“物种”表达差异。

推荐：

```ts
interface PlayerVisualIdentity {
  species: "cat";
  coat: "black";
  archetype:
    | "engineer_brain"
    | "system_thinker"
    | "tool_collector"
    | "question_chaser"
    | "evidence_hunter"
    | "creative_maker"
    | "life_observer"
    | "curious_roamer";
  eyeVariant: string;
  earDetail: string;
  eyewear: string | null;
  neckwear: string | null;
  bagKit: string | null;
  signatureProp: string | null;
  interestStickers: string[];
  earnedBadges: string[];
  journeyTraces: string[];
  relationshipMarks: string[];
}
```

`species` 可以继续留在底层模型中，方便 Resident / NPC 使用，但对玩家 Persona 固定为 `cat`。

---

# 14. 下一批素材 P0

由于 STEP 1–3 已完成，接下来只做：

1. `player-black-cat/base_master`；
2. `player-black-cat/identity-sheet`；
3. 9 个 P0 黑猫动作 / Avatar；
4. 第一批 eye / eyewear / neckwear；
5. tool / canvas / travel 三套 bag；
6. notebook / camera / map / clipboard 四件 prop；
7. 五种动物 NPC 各 4 个最小动作；
8. 然后继续 egg / theatre / room / journey / encounter / collectible。

不再回头给六个物种制作完整玩家动作库。

---

# 15. 最终验收

玩家黑猫：

> **一眼都是谢邀喵的黑猫，第二眼能看出“这是不同的人”。**

NPC：

> **一眼知道它不是用户本人，而是谢邀喵世界里遇到的社区居民。**

模块如果导致角色像换了一个 IP、破坏基础黑猫轮廓、出现穿模，直接淘汰。
