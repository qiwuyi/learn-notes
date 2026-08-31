---
title: ② 摄入流水线
---

# 摄入流水线：从 Markdown 到向量库

第二课 · 核心文件：`scripts/ingest.ts` · `src/rag/chunk.ts` · `src/utils/md.ts`

## 摄入要解决什么

向量检索的输入输出是：`一段文字 ↔ 一个向量`。但一篇 Markdown 文章可能几千字，直接整篇向量化有两个问题：

1. **粒度太粗**——一篇文章往往讲多个主题，用户只问其中一段，整篇向量会让"不相关"的部分拖累检索相关性
2. **超出 embedding 模型上限**——embedding 模型有最大输入长度，长文必须切小

::: tip 摄入的本质
把"一篇文章"变成"一批 (向量 + 原文 + 元数据) 的条目"，存进向量库。之后每次用户提问，就能精确地捞回最相关的那一小段，而不是整篇文章。
:::

## 第一步：Markdown → 纯文本（md.ts）

这个项目很妙的一点：Markdown 的 `#`、`**`、链接等语法，embedding 模型处理不好。所以先转成干净的纯文本。

```ts
// src/utils/md.ts
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

export function markdownToPlain(mdContent: string): string {
  const html = md.render(mdContent);
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')   // 去掉样式
    .replace(/<script[\s\S]*?<\/script>/g, ' ')  // 去掉脚本
    .replace(/<[^>]+>/g, ' ')                    // 去掉所有标签
    .replace(/&nbsp;|&amp;|&lt;|&gt;/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')   // 压缩空白
    .replace(/\n+/g, '\n')
    .trim();
}
```

思路：**先用 MarkdownIt 渲染成 HTML，再粗暴地剥掉标签**。注释里作者自己都写了 "crudely"，说明这是个够用就行的方案。

::: warning 易错点
Markdown 里 `<code>X</code>` 转成 HTML 后是 `<code>` 标签，剥标签时会把代码内容也留下（这是想要的行为）。
但转义实体（`&amp;` 等）要单独处理，否则"&" 会变成乱码——所以有一行专门 replace 实体。
:::

## 第二步：切分成 chunk（chunk.ts）

这是全项目最有"中文特色"的地方。`chunkText` 分两级切：

```ts
// src/rag/chunk.ts
export function chunkText(input: string, maxLen = 800): string[] {
  // 第一级：按 Markdown 标题切（##、###…）
  const sections = input
    .split(/^#{1,6}\s+/m)   // 匹配行首的 1~6 个 # 加空格
    .map(s => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  const pushChunk = (s: string) => { if (s.trim()) chunks.push(s.trim()); };

  for (const sec of sections.length ? sections : [input]) {
    if (sec.length <= maxLen) { pushChunk(sec); continue; }

    // 第二级：超长的节，按中文句号/问号/感叹号/分号切，尽量保持句子完整
    let buf = '';
    for (const part of sec.split(/(?<=[。！？!?；;]\s*)/)) {
      if ((buf + part).length > maxLen) {
        pushChunk(buf); buf = part;
      } else {
        buf += part;
      }
    }
    pushChunk(buf);
  }
  return chunks;
}
```

两个设计决策值得记住：

1. **先按标题切**：Markdown 标题天然是"语义分界"——一个 `##` 下的内容通常是同一主题，直接作为一个候选 chunk 单元。
2. **再按中文标点切长段**：`(?<=...)` 是**后行断言**（lookbehind），表示"在句号/问号/感叹号/分号*后面*切开，但不消费这个标点"。这样 chunk 边界落在句子之间，不会把一句话劈成两半——对中文尤其重要（中文没有空格分词）。

::: tip 为什么 chunk 大小是 800？
`maxLen = 800` 字符（约 800 个中文字）是经验值：太大 → 检索粒度粗、含太多噪声；太小 → 上下文被切成碎片，语义不完整。
800 也符合大多数 embedding 模型的输入上限。后面 `retriever` 里存库时还把 text 截断到 500 字符，是给"塞进提示词"留余量。
:::

## 第三步：向量化（embeddings.ts）

每个 chunk 都要变成向量。这个仓库支持两个 provider，它们的 **API 差异决定了摄入性能的巨大差别**：

| | Gemini | Qwen (DashScope) |
| - | ------ | ---------------- |
| 模型 | `text-embedding-004` | `text-embedding-v2/v4` |
| 批量 | **不支持**，一条一条请求 | **支持**，一批最多 10 条 |
| 维度控制 | 请求里指定 `outputDimensionality` | 返回后 `slice(0, dim)` 截断/补零 |

```ts
// ingest.ts 里的批处理封装
async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (PROVIDER === 'gemini') {
    // Gemini 不支持批量：逐个请求
    for (const text of texts) { ... 每次一个 fetch ... }
  } else {
    // Qwen 支持批量：一次请求传整个数组
    const r = await fetch(url, {
      body: JSON.stringify({ model: QWEN_EMBED_MODEL, input: texts }),
      ...
    });
    return j.data.map(d => d.embedding.slice(0, EMBED_DIM));
  }
}
```

::: warning 为什么 EMBED_DIM 一定要一致？
Vectorize 索引创建时就固定了维度（这个项目是 1024）。`EMBED_DIM = 1024` 在 `wrangler.toml` 里配好。
写入时 /admin/upsert 会校验 `vector.length === EMBED_DIM`，不一致直接报错。所以代码里 `slice(0, dim)` 截断、`fill(0)` 补零，都是为了让维度严格对齐。
:::

