---
title: Agent ⑥ Agent 测评与可观测
---

# ⑥ Agent 测评与可观测

> Agent 做出来只是开始——**怎么知道它好不好、哪里坏了、改完有没有变好**，靠的是测评与可观测。

## 工具选型：Langfuse

作者的评价：**Langfuse 是「山寨版 Langsmith」，但做得也很好。**

先把官网的概念全部看一遍：

- [Langfuse Academy](https://langfuse.com/academy)

![Langfuse Academy 首页截图：左侧红框标出 Tracing / Datasets / Evaluation 等学习步骤](/agent/06-langfuse.png)

*图：Langfuse Academy 的学习路径——Tracing、Monitoring、Datasets、Evaluation 一条主线走下来。*

## 安装官方 Skill，用 Codex 带你读代码

推荐安装 Langfuse 官方 skill：

- [github.com/langfuse/skills](https://github.com/langfuse/skills)

然后让 codex 用这个 skill 帮你解读。作者的提示词模板（可直接抄）：

```plaintext
带我解读 langfuse 的代码，从以下几个主题逐步展开，每个主题要说明：
- 为什么会有这个东西
- 我们在什么场景下会用到
- 这个东西是如何实现的
- 我应该如何使用这个东西

这些主题包括：
1. langfuse 的 tracing
2. langfuse 的 evaluation
3. 如何系统的为一个 agent 产品做评测
```

::: tip 这个提示词的通用性
「为什么会有 → 什么场景用 → 怎么实现 → 怎么使用」这四问，其实适用于任何陌生技术栈的源码学习。
:::

## 做完之后你会得到什么

作者说：做完以上，你会对以下问题有系统理解——

- 评测的**设计**方式
- 评测的**实现**方式
- 评测的**使用场景**
- 怎么做**问答结果**的评测
- 怎么做问答过程中**调用工具、召回**的评测

## 评测的三层视角

| 视角 | 评什么 | 对应 Langfuse 能力 |
| ---- | ------ | ------------------ |
| 结果层 | 最终答案对不对 | evaluation（打分 / LLM-as-judge） |
| 过程层 | 工具调用、召回是否合理 | tracing（链路追踪） |
| 系统层 | 整个 Agent 产品怎么持续评测 | datasets + 评测流水线 |

## 相关延伸

- 如何准备评测集：[Langfuse · Designing Great Datasets](https://langfuse.com/academy/datasets/designing-great-datasets)
- 模型选型也要靠自建评测集 → 见 [③ 模型层：三步选型法](/agent/03-model-selection)
- 本站 RAG 专题的评估篇 → [B4 · RAG 评估](/rag/b4-rag-evaluation)

- 上一篇：[⑤ Agent 四大件拆解](/agent/05-agent-four-pillars)
- 下一篇：[⑦ 延伸阅读资源清单](/agent/resources)
