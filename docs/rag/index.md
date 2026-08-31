---
title: RAG 专题
---

# RAG 原理课程

以 **rag-chatbot-fork**（一个 Cloudflare Workers 上的中文 RAG 聊天机器人）为具体实现案例，学习检索增强生成（Retrieval-Augmented Generation）的原理。

## 课程导航

::: tip 学习建议
按 ① → ② → ③ 顺序学习，每课约 5-10 分钟。做完每课末尾的测验、答对 4 题以上再进入下一课。遇到不懂的术语，随时翻阅文末的 [RAG 速查表](/rag/glossary)。
:::

## 课程内容

| # | 课程 | 主题 | 状态 |
| - | ---- | ---- | ---- |
| ① | [全流程概览](/rag/01-rag-pipeline-overview) | 两条流水线、为什么用向量、代码地图 | ✅ |
| ② | [摄入流水线](/rag/02-ingestion-pipeline) | Markdown → chunk → 向量化 → 写入索引 | ✅ |
| ③ | [查询流水线](/rag/03-retrieval-generation) | /chat 完整旅程、语言过滤、提示词组装 | ✅ |
| R | [RAG 速查表](/rag/glossary) | 术语、代码地图、端点、配置、命令 | ✅ |

## 教学案例

- **仓库**：[github.com/9Ashwin/rag-chatbot-fork](https://github.com/9Ashwin/rag-chatbot-fork)（本机克隆在 `D:\ds\rag-chatbot-fork`）
- **系统**：Markdown 知识库 → 向量库（Cloudflare Vectorize）→ 检索增强生成（Gemini/Qwen）
