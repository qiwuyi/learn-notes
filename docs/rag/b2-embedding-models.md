---
title: B2 · Embedding 模型选型
---

# Embedding 模型选型

进阶专题 B2 · 关联：第二课里的 [embeddings.ts（Gemini/Qwen 双实现）](/rag/02-ingestion-pipeline)

::: tip 本专题定位
你已经见过本仓库用 `PROVIDER` 切换 Gemini（text-embedding-004）和 Qwen（text-embedding-v2/v4）。
这一课讲清楚：**embedding 模型是什么决定的、怎么评测、主流模型怎么选、中文场景怎么权衡**。
:::

## embedding 模型到底在学什么

embedding 模型把一个 token 序列（句子/段落）映射成**固定维度**的向量。它训练的目标是让**语义相近的文本在向量空间里距离近**：

```text
"什么是 service mesh"        → [0.21, -0.05, 0.87, ...]  ⟵ 距离近 ⟶
"service mesh 原理是什么"     → [0.19, -0.02, 0.85, ...]

"今天天气不错"               → [0.88, 0.13, -0.42, ...]  ⟵ 距离远 ⟶（不同语义域）
```

关键属性：
- **维度（dimension）**：常见 384 / 768 / 1024 / 1536 / 3072。维度高 → 表达力强但更贵更慢；向量库建索引时维度**固定不可改**
- **最大输入长度**：通常 512 / 2048 / 8192 token，超出要截断（chunk 必须小于它）
- **语言能力**：有的模型中英都好，有的英文强中文弱——**中文项目必须看中文评测**

## 怎么评测一个 embedding 模型

业界用 **MTEB（Massive Text Embedding Benchmark）** 和它的中文版 **C-MTEB** 做标准评测，核心看几类任务：

| 任务类别 | 问的是什么 | 例子 |
| -------- | ---------- | ---- |
| **Retrieval（检索）** | 查询能不能召回相关文档 | 句子检索、问答检索 |
| **STS（语义相似度）** | 相似度分数准不准 | 句对相似度 |
| **Classification** | 向量做分类好不好 | 情感分类、意图分类 |
| **Reranking** | 排序质量 | 给候选重排 |
| **Clustering** | 聚类质量 | 按语义分组 |

对 RAG 来说，**Retrieval 和 Reranking 最重要**。选型时优先看这两个指标，而不是总榜。

## 主流 embedding 模型对比

### 通用/多语言（API 服务）

| 模型 | 厂商 | 维度 | 中文 | 批量 | 特点 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| `text-embedding-004` | Google Gemini | 可调（768/3072） | 中上 | ❌ 不支持 | 本仓库默认之一 |
| `text-embedding-v2/v4` | 阿里 Qwen | 1024 等 | **优** | ✅ 支持（≤10） | 本仓库默认之一，中文强 |
| `text-embedding-3-small/large` | OpenAI | 512~3072 | 良 | ✅ 支持 | 生态成熟，海外为主 |
| `embedding-3` | 百度文心 | 1024 | 优 | ✅ | 国内，中文场景常用 |

### 开源模型（可自托管，Ollama/BGE/GTE）

| 模型 | 维度 | 中文 | 最大输入 | 特点 |
| ---- | ---- | ---- | -------- | ---- |
| `bge-m3` (BAAI) | 1024 | **优** | 8192 | 中文检索标杆之一，支持多粒度 |
| `bge-large-zh-v1.5` | 1024 | 优 | 512 | 老牌中文 embedding |
| `gte-large-zh` (Alibaba) | 1024 | 优 | 8192 | 中文 MTEB 排名前列 |
| `multilingual-e5-large` (Microsoft) | 1024 | 良 | 512 | 多语言通用 |
| `all-MiniLM-L6-v2` | 384 | 差 | 256 | 最小最轻，英文原型用 |

