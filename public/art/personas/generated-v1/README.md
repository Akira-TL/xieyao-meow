# 谢邀喵 Generated Personas v1

这是一组已经生成并统一重命名的黑猫人格角色资产。

## 放置方式

把本压缩包内的 `public/art/personas/generated-v1/` 整个目录复制到项目同名位置：

```text
<repo>/public/art/personas/generated-v1/
```

之后代码和后续开发都直接引用固定路径，不需要再根据中文临时文件名找图。

## 最终人格包

- `01_engineer_blue/`：工程脑，圆眼镜 + 蓝围巾 + 工具/技术气质
- `02_analyst_black/`：分析型，方框眼镜 + 黑领结 + 档案气质
- `03_thinker_red/`：思辨型，半框眼镜 + 红围巾 + 思考/观点气质
- `04_observer_canvas/`：观察型，蓝圆眼镜 + 纸牌项圈 + 帆布包
- `05_traveler_blue/`：旅行型，蓝领结 + 旅行背包 + 探索气质

每个正式包统一使用：

```text
base.png
thinking.png
talking.png
walking.png
returned.png
_contact_sheet.jpg
```

`00_exploration_samples/` 是最开始从 00 素材库试生成的 5 个混合样例，保留作为视觉参考，不建议作为程序默认路径。

## 程序接入

根目录 `asset-manifest.json` 已经提供固定 URL。后续可直接使用：

```text
/art/personas/generated-v1/01_engineer_blue/base.png
/art/personas/generated-v1/01_engineer_blue/thinking.png
...
```

建议后续不要重新生成这些角色的核心外观，只新增缺少的动作，并沿用对应包中的 `base.png` 作为身份参考。
