# 02｜建立应用脚手架、知乎授权与用户 Profile

Type: task
Status: ready-for-agent
Blocked by: 01

## 目标

在当前仓库建立可运行应用，并把知乎授权数据收敛到稳定的内部 `UserProfile`，为“知乎成分”与 Persona 提供输入。

## 完成标准

- 项目脚手架可通过项目 `scripts/` 启停；
- `/api/health` 或等价健康检查可用；
- OAuth callback 在公网 HTTPS 环境真实工作；
- 官方原始响应通过 adapter 转成内部强类型 Profile；
- 浏览器端不接触 secret；
- 日志不泄露 token、secret、authorization code；
- 具备可重复的本地/远程开发说明与最小测试。
