# 02｜建立应用脚手架、知乎授权与用户 Profile

Type: task
Status: resolved
Blocked by: 01

## 目标

在当前仓库建立可运行应用，并把知乎授权数据收敛到稳定的内部 `UserProfile`，为“知乎成分”与 Persona 提供输入。

## 完成标准

- 项目脚手架可通过项目 `scripts/` 启停；
- `/api/health` 或等价健康检查可用；
- OAuth authorize URL 与 authorization code 换 token 的服务端逻辑已按官方合同实现并测试；真实 callback、`redirect_uri` 限制和终端用户授权验收由 issue 06 负责；
- 官方原始响应通过 adapter 转成内部强类型 Profile；
- 浏览器端不接触 secret；
- 日志不泄露 token、secret、authorization code；
- 具备可重复的本地/远程开发说明与最小测试。

## 外部依赖

OAuth `app_id/app_key` 申请与真实终端用户 callback 验收见 `06-apply-zhihu-oauth-app.md`。该外部审批不再阻塞 03 号 Persona 主链路开发。

## Comments

2026-09-12：完成 Next.js 15.4.11 + React 19 + TypeScript + Tailwind CSS 4 脚手架；`/api/health` 已通过真实 dev server 验收；建立强类型 `ZhihuGateway`、Zod 响应校验、UserProfile 聚合、OAuth authorize/token exchange 服务和连接层有限重试。`pnpm typecheck`、Vitest、`next build` 均通过。Access Secret 只由服务端环境变量或 `.secrets/` 本地输入注入，`env.ts` 使用 `server-only` 阻止客户端误导入。
