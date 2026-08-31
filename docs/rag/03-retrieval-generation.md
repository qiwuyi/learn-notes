---
title: ③ 查询流水线
---

# 查询流水线：/chat 的完整旅程

第三课 · 核心文件：`src/worker.ts` · `src/rag/retriever.ts` · `src/rag/prompt.ts` · `src/providers/llm.ts`

## 一次 /chat 请求的完整旅程

用户在前端 widget 输入一句话，浏览器向 Worker 发 `POST /chat`。这是整个系统的"心脏"，一共四步：

```text
POST /chat  body: { message, history, language }

   ① 问题向量化         ② 检索(带语言过滤)         ③ 组装提示词           ④ 生成回答
   message ──embed──▶ qv ──VECTORIZE.query──▶ contexts  ──buildPrompt──▶ prompt ──llmGenerate──▶ answer
                                 sources     + sources
                                                          │
                                   ┌───────────────────────┘
                                   ▼
                        返回 { answer, sources }   ← 前端把 sources 展示成"参考资料"
```

注意 `worker.ts` 里 /chat 处理的骨架：

```ts
// src/worker.ts （节选）
if (req.method === 'POST' && url.pathname === '/chat') {
  const { message, history = [], language = 'zh' } = await req.json();

  const embedder = createEmbedder(env);

  // ① 只对当前这条消息做向量检索（历史不参与检索，避免干扰）
  const [qv] = await embedder.embed([message], Number(env.EMBED_DIM));

  // ② 检索 topK=8，带语言过滤
  const { contexts, sources } = await getRelevantDocuments(env, qv, 8, language);

  // ③ 问题 + 检索结果 + 历史 拼成提示词
  const prompt = buildPrompt(message, contexts, history, language);

  // ④ 调 LLM 生成
  const answer = await llmGenerate(env, prompt);

  return new Response(JSON.stringify({ answer, sources }), ...);
}
```

## 第一步：把问题变成向量

问题和文档 chunk 用的是**同一个 embedding 模型、同一个维度**——否则向量不在同一空间，距离没有意义。

```ts
const [qv] = await embedder.embed([message], Number(env.EMBED_DIM));
// qv 就是问题的向量，比如 [-0.012, 0.087, ..., 0.003] 共 1024 个数
```

::: info 设计细节：为什么历史不参与检索？
代码注释写得很清楚：*For vector retrieval, use only the current message to avoid history interference.*
如果带着"上一条说了什么"去检索，问题向量会被历史"污染"，搜出来的可能不是针对当前问题的内容。
历史的处理方式是：只进提示词（见第三步），不进检索。
:::

## 第二步：检索 + 语言过滤（retriever.ts）

这是全项目最复杂的一个文件，也是"多语言 RAG"的精华。核心逻辑分三层：

### 2.1 先带语言过滤查询，超时/无结果就回退

```ts
// ① 先尝试带 language metadata filter 的查询
const queryWithFilter = env.VECTORIZE.query(qvec, {
  topK: k, returnValues: false, returnMetadata: 'all',
  filter: { metadata: { language: currentLang } }   // 只搜当前语言的条目
});

// ② 500ms 超时保护
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Language filter timeout')), 500));

queryRes = await Promise.race([queryWithFilter, timeoutPromise]);

// ③ 没结果 → 抛错 → 走回退：不带过滤再查一次
} catch (error) {
  queryRes = await env.VECTORIZE.query(qvec, { topK: k, ... });  // 无 filter
}
```

::: tip 为什么有回退？
如果某个语言的内容在库里几乎没有条目，带 filter 的查询可能返回 0 条，用户就什么都拿不到。
所以策略是：**先精确（带过滤）→ 失败/超时 → 再宽松（不带过滤）→ 事后在代码里再过滤**。
用 `Promise.race` 给 filter 查询加 500ms 超时，是防止 Vectorize 的 metadata filter 在某些情况变慢拖垮整个请求。
:::

### 2.2 回退后的事后语言过滤

回退查询拿回来的是混合语言的 topK 结果，需要在内存里再筛一遍（按 URL 是否含 `/en/` 判断）：

```ts
// 英文用户：优先找 /en/ 内容，没有才退回中文（URL 稍后转换）
if (currentLang === 'en') {
  const englishResults = results.filter(r => r.metadata.url.includes('/en/'));
  return englishResults.length > 0
    ? results.filter(r => r.metadata.url.includes('/en/'))
    : results.filter(r => !r.metadata.url.includes('/en/'));
}
// 中文用户：排除 /en/ 即可
return results.filter(r => !r.metadata.url.includes('/en/'));
```

### 2.3 组装上下文和来源

```ts
// contexts：把所有命中文本用分隔符连成一长串，塞进提示词
const contexts = metadataResults
  .map(v => v.metadata.text)
  .filter(text => text && text.length > 0)
  .join('\n---\n');

// sources：为每个命中生成 { id, url, title, source }，并做 URL 语言转换
// （中文文章被英文用户问到，URL 自动换成 /en/ 版本，标题用 titleDictionary 翻译）
const sources = ... .map(...).filter(...);

// 按 URL 去重
const uniqueSources = dedupeByUrl(sources);
```

