---
title: Pi Agent Harness 专题
---

# Pi Agent Harness 专题

以 **earendil-works/pi**（一个 10 万星的开源 AI 智能体工具包）为案例，学习现代 AI 智能体系统的架构设计。

## 这个项目是什么

一句话：**一个 TypeScript 写的 AI 智能体工具包**，包含统一 LLM API、智能体运行时、终端 UI，以及一个可自我扩展的编程智能体 CLI。

```text
⭐ 100k+ stars  ·  🍴 12k+ forks  ·  MIT 协议  ·  TypeScript  ·  Monorepo
创建于 2025 年 8 月，一年内从 0 涨到 10 万星 —— 现象级开源项目
```

## 三层架构（核心认知）

| 层 | 包 | 职责 | 类比 |
|----|----|------|------|
| **接入层** | `@earendil-works/pi-ai` | 统一多厂商 LLM API（OpenAI/Anthropic/Google/DeepSeek/Qwen…30+ 家） | 所有模型的"通用插头" |
| **运行时层** | `@earendil-works/pi-agent-core` | Agent 循环、工具调用、会话状态管理 | 智能体的"大脑循环" |
| **应用层** | `@earendil-works/pi-coding-agent` | 交互式编程智能体 CLI（像 Claude Code） | 面向用户的产品 |

外加 `pi-tui`（终端 UI）、`pi-telemetry`（遥测）、`pi-evals`（评估）。

## 本专题课程

| # | 课程 | 主题 |
| - | ---- | ---- |
| ① | [项目总览与 monorepo 架构](/pi/01-overview-architecture) | 仓库结构、三层架构、为什么 10 万星 |
| ② | [pi-ai：统一 LLM API 设计](/pi/02-pi-ai-unified-api) | Model/Provider/Api 抽象、30+ 厂商适配 |
| ③ | [agent-loop：智能体核心循环](/pi/03-agent-loop) | 双层循环、工具执行、流式响应 |
| ④ | [AgentHarness：会话/工具/压缩](/pi/04-agent-harness) | 会话持久化、工具集、compaction、skills |
| ⑤ | [coding-agent：CLI 产品化](/pi/05-coding-agent-cli) | 命令行、config、工具链、扩展机制 |

## 教学案例

- **仓库**：[github.com/earendil-works/pi](https://github.com/earendil-works/pi)（本机源码在 `D:\ds\pi`）
- **源码**：TypeScript monorepo，`packages/` 下 10 个子包

::: tip 学习建议
本专题适合已经掌握基础 TypeScript 和"LLM 是什么"概念的读者。建议先有 RAG 专题的基础（了解 agent 会调用 LLM），
按 ① → ⑤ 顺序学习，重点理解②（抽象设计）和③（循环架构）。
:::

## 与 RAG 专题的关系

- RAG 专题学了"怎么用 LLM 检索知识"
- Pi 专题学"**怎么把 LLM 封装成可复用的智能体系统**"——这是更上层的工程抽象
- 两者结合 = 完整的 LLM 应用开发图景
