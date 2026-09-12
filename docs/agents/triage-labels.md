# Triage 标签

Matt skills 使用五种规范 triage 角色；本地 Markdown tracker 直接使用同名状态。

| Matt 角色 | 本项目状态 | 含义 |
|---|---|---|
| `needs-triage` | `needs-triage` | 等待维护者判断 |
| `needs-info` | `needs-info` | 等待补充信息 |
| `ready-for-agent` | `ready-for-agent` | 信息完整，可由 Agent 执行 |
| `ready-for-human` | `ready-for-human` | 需要人工执行或决策 |
| `wontfix` | `wontfix` | 不进入实现 |

当 skill 使用抽象 triage 角色时，按本表右列写入 issue 的 `Status:`。实现流程若使用 `claimed`、`active`、`resolved` 等生命周期状态，以对应 skill 的 workflow 约定为准。
