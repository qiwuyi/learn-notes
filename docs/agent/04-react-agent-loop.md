---
title: Agent ④ Agent 设计：Re-Act 与 Agent Loop
---

# ④ Agent 设计：Re-Act 与 Agent Loop

> **产品经理核心掌握，工作重心。** 作者特别强调：这一部分要重点看。

## 从众声喧哗到只剩一个

过去两年诞生过很多 Agent 设计模式（可参考《产品二姐的 AGI 产品经理参考手册》里的「Agent-智能体设计」部分），**最终留下来的就是 Re-Act。**

Re-Act 在 Agent 工程里有一个通俗的名字：**Agent loop**，或 Query loop。

它的原理极其简单，正应了「大道至简」这个说法——类似 Codex 这类 Agent，就是一轮又一轮地执行着三个动作：

```text
    ┌──────────────────────────────────────┐
    │                                      │
    ▼                                      │
  想（Reason）──▶ 做（Act）──▶ 看（Observe）
    │
    └── 带着观察结果进入下一轮
```

## 一句指令背后发生了什么

一句指令背后，Agent 到底做了什么？全球最优秀的 Agent——Claude、Codex——都围绕这个原理展开。

```text
用户消息
   │
   ▼
① 组装上下文（系统提示 + 历史 + 工具定义）
   │
   ▼
② LLM 决定：直接回答，还是调用工具
   │
   ▼
③ 执行工具（读文件 / 改代码 / 搜索 / 调 API）
   │
   ▼
④ 把工具结果放回上下文
   │
   └──────────▶ 回到 ①
```

::: tip 记住这一句
**Agent = LLM（想）+ 工具（做）+ 循环（把两者连起来）。**
:::

## 深入阅读

| 资源 | 说明 |
| ---- | ---- |
| [全人类通用 Agent 框架，看过后你会恍然大悟](https://www.xiaohongshu.com/discovery/item/6a922ce6000000002a03ffb9) | 作者的小红书视频讲解 |
| [Claude Code 代码泄露后的解读](https://claudeleakage.com/zh/how-claude-code-works-as-a-product/core-engine-what-problem-it-solves/) | 2026-03-31 作者对 Claude Code 的源码解读 |

### Re-Act 原始资料（看不懂也没关系）

- 论文：[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- 项目：[react-lm.github.io](https://react-lm.github.io/)
- 实现：[LangChain ReAct Agent](https://python.langchain.com/docs/modules/agents/agent_types/react/)

## 从 Agent Loop 推出「四大件」

围绕 Agent loop，自然得出 Agent 的四大件：**知识库、记忆、工具、Skills。**

```text
        ┌──────────── Agent Loop ────────────┐
        │   想 ──▶ 做 ──▶ 看 ──▶ 想 ...      │
        └────────────────────────────────────┘
              ▲         ▲        ▲       ▲
              │         │        │       │
           知识库      记忆     工具    Skills
        （知道什么）（记得什么）（能做什么）（会怎么做）
```

> 作者的建议：这部分内容比较多，但 Anthropic 有全世界最权威的文章帮你理解。
> **围绕最权威的文章来扩展，你就有主线了，而不是先看一堆杂七杂八的东西把自己搞得晕头转向。**

- 上一篇：[③ 模型层：三步选型法](/agent/03-model-selection)
- 下一篇：[⑤ Agent 四大件拆解](/agent/05-agent-four-pillars)
