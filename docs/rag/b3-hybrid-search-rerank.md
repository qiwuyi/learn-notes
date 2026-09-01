---
title: B3 · 检索优化：Hybrid Search 与 Rerank
---

# 检索优化：Hybrid Search 与 Rerank

进阶专题 B3 · 关联：第三课里的 [retriever.ts 向量检索](/rag/03-retrieval-generation)

::: tip 本专题定位
本仓库的检索只有"纯向量检索 + metadata 语言过滤"。这一课讲两件能明显提升检索质量的事：
**混合检索（向量 + 关键词 BM25）** 和 **重排（Rerank）**——它们解决的是"向量检索的固有盲区"。
:::

## 纯向量检索的盲区在哪

向量检索靠"语义相似"，但有两个经典问题：

1. **专有名词 / 精确匹配失败**：问"什么是 ClusterIP"，向量可能把"ClusterIP"理解成"集群内访问方式"而检索偏了；**精确的关键词匹配**（BM25）反而一找一个准
2. **短查询稀疏**：用户问题往往很短（"K8s 网络"），向量信息量少，召回不稳定

纯向量 vs 纯关键词各有优缺点，**混合（hybrid）就是把两者结合**。

## 什么是 BM25

BM25 是传统信息检索（搜索引擎）的核心算法，**纯文本匹配**，不涉及向量。它给每个文档打分，依据：

- **词频（TF）**：查询词在文档里出现几次
- **逆文档频率（IDF）**：这个词在整个语料里多"稀有"——"的""了"这类常见词权重低，"ClusterIP"这类稀有词权重高
- **文档长度归一化**：长文档里的词频打折

```text
score = Σ  IDF(词) × 词频因子 × 长度因子
        每个查询词

"ClusterIP" 在文档里出现 → 稀有词 IDF 高 → 得分高 → 命中
"的"       出现很多 → 常见词 IDF 低 → 几乎不影响
```

关键：**BM25 不需要训练、不需要 embedding、解释性强**，而且快。

## Hybrid Search：两路召回 + 融合

```text
用户查询
  ├──▶ 向量检索（语义）────────┐
  │     topK=20               │
  └──▶ BM25 检索（关键词）─────┼──▶ 融合排序 ──▶ 取 topK=8 ──▶ 给 LLM
        topK=20               │
                      加权/归一化
                      (如 RRF)
```

融合方法常见两种：

| 方法 | 思路 | 特点 |
| ---- | ---- | ---- |
| **加权和（Weighted Sum）** | `score = α·向量分 + β·BM25分` | 可调权重，但两者分数尺度不同需归一化 |
| **RRF（Reciprocal Rank Fusion）** | `score = Σ 1/(k + rank)` | 只看排名不看分数，简单鲁棒，是默认选择 |

RRF 例子（k=60）：
```text
文档 A：向量排名第2，BM25 排名第5 → 1/(60+2) + 1/(60+5) = 0.0315
文档 B：向量排名第8，BM25 排名第1 → 1/(60+8) + 1/(60+1) = 0.0311
→ A 胜出（因为两路都靠前）
```

RRF 的哲学：**两路都排前面的文档最可靠**。

## Rerank：粗召回 → 精排序

Hybrid 解决了"召回"，但融合后的 topK 里可能仍有不相关的混进来。**Rerank（重排）**用更强的模型对候选精排序：

```text
粗召回（向量+BM25 融合）:  topK=20（便宜，快）
        │
        ▼
Rerank 模型（交叉编码器）:  逐对打分 query vs 每个候选 → 精排
        │
        ▼
取 topK=8（贵，但对数量少）
```

为什么有用：Rerank 模型（cross-encoder）把**查询和文档拼在一起过一遍模型**，能看到它们的完整交互——比 embedding（把两者分别编码再算距离，bi-encoder）更准，但慢，所以只对**少量候选**做。

```text
bi-encoder（embedding 检索）：query→向量, doc→向量, 算距离   （快，召回）
cross-encoder（rerank）：    [query + doc] 一起过模型打分      （准，精排）
```

