# Journey Engine 生命周期、时间与弱控制研究 — 2026-09-14

## 研究问题

一趟谢邀喵自主旅行从准备、离家、途中、可能寄回消息、归来到结算应有哪些服务端状态与时间语义？用户的纸条、路线倾向或装备能影响什么，哪些结果必须保持 Persona 自主性？在 MVP 不运行常驻后台 Agent 的前提下，如何保证用户离开期间世界仍然继续？

本研究只建立事实约束与可实施模型；最终决策以 Wayfinder 决策票「定义 Journey Engine 的生命周期、时间和弱控制」的 resolution comment 为准。

## 一手来源

- `docs/adr/0002-personality-theatre-and-autonomous-outings.md`
- `docs/product/travel-frog-loop-v1.md`
- `docs/architecture/product-system-v1.md`，尤其 `Outing`、日常循环数据流与数据存储分层
- `docs/research/user-game-state-ownership-2026-09-14.md`
- `src/features/demo/outing.ts`
- `src/features/demo/outing-client.tsx`

## 已冻结的产品事实

### 1. 对用户可见的主生命周期已经是四态

ADR-0002 已接受：

```text
AT_HOME → PREPARING → AWAY → RETURNED
```

并明确 Home 必须真实反映猫是否在家，AWAY 时允许空舞台。当前 PoC `src/features/demo/outing.ts` 也使用相同四态。

因此 MVP 不应为了调度细节把 UI 状态膨胀成十几个枚举。下载候选、挑问题、是否遇见 Persona、产物生成等应作为 Journey 内部阶段/事件，而不是新的用户可见主状态。

### 2. 用户只能“影响”，不能指定结果

ADR-0002 已拒绝“用户手动选择具体问题和具体对象”；`travel-frog-loop-v1.md` 进一步规定最终路线由根 Persona、近期记忆、用户纸条和当天知乎内容共同决定。

所以纸条/route bias 的职责是调整候选权重，不是把 Journey 变成搜索表单。

### 3. 一趟 Journey 必须有严格预算

现有 accepted 设计约束：一趟最多 1 个主内容发现、0–1 个 Persona Encounter、1 个带回物、0–1 个主要成长变化；`travel-frog-loop-v1.md` 允许 0–2 个轻量侧发现，但不能演化成无限 Feed。

### 4. MVP 已允许“时间戳 + 惰性 materialize”

Wayfinder Map 的 standing note 已明确：第一版不要求常驻后台 Agent 或复杂定时任务，允许 Journey Engine 按时间戳惰性 materialize。

这意味着真实世界时间必须由服务端持久化时间点决定，而不是由浏览器 `setTimeout` 决定。当前 `outing-client.tsx` 中 PREPARING 约 1 秒、AWAY 约 5 秒的 client timer 只是 Demo 动画，刷新、换设备或关闭页面都会破坏真实生命周期，不能进入正式合同。

## 生命周期模型

### 顶层状态

保持四态：

```text
AT_HOME
  ↓ create/schedule journey
PREPARING
  ↓ depart_at reached
AWAY
  ↓ return_at reached and result materialized
RETURNED
  ↓ settlement complete / rest transition
AT_HOME
```

所有状态都由服务端权威管理；客户端只展示投影。

### `AT_HOME`

没有正在进行的 Journey。此时用户可以：

- 留一张可选纸条；
- 选择一个弱路线倾向；
- 查看旧旅途与未读产物。

用户不操作时也不意味着永远不会出门。自主出门的**下一次触发节奏与离线累积上限**属于后续「定义回访节奏、离线累积和留存反馈」决策；本票只要求 Journey Engine 支持“无用户命令也能创建 Journey”。

### `PREPARING`

Journey 已创建，服务端已冻结：

- `journey_id`；
- owner `user_id` / Persona version；
- `created_at`；
- `depart_at`；
- duration band / `return_at`；
- 当时的 route bias；
- 用于可重复决策的 plan seed / engine version。

准备阶段应短暂但真实，建议 MVP 目标约 **5–20 分钟**，UI 不给精确倒计时。用户可在 `depart_at` 前修改一次纸条/route bias；离家后不再允许追溯改写这一趟 Journey。

### `AWAY`

`now >= depart_at` 后进入 AWAY。此时 Journey 已冻结路线倾向与时长带，但具体内容可以按惰性 materialize 在需要时生成。

AWAY 期间可以存在内部 milestone：

- `content_due_at`：主内容结果可被确定；
- `postcard_due_at?`：0–1 次途中消息；
- `encounter_due_at?`：可选 Persona 相遇；
- `return_at`：本次旅途应结束。

这些是内部时间点/事件，不增加顶层 UI 状态。

### `RETURNED`

当 `now >= return_at`，Engine 在一次幂等 materialize 中保证：

1. 必要内容/Encounter 已按预算确定；
2. ReturnArtifact / JourneyLog / 可解释成长 delta 已写入；
3. “已归来” DailyEvent 已写入；
4. Journey 标记完成并进入 RETURNED。

**RETURNED 不能要求用户亲自点击“收进图鉴”才能完成世界时间。** 用户是否查看属于 read/seen 状态；产物和归来事件必须独立持久化。否则用户离开几天时世界会卡死在第一次 RETURNED，与“用户不看时世界仍继续”冲突。

