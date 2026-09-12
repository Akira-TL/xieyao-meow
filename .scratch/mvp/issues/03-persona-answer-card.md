# 03｜跑通 Persona → 真实问题 → 回答卡片主链路

Type: task
Status: ready-for-agent
Blocked by: 02

## 目标

完成 L0 核心体验：知乎成分生成 Persona，Persona 选择或接收真实知乎问题，经 Knowledge Layer 与 Persona Layer 生成回答卡片。

## 完成标准

- 用户 Profile 可生成稳定的“知乎成分”结构；
- Persona 包含外观/品种、性格、口头禅、回答风格、兴趣与彩蛋属性；
- 问题来自已验证的知乎真实数据源；
- Knowledge Layer 与 Persona Layer 明确分离；
- Persona Layer 不修改 Knowledge Layer 的核心事实；
- 生成至少一种可分享回答卡片；
- 直答/问题数据具备缓存和 Demo fallback；
- 主链路可在路演环境连续执行。
