# ADR-0002：选择「人格剧场」视觉主方向，并以自主出门作为长期留存循环

- Status: Accepted
- Date: 2026-09-12

## Context

在低保真产品壳完成后，需要冻结主视觉方向和长期养成的核心交互语法。

视觉候选有三套：

- A：人格研究所；
- B：电子宠物街区；
- C：人格剧场。

用户选择 Direction C「人格剧场」。同时希望长期玩法吸收《旅行青蛙》一类低操作、自主离开、回家带回经历的体验。

如果只采用“剧场”而没有长期循环，产品会更像一次性互动作品；如果只采用电子宠物式签到/喂养，会削弱知乎内容与 Agent agency；如果每天只是生成一条推荐，则留存逻辑仍然是工具型推荐系统。

## Decision

### 1. 主视觉采用人格剧场

首访激活流程采用高戏剧浓度：

```text
序幕 → 人格化验 → Reveal → First Encounter → 谢幕
```

核心视觉语法包括：

- 黑场 / 聚光；
- 巨型中文排版；
- 字幕式 Scanning；
- Persona 登台；
- 双人格对手戏；
- 真实知乎问题作为“剧目”。

日常使用降低戏剧浓度，避免长期疲劳。

### 2. 长期养成采用「自主出门」循环

宠物具有独立 outing 状态：

```text
AT_HOME
PREPARING
AWAY
RETURNED
```

用户可以留短纸条影响路线，但不直接控制最终内容、社交对象和结果。

一次 outing 只允许有限动作，最多产生：

- 1 个内容发现；
- 0–1 个社交 Encounter；
- 1 个带回物；
- 0–1 个成长变化。

### 3. 回报全部绑定知乎人格资产

不做随机金币/食物/普通道具。

允许的 return artifact：

- 旅途札记；
- 观点碎片；
- 问题票根；
- 关系票根；
- 新兴趣痕迹。

### 4. Home 由宠物是否在家决定

`/home` 不再只是静态 DailyEvent 首页，而是 outing 状态舞台。

尤其允许“空舞台”作为重要状态：宠物出门时，用户看到的是它留下的痕迹，而不是一个假的常驻角色。

### 5. 首访即时社交仍保留

自主出门属于长期留存机制，不能推翻 ADR-0001。

首次孵化后仍立即安排一次 First Encounter，让用户在 60–90 秒内看到 Persona 与 Agent × Agent 的价值。

## Consequences

### Positive

- 首访有强比赛记忆点；
- 长期留存从“每日推荐”提升为“等一个有自主生活的 Agent 回家”；
- 宠物真正具有 agency，而不是 UI mascot；
- 同一套知乎搜索/热榜/Persona 社交能力可以被包装成独特叙事；
- `窝 / 逛 / 遇见 / 图鉴` 四入口获得更统一的语义。

### Negative

- 需要额外的 Outing 状态、调度与 return event；
- 异步感如果实现不好会变成纯等待；
- 自主性必须受调用额度和事件图限制；
- 视觉上要处理“空舞台”，不能依赖宠物永远在屏幕中央。

## Rejected alternatives

### 每天固定推送一条内容

拒绝。技术简单，但产品仍然是推荐 Feed。

### 用户手动选择具体问题和具体对象

拒绝。控制过强，Agent agency 消失，退化成工具操作。

### 传统电子宠物喂养

拒绝。和知乎内容生态关系弱，也会造成大量无意义系统。

### 每次 outing 都必定遇见另一只宠物

拒绝。社交会显得人为编排，降低世界可信感。

## References

- `docs/product/visual-directions-v1.md`
- `docs/product/autonomous-outing-loop-v1.md`
- `docs/adr/0001-product-shell-and-activation-flow.md`
- `docs/architecture/product-system-v1.md`
