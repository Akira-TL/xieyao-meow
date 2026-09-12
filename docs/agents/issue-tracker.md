# Issue tracker：本地 Markdown

本仓库的 spec 与 issue 以 Markdown 文件保存在 `.scratch/`。

## 目录约定

- 每个 feature 一个目录：`.scratch/<feature-slug>/`
- Feature spec：`.scratch/<feature-slug>/spec.md`
- 实现 issue：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- issue 从 `01` 起编号，一个 ticket 一个文件，不合并成单一 tickets 文档
- issue 顶部使用 `Status:` 记录状态；状态词见 `docs/agents/triage-labels.md`
- blocking 关系使用 `Blocked by: NN, NN`
- 补充讨论追加到文件底部 `## Comments`

## 发布与读取

当 Matt skill 要求“publish to the issue tracker”时，在对应 `.scratch/<feature-slug>/` 下创建 spec 或 issue 文件。

当 skill 要求读取 ticket 时，以用户给出的路径或编号为准读取对应 Markdown 文件。

## Work item 约定

- **Blocking**：只有列出的所有前置 issue 都进入所属工作流的 resolved 状态后，当前 issue 才解除阻塞。
- **Frontier**：从当前 workflow 中选择 open、未阻塞、未被 claim 的 issue，并保持既有编号顺序。
- **Claim**：普通本地执行时，第一笔写操作应把 `Status:` 更新为当前工作流约定的 claimed/active 状态；多 Agent 并发时由协调器提供原子 claim 或互斥机制，不能只依赖文本状态。

## Wayfinder 约定

- Map：`.scratch/<effort>/map.md`
- 子 ticket：`.scratch/<effort>/issues/<NN>-<slug>.md`
- Wayfinder ticket 使用 `Type:` 标记 `research` / `prototype` / `grilling` / `task`
- 解决后追加 `## Answer`，将 `Status:` 设为 `resolved`，并把决策摘要与链接写回 `map.md`
