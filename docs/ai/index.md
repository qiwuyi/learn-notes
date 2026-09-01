---
title: AI 基础专题
---

# AI 基础专题

基于微软官方课程 **microsoft/AI-For-Beginners**（12 周 · 24 课 · 6.8 万星）整理的 AI 基础学习专题。

## 微软课程全景

```text
AI-For-Beginners（24 课）
├─ ① 入门（1 课）            AI 是什么、发展史、符号 vs 神经
├─ ② 符号 AI（3 课）         知识表示、本体论、概念图
├─ ③ 神经网络（3 课）        感知机 → 自建框架 → TensorFlow/PyTorch
├─ ④ 计算机视觉（7 课）      CNN → 迁移学习 → 自编码器 → GAN → 目标检测 → 分割
├─ ⑤ NLP（8 课）            文本表示 → Embeddings → 语言建模 → RNN
│                           → 生成网络 → Transformer → NER → 大语言模型
├─ ⑥ 其他技术（3 课）        遗传算法 → 深度强化学习 → 多智能体
└─ ⑦ AI 伦理（1 课）        公平、责任、透明
```

## 本专题策略

微软原课本身非常完整（每课有讲义 + notebook + 测验 + 作业）。所以本专题**不做搬运**，而是：

1. **课程全景导览**：24 课地图 + 学习路径建议（帮你选"先学什么"）
2. **精选深读**：挑与本站 RAG / Pi 专题衔接最紧的课，做深度整理

## 课程内容

| # | 课程 | 主题 | 关联 |
| - | ---- | ---- | ---- |
| ① | [课程全景与学习路径](/ai/01-curriculum-map) | 24 课地图、路径建议 | 从零规划 AI 学习 |
| ② | [神经网络基础](/ai/02-neural-networks) | 感知机、前向/反向传播、框架 | 一切的基石 |
| ③ | [Embeddings 深度理解](/ai/03-embeddings) | Word2Vec、语义向量 | ← RAG B2 的前置理论 |
| ④ | [Transformer 深度理解](/ai/04-transformer) | 注意力、位置编码、自注意力 | ← 所有现代 LLM 的底座 |
| ⑤ | [从语言模型到 RAG](/ai/05-llm-to-rag) | 语言建模 → LLM → RAG | 打通 AI 基础与 RAG 专题 |

## 与本站其他专题的关系

```text
AI 基础专题（本专题）
   │  提供：神经网络、Embedding、Transformer 等理论基础
   ▼
RAG 专题 ──── 检索增强生成（应用了 Embedding + LLM）
Pi 专题  ──── 智能体工程（应用了 LLM + 工具）
```

**学习顺序建议**：
- 想补理论 → 本专题 ① → ⑤
- 想快速上手应用 → RAG 专题 → Pi 专题
- 两者并行：每学一个 RAG 概念，回来读对应的理论基础

## 教学资源

- **原课程**：[github.com/microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners)（完整讲义、notebook、测验、作业）
- **微软课程配套**：每课有 Pre/Post 测验链接、Binder 在线运行环境
