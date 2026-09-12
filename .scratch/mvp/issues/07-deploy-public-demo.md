# 07｜部署公开 Demo 并固定 OAuth Callback

Type: task
Status: ready-for-human
Blocked by:

## 目标

把已通过本地 Docker 验收的「谢邀喵」部署到一个稳定的 HTTPS 公网域名，为比赛 Demo 和知乎 OAuth `redirect_uri` 提供固定入口。

## 当前已完成

- Next.js 已启用 `output: "standalone"`；
- `Dockerfile` / `.dockerignore` 已完成；
- 本地镜像 `xieyao-meow:local` 构建成功；
- 无 Secret 容器已验证 `/api/health`、`oauth-pending` 与 fallback；
- 注入现有 Access Secret 后，容器内 `/api/experience` 已验证 `mode=live`；
- 部署说明：`docs/deploy/container.md`。

## 人工选择

需要确定最终部署目标与域名。优先条件：

- 支持 Docker/OCI；
- 自动 HTTPS；
- 比赛期间域名稳定不变；
- 单实例运行；
- 支持平台 Secret；
- 能访问知乎开放平台。

Sealos 可作为候选，但本 issue 不把平台写死。

## 部署参数

```text
container port: 3000
replicas: 1
health path: /api/health
```

Secret：

```text
ZHIHU_ACCESS_SECRET
```

OAuth 获批后追加：

```text
ZHIHU_OAUTH_APP_ID
ZHIHU_OAUTH_APP_KEY
ZHIHU_OAUTH_REDIRECT_URI=https://<domain>/api/auth/zhihu/callback
```

## 完成标准

- 获得稳定 HTTPS 公网 origin；
- `/api/health` 公网返回 `ok`；
- 首页可访问并完成 L0/L1 Demo；
- 无 OAuth 凭证时 `/api/auth/zhihu/start` 明确为 pending；
- callback 固定为 `https://<domain>/api/auth/zhihu/callback`；
- 将该 URL 填入 `docs/oauth/application-package.md` 后发送 OAuth 申请；
- 部署环境 Secret 不进入 Git/镜像/前端；
- OAuth session 在比赛阶段保持单实例约束。
