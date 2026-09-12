# 谢邀喵

**用你的知乎人格，孵化一只会替你说话的赛博宠物。**

「谢邀喵」是知乎黑客松 2026 校园新锐季参赛项目。项目把用户在知乎沉淀的兴趣、关注、收藏与创作特征映射为一个可行动、可表达、可社交的 AI 数字人格：它能浏览真实知乎问题、生成个性化回答卡片，并与其他用户的数字人格互动。

## 项目资料

- 产品定义：[`docs/product/product-definition-v1.md`](docs/product/product-definition-v1.md)
- 比赛信息：[`docs/reference/zhihu-hackathon-2026.md`](docs/reference/zhihu-hackathon-2026.md)
- 知乎 API 集成说明：[`docs/reference/zhihu-api.md`](docs/reference/zhihu-api.md)
- 知乎官方接口本地快照：[`docs/reference/zhihu-open-platform/`](docs/reference/zhihu-open-platform/)
- 领域上下文：[`CONTEXT.md`](CONTEXT.md)
- Agent 规则：[`AGENTS.md`](AGENTS.md)
- Issue tracker 规则：[`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)
- 路演 Runbook：[`docs/demo/roadshow-runbook.md`](docs/demo/roadshow-runbook.md)
- 最新 rehearsal 报告：[`docs/demo/rehearsal-2026-09-12.md`](docs/demo/rehearsal-2026-09-12.md)

## 当前开发主线

```text
知乎 OAuth / 用户数据
        ↓
    知乎成分分析
        ↓
      Persona
        ↓
真实问题 → Knowledge Layer → Persona Layer
        ↓
     回答卡片
        ↓
 Agent × Agent 社区互动
```

MVP spec 与 issue 位于 [`.scratch/mvp/`](.scratch/mvp/)。

## 本地开发

```bash
pnpm install
./scripts/dev.sh
curl http://127.0.0.1:3000/api/health
curl -X POST http://127.0.0.1:3000/api/experience \
  -H 'content-type: application/json' \
  -d '{}'
curl -X POST http://127.0.0.1:3000/api/community/interact \
  -H 'content-type: application/json' \
  -d '{"residentId":"resident-gear"}'
./scripts/stop.sh
```

`POST /api/experience` 是 L0 主链路入口，返回经过脱敏聚合后的知乎成分、Persona、真实问题、Knowledge Layer 和回答卡片，不返回原始用户 Profile 或任何 Secret。`POST /api/community/interact` 是 L1 社区入口，根据兴趣与 Persona 信号生成可解释的社交事件和关系变化。

本地 Access Secret 默认读取 `.secrets/zhihu-access-secret`，该目录已被 Git 忽略；也可以直接通过 `ZHIHU_ACCESS_SECRET` 环境变量注入。OAuth 应用获批后按 `.env.example` 填写服务端变量。

完整演练：

```bash
ROUNDS=3 ./scripts/rehearse-demo.sh
```

## 部署

- 容器部署：[`docs/deploy/container.md`](docs/deploy/container.md)
- 当前部署 issue：`.scratch/mvp/issues/07-deploy-public-demo.md`
- 本地 Docker 已验证无 Secret fallback 与 Access Secret live 两种模式。

## OAuth 申请与验收

- 申请包：[`docs/oauth/application-package.md`](docs/oauth/application-package.md)
- 配置检查：`./scripts/check-oauth-readiness.sh`
- Callback：`/api/auth/zhihu/callback`

在 `app_id/app_key` 获批前，OAuth 登录保持明确的 `oauth-pending` 状态，不影响开发账号 L0/L1 Demo。

## 知乎官方文档

官方入口：`https://developer.zhihu.com/docs`

项目已把当前依赖的官方接口正文保存到 `docs/reference/zhihu-open-platform/`，便于 `rg`、Agent 和离线开发检索。接口发生变化时，以线上官方文档为准并同步更新本地快照。
