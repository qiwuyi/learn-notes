---
title: RAG 速查表
---

# RAG 速查表

项目：`rag-chatbot-fork` · 随课程更新

## 术语表（Glossary）

| 术语 | 含义 |
| ---- | ---- |
| **RAG** (Retrieval-Augmented Generation) | 检索增强生成：提问时先从知识库检索相关内容，塞进提示词，再让 LLM 作答，避免重新训练 |
| **Embedding（向量化）** | 把一段文字映射成高维向量（本仓库 768/1024 维）。语义相近的文字向量距离近。见 `embeddings.ts` |
| **Chunk（分块）** | 把长文章切成可向量化的小段（默认 800 字符，中文按标点保句切分）。见 `chunk.ts` |
| **Vectorize** | Cloudflare 的向量数据库。存 (id, vector, metadata)，支持 query/upsert/delete。Worker 通过 `VECTORIZE` 绑定访问 |
| **topK** | 向量检索返回最相似的多少条。本项目 /chat 用 8，检索函数默认 15 |
| **metadata filter** | 查询时按 metadata 字段过滤（本项目按 `language`）。过滤失败/超时则回退无过滤查询 |
| **lookbehind（后行断言）** | 正则 `(?<=...)`，匹配某模式之前/之后的位置。chunk 用它"在中文标点后切开但不吞掉标点" |
| **EMBED_DIM** | 向量维度，索引创建时固定（本项目 1024）。写入时 /admin/upsert 会严格校验长度一致 |
| **PROVIDER** | embedding/LLM 后端选择：`gemini` 或 `qwen`。Gemini 不批量、Qwen 支持批量 |
| **titleDictionary** | 中→英标题翻译表（脚本预生成）。英文用户搜到中文内容时用于翻译标题、转换 URL |
| **ADMIN_TOKEN** | 保护 /admin/* 端点的 Bearer token。写入/删除/清空知识库必须带 |

## 代码地图

| 文件 | 职责 |
| ---- | ---- |
| `src/worker.ts` | Worker 入口，全部 HTTP 路由（/chat、/admin/*、/debug、/widget.js） |
| `src/providers/embeddings.ts` | 文字→向量，Gemini/Qwen 双实现 |
| `src/providers/llm.ts` | LLM 生成回答，Gemini/Qwen 双实现 |
| `src/rag/chunk.ts` | 中文友好切块（标题级 + 标点级） |
| `src/rag/retriever.ts` | 向量检索 + 语言过滤 + 上下文/来源组装 |
| `src/rag/prompt.ts` | 组装提示词（角色+上下文+历史+问题+约束） |
| `src/rag/title-dictionary.ts` | 中→英标题字典与翻译函数（自动生成） |
| `src/utils/md.ts` | Markdown → 纯文本 |
| `src/utils/schema.ts` | Env / VectorizeIndex / MatchMeta 类型定义 |
| `scripts/ingest.ts` | 本地摄入主脚本（并发、批量、容错） |
| `scripts/manual-ingest.ts` | 手动摄入指定文件 |
| `scripts/full-reindex.ts` | 清空库 + 删状态 + 全量重建 |
| `scripts/generate-title-dictionary.ts` | 扫描中英标题对，生成 title-dictionary |

## HTTP 端点

| 方法+路径 | 鉴权 | 作用 |
| --------- | ---- | ---- |
| `POST /chat` | 无 | 问答主接口，body: {message, history, language} → {answer, sources} |
| `POST /admin/upsert` | ADMIN_TOKEN | 批量写入向量条目，校验维度 |
| `DELETE /admin/delete` | ADMIN_TOKEN | 按 ids 删除 |
| `DELETE /admin/clear-all` | ADMIN_TOKEN | 清空整个索引（分页查询+批量删） |
| `POST /debug` | 无 | 调试：问题向量化+查询，返回原始 matches |
| `POST /admin/test-query` | ADMIN_TOKEN | 测试多种 query 配置的差异 |
| `GET /network-debug` | 无 | 回显请求头/cf 信息 |
| `GET /widget.js` | 无 | 返回可嵌入前端的聊天 widget（JS 字符串） |

## 环境变量 / 配置（wrangler.toml + .env）

| 变量 | 含义 |
| ---- | ---- |
| `PROVIDER` | `gemini` \| `qwen` |
| `EMBED_DIM` | 向量维度（须与索引一致，本项目 1024） |
| `LLM_MODEL` | 生成模型，如 gemini-2.5-flash / qwen-turbo-latest |
| `GOOGLE_API_KEY` | Gemini 密钥（PROVIDER=gemini 时必需） |
| `QWEN_API_KEY / QWEN_BASE / QWEN_EMBED_MODEL` | Qwen 密钥/端点/embedding 模型 |
| `ADMIN_TOKEN` | /admin/* 鉴权 token |
| `VECTORIZE` 绑定 | wrangler.toml 里 `[[vectorize]]` 定义，index_name = website-rag |
| `WORKER_URL / CONTENT_DIR / BASE_URL` | 摄入脚本用的：Worker 地址 / 文章目录 / 站点根 URL |

## 两条流水线速览

```text
摄入（离线，本地脚本 scripts/ingest.ts）
  content/*.md ─▶ markdownToPlain ─▶ chunkText(800) ─▶ embedding ─▶ POST /admin/upsert ─▶ Vectorize
       (gray-matter 读 frontmatter, 跳过 draft)

查询（在线，Worker /chat）
  message ─▶ embed ─▶ VECTORIZE.query(filter language, topK=8, 500ms 超时→回退)
          ─▶ contexts + sources ─▶ buildPrompt ─▶ llmGenerate ─▶ { answer, sources }
```

## 常用命令

```bash
# 本地起 Worker（开发）
npm run dev

# 部署到 Cloudflare
npm run deploy

# 全量摄入（需 .env 配好 PROVIDER/密钥/WORKER_URL/ADMIN_TOKEN）
npm run ingest

# 只摄入指定文件
npm run manual-ingest content/zh/blog/xxx/index.md

# 生成中英标题字典
npm run generate-titles

# 清空并重建整个索引
npm run full-reindex

# 测试
npm run test:run   # 单元+集成
npm run test:e2e   # Playwright 端到端
```

---

**课程**：[① 全流程概览](/rag/01-rag-pipeline-overview) · [② 摄入流水线](/rag/02-ingestion-pipeline) · [③ 查询流水线](/rag/03-retrieval-generation)
