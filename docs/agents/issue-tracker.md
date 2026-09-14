# Issue tracker: GitHub

本仓库的 spec、implementation ticket、triage 与 Wayfinder 决策地图统一使用 GitHub Issues：`Akira-TL/xieyao-meow`。所有操作使用已登录的 `gh` CLI。

## Conventions

- 创建：`gh issue create --title "..." --body "..."`
- 读取：`gh issue view <number> --comments`
- 列表：`gh issue list --state open --json number,title,body,labels,comments`
- 评论：`gh issue comment <number> --body "..."`
- 标签：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- Claim：`gh issue edit <number> --add-assignee @me`
- 关闭：`gh issue close <number> --comment "..."`

PRs 不作为 triage request surface。

## Workflow roles

所有 Matt Skill 通过 `docs/agents/triage-labels.md` 将 canonical workflow role 映射到 GitHub label。不要临时创造同义 label。

## Blocking / Frontier

优先使用 GitHub 原生 issue dependencies。执行前先探测当前 `gh` 是否直接暴露 dependency 能力；若 CLI 没有便利参数，则使用 GitHub API 建立和查询依赖。只有 API 本身不可用时，才退回 issue body 中机器可读的 `Blocked by: #n, #m`。

Frontier = 当前 workflow 下 open、未被未解决依赖阻塞、且未被 claim 的 work item。

## Wayfinder

- Map：一个带 `wayfinder:map` label 的 GitHub Issue。
- Decision ticket：Map 的 sub-issue，并根据类型使用 `wayfinder:research` / `wayfinder:prototype` / `wayfinder:grilling` / `wayfinder:task`。
- 优先使用 GitHub 原生 sub-issues；若 CLI 没有便利参数，则通过 GitHub API 建立 parent/sub-issue 关系。
- 若 sub-issue API 本身不可用，才在 Map 中用 task list，并在 child body 顶部写 `Part of #<map>`。
- 解决一个 ticket 时：先在 ticket 留下 Answer comment，再关闭它，再把“一行 gist + ticket 链接”追加到 Map 的 `Decisions so far`。
- 普通 Wayfinder session 一次最多解决一个非 Research ticket；Research 可按规则并行。

## Publish / Fetch

当 Skill 要求 “publish to the issue tracker” 时，创建 GitHub Issue；要求读取 ticket 时，从 GitHub Issue 读取，不再把 `.scratch/` 当正式 tracker。
