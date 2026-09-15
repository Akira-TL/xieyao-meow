# Waiting Game v2 — 现有素材与数据模型复用盘点

> 2026-09-15。Wayfinder「谢邀喵 Waiting Game v2 核心循环」Research 结论。范围只回答：哪些现有资产/状态可直接复用，哪些必须新增，哪些现有约束会影响行囊、途中明信片、回家拆包和猫窝生活。

## 结论摘要

Waiting Game v2 不需要推翻现有 Journey / Persona / Encounter 基础。**可直接复用的是角色状态素材、猫窝/空屋底图、现有 Journey 历史、知乎问题票根事实、Persona snapshot / Shared Encounter / PersonaRelationship。**

真正的缺口集中在 5 个新的持久化边界：

1. `Journey Event / Event Plan`：当前每趟只有一张归来 postcard，没有 0–2 个途中事件的持久化结构。
2. `Loadout / Inventory / Resource Balance`：当前没有库存、装备、消耗品或基础资源状态。
3. `Return Bundle`：当前 `return_artifacts.origin_journey_id` 是 `UNIQUE`，天然限制“一趟最多一个 artifact”，无法表达回家摊开多件东西。
4. `Visitor Event / Home Visit`：Shared Encounter 与关系表可以复用，但没有猫窝来访事实表。
5. `Home Activity`：当前只有 Journey 状态 + `resting`，没有读书、睡觉、整理票根、来客等持久化/可投影的猫窝生活状态。

因此 v2 最合理的路线不是重写 Journey，而是在现有 Journey 聚合周围补这些子状态，并把现有单值 `postcard/artifact/conversation` view-model 逐步扩成可容纳多个事件/奖励的投影。

## 视觉资产：可以直接复用

### 1. 五套玩家 Persona 已经覆盖基础 waiting-game 动作

`public/art/personas/generated-v1/` 已有 5 个正式 Persona pack，每套实际存在 `base / thinking / talking / walking / returned / sleeping` 六个 PNG，共 30 张；运行时代码也把这六种状态定义为正式 `PersonaArtState` 并通过 `resolvePersonaArt()` 直接映射到对应文件。首版可以直接用：

- `walking`：离家 / 在路上；
- `returned`：归来 / 拆包；
- `sleeping`：Home rest；
- `thinking`：读书、看票根、研究东西的临时替代；
- `talking`：Home Visit / Encounter。

来源：`public/art/personas/generated-v1/asset-manifest.json`；`src/lib/persona/art.ts:3-24`。

### 2. 五个 NPC 已有来访所需的四态素材

`public/art/slots/npc/` 下有 5 个 resident，每个都有 `idle / meeting / reaction / talking`，共 20 张 PNG；`ResidentArt` 运行时直接按 `residentId/state` 解析路径。它们足够支撑 P0 的 Home Visit 和 Encounter Glimpse，不需要先补 NPC 新姿势。

来源：`public/art/slots/npc/**`；`src/features/demo/components.tsx:287-317`。

### 3. 猫窝与空屋底图已经存在

P0 资产明确包含：

- `room_home_night`：猫在家的常驻房间；
- `room_empty_night`：猫离家后的空屋；
- `room_study_night_empty`：可叠加角色的空书房；
- `journey_zhihu_gate`：Journey / Explore 入口场景；
- `stage_paper_archive`：可继续用于档案/收藏氛围。

运行时代码已有 `resolveP0Art()`，当前 Home 也已经用 `room-empty-night / room-study-night-empty` 做底图切换，所以不是从零搭场景。

来源：`public/art/p0/README.source.md`；`src/lib/art/p0.ts:1-49`；`src/features/demo/outing-client.tsx:13-21`。

### 4. 已有 16 张世界旅行风景，可作为 Scene Postcard 候选资产

仓库里的 `public/谢邀喵_世界旅行风景_16图.zip` 含 16 张已重命名世界场景（京都、圣托里尼、马拉喀什、威尼斯、纽约、里约、巴黎、伦敦、伊斯坦布尔、香港、布拉格、开罗、悉尼、旧金山、瓦拉纳西、卡帕多奇亚）。它们目前仍在 ZIP 中，**不是运行时可直接引用的 public URL**；若采用，需要解包到正式 `public/art/...` 路径并建立 manifest。

这批图适合 `SCENE_POSTCARD` 的“谢邀喵世界场景”层，但不能伪装成知乎问题缩略图。

