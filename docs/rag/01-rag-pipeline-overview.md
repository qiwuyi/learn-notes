---
title: ① RAG 全流程概览
---

# RAG 全流程概览

第一课 · 教学对象：`rag-chatbot-fork`

## 大图景：一个 RAG 系统在做什么

你已经知道 RAG = **Retrieval-Augmented Generation**（检索增强生成）。这个仓库是一个具体的、能跑的实现。在看代码之前，先把"它到底在解决什么问题"想清楚：

::: tip 核心问题
大模型（LLM）的"知识"是训练时定死的。如果你的博客/文档是私有的、更新很快的，LLM 根本不知道它们。
RAG 的思路：**每次提问时，先到你的知识库里检索相关内容，把检索到的文本"塞进"提示词里，再让 LLM 基于这些文本回答。** 这样 LLM 无需重新训练，就能回答你私有知识库里的问题，而且能给出出处。
:::

这个仓库的知识库是一堆 **Markdown 文章**（Hugo 博客的 `content/` 目录）。整个系统要回答的问题是：

> 用户问："服务网格的 sidecar 是什么？" —— 机器人必须从这些 Markdown 文章里找到相关内容，基于它作答，并列出参考来源。

## 两条流水线：摄入 vs 查询

RAG 系统天然分成 **离线** 和 **在线** 两条流水线，别混在一起：

```text
┌─────────────────────────── 离线 · 摄入（ingestion） ───────────────────────────┐
│                                                                                │
│  content/*.md ─▶ 提取纯文本 ─▶ 切分成 chunk ─▶ 每个 chunk 向量化 ─▶ 写入向量库 │
│   (Markdown)    (markdownToPlain) (chunkText)      (embedding)    (Vectorize)  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── 在线 · 查询（query / chat） ─────────────────────────┐
│                                                                                │
│  用户提问 ──▶ 问题向量化 ──▶ 向量库检索 topK ──▶ 拼进提示词 ──▶ LLM 生成 ──▶ 回答+来源 │
│  "message"    (embedding)   (VECTORIZE.query)  (buildPrompt)   (llmGenerate)   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

关键认识：**摄入只做一次/定期做，查询每次请求都做**。摄入慢一点无所谓（它不阻塞用户），查询必须快（用户在等）。这也是为什么仓库里 `ingest` 脚本专门做了大量并发优化，而 `/chat` 处理要轻量。

::: info 为什么是"向量"？
计算机没法直接判断"服务网格的 sidecar"和哪篇文章"相关"。embedding 模型把一段文字变成一个高维向量（这个仓库里是 768 或 1024 维的数字数组），
语义相近的文字，其向量在空间里也相近。于是"相关"被翻译成了"向量距离近"，可以用数学（余弦相似度）来检索。
检索和回答用的是同一个向量空间，只是角色不同。
:::

## 代码地图：文件 ↔ 阶段

整个仓库很小，结构非常清晰。记住这张地图，后面两节课就是逐层深入：

| 文件 | 属于哪条线 | 负责什么 |
| ---- | ---------- | -------- |
| `src/worker.ts` | 查询线入口 | 整个 Worker，所有 HTTP 路由（/chat、/admin/*、/widget.js） |
| `src/providers/embeddings.ts` | 两条线共用 | 把文字变向量的"embedder"，支持 Gemini / Qwen |
| `src/providers/llm.ts` | 查询线 | 调 LLM 生成回答，同样支持 Gemini / Qwen |
| `src/rag/chunk.ts` | 摄入线 | 把长文本切成一节节 chunk（中文友好） |
| `src/rag/retriever.ts` | 查询线 | 向量检索 + 语言过滤 + 组装上下文/来源 |
| `src/rag/prompt.ts` | 查询线 | 把问题+检索结果+历史拼成给 LLM 的提示词 |
| `src/utils/md.ts` | 摄入线 | Markdown → 纯文本 |
| `src/utils/schema.ts` | 公共 | 类型定义：Env（环境变量）、Vectorize 接口 |
| `scripts/ingest.ts` | 摄入线（本地脚本） | 扫 Markdown → 处理 → 批量上传到 Worker |
| `wrangler.toml` | 部署配置 | Worker 名、VECTORIZE 绑定、模型/维度配置 |

::: warning 一个易混点：ingest 脚本不在 Worker 里跑
摄入脚本（`scripts/ingest.ts`）是**本地**跑的命令行工具（用 `tsx` 运行）。它把处理好的向量 `POST` 到已部署 Worker 的
`/admin/upsert` 端点，由 Worker 再写入 Cloudflare Vectorize。这样设计是为了让摄入任务不占用 Worker 的运行时长配额。
:::

## 测验

::: details 测验 · 点击展开（共 5 题）

**1. 在摄入流水线中，下面哪一步的正确顺序是？**

- ✅ **纯文本提取 → 切分 → 向量化 → 写入**
- ❌ 向量化 → 纯文本提取 → 切分 → 写入（先提取纯文本再切分，切分前不可能向量化）
- ❌ 写入索引 → 向量化 → 切分 → 纯文本（写入是终点，不是第一步）
- ❌ 切分 → 写入 → 向量化 → 纯文本（写入在向量化之后）

**2. 为什么摄入脚本要做大量并发优化，而 /chat 不这么做？**

- ❌ 因为摄入不能并发，只能串行
- ✅ **摄入离线且量大，查询要即时响应**（摄入批量、追求吞吐；/chat 在线等待、要轻量）
- ❌ 查询量比摄入量大得多，才该并发
- ❌ 两边都调 embedding，所以都要并发

**3. 关于 /admin/upsert 和 Vectorize，正确的是？**

- ❌ Vectorize 直接读本地 Markdown 文件
- ❌ /admin/upsert 由浏览器直接调用
- ✅ **脚本把向量发给 Worker，Worker 写入向量库**
- ❌ 向量在每次 /chat 请求时才重新生成（向量在摄入阶段就生成好存起来）

**4. 用户提问时，下面哪一项是 /chat 真正会做的事？**

- ❌ 先让 LLM 回答，再回头找来源
- ❌ 先扫描全部 Markdown 再找答案
- ✅ **问题向量化后检索，再拼提示词生成**（全程不碰原始 Markdown）
- ❌ 每次请求重新向量化整个知识库（索引在摄入阶段建好）

**5. 下列哪个文件属于"摄入线"而不是"查询线"？**

- ❌ `src/rag/retriever.ts`（/chat 时检索，属于查询线）
- ✅ **`src/rag/chunk.ts`**（把 Markdown 切块，只在摄入时使用）
- ❌ `src/rag/prompt.ts`（组装提示词，属于查询线）
- ❌ `src/providers/llm.ts`（/chat 生成回答，属于查询线）

:::

## 本课小结

- RAG = 提问时先检索私有知识库，把相关内容塞进提示词，再让 LLM 作答
- 系统分 **离线摄入**（Markdown→文本→chunk→向量→入库）和 **在线查询**（问题→向量→检索→提示词→生成）两条线
- 摄入批量、离线、追求吞吐；查询单次、在线、追求速度
- 摄入脚本通过 Worker 的 `/admin/upsert` 写向量库，不直接读 Markdown

---

**推荐阅读**：[What Is Retrieval-Augmented Generation? (NVIDIA)](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/)

**继续学习**：[② 摄入流水线：从 Markdown 到向量库](/rag/02-ingestion-pipeline) ｜ [RAG 速查表](/rag/glossary)