::: warning 为什么 OpenAI 的 embedding 在国内 RAG 要谨慎？
`text-embedding-3` 中文不错，但 API 在国内访问不稳、数据出境合规、成本按 token 计费。
**中文生产项目通常优先 Qwen / BGE / GTE**——这也是本仓库把 Qwen 设成默认 `PROVIDER` 的原因之一。
:::

## 选型决策树

```text
你的用户主要说什么语言？
│
├─ 中文为主 ───────────────► 优先中文强模型
│     ├─ 要 API 省事        → Qwen text-embedding-v4（本仓库默认）
│     ├─ 要自托管/隐私      → BGE-M3 或 GTE-large-zh（Ollama 可跑）
│     └─ 数据量小/原型      → 先用 Qwen，效果不满意再换
│
├─ 英文为主 ───────────────►
│     ├─ 要 API             → OpenAI text-embedding-3 / Gemini
│     └─ 要自托管            → multilingual-e5 / MiniLM（原型）
│
└─ 多语言混杂 ─────────────► 多语言模型：bge-m3 / multilingual-e5
```

## 和本仓库的映射

本仓库的 `createEmbedder(env)` 做了很好的抽象——**上层不关心用哪个模型**：

```ts
if (env.PROVIDER === 'gemini') { ... text-embedding-004，逐条请求 ... }
if (env.PROVIDER === 'qwen')   { ... text-embedding-v2/v4，批量请求 ... }
```

换 embedding 模型 = 改 `PROVIDER` + 配 API key + **保证 EMBED_DIM 与索引一致**（索引维度写死后改不了，必须重新建索引）。

## 自测

::: details 测验 · 点击展开

**1. 向量维度在选型时为什么最重要？**
- ❌ 维度越高效果一定越好（不一定，且成本高）
- ❌ 维度越小越好（过小表达力不足）
- ✅ **向量库索引创建时维度固定，之后改不了**（换维度必须重建索引）
- ❌ 维度只影响速度不影响其他

**2. 中文 RAG 项目选 embedding 模型，最应该看重什么？**
- ❌ 英文评测成绩（应看中文评测）
- ✅ **中文检索（Retrieval）评测 + 中文能力**（如 Qwen/BGE/GTE）
- ❌ 只要维度最低的
- ❌ 只要最便宜的

**3. MTEB/C-MTEB 评测中，对 RAG 最重要的两个任务是？**
- ❌ Classification 和 Clustering
- ✅ **Retrieval 和 Reranking**（直接决定检索质量）
- ❌ STS 和 Classification
- ❌ 只看总榜分数

**4. 本仓库用 Qwen 做 embedding 的明显优势是？**
- ❌ 它不支持批量（恰恰相反）
- ✅ **中文强 + 支持批量请求**（提高摄入吞吐）
- ❌ 它免费
- ❌ 它维度更高（不是这个原因）

**5. 想换 embedding 模型，除了改 PROVIDER 还必须注意什么？**
- ❌ 什么都不用注意
- ✅ **EMBED_DIM 必须与向量库索引一致，不一致要重建索引**
- ❌ 只要改 API key
- ❌ 必须改 LLM 模型（两者独立）

:::

## 小结

- embedding 把文本映射成固定维度向量，**语义近则距离近**
- 选型看 **中文检索评测（C-MTEB）**，不看总榜
- 中文生产项目：**Qwen API / BGE / GTE 自托管**是主流组合
- 换模型三件事：PROVIDER、API key、**EMBED_DIM 与索引一致**

---

**推荐阅读**：
- [Hugging Face MTEB 榜单](https://huggingface.co/spaces/mteb/leaderboard)
- [阿里云百炼 · 文本向量化文档](https://help.aliyun.com/zh/model-studio/developer-reference/text-embedding)
- [BGE-M3 官方仓库（BAAI）](https://github.com/FlagOpen/FlagEmbedding)

**继续学习**：[B3 · 检索优化：Hybrid Search 与 Rerank](/rag/b3-hybrid-search-rerank) ｜ [返回 RAG 专题](/rag/)