## 什么时候该上 Hybrid / Rerank

| 场景 | 建议 |
| ---- | ---- |
| 知识库有大量专有名词、型号、代码标识符 | **强烈建议 Hybrid**（如 "ClusterIP"、"vLLM"、"qwen-plus"） |
| 中文精确匹配需求（论文题目、产品名） | **建议 Hybrid** |
| 小知识库、效果够用 | 先不上，纯向量即可 |
| 候选多、噪声多，追求最高质量 | 加 **Rerank**（如 bge-reranker） |
| 延迟敏感（用户在线等待） | Rerank 要控制候选数，或只在 10~20 个候选中做 |

## 和本仓库的对照

本仓库 `retriever.ts` 目前是**纯向量 + metadata 语言过滤**：

```ts
env.VECTORIZE.query(qvec, { topK: k, filter: { metadata: { language } } });
```

如果要升级成 hybrid，需要：
1. **BM25 数据源**：Cloudflare Vectorize 本身没有 BM25；要么自己维护倒排索引（如 SQLite FTS、Meilisearch），要么用支持 hybrid 的向量库（Qdrant/Weaviate 原生支持）
2. **融合**：在 `/chat` 里对两路结果做 RRF
3. **Rerank**：引入 reranker 模型对 topK 精排后再给 LLM

::: warning 一个重要提醒
Hybrid/Rerank **不是银弹**。先诊断问题：如果检索效果不好，先检查 chunking 和 embedding（B1/B2），再考虑上 Hybrid/Rerank——很多"检索差"其实是 chunk 切得差。
:::

## 自测

::: details 测验 · 点击展开

**1. BM25 和向量检索的核心区别是？**
- ❌ BM25 也用 embedding（不是，纯文本匹配）
- ✅ **BM25 做精确的关键词/词频匹配，向量检索做语义匹配**
- ❌ 两者一模一样
- ❌ BM25 需要 GPU 训练（不需要）

**2. RRF 融合的核心思想是？**
- ❌ 只看分数不看排名（看排名）
- ✅ **按排名倒数融合，两路都靠前的文档得分高**（鲁棒、无需归一化）
- ❌ 两路分数直接相加（分数尺度不同不能直接加）
- ❌ 只取 BM25 的结果（要融合）

**3. Rerank 和 embedding 检索的本质区别是？**
- ❌ 完全一样
- ✅ **Rerank 是 cross-encoder（query+doc 一起过模型），比 bi-encoder 的向量检索更准但更慢**
- ❌ Rerank 更便宜更快
- ❌ Rerank 不需要模型

**4. 知识库大量包含"ClusterIP"这类专有名词时，最该做什么？**
- ❌ 什么都不用做
- ✅ **上 Hybrid Search（向量+BM25）**，专有名词精确匹配更稳
- ❌ 只增大 topK（治标不治本）
- ❌ 换更大的 embedding 模型（不解决精确匹配）

**5. 检索效果差时，正确的排查顺序是？**
- ❌ 直接上 Rerank
- ✅ **先查 chunking 和 embedding（B1/B2），再考虑 Hybrid/Rerank**
- ❌ 一定是向量库的问题
- ❌ 先换 LLM

:::

## 小结

- 纯向量检索有盲区：专有名词、短查询、精确匹配
- **Hybrid = 向量（语义）+ BM25（关键词）双路召回 + RRF 融合**
- **Rerank = cross-encoder 对粗召回精排**，准但慢，只对少量候选做
- 先诊断问题再上优化：chunking → embedding → hybrid → rerank

---

**推荐阅读**：
- [RAG 中的 Hybrid Search 与 RRF 详解（Weaviate Blog）](https://weaviate.io/blog/hybrid-search-explained)
- [BM25 算法介绍（Wikipedia）](https://en.wikipedia.org/wiki/Okapi_BM25)
- [bge-reranker（BAAI）](https://github.com/FlagOpen/FlagEmbedding)

**继续学习**：[B4 · RAG 评估](/rag/b4-rag-evaluation) ｜ [返回 RAG 专题](/rag/)