::: info 多语言出处的巧思
如果一个英文用户搜到了中文内容，代码会用 `titleDictionary`（脚本预生成的中→英标题表）把标题翻译成英文，
并把 URL 从 `/blog/xxx/` 转成 `/en/blog/xxx/`——让用户点开的是英文版文章。这是"内容没有英文版时的优雅降级"。
:::

## 第三步：组装提示词（prompt.ts）

提示词 = **角色设定 + 检索到的上下文 + 对话历史 + 当前问题 + 输出约束**，按语言（zh/en）各有一套文案。

```ts
// 中文版提示词结构（英文版对应）：
[
  '你是一名 AI 助手，擅长云原生技术、技术写作和开源…',   // 角色
  '你的个性和风格：…',                                  // 风格
  '回答指导原则：…',                                   // 准则
  '--- 博客内容 ---',
  contexts || '（空）',                               // ② 检索结果
  '--- 对话历史 ---',                                  // ③ 最近 3 轮
  '用户: …\n助手: …',
  '--- 问题 ---',
  question,                                           // ④ 当前问题
  '请基于知识库片段提供简洁而有针对性的回答…'
  '重要：请不要在回答中包含任何来源链接…'              // ⑤ 输出约束
]
```

::: warning 一个关键约束：回答里不许带来源链接
提示词明确要求 LLM **不要在回答里写 URL/路径**，因为**来源由系统单独返回**（`sources` 字段），
前端会把它渲染成"参考资料"列表。这样 LLM 不会编造链接，来源永远来自真实的检索结果。
:::

## 第四步：LLM 生成回答

`llmGenerate` 和 embedding 一样支持 Gemini / Qwen 双 provider：

```ts
// Gemini：generateContent，单轮文本
POST https://generativelanguage.googleapis.com/...:generateContent
body: { contents: [{ parts: [{ text: prompt }] }] }
→ j.candidates[0].content.parts.map(p => p.text).join('')

// Qwen：chat/completions（OpenAI 兼容格式）
POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
body: { model: 'qwen-plus', messages: [{role:'system',...},{role:'user',content:prompt}] }
→ j.choices[0].message.content
```

注意 Qwen 用的是 OpenAI 兼容的 `/chat/completions`，而 Gemini 用自家的 `/generateContent`——接口形态不同，但都被这个文件统一成了同一个 `llmGenerate(env, prompt): string` 签名。这就是"抽象"：上层 /chat 根本不关心背后是哪个模型。

::: info 为什么 /chat 不带鉴权而 /admin/* 带？
`/admin/upsert`、`/admin/delete` 等会改动知识库，必须用 `ADMIN_TOKEN` 保护；
`/chat` 是公开只读接口（谁都能问），所以直接开放，靠 CORS 头限制浏览器来源。
:::

## 测验

::: details 测验 · 点击展开（共 5 题）

**1. 检索时为什么只用当前这条消息、不用对话历史？**

- ❌ 因为对话历史没有向量
- ✅ **避免历史污染检索，历史只进提示词**（历史会污染问题向量）
- ❌ 因为历史存在另一个数据库
- ❌ 因为 Vectorize 不支持多条查询（是设计选择）

**2. 带语言过滤的检索超时或返回空时，代码怎么办？**

- ❌ 直接给用户返回"找不到资料"（正相反，会回退）
- ❌ 原地重试同一条带过滤的查询
- ✅ **回退到不带过滤的查询，事后内存过滤**（Promise.race 500ms 超时或空结果触发）
- ❌ 继续等待直到有结果为止（超时会立即回退）

**3. sources（参考资料）是怎么来的？**

- ❌ 由 LLM 在回答末尾自动生成（提示词要求 LLM 不写链接）
- ✅ **从检索命中的 metadata 构造并返回**（url/title/source，不经过 LLM）
- ❌ 前端根据回答内容现猜 URL
- ❌ 是检索命中的 id 列表，没有标题（metadata 里有 url/title）

**4. 英文用户问到只有中文的文章时，代码会做什么？**

- ❌ 直接丢弃该结果，不给任何来源（有降级策略）
- ✅ **翻译标题并转换 URL 为 /en/ 版本**（用 titleDictionary，让用户看到英文版页面）
- ❌ 现场调用翻译 API 把整篇文章译成英文（只处理标题和 URL）
- ❌ 重新摄入一篇英文版再检索

**5. 为什么 /chat 公开而 /admin/* 要鉴权？**

- ❌ 两者都是公开的，靠 CORS 防滥用
- ✅ **/chat 只读公开；/admin/* 改动库须鉴权**（用 ADMIN_TOKEN）
- ❌ /chat 也要传 ADMIN_TOKEN 才能用（相反）
- ❌ admin 用 API key 而非 Bearer 头鉴权（admin 用 Bearer ADMIN_TOKEN）

:::

## 本课小结

- /chat 四步：**问题向量化 → 检索+语言过滤 → 组装提示词 → LLM 生成**
- 检索策略：先带 language filter，失败/超时（500ms）则回退无过滤查询 + 内存事后过滤
- 提示词包含：角色 + 上下文 + 历史 + 问题 + "不许写来源"约束；来源由系统单独返回
- 多语言降级：titleDictionary 翻译标题 + URL 转 /en/，让中文内容对英文用户仍可用

---

**推荐阅读**：[Vectorize metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/)

**回到**：[① 全流程概览](/rag/01-rag-pipeline-overview) ｜ [RAG 速查表](/rag/glossary)
