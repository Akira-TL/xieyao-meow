# 02｜建立应用脚手架、知乎授权与用户 Profile

Type: task
Status: ready-for-agent
Blocked by: 01

## 目标

在当前仓库建立可运行应用，并把知乎授权数据收敛到稳定的内部 `UserProfile`，为“知乎成分”与 Persona 提供输入。

## 完成标准

- 项目脚手架可通过项目 `scripts/` 启停；
- `/api/health` 或等价健康检查可用；
- OAuth callback 使用官方获批的 `redirect_uri` 完成真实 Authorization Code Flow；callback 是否必须 HTTPS、是否允许 localhost/127.0.0.1 以 issue 06 的实测结果为准；
- 官方原始响应通过 adapter 转成内部强类型 Profile；
- 浏览器端不接触 secret；
- 日志不泄露 token、secret、authorization code；
- 具备可重复的本地/远程开发说明与最小测试。

## 外部依赖

OAuth `app_id/app_key` 申请见 `06-apply-zhihu-oauth-app.md`。在审批完成前，本 issue 可以先实现应用脚手架、Access Secret Gateway、强类型 Profile、OAuth 路由骨架与测试；真实终端用户授权验收等待 issue 06。
