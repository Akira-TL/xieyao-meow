# 08｜Build low-fi product shell

Status: resolved

## Goal

把已经冻结的产品架构实现成一个可在浏览器完整点击的低保真前端壳，用 fixture 先验证信息架构、状态机和 CTA，不在本 issue 内继续扩张后端能力。

## Source of truth

- `docs/architecture/product-system-v1.md`
- `docs/architecture/frontend-application-contract-v1.md`
- `docs/product/experience-flow-v2.md`
- `docs/product/first-visit-storyboard-v1.md`
- `docs/product/low-fi-screen-contract-v1.md`
- `docs/adr/0001-product-shell-and-activation-flow.md`

## Required route flow

```text
/
→ /hatch/consent
→ /hatch/scanning
→ /hatch/reveal
→ /encounter/first
→ /share/:id
→ /home
```

激活后必须能进入：

```text
/explore
/encounter
/atlas
```

## Required shells

- Public Shell
- Activation Shell
- App Shell

## Required shared components

只在确有复用时抽取：

- PetStage / PetAvatar
- KanshanGuide
- ActivationProgress
- CompositionStat + EvidenceDrawer
- ZhihuTopicCard
- MatchScore
- PetDialogueTurn
- RelationshipBadge
- DailyEventHero
- GrowthStrip
- ContentReasonCard
- ShareCard
- StatusBanner
- AppBottomNav

## Fixture contract

第一轮允许全部页面使用固定 fixture，但必须明确：

```text
provenance = demo
```

Fixture 至少包含：

- 一个“本人” Persona；
- 两个 resident Persona；
- 一次可解释 Match；
- 一个真实知乎公开问题的缓存引用；
- 一段 2–4 回合 Agent Encounter；
- 一个 DailyEvent；
- 3 个 Explore item；
- Growth / Atlas 示例数据。

不得把 fixture 冒充实时知乎用户数据。

## Route/state rules

- URL 不是权威激活状态；低保真阶段可以用 fixture activation state adapter，但接口必须为后续 server state 留出边界。
- 未激活状态直接访问 `/home` 必须被引导回当前激活步骤。
- 已激活状态刷新页面不能丢 Persona。
- Activation Shell 不显示四大主导航。
- App Shell 固定四入口：窝 / 逛 / 遇见 / 图鉴。

## Responsive target

- mobile-first 单列；
- desktop 最大内容宽度约 960–1120 px；
- Reveal / Encounter 可在桌面双列；
- 不做两套产品结构。

## Explicit non-goals

本 issue 禁止：

- 重写 OAuth；
- 修改 Access Secret 处理；
- 重写 PersonaEngine / SocialEngine；
- 数据库迁移；
- 接真实第三方用户 OAuth；
- 新增虚拟货币、商城、签到；
- 复杂宠物生成；
- 复杂视觉动效；
- 把现有 `/api/experience` PoC 当成新首页数据模型。

仓库中当前存在一组来源未确认的 auth/OAuth 未提交改动；本 issue 不覆盖、不提交、不重构这些文件。

## Acceptance

浏览器可以在无需口头解释的情况下完整走通：

```text
Landing
→ Consent
→ Scanning
→ Reveal
→ First Match
→ Encounter
→ Activation Result
→ Home
→ Explore
→ Encounter Hub
→ Atlas
```

并且：

1. 每屏只有一个清晰主 CTA；
2. 所有“为什么”入口有可见解释；
3. Scanning 显示完成/失败来源，不只显示 spinner；
4. First Match 明确标记分数是谢邀喵算法；
5. Demo resident 有显式标记；
6. Share 页公开访问不泄露原始用户 Context；
7. Home 首屏只突出一个 DailyEvent；
8. Explore 每条内容都解释 whyPicked；
9. mobile + desktop 都能走完整流程；
10. `pnpm typecheck`、测试、build 通过。

## Test seams

优先测试公开 seam：

- route/state guard；
- ViewModel → Screen rendering 的关键状态；
- fixture/live provenance 标识；
- 主 CTA 跳转；
- Activation Shell / App Shell 导航边界。

不要为纯 CSS 或组件内部实现细节写脆弱测试。

## Completion notes

2026-09-12 完成低保真产品壳：

- 已接通 `Landing → Consent → Scanning → Reveal → First Match → First Encounter → Share → Home`；
- 激活后 `窝 / 逛 / 遇见 / 图鉴` 四入口均可浏览器实机访问；
- 首访 `/encounter/first` 与日常 `/encounter` 已分离，避免激活状态与长期关系页互相污染；
- 低保真阶段使用 `localStorage` activation adapter，仅用于验证 route/state guard，目标正式架构仍以服务端状态为权威；
- 所有页面明确标记 `DEMO FIXTURE / provenance=demo`，两个 resident Persona 均标记为“演示居民”；
- fixture 的 Encounter 锚定真实知乎公开问题，不把演示 Persona 冒充真实注册用户；
- Scanning 渐进展示 fixture finding；正式接入时必须由真实已完成数据驱动；
- 未激活用户直达 `/home` 会回到 Landing；已激活用户访问首访 activation route 会回 `/home`；刷新后 demo Persona 状态可恢复；
- 激活用户再次打开 Landing，主 CTA 变为“回我的窝”，不会引导重复孵化；
- 390px 移动端 Landing / Encounter 无横向溢出，四导航可见；
- 新壳对 `ZHIHU_ACCESS_SECRET`、`X-OAuth-Token`、`/api/experience` 无直接耦合；
- 仓库中来源未确认的 auth/OAuth 未提交改动未被本 issue 修改或纳入提交。

验证：

- `pnpm typecheck`：通过；
- `pnpm test`：9 个测试文件、31 个测试通过；
- `pnpm build`：通过；
- `git diff --check`：通过；
- `codegraph sync .`：通过；
- Windows Chrome CDP：完整首访、App 四导航、route guard 和移动端 390px 实机验收通过。
