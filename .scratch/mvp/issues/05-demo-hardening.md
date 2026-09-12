# 05｜Demo 稳定性、降级与路演冻结

Type: task
Status: resolved
Blocked by:

## 目标

在停止新增核心功能后，把比赛提交和现场路演所需链路固化为可重复、可恢复的 Demo。

## 完成标准

- 热榜、搜索、Knowledge Layer 关键结果可缓存；
- 保留至少一组真实请求成功的演示数据；
- 官方接口不可用时有明确 fallback，且 UI 不伪装数据来源；
- OAuth、外部 API、模型调用均有用户可理解的错误态；
- 路演脚本与产品实际行为一致；
- 关键演示流程至少完成多轮端到端演练；
- L2 只有在 L0/L1 稳定后才进入实现，否则明确砍掉。

## Comments

2026-09-12：Demo hardening 已完成，证据见 `docs/demo/rehearsal-2026-09-12.md`，现场操作见 `docs/demo/roadshow-runbook.md`。

- 新增 `scripts/rehearse-demo.sh`，自动检查健康、首页、L0、缓存稳定性、L1 多行为、可解释信号与 feed 累积；
- LIVE 模式完成 3 轮 rehearsal：`mode=live`、缓存稳定、`debate + visit`、feed=6；
- 临时移走 Secret 后完成 2 轮 fallback rehearsal：`mode=fallback`、缓存稳定、`debate + visit`、feed=4；测试结束 Secret 已恢复；
- 生产环境不允许客户端强制刷新，且同 key 并发请求合并，保护有限直答额度；
- fallback 明确显示 `DEMO CACHE`，使用真实公开知乎问题/回答摘要/直答固化结果，不伪装实时数据；
- 当前冻结主链路不调用知乎搜索，因此搜索不预热、不消耗额度；若后续重新启用搜索，必须先接入同一公共内容缓存策略；
- 路演 runbook 已与当前真实 UI 和 API 行为对齐；
- L2 真实宠物照片情绪识别明确砍掉，除非 OAuth、部署、提交和演练全部稳定后仍有余量。