来源：`public/谢邀喵_世界旅行风景_16图.zip`（本次用 `unzip -l` 只读盘点，未解包/修改）。

## 视觉资产：关键缺口

### 1. 没有真正模块化的旅行道具素材

当前 Persona exploration sample 中虽然画进了蓝图、夹板、笔记本、工具包、旅行背包，但它们是**烘焙在整张角色图里**的，不是独立透明 PNG；仓库运行时也没有 `camera / magnifier / red pencil / ticket / fish / catnip` 等正式 inventory asset。

所以“主道具 + 小物”如果要在行囊 UI、桌面、拆包里独立摆放，必须补一套模块化物品资产。现有角色图只能作为风格参考，不能当库存图标直接拆用。

来源：`public/art/personas/generated-v1/asset-manifest.json`；本次 `public/` 文件名盘点未发现对应独立 runtime asset。

### 2. Home 生活状态不够丰富

玩家 Persona 虽已有睡觉/思考/说话，但没有 `reading / sorting / eating / looking-window / visitor-hosting` 等专门动作；P0 房间也以夜间为主，没有昼夜变化。

P0 可以先用 `sleeping / thinking / talking` 复用建立“猫确实在生活”的最低闭环；若 Home 要成为长期主入口，后续仍需要至少 3–5 个专门生活状态素材，否则视觉上仍容易像同一张状态卡换文案。

来源：`src/lib/persona/art.ts:3-24`；`public/art/p0/README.source.md`。

## 数据模型：可以直接复用

### 1. Journey 本体可以保留

现有 `journeys` 已经持久化 `user_id / state / route_bias / depart_at / return_at / plan_seed / materialized_at / returned_at / archived_at`，而且每个用户只允许一个未归档 current Journey。这个边界与 v2 的 `AT_HOME / PREPARING / AWAY / RETURNED` 主生命周期兼容，不需要换掉 Journey 聚合。

来源：`src/lib/journey/service.ts:922-939`。

### 2. 历史知乎事实、Insight、Conversation 都可继续作为 v2 的“内容来源事实”

现有表已经分别保存：

- `journey_logs`：真实问题标题、URL、summary、thumbnail、source provenance；
- `journey_insights`：一次 materialize 后不可重生的理解；
- `journey_conversations`：NPC / USER 对话；
- `persona_memories`：结构化经历记忆。

这些都可以在 v2 中继续作为 Question Glimpse、回家票根、JourneyInsight、Encounter/关系历史的数据源，不应重新生成。

来源：`src/lib/journey/service.ts:941-999, 1023-1033`。

### 3. Shared Encounter / PersonaRelationship 可以直接支撑真人来访资格

`social_persona_snapshots` 已保存版本化 Persona snapshot；`shared_encounters` 已保存双方用户、双方 snapshot、topic、turns 与 provenance；`persona_relationships` 已保存 `familiarity / chemistry / encounter_count / last_encounter_at`。因此真人 Visitor Event 不需要再发明一套“真人身份/关系”模型，只需要引用这些稳定事实。

来源：`src/lib/social/shared-encounter.ts:469-510`。

## 数据模型：必须新增或改造

### 1. 缺少 Journey Event / Event Plan 表

当前 `journey_postcards` 以 `journey_id PRIMARY KEY` 存储，天然只能“一趟一张”，且其语义是归来后的 postcard。`JourneyView` / `JourneyAtlasEntry` 也都是单值 `postcard`。

v2 已决定一趟可有 0–2 个途中事件，并要求 `scheduledAt / occurredAt / seenAt`、事件类型、materialized payload 永久持久化，因此必须新增一对明确结构（可以是一张表包含 plan + materialization 字段，也可以 plan/event 分表），不能继续复用现有单张 `journey_postcards`。

来源：`src/lib/journey/service.ts:955-963`；`src/lib/journey/types.ts:46-50, 75-109`。

### 2. 完全没有 Inventory / Loadout / Resource 状态

现有 Journey 只保存 `route_bias`；`journey_user_state` 只有 `next_eligible_at / queued_route_bias`。代码检索也没有运行时 inventory/equipment/loadout/consumable 领域模块。

因此 v2 的永久主道具、消耗型小物、装备 reservation、出门时扣除、基础资源 balance 都必须新增服务端持久化状态，不能塞进前端 local state 或继续挤在 `route_bias` 字段里。