RETURNED 可以有一个短暂 rest/settlement 窗口，之后系统重新进入 AT_HOME；下一趟是否自动开始、多久开始、离线可累计多少趟由后续回访节奏决策处理。

## 时间模型

沿用 `travel-frog-loop-v1.md` 已有区间：

| Journey 类别 | MVP 时间范围 | 产品语义 |
| --- | --- | --- |
| 短途 | 30–90 分钟 | 一次轻量内容探索 |
| 普通 | 2–6 小时 | 默认主循环 |
| 远行 | 8–16 小时 | 更明显的等待感 |
| 特殊 | 隔夜 | 少量、由 Persona/历史触发 |

实现时在创建 Journey 时就确定 duration band 与 `return_at`；后续刷新、轮询次数、客户端在线时长都不得改变它。

UI 只展示模糊时间语义，例如“刚出门 / 走远了 / 好像停在哪儿 / 快回来了”，由 `(now - depart_at) / (return_at - depart_at)` 等服务端时间投影得出，不显示精确秒级倒计时。

比赛 Demo / 自动化测试可以通过注入 clock 或显式 development-only time scale 加速，但正式数据模型与状态语义不得使用 1 秒/5 秒假时间。

## 惰性 materialize

### 核心合同

每次读取 Home/Journey 或执行相关 mutation 时，服务端先运行类似：

```text
materializeDueTransitions(user_id, now)
```

它按时间顺序补齐所有已经到期的内部 milestone 和状态转换。

同一个 Journey 反复调用必须得到同一结果，因此需要：

- 稳定 `journey_id`；
- engine / rules version；
- stable plan seed，或等价的已冻结 selection inputs；
- 每个 milestone 的 materialized/committed 标记；
- 数据库唯一约束或事务保证重复执行不会创建第二张明信片、第二次 Encounter 或重复成长。

用户在旅途中刷新 20 次，不能获得 20 次重抽机会。

### 离线追赶

如果用户在 `return_at` 之后才回来，第一次请求可以在同一服务端事务/工作单元中按顺序补齐：

```text
PREPARING → AWAY → optional postcard/encounter → RETURNED
```

事件历史仍保留真实计划时间，不因为“今天才打开页面”把全部时间改成当前时刻。

最终结果不得依赖用户是否在线、是否轮询或在哪台设备打开。

## 弱控制合同

### 用户可以影响

纸条/route bias 只允许影响**概率与排序权重**，例如：

- 更熟悉：提高既有兴趣向量权重；
- 陌生一点：提高跨兴趣探索温度；
- 深挖：偏向一个主题的高信息密度问题；
- 找反方：提高观点差异候选权重；
- 想认识人：提高“尝试寻找 Persona Encounter”的概率，但不能保证遇见谁。

如果 MVP 保留装备，它只应作为稳定 Persona 外观或软策略 modifier；第一版不引入消耗品经济、付费加速、体力或“某道具必出某结果”。

### 用户不能控制

- 精确知乎问题；
- 精确目的地/主题；
- 精确 Persona 对象；
- 是否一定发生 Encounter；
- 对方 Persona 会说什么；
- 最终 ReturnArtifact 类型；
- 成长 delta；
- 离家后的重抽/撤销/立即召回。

这部分自主性是产品价值，不是缺失功能。

## 结果选择合同

一趟 Journey 的结果应由以下输入共同决定：

```text
Persona root / interests
+ recent Persona memory
+ recent Journey history（避免机械重复）
+ optional route bias
+ current Zhihu candidate pool
+ relationship / eligible Persona pool
+ engine version / plan seed
```

主内容和社交候选由服务端选择。Encounter 必须是可选事件，不得为了“看起来热闹”每趟强制匹配。

ReturnArtifact 必须能追溯到本次 Journey 的真实内容或 Encounter 证据，不发随机金币/无来源纪念品。成长最多一项主要变化，并带解释证据。

## 上游失败与降级

Journey 不能因为知乎 API 短暂失败永久卡在 AWAY：

1. 优先使用符合 TTL / provenance 规则的缓存候选；
2. 如果仍无合格内容，允许“空手回来”或带回一条明确标记为无新发现的短札记；
3. 不伪造知乎事实；
4. 不生成成长 delta；
5. Journey 仍按原 `return_at` 完成并进入 RETURNED。

等待感不能变成故障状态。

## 并发与不变量

MVP 一个 User 同一时刻最多一趟 active Journey。

状态转换只允许：

```text
AT_HOME -> PREPARING -> AWAY -> RETURNED -> AT_HOME
```

惰性追赶可以在一次请求内跨过多个已到期状态，但事件历史必须按顺序、单调、幂等写入。

`route_bias` 在 depart 前可变更，depart 后 immutable；`return_at` 一经 Journey 创建/确认后不因客户端行为重算。

## 与后续决策的边界

本票不决定：

- 用户离开 3 天时最多积累几趟 Journey；
- 下一趟完全自主 Journey 的 cooldown；
- Push / 邮件 / 回流提醒；
- 未读 ReturnArtifact 的 Home 排序策略。

这些属于后续「定义回访节奏、离线累积和留存反馈」。

本票也不决定知乎搜索、热榜、问题回答摘要与直答各自在 Journey 哪个阶段调用；这属于下一张「定义知乎内容发现与知乎直答的旅行职责边界」。
