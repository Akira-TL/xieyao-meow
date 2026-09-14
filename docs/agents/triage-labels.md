# Workflow Role Mapping

本项目使用 GitHub label 表示 Matt engineering workflow roles，并保留 canonical 名称。

| Workflow role | GitHub label | Used by | Meaning |
| --- | --- | --- | --- |
| `ready-for-agent` | `ready-for-agent` | `to-tickets`, `triage` | 已完整定义，可由 Agent 执行 |
| `bug` | `bug` | `triage` | 缺陷 |
| `enhancement` | `enhancement` | `triage` | 功能或改进 |
| `needs-triage` | `needs-triage` | `triage` | 等待维护者判断 |
| `needs-info` | `needs-info` | `triage` | 等待补充信息 |
| `ready-for-human` | `ready-for-human` | `triage` | 需要人工执行或判断 |
| `wontfix` | `wontfix` | `triage` | 不进入实现 |
| `wayfinder:map` | `wayfinder:map` | `wayfinder` | Wayfinder 主地图 |
| `wayfinder:research` | `wayfinder:research` | `wayfinder` | AFK research 决策票 |
| `wayfinder:prototype` | `wayfinder:prototype` | `wayfinder` | Prototype 决策票 |
| `wayfinder:grilling` | `wayfinder:grilling` | `wayfinder` | HITL grilling 决策票 |
| `wayfinder:task` | `wayfinder:task` | `wayfinder` | 为决策解除阻塞的 task |

下游 Skill 必须读取本表，不得假设 tracker 使用其他名称。
