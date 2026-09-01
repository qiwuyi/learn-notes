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

### 基础课程（A 系列）

| # | 课程 | 主题 | 状态 |
| - | ---- | ---- | ---- |
| ① | [全流程概览](/rag/01-rag-pipeline-overview) | 两条流水线、为什么用向量、代码地图 | ✅ |
| ② | [摄入流水线](/rag/02-ingestion-pipeline) | Markdown → chunk → 向量化 → 写入索引 | ✅ |
| ③ | [查询流水线](/rag/03-retrieval-generation) | /chat 完整旅程、语言过滤、提示词组装 | ✅ |
| R | [RAG 速查表](/rag/glossary) | 术语、代码地图、端点、配置、命令 | ✅ |

### 进阶专题（B 系列）

| # | 课程 | 主题 | 状态 |
| - | ---- | ---- | ---- |
| B1 | [Chunking 策略全解](/rag/b1-chunking-strategies) | 五种切分策略、chunk 大小、中文场景 | ✅ |
| B2 | [Embedding 模型选型](/rag/b2-embedding-models) | MTEB/C-MTEB、主流模型对比、中文权衡 | ✅ |
| B3 | [检索优化：Hybrid + Rerank](/rag/b3-hybrid-search-rerank) | BM25、双路召回、RRF 融合、重排 | ✅ |
| B4 | [RAG 评估](/rag/b4-rag-evaluation) | ragas 四件套、LLM 评估、Golden Set | ✅ |
| B5 | [高级 RAG 模式](/rag/b5-advanced-rag-patterns) | Self-RAG、CRAG、GraphRAG、Agentic RAG | ✅ |
| B6 | [向量数据库对比](/rag/b6-vector-databases) | 三类方案、主流对比、选型决策树 | ✅ |

## 教学案例

- **仓库**：[github.com/9Ashwin/rag-chatbot-fork](https://github.com/9Ashwin/rag-chatbot-fork)（本机克隆在 `D:\ds\rag-chatbot-fork`）
- **系统**：Markdown 知识库 → 向量库（Cloudflare Vectorize）→ 检索增强生成（Gemini/Qwen）
