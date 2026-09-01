---
title: B6 · 向量数据库对比
---

# 向量数据库对比

进阶专题 B6 · 关联：全项目核心依赖 [Cloudflare Vectorize](/rag/01-rag-pipeline-overview)

::: tip 本专题定位
本仓库用的是 **Cloudflare Vectorize**（绑定进 Worker）。这一课把它放进整个向量数据库生态里对比：
主流方案各适合什么场景、怎么选、以及它们和"你正在学的仓库"的关系。
:::

## 先分清三类"存向量的东西"

"向量数据库"这个词很宽，实际分三类：

| 类型 | 是什么 | 例子 | 特点 |
| ---- | ------ | ---- | ---- |
| **专用向量数据库** | 为向量检索而生 | Qdrant、Milvus、Weaviate、Pinecone | 功能全：过滤、混合检索、缩放 |
| **传统数据库+向量扩展** | 原库加向量能力 | PostgreSQL(pgvector)、Redis、Elasticsearch、ClickHouse | 复用已有 DB 生态 |
| **云平台托管向量服务** | 云上的"库 + 服务" | **Cloudflare Vectorize**、AWS OpenSearch、Azure AI Search | 免运维，和云生态绑定 |

本仓库用的 Cloudflare Vectorize 属于第三类——它不是一个独立数据库，而是 **Cloudflare 平台内的向量索引服务**，通过 Worker binding 直接调用。

## 主流方案对比

| 方案 | 类型 | 部署 | 混合检索 | 中文生态 | 适合 |
| ---- | ---- | ---- | -------- | -------- | ---- |
| **Cloudflare Vectorize** | 云托管 | 免运维（CF 平台） | ❌ 需自己加 | 一般 | **CF Workers 项目**（本仓库场景） |
| **Qdrant** | 专用 | 自托管/云 | ✅ 原生 | 好 | 生产级、要混合检索 |
| **Milvus** | 专用 | 自托管/云 | ✅ | 好 | 超大规模（十亿级） |
| **Weaviate** | 专用 | 自托管/云 | ✅ 原生 | 好 | 混合检索 + GraphQL |
| **Pinecone** | 云托管 | 免运维 | ✅ | 一般 | 想省运维、托管优先 |
| **pgvector** | PG 扩展 | 自托管 | ⚠️ 需配合 | 一般 | 已有 PostgreSQL |
| **ChromaDB** | 专用（轻量） | 本地/嵌入式 | ❌ | 中 | **原型、本地开发** |

## 怎么选（决策树）

```text
你的应用跑在哪？
│
├─ 已经/计划用 Cloudflare Workers ──► Cloudflare Vectorize（零额外运维）
│
├─ 想自托管、要混合检索/生产级 ──► Qdrant（平衡）或 Milvus（超大规模）
│
├─ 已有 PostgreSQL ──► pgvector（不用引新库）
│
├─ 只想本地做原型/学习 ──► ChromaDB（最简单）
│
└─ 不想管服务器 ──► Pinecone（托管 SaaS）
```

## 选型时看什么（关键维度）

1. **部署形态**：自托管（要服务器）vs 托管（免运维）vs 嵌入式（本地）
2. **混合检索**：是否原生支持 BM25/关键词（B3 讲过，很多场景需要）
3. **过滤能力**：metadata filter 强不强（本仓库靠 `language` 过滤，Vectorize 支持但有限）
4. **扩展性**：几百万 vs 几十亿向量
5. **与你的技术栈**：Worker 绑定、Python 客户端、语言 SDK
6. **成本**：托管按存储/查询计费 vs 自托管按服务器

## 回到本仓库：为什么用 Cloudflare Vectorize

```toml
# wrangler.toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "website-rag"
```

选择它的理由（放在当时场景下）：
- 项目本来就在 Cloudflare Workers 上 → **binding 直接注入 `env.VECTORIZE`**，零额外服务器、零跨网调用
- 查/写走 Worker 内置 API，和整个部署同生命周期
- 免运维、自动伸缩

**它的短板**（也是选型要知道的）：
- 不支持混合检索（BM25），本仓库的检索是纯向量
- metadata filter 能力有限
- 脱离 Cloudflare 生态就没法用（vendor lock）

## 自测

::: details 测验 · 点击展开

**1. Cloudflare Vectorize 属于哪一类？**
- ❌ 传统关系型数据库
- ✅ **云平台托管向量服务，通过 Worker binding 调用**
- ❌ 嵌入式本地库
- ❌ 开源专用向量库

**2. 想在本地快速搭 RAG 原型，最简单的是？**
- ❌ Milvus（太重）
- ✅ **ChromaDB**（轻量、嵌入式、本地开发友好）
- ❌ Pinecone（要注册云端）
- ❌ Cloudflare Vectorize（要部署 Worker）

**3. 需要原生混合检索（向量+BM25）的生产项目，优先考虑？**
- ❌ ChromaDB（不支持）
- ✅ **Qdrant / Weaviate**（原生支持混合检索）
- ❌ Cloudflare Vectorize（需自己实现）
- ❌ pgvector（不原生支持）

**4. 已经有 PostgreSQL 数据库，加向量检索最省事的是？**
- ❌ 再起一个 Qdrant
- ❌ 换到 Milvus
- ✅ **用 pgvector 扩展**（复用现有 PG 生态）
- ❌ 用 ChromaDB（和 PG 无关）

**5. 本仓库选 Cloudflare Vectorize 最核心的原因是？**
- ❌ 它检索效果最好
- ❌ 它最便宜
- ✅ **项目跑在 Cloudflare Workers 上，binding 零运维直连**（与部署同生态）
- ❌ 它支持混合检索

:::

## 小结

- 三类方案：**专用向量库 / 传统库+扩展 / 云托管服务**
- 选型看：**部署形态、混合检索、过滤能力、规模、技术栈、成本**
- 本仓库用 Vectorize 是"CF 生态内的自然选择"，了解其短板（无混合检索、锁平台）对换方案很重要

---

**推荐阅读**：
- [Cloudflare Vectorize 官方文档](https://developers.cloudflare.com/vectorize/)
- [Awesome Vector Database 资源合集](https://github.com/dangkhoasdc/awesome-vector-database)
- [Qdrant 官方文档](https://qdrant.tech/documentation/)

**返回**：[RAG 专题首页](/rag/) ｜ [A 类课程回顾](/rag/)
