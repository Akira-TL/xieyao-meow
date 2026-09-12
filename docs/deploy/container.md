# 容器部署｜谢邀喵

> 目标：用同一镜像部署到 Sealos 或其他支持 Docker/OCI 的平台，获得稳定 HTTPS 域名，并将其用于知乎 OAuth `redirect_uri`。

## 1. 镜像约定

项目使用 Next.js standalone 输出：

```text
next.config.ts -> output: "standalone"
```

容器运行入口：

```text
node server.js
```

监听：

```text
0.0.0.0:3000
```

健康检查：

```text
GET /api/health
```

## 2. 必需 Secret

基础 Demo：

```text
ZHIHU_ACCESS_SECRET
```

OAuth 获批后追加：

```text
ZHIHU_OAUTH_APP_ID
ZHIHU_OAUTH_APP_KEY
ZHIHU_OAUTH_REDIRECT_URI
```

不要把任何 Secret 烘焙进镜像、Dockerfile、Git 或前端 bundle。

## 3. OAuth callback

部署获得稳定 origin 后，将回调固定为：

```text
https://<your-domain>/api/auth/zhihu/callback
```

并把**完整同一 URL**同时用于：

1. 向知乎开放平台申请 OAuth 应用；
2. 部署环境 `ZHIHU_OAUTH_REDIRECT_URI`；
3. 后续 authorization code 换 token。

## 4. 本地构建检查

```bash
pnpm test
pnpm typecheck
pnpm build
```

若本机有 Docker：

```bash
docker build -t xieyao-meow:local .
docker run --rm -p 3000:3000 \
  -e ZHIHU_ACCESS_SECRET \
  xieyao-meow:local
```

然后：

```bash
curl http://127.0.0.1:3000/api/health
```

## 5. 平台侧建议

黑客松 Demo 建议保持**单实例**，原因是当前开发版 OAuth session store 为进程内存存储。如果横向扩展多个实例或使用会频繁冷启动的无状态运行环境，应先把 OAuth session 替换为共享 KV/Redis/数据库。

因此比赛阶段部署约束建议：

```text
replicas = 1
port = 3000
health = /api/health
HTTPS = enabled
restart = on-failure
```

这不会影响 Access Secret、热榜、直答和 fallback；它只关系到 OAuth 用户 session 是否能跨进程持续存在。

## 6. 2026-09-12 本地容器验收

已真实执行：

```text
docker build -t xieyao-meow:local .
```

结果：镜像构建成功。

无 Secret 容器：

```text
/api/health -> status=ok
/api/auth/zhihu/start -> HTTP 503, status=oauth-pending
/api/experience -> mode=fallback
```

只注入现有 `ZHIHU_ACCESS_SECRET` 的容器：

```text
/api/experience -> mode=live
persona -> 英短
primaryInterest -> AI 与数码
knowledge.source -> zhihu-question-answers+zhida
```

测试过程中 Secret 值未打印、未写入镜像、未写入 Git。

## 7. 部署完成后的检查

```text
https://<domain>/api/health
https://<domain>/
https://<domain>/api/auth/zhihu/start
```

OAuth 尚未配置时 `/api/auth/zhihu/start` 应明确显示 `oauth-pending`；配置完成后应 3xx 跳转到知乎授权页。

最后运行：

```bash
./scripts/check-oauth-readiness.sh
```

确认配置形状后再做真实用户授权验收。
