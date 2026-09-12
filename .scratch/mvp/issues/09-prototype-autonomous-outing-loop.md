# 09｜Prototype autonomous outing loop

Status: completed

## Goal

在不接真实 OAuth、不新增数据库迁移、不生成图片的前提下，把现有 fixture-driven 日常壳升级为可点击的自主出门循环，验证“旅行青蛙式缺席感”是否真的比静态 DailyEvent 更有留存吸引力。

## Source of truth

- `docs/adr/0002-personality-theatre-and-autonomous-outings.md`
- `docs/product/autonomous-outing-loop-v1.md`
- `docs/architecture/product-system-v1.md`
- `docs/product/visual-directions-v1.md` Direction C

## Required loop

```text
AT_HOME
→ 留出门纸条（可选）
→ PREPARING
→ AWAY
→ RETURNED
→ 查看 ReturnArtifact
→ AT_HOME
```

低保真阶段允许用 localStorage + fixture 驱动，不模拟真正后台异步任务。

## Required Home states

### AT_HOME

- 宠物在舞台；
- 显示最近带回物；
- 主 CTA：留张纸条；
- 可以选择“随便逛 / 多看看 AI / 去陌生地方 / 看看大家在吵什么”。

### PREPARING

- 明确是短过渡；
- 展示纸条内容；
- 不显示精确倒计时。

### AWAY

- **宠物必须从舞台消失**；
- 空舞台是主视觉；
- 显示宽泛状态，例如“刚出门 / 已经逛了一会儿”；
- 不提供“立即召回”；
- 主 CTA：看上次带回来的东西。

### RETURNED

- 回家 Reveal；
- 主 CTA：看看它带回了什么；
- 至少一张 ReturnArtifact。

## Fixture ReturnArtifact

第一版固定包含：

```text
幕间札记 #014
今天去了：AI / 科学
看到：汽车为什么长期采用方向盘而不是操纵杆？
本喵记了一句：真正麻烦的不是灵敏，而是容错。
同行者：齿轮
关系变化：+2
```

必须标注 provenance=demo。

## Visual constraints

- 不生成图片；
- Direction C 人格剧场；
- 允许纯 CSS 舞台、遮罩、巨型字体、灯光块；
- 首访不在本 issue 大改；
- 日常 Home 戏剧浓度约 25%，Return Reveal 约 60%；
- AWAY 状态宁可空，也不要用假宠物占位。

## Integration with four tabs

- `窝`：当前 outing 状态；
- `逛`：JourneyLog / ReturnArtifact 历史 + 出门纸条；
- `遇见`：outing 中发生过的 Persona Encounter；
- `图鉴`：票根、札记、兴趣痕迹、关系痕迹长期沉淀。

## Non-goals

- 真实 scheduler；
- 后台 worker；
- 精准旅行时长；
- 金币 / 商店 / 食物 / 便当 / 护身符；
- 用户手动指定具体知乎问题；
- 无限 Agent loop；
- 图片生成；
- 重写 OAuth 或真实 API gateway。

## Acceptance

1. 从 `/home` 可以完整点击走完一次 outing；
2. AWAY 时舞台真的没有宠物；
3. 用户只能弱引导，不能直接指定结果；
4. RETURNED 有明确的小高潮；
5. ReturnArtifact 与真实知乎公开问题 fixture 有关系；
6. `逛 / 遇见 / 图鉴` 对 outing 结果有可见沉淀；
7. 所有 fixture 明确 demo provenance；
8. mobile 390px 无横向溢出；
9. typecheck / tests / build 通过。

## Validation record

- `pnpm typecheck` ✓
- `pnpm test` ✓（10 test files / 36 tests）
- `pnpm build` ✓
- Chrome CDP 实机：`AT_HOME → PREPARING → AWAY → RETURNED → AT_HOME` ✓
- AWAY 状态确认宠物元素不在页面 ✓
- `逛` 显示幕间札记 / JourneyLog ✓
- `图鉴` 显示旅途收藏与关系票根 ✓
- 390×844：AWAY 页面 `scrollWidth === clientWidth === 390` ✓
- 全流程仅使用 demo fixture；未接真实 OAuth / API；未生成图片 ✓
