# 01｜核验知乎 API 与 OAuth 真值

Type: research
Status: ready-for-agent
Blocked by:

## 目标

取得官方开发手册正文并用真实应用凭证验证本项目依赖的 OAuth、用户数据、热榜、搜索与直答能力。

## 完成标准

- 官方手册可在仓库中以引用或整理文档追溯；
- 明确 authorize / token 流程与 callback 要求；
- 明确 scope、用户可读字段与 token 生命周期；
- 明确热榜、搜索、直答 Agent 的 endpoint、响应结构、配额与错误码；
- 至少完成一次真实 OAuth 或最小接口调用；
- 更新 `docs/reference/zhihu-api.md`，把已验证项从“待官方确认”改为确定事实；
- 所有凭证只进入本地 Secret / 环境变量，不写入 Git。

## Comments

2026-09-12：公开抓取飞书开发手册链接会跳转登录页，后续可使用已登录浏览器能力继续核验。
