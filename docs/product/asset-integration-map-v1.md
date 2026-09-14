# 谢邀喵素材接入映射 v1

> 2026-09-14。目标：按既有效果图与 `art-generation-prompts-v1.md` 的世界层级逐步接入用户新增素材，不按文件名盲猜用途。

## 接入原则

- 玩家角色：只使用 `public/art/personas/generated-v1/` 的黑猫 Persona 变体与动作状态。
- NPC / Resident：保留狐、兔、鸟、熊、汪等社区居民身份，不映射为玩家。
- 世界背景：单独作为 scene/background 层，不进入 Persona 或 NPC 槽位。
- 前景 / 纸张 / 票根 / 拍立得：作为独立装饰层或内容容器，不烧入动态文字。
- 原始 `ChatGPT Image ...` 文件与用户 ZIP 保留，确认语义后复制到稳定语义路径；未确认用途的素材不强行接入。

## 已确认接入

| 稳定路径 | 原始来源 | 语义 | 使用位置 | 状态 |
| --- | --- | --- | --- | --- |
| `/art/world/theatre/curtain-frame.png` | `public/ChatGPT Image 2026年9月13日 19_28_11 (1).png` | 红黑人格剧场侧幕 / 舞台框 | Landing / Casting / Reveal / Encounter | 已接入 |
| `/art/world/theatre/spotlight.png` | `public/ChatGPT Image 2026年9月13日 19_28_11 (2).png` | 暖色舞台聚光层 | Landing / Casting / Reveal / Encounter | 已接入 |
| `/art/world/theatre/stage-floor.png` | `public/ChatGPT Image 2026年9月13日 19_28_11 (4).png` | 舞台地台 / 下沿前景 | Landing / Casting / Reveal / Encounter | 已接入 |

`public/ChatGPT Image 2026年9月13日 19_28_24 (7).png` 与侧幕框像素结构高度近似，暂作为重复/备选版本保留，不重复叠加。

## 待确认后接入

按原效果图与生产规范继续分组：

1. Home：`room_home_night` / `room_empty_night` / `room_returned` / `room_visitor`
2. Journey：`journey_zhihu_gate` 及知识世界区域背景
3. Encounter：`encounter_stage` / cafe / library / room / rooftop
4. Collectibles：question ticket / relationship ticket / polaroid / sticker / badge
5. Paper auxiliary：纸张、胶带、印章、票根框
6. NPC：按 Resident 身份和动作状态接入，不与玩家黑猫混用

## 移动端构图约束

Reveal 首屏必须优先保持：Persona 身份 → 角色 → 3–5 个证据 → 主 CTA。背景只增强舞台感，不得制造横向溢出或把 CTA 推出过长的首屏叙事。