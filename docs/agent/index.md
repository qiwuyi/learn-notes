---
title: Agent 产品认知专题
---

# Agent 产品认知专题

整理自飞书文档 **《产品二姐 ✖️ 言e实验室：Agent 产品基础认知手册（精简版）》**——一份基于 3 年 AI 开发经验总结的 Agent 产品经理知识框架。

> 原文作者：产品二姐（小红书 / 即刻 / 公众号同名）· 极客时间《AGI 产品经理全栈指南》专栏讲师
> 原文链接：[my.feishu.cn/wiki/P5AhwGmW0io3zCkXUaAcGP78nRh](https://my.feishu.cn/wiki/P5AhwGmW0io3zCkXUaAcGP78nRh)

::: tip 作者给读者的建议
内容不多，但**强烈建议看完里面提到的所有文章，重点看 Agent 设计 这部分**——作者所有的项目实践理论基础都来源于这些内容。
:::

## 这份手册讲什么

它回答一个核心问题：**一个 Agent 产品经理需要建立怎样的知识框架？**

作者用「土壤层级」类比 AI 产品的生态分层，然后从最底层的算法 / 算力 / 数据一路往上讲到应用层，主线非常清楚：

![AI 应用生态层级架构：劳作方式、植被分层与 AI 生态产品的一一对应](/agent/01-ecosystem-layers.png)

> 原文的 14 张配图，除课程小助手二维码未转载外，其余 13 张已同步到本专题各章节页面（[见资源清单](/agent/resources#原文全部配图)）。

```text
草木万物层   → Agent 应用（面向终端用户的产品）
有机质层     → Agent Infra（提示词、知识库、工具、Skills、记忆）
表土层       → AI 原生应用（以模型为起点生根发芽）
底土层       → 数据 / 算力 / 算法（自建能力）
BedRock 层   → 云原生基础设施（上一代云为 Agent 备好的底座）
```

## 课程目录

| # | 章节 | 主题 | 学习目标 |
| - | ---- | ---- | -------- |
| ① | [AI 产品生态层级架构](/agent/01-ecosystem-layers) | 五层土壤模型 | 建立整体地图 |
| ② | [算法 · 算力 · 数据](/agent/02-algorithm-compute-data) | 神经网络本质、Token 与成本、微调 | 理解原理 |
| ③ | [模型层：三步选型法](/agent/03-model-selection) | 可用性 → 评测 → 自建评测集 | 会做模型选择 |
| ④ | [Agent 设计：Re-Act 与 Agent Loop](/agent/04-react-agent-loop) | 想→做→看，四大件 | **重点掌握** |
| ⑤ | [Agent 四大件拆解](/agent/05-agent-four-pillars) | 上下文 / Skills / 记忆 / 工具 / 知识库 | 理解工程要素 |
| ⑥ | [Agent 测评与可观测](/agent/06-evaluation-observability) | Langfuse tracing / evaluation | 会做评测 |
| ⑦ | [延伸阅读资源清单](/agent/resources) | 原文引用的全部资料 | 按图索骥 |

## 与本站其他专题的关系

```text
AI 基础专题  ──  神经网络 / Embedding / Transformer（理论底座）
      │
      ▼
Agent 产品认知（本专题）──  产品经理视角：生态分层、模型选型、Agent 设计、评测
      │
      ├──▶ RAG 专题 ── 知识库落地的具体工程实现
      └──▶ Pi 专题  ── Agent loop 的源码级实现案例
```

- 想先补**理论** → 先看 [AI 基础专题](/ai/)
- 想先看**源码实现** → [Pi 专题](/pi/) 的 ③ agent-loop
- 想补**产品视角与选型方法论** → 本专题

## 阅读顺序建议

1. 先读 ① 建立生态地图
2. 再读 ④ 和 ⑤（作者指定的重点）
3. ③ 模型选型、⑥ 评测按需查阅
4. ⑦ 资源清单当作长期待读列表