## 第四步：写进向量库（/admin/upsert）

摄入脚本是本地程序，不直接碰 Vectorize。它把条目打包 `POST` 给 Worker：

```ts
// ingest.ts — 组装一条 entry
items.push({
  id: generateShortId(baseUrl, sourcePath, i + j),  // 短 ID，带 chunk 序号
  vector: finalVector,           // 向量（严格 1024 维）
  text:   text.slice(0, 500),    // 原文（截断，检索后塞进提示词用）
  title:  title,                 // 文章标题
  source: sourcePath,            // 相对路径，如 zh/blog/xxx/index.md
  url:    baseUrl,               // 生成的网页 URL
  language: language             // 'zh' | 'en' ← 这是检索过滤的关键字段！
});
```

注意这个 `language` 字段——它被写进了 **metadata**，下一课你会看到它在检索时有多重要（语言过滤就靠它）。

Worker 端 `/admin/upsert` 做三件事：

1. **校验权限**：请求头必须带 `Authorization: Bearer ${ADMIN_TOKEN}`，否则 401
2. **校验维度**：每个 vector 长度必须是 EMBED_DIM，否则 500
3. **写入**：把 `{id, values, metadata}` 交给 `env.VECTORIZE.upsert()`

## 性能设计：为什么这么快

ingest 脚本注释写着 "Ultra-fast batch ingest"。它用了四层并发，值得学：

```ts
const MAX_CONCURRENT_FILES      = PROVIDER === 'gemini' ? 30 : 15;  // 同时处理多少文件
const MAX_CONCURRENT_EMBEDDINGS = PROVIDER === 'gemini' ? 50 : 25;  // embedding 并发
const UPLOAD_BATCH_SIZE         = 300;                               // 每次上传多少条
const EMBEDDING_BATCH_SIZE      = PROVIDER === 'gemini' ? 1 : 10;   // 每次 embedding 几条
```

- **文件级并发**：一批 15~30 个文件同时处理（`Promise.allSettled`）
- **批量上传**：攒够 300 条一次 `POST`，减少 HTTP 往返
- **容错**：单文件失败不影响整体（`allSettled` + 内部 try/catch），上传失败会把条目放回队列重试
- **限速**：批间加 5~50ms 小延迟，防止把 API 打爆

::: info 中英双语去重逻辑
ingest 默认只收 `zh/blog/**/index.md` 和 `en/blog/**/index.md`。
对同一篇博客（同一 post path），**优先用中文版**，英文版只有中文不存在时才入库——这是为了控制知识库体积，避免双语重复内容都进索引。
:::

## 测验

::: details 测验 · 点击展开（共 5 题）

**1. markdownToPlain 为什么先渲染成 HTML 再剥标签？**

- ❌ 为了保留 Markdown 语法给模型看（embedding 要纯文本）
- ✅ **复用现成解析器，再剥标签得纯文本**（借 MarkdownIt 统一处理语法，省去手写解析）
- ❌ HTML 比 Markdown 更适合 embedding（正好相反，HTML 标签是噪声）
- ❌ 直接字符串替换掉 # 号和星号（它实际是转成 HTML 再剥标签）

**2. chunkText 里的 `(?<=...)` 是什么？**

- ❌ 先行断言，匹配标点之前的位置（正相反，是后行断言）
- ✅ **后行断言，在标点后切且不吞掉标点**（句子边界不破坏）
- ❌ 一个把字符串变数组的函数（它是正则）
- ❌ 用来匹配 URL 的正则片段（它切的是标点边界）

**3. Gemini 和 Qwen 在 embedding 上最大的区别是？**

- ❌ Gemini 批量嵌入，Qwen 逐个请求（恰恰相反）
- ❌ Gemini 用 768 维，Qwen 用 1024 维（维度都要对齐 EMBED_DIM）
- ✅ **Gemini 不支持批量，Qwen 支持批量**（所以并发策略不同）
- ❌ 两者都支持批量，只是价格不同（Gemini 确实不支持批量）

**4. /admin/upsert 校验向量维度失败会怎样？**

- ❌ 返回 401 Unauthorized（那是权限校验，维度错是 500）
- ❌ 自动截断到正确维度再入库（不会自动截断，直接抛错）
- ✅ **抛错返回 500，拒绝写入**（避免脏数据进索引）
- ❌ 照常写入并记日志（会直接抛错）

**5. 同一篇博客中英双语都有时，ingest 默认怎么处理？**

- ❌ 英文版优先，中文丢弃（正好相反）
- ✅ **优先中文版，英文仅中文缺失时入库**（控制知识库体积）
- ❌ 中英两个版本都完整入库（有去重逻辑）
- ❌ 两者都入库，检索时再去重（去重发生在摄入时）

:::

## 本课小结

- 摄入四步：**纯文本 → 切 chunk → 向量化 → 写入索引**，全部离线批量做
- 中文 chunking 的巧思：先按标题切语义块，再用后行断言按中文标点保句切分
- 向量维度必须与索引一致（EMBED_DIM），不一致会被 /admin/upsert 拒绝
- provider 差异（Gemini 不批量 vs Qwen 批量）直接决定并发与速度

---

**推荐阅读**：[Cloudflare Vectorize — Get started](https://developers.cloudflare.com/vectorize/get-started/)

**继续学习**：[③ 查询流水线：/chat 的完整旅程](/rag/03-retrieval-generation) ｜ [RAG 速查表](/rag/glossary)
