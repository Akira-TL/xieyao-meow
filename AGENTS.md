# xieyao-meow Agent 规则

## 项目入口

本项目是知乎黑客松 2026 校园新锐季参赛项目「谢邀喵」。处理产品、知乎 API、比赛规则或实现任务前，先读取 `CONTEXT.md`，再按任务读取对应资料：

- 产品定义：`docs/product/product-definition-v1.md`
- 比赛信息：`docs/reference/zhihu-hackathon-2026.md`
- 知乎 API 使用说明：`docs/reference/zhihu-api.md`

资料中标记为“待官方确认”的内容不得当作已验证接口事实；实现前应优先核对官方开发手册。

## Agent skills

### Issue tracker

项目使用 GitHub Issues（`Akira-TL/xieyao-meow`）承载 issue、spec 与 Wayfinder 决策地图。具体约定见 `docs/agents/issue-tracker.md`。

### Workflow roles

Matt 工程流程使用 canonical GitHub labels，包括 triage、`ready-for-agent` 与 `wayfinder:*` 角色。映射见 `docs/agents/triage-labels.md`。

### Domain docs

项目采用 single-context：根目录 `CONTEXT.md` 维护领域语言，架构决策记录在 `docs/adr/`。消费规则见 `docs/agents/domain.md`。

## 工程流程

- 新的开发任务先读取 `ask-matt` Skill，并依据其路由选择 spec、ticket、implement、TDD 或其他流程。
- 多阶段功能、spec、实现 ticket 与 Wayfinder 决策统一发布到 GitHub Issues；blocking、claim、sub-issue 等关系优先使用 GitHub 原生能力，具体操作见 `docs/agents/issue-tracker.md`。
- 若根目录存在 `.codegraph/`，理解或定位代码时先执行 CodeGraph 查询，再继续读取实现。
- 比赛冲刺以可稳定演示的核心链路为优先级来源；具体范围以产品定义和当前 issue 为准，不在 `AGENTS.md` 重复缓存产品细节。
