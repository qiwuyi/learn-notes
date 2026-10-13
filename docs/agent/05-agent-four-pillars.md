---
title: Agent ⑤ Agent 四大件拆解
---

# ⑤ Agent 四大件拆解

> 围绕 Agent loop 得出的四大件：**知识库、记忆、工具、Skills**。
> 作者原话：「下面提到的内容我本人看过不止 3 遍，每次看都有新的体会。」

本篇按作者给的顺序拆解，每件都指向 Anthropic 的权威文档作为主线。

![手绘示意图：Agent 四大件——Memory、知识库、工具、Skills 围绕智能体](/agent/05-four-pillars.png)

*图：四大件总览——Memory（用户画像 + 做事原则）、知识库（经验·事实）、工具（内外部 + 权限/安全）、Skills（开箱即用）。*

## 1. Agent 上下文管理

**核心问题**：上下文窗口有限，而 Agent 一轮轮跑下去，历史会不断膨胀。怎么装、怎么裁、怎么压？

- 权威文档：[Anthropic 上下文管理](https://platform.claude.com/docs/zh-CN/build-with-claude/context-windows)

作者的读法：**把文档里红框的内容全部看一遍。**

![Anthropic 上下文管理文档截图：左侧红框标出「上下文管理 / 上下文窗口 / 编辑 / 压缩」等章节](/agent/05-context.png)

*图：红框内的章节就是作者要求通读的部分。*

## 2. Agent Skills

**核心问题**：怎么把「某个任务该怎么做」的知识，从提示词里抽出来，变成可复用、可按需加载的能力单元？

- 权威文档：[Anthropic Agent Skills](https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/overview)

![Anthropic Agent Skills 文档截图：左侧红框标出「技能」目录下的概览、快速开始、最佳实践、企业版技能](/agent/05-skills.png)

*图：红框内的「技能」目录是必读部分。*

## 3. Agent 记忆设计

**核心问题**：跨会话、跨任务，Agent 该记住什么、忘掉什么、什么时候取回？

- 权威文档：[Anthropic Memory Tool](https://platform.claude.com/docs/zh-CN/agents-and-tools/tool-use/memory-tool)

![Anthropic 记忆工具文档截图：左侧红框标出「记忆工具」菜单项](/agent/05-memory.png)

*图：记忆工具在「工具」菜单下的位置。*

::: tip 记忆 vs 上下文 vs 知识库
- **上下文**：这一次推理里能看到的
- **记忆**：跨轮次/跨会话保留的
- **知识库**：外部资料，按需检索进来的
:::

## 4. Agent 工具

**核心问题**：Agent 的「手」——工具怎么定义、怎么描述、怎么让模型正确选择？

- 权威文档：[Anthropic 工具使用概览](https://platform.claude.com/docs/zh-CN/agents-and-tools/tool-use/overview)

![Anthropic 工具使用文档截图：左侧红框标出「工具使用」完整目录](/agent/05-tools.png)

*图：工具使用的目录结构——工作原理、定义工具、处理调用、并行、Tool Runner、服务端工具等。*

## 5. Agent 知识库

RAG（检索增强生成）是**最好起步 Agent 的上手实践方式**。

作者自己总结的 RAG 全流程理解（中等入门）：

- 《新手读完就懂：万字长文综述 RAG 组合拳（AGI 应用走向落地的 40%）》——见飞书原文内链

知识库在过去两年诞生了三种形式，腾讯这篇文章讲得很清楚：

- [知识库检索入门：从普通 RAG、知识图谱 RAG 到 LLM Wiki，一篇讲清原理、区别与选型](https://cloud.tencent.com/developer/article/2660474)

## 四大件总览

| 组件 | 回答的问题 | 类比 | 权威文档 |
| ---- | ---------- | ---- | -------- |
| 上下文管理 | 这次推理里装什么 | 工作台 | [context-windows](https://platform.claude.com/docs/zh-CN/build-with-claude/context-windows) |
| Skills | 这类任务该怎么做 | 操作手册 | [agent-skills](https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/overview) |
| 记忆 | 跨会话记住什么 | 笔记本 | [memory-tool](https://platform.claude.com/docs/zh-CN/agents-and-tools/tool-use/memory-tool) |
| 工具 | 能对外做什么 | 手 | [tool-use](https://platform.claude.com/docs/zh-CN/agents-and-tools/tool-use/overview) |
| 知识库 | 需要时能查到什么 | 图书馆 | [腾讯技术文章](https://cloud.tencent.com/developer/article/2660474) |

## 本站对应专题

- 知识库的具体工程实现 → [RAG 原理课程](/rag/)
- Agent loop 的源码级案例 → [Pi 专题 · agent-loop](/pi/03-agent-loop)

- 上一篇：[④ Agent 设计：Re-Act 与 Agent Loop](/agent/04-react-agent-loop)
- 下一篇：[⑥ Agent 测评与可观测](/agent/06-evaluation-observability)
