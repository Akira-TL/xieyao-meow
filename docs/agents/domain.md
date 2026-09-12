# Domain Docs

本项目采用 single-context 领域文档布局。

## 开始探索前

- 读取根目录 `CONTEXT.md` 获取当前领域词汇与边界。
- 如果任务涉及已有架构决策，读取 `docs/adr/` 中相关 ADR。
- 如果文件尚不存在，继续当前任务，不把“补文档”本身当作阻塞项；只有真实术语或架构决策需要固化时再创建。

## 布局

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

## 词汇约束

issue、spec、测试与代码命名优先使用 `CONTEXT.md` 已定义的领域术语。若需要的新概念尚未定义，应先判断是普通描述即可，还是确有必要通过 domain-modeling 固化。

## ADR 冲突

若新的实现方案与已有 ADR 冲突，必须在 issue/spec 中明确指出冲突及重新开启决策的理由，不得静默覆盖。
