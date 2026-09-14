# 谢邀喵视觉缺口 P0 — 效果图对照版

> 2026-09-14。基于 15 张效果图、当前正式 `public/art`、官方刘看山 GIF、generated-v1 黑猫状态包、`xieyaomiao_assets_renamed.zip` NPC 包重新审计。
>
> 原则：已有素材优先复用；动态文字继续由 HTML/CSS 渲染；不为了“填满”而生成重复图片。
>
> **状态更新（2026-09-14）：本页定义的 8 个 P0 语义位已完成两轮生成，共 16 张，正式归档于 `public/art/p0/generation-01|02/`。应用默认使用 generation-02；generation-01 保留作视觉对照与快速回退。以下 Prompt 作为生成规格与资产溯源保留，不再是待办清单。**

## 已有，不要重复生成

- 玩家：5 套黑猫 Persona × base / thinking / talking / walking / returned。
- 官方向导：刘看山 idle / wave / wander / computer / sleepy / ball GIF。
- NPC：哲学狐、生活兔、数据鸟、创作熊、探索汪，完整母版与动作素材已提供；页面按 resident + state 接入。
- 剧场：curtain-frame / spotlight / stage-floor。
- 问题卡、关系卡、数据卡：文字必须动态，不烧进图片。
- Journey/Explore 卡片：有真实知乎 thumbnail 时优先使用真实 thumbnail。

## 通用视觉锁定

所有以下世界素材统一：

```text
Xieyao Meow visual world, sophisticated 2D editorial illustration, contemporary Chinese internet culture poster, intimate black-box personality theatre, mature cultural-product feeling, charcoal black + warm bone white + Zhihu blue #1772F6, tiny restrained vermilion accent, subtle paper / screen-print / risograph texture, warm upper-left theatrical light, bold readable silhouettes, layered physical paper/archive objects, not childish, no glossy 3D, no cyberpunk, no purple gradient, no hologram HUD, no readable text, no logo, no watermark, no UI mockup. Keep important content inside the center 45% mobile-safe area.
```

---

# P0-A Persona Egg — 5 张

统一：1600×2000，4:5，透明背景，同一个蛋的连续状态，不改变蛋的身份与比例。

## `egg_idle.png`

```text
Use the Xieyao Meow visual world rules above.
Create the canonical unhatched Persona Egg. One mature mysterious egg, warm bone-white shell, sparse charcoal speckles, subtle imperfect paper-print grain, one tiny restrained Zhihu-blue mark/reflection, slightly asymmetrical organic silhouette, grounded shadow only, no character visible, no scenery, no text, no logo. It should feel like a personality waiting backstage, not a fantasy dragon egg and not a toy.
Transparent background, 1600x2000, 4:5.
```

## `egg_scanning.png`

```text
Use egg_idle as a strict reference. Preserve the exact shell shape, speckles and scale. The same egg is being scanned by information: faint Zhihu-blue reflected fragments and a few subtle paper-like light shards orbit near the shell, with a restrained cool glow from inside. No sci-fi HUD, no lasers, no readable symbols, no text. Transparent background.
```

## `egg_glowing.png`

```text
Use egg_idle as a strict reference. Same exact egg. Stronger warm-white and Zhihu-blue internal glow now leaks through several hairline cracks. The shell remains mostly closed. Elegant theatrical light, not magical fantasy, not neon. Transparent background.
```

## `egg_cracking.png`

```text
Use egg_idle as a strict reference. Same exact egg actively cracking open. Several shell fragments lift slightly; inside, only an ambiguous charcoal-black cat-like silhouette and two subtle eye highlights may be hinted. Do not reveal glasses, scarf, bag or personality archetype yet. Transparent background.
```

## `egg_opened.png`

```text
Use egg_idle as a strict reference. The same shell is now opened into two or three elegant broken pieces around an empty central space reserved for compositing the generated PLAYER BLACK CAT. Warm backstage light, restrained blue reflection, no character baked into the image, no text. Transparent background.
```

---

# P0-B Home Room — 2 张

统一：2400×1350，16:9；同一个房间；不要角色，不要文字；中心和偏右留出放黑猫的干净空间。

## `room_home_night.png`

```text
Use the Xieyao Meow visual world rules above.
Create the canonical nighttime home room for the PLAYER BLACK CAT, matching the effect-sheet Home scene: a cozy dark-charcoal room that still feels like part of the personality theatre, one warm table lamp, low dark sofa/cushion where a cat can rest, small coffee table, a few stacked books, blank paper notes, one mug, a subtle wall archive/polaroid area, distant blue city-night hints through a window, restrained red theatre-curtain edge only if compositionally useful.
No character. No readable text. Leave a large clean character-placement zone around center-right and preserve mobile-safe center composition. Mature editorial illustration, not photorealistic interior design.
2400x1350, 16:9.
```

## `room_empty_night.png`

```text
Use room_home_night as a strict environment reference. Exact same room, camera, furniture and lighting. The Persona is clearly away: the cushion is slightly displaced, a small side exit/doorway is faintly open, one blank note remains on the table, and the room feels temporarily empty rather than abandoned. No character, no readable text. Preserve all geometry so the app can switch between occupied and away states without a visual jump.
2400x1350, 16:9.
```

---

# P0-C Journey / Explore — 1 张

## `journey_zhihu_gate.png`

```text
Use the Xieyao Meow visual world rules above.
Create the canonical entrance from the dark personality theatre into a vast knowledge world, matching the Explore effect sheet. A strong doorway / portal composition opens from charcoal-black backstage architecture toward a brighter blue-and-warm-paper knowledge district. Around the route are abstract blank question cards, books, archive shelves, sign-like blue geometry, paper scraps and small distant lit windows. The world should suggest many topics and conversations without showing readable text or a literal Zhihu logo.
Leave a clear walking path and negative space for the PLAYER BLACK CAT in the lower center/right. Make the portal readable on both desktop and a narrow mobile crop. No characters baked in.
2400x1350, 16:9.
```

---

# 暂不生成

## Encounter background

当前 `curtain-frame + spotlight + stage-floor` 已经足够支撑首次匹配、对手戏和关系详情的核心构图。先观察接入真实 NPC 后的页面密度，再决定是否补 `encounter_cafe` / `encounter_library`。

## Collectibles / ticket / polaroid

当前应优先使用 HTML/CSS 纸张容器承载动态知乎标题、关系状态和日期。不要把文字烧进图。Journey 照片优先使用真实知乎 thumbnail；Atlas 关系拍立得直接放 NPC 素材。

## 刘看山

已经有官方 GIF 素材，不生成仿制版。
