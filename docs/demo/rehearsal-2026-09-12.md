# Demo Rehearsal Report｜2026-09-12

## 结论

当前 L0 + L1 已分别通过真实知乎链路与完全无 Secret 的 fallback 链路演练，可以进入路演冻结阶段。

本文只记录聚合结果与公开内容，不保存 Access Secret、原始用户 Profile、OAuth token 或用户创作正文。

## LIVE rehearsal

执行：

```bash
ROUNDS=3 BUILD=0 PORT=3100 ./scripts/rehearse-demo.sh
```

结果：

```text
mode: live
persona: 英短
personaTitle: 知乎盐选级工具猫
primaryInterest: AI 与数码
knowledgeSource: zhihu-question-answers+zhida
cacheStable: true
socialActions: debate, visit
feedCount: 6
rounds: 3
PASS
```

真实问题来自当次知乎热榜。Knowledge Layer 使用 5 条知乎回答摘要与知乎直答；具体回答正文不写入本报告。

额外人工黑盒记录：生产模式首次完整 L0 生成约 23 秒，同进程第二次请求命中缓存约 14 ms，`generatedAt` 和回答正文保持一致。

## Offline / no-secret rehearsal

测试时仅临时移动 `.secrets/zhihu-access-secret` 文件，不读取文件内容；测试结束后已恢复原路径。

执行：

```bash
ROUNDS=2 BUILD=0 PORT=3101 ./scripts/rehearse-demo.sh
```

结果：

```text
mode: fallback
persona: 英短
personaTitle: 知乎认证·机械原理蹲守猫
primaryInterest: AI 与数码
question: 汽车为什么长期采用方向盘而不是操纵杆？
knowledgeSource: demo-fallback
cacheStable: true
socialActions: debate, visit
feedCount: 4
rounds: 2
PASS
```

fallback 使用此前真实成功请求后固化的公开知乎问题、回答摘要和知乎直答结果，不包含开发账号的原始 Profile 数据。

## 已验证的稳定性边界

- 首页和 `/api/health` 可用；
- L0 可返回 `live`；
- 无 Secret 时 L0 可明确返回 `fallback`，不会伪装为实时数据；
- 同 key 并发请求在服务端合并，避免重复消耗上游额度；
- 生产环境忽略客户端 `forceRefresh`；
- 同进程重复请求命中 L0 内存缓存；
- L1 社区复用 L0 缓存，不因每次串门重复调用知乎直答；
- 社区行为覆盖至少两种类型并保留结构化 `signals` / `reasons`；
- 关系分和 feed 能跨多轮互动累积；
- 无 Secret 时 L1 仍能基于公共数据居民与 fallback Persona 完整演示。

## 搜索缓存说明

知乎搜索 API 已完成官方文档核验和真实接口验证，但当前冻结的 L0/L1 主链路**不调用搜索**，问题来源固定为热榜，因此不应为了满足形式要求额外调用并消耗搜索额度。

当前缓存覆盖实际主链路中的热榜选择、问题回答摘要、Knowledge Layer、Persona Layer 和最终回答卡片，因为它们作为一个 `AnswerExperience` 原子结果被服务端缓存。若后续重新引入搜索，搜索结果必须进入同一公共内容缓存策略后才能加入正式 Demo。

## 路演冻结决定

L2 真实宠物照片情绪识别暂时砍掉。除非 OAuth、部署、提交材料与多轮 rehearsal 全部稳定，并仍有明确剩余开发窗口，否则不重新打开 L2。