来源：`src/lib/journey/service.ts:1016-1021`；本次对 `src/lib` / `src/app` 的 `inventory|equipment|loadout|consumable` 检索。

### 3. `return_artifacts` 当前限制“一趟最多一个收藏物”

`origin_journey_id TEXT NOT NULL UNIQUE` 使每个 Journey 最多只有一条 ReturnArtifact。Waiting Game v2 的回家拆包目标是同时摊开照片、问题票根、关系纸条、纪念物等多件东西，所以这个唯一约束与目标冲突。

建议 spec 阶段把“Return Bundle”定义成 1:N：保留 artifact 自己的 `id/type/title/source_url/source_key` 与 owner/source dedupe，但移除 `origin_journey_id` 的单值唯一性，或者新增 `journey_return_items` 作为 bundle item 表。

来源：`src/lib/journey/service.ts:1001-1014`。

### 4. Atlas 当前是“每趟一个 postcard + 一个 artifact + 一个 conversation”

`JourneyAtlasEntry` 目前全部是单值字段。v2 若把途中事件、多个返家物件、Visitor Event 都纳入“世界历史”，Atlas 不能只继续堆更多 nullable 单字段；应该把 Journey 事实与 collection projection 分离，至少让 event / return item 以数组或独立查询面返回。

来源：`src/lib/journey/types.ts:100-109`。

### 5. 缺少 Visitor Event / Home Activity 持久化

现有 Shared Encounter 是双方围绕真实话题的共享事件；没有“来猫窝但没碰见主人猫”“留下纸条/脚印”“Home Visit”这样的事实表。Home 本身也只通过 JourneyProjection 的 `resting / nextJourneyAt` 知道是否休息，没有活动类型。

因此 Visitor Event 和 Home Activity 都必须作为 Game State 新增，而不是从每次页面刷新随机算 UI。

来源：`src/lib/social/shared-encounter.ts:477-510`；`src/lib/journey/types.ts:92-98`。

## 当前历史数据对迁移的含义

对当前 `data/xieyao.sqlite` 的只读统计（2026-09-15）得到：

- `journeys = 38`
- `journey_logs = 31`
- `journey_postcards = 31`
- `journey_insights = 25`
- `journey_conversations = 19`
- `return_artifacts = 4`
- `shared_encounters = 2`
- `persona_relationships = 2`
- `social_persona_snapshots = 13`

这意味着历史迁移不应该“重新跑模型”：31 个已完成 Journey 已经有可追溯日志/札记，19 个有对话，25 个有 Insight。v2 应把这些旧记录投影进新的相册/票根/关系历史；只有 4 个现有 return artifact，说明旧系统的 collectible 资产确实远少于 Journey 数量，不能直接把旧 Atlas 数字当成新的收藏完成度。

来源：本次对仓库当前 `data/xieyao.sqlite` 的只读 `SELECT count(*)` 查询。

## 对后续 Wayfinder 决策的直接约束

- **行囊 / 资源经济**：必须新建 Inventory/Loadout/Balance，不要改造 `route_bias` 继续承担。
- **途中明信片**：必须新增 Journey Event 持久化；旧 `journey_postcards` 只作为历史归来札记兼容。
- **回家拆包**：必须突破 `return_artifacts.origin_journey_id UNIQUE` 的一趟一物约束，目标应是 Return Bundle 1:N。
- **猫窝生活**：房间底图和角色基础状态足够做 P0，但 Home Activity / Visitor Event 必须服务端持久化；视觉上还需要后续专门生活动作补强。
- **旅途照片**：已有 16 张世界场景可作为谢邀喵 Scene Postcard 候选，但目前只在 ZIP；知乎问题图仍只能来自真实 `thumbnailUrl`，两者必须保持不同 provenance。
- **历史迁移**：优先做 projection/migration，不重新调用知乎或 DeepSeek 重写旧 Journey。

## 未解决事项

- 16 张世界旅行风景是否全部进入正式 runtime asset、是否还需要更多非地理化“知乎世界”场景，留给「定义旅途照片来源、真实性与生成边界」。
- 第一批模块化主道具/小物具体有哪些、需要哪些透明 PNG，留给「定义首批旅行道具目录、稀有度与美术需求」。
- Return Bundle 最终 schema 采用直接放宽 `return_artifacts` 还是新增 bundle item 表，属于后续 spec/implementation 设计，不在本 Research ticket 决策。
