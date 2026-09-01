---
title: Pi ⑦ 用 Pi 构建 RAG 应用
---

# 用 Pi 构建 RAG 应用

Pi 专题第七课 · RAG × Pi 串联实战

::: tip 本课目标
两个专题在这里汇合：**RAG 专题**学了检索增强生成的原理，**Pi 专题**学了统一 LLM API 和 agent 运行时。
这一课把它们接起来：用 Pi 的组件，从零搭一个"能检索 + 能回答 + 带工具"的 RAG 应用，并对比 rag-chatbot-fork 的架构差异。
:::

## 先回顾两边的"零件"

```text
RAG 专题（rag-chatbot-fork）          Pi 专题（earendil-works/pi）
├─ chunk：切分文档                     ├─ pi-ai：统一调各家 LLM
├─ embedding：向量化                   ├─ agent loop：智能体循环
├─ retriever：向量检索                 ├─ harness：工具/会话
├─ prompt：组装提示词                  └─ tui / coding-agent：产品壳
└─ llm：调 LLM 生成                   
```

**关键观察**：rag-chatbot-fork 是一个"**手工拼装的朴素 RAG**"——每步都是显式代码。
Pi 提供的是"**可组合的积木**"——你用它的积木拼，少写很多胶水代码，还能免费获得工具调用、流式、多模型。

## 设计：把 RAG 变成 Agent 的工具

朴素 RAG 是"检索 + 生成"两段式。用 Pi 的思路，更优雅的做法是 **RAG-as-a-Tool**：

```text
用户问："告诉我 sidecar 的最新文档怎么说"

朴素 RAG：                       RAG-as-Tool（Agent）：
  1. 向量化问题                    1. LLM 想：这需要检索知识库
  2. 检索 topK                    2. 调用 search_kb 工具
  3. 拼提示词                    3. 工具返回检索结果
  4. LLM 生成                     4. LLM 基于结果回答
                                  （不够还可以再搜、用别的工具）
```

**为什么 RAG-as-Tool 更强？**
- LLM 可以**自己决定**要不要检索（问"你是谁"就不检索）
- 检索一次不够可以**检索多次**（多关键词）
- 检索可以和其他工具**组合**（搜知识库 + 查数据库 + 读文件）

## 实现：三个模块

### 1. 用 pi-ai 做统一 LLM + embedding 调用

```ts
import { Models, openaiProvider, deepseekProvider, qwenTokenPlanProvider } from "@earendil-works/pi-ai"

// 统一模型集合：想换哪个换哪个
const models = new Models()
  .addProvider(openaiProvider())
  .addProvider(deepseekProvider())      // 便宜
  .addProvider(qwenTokenPlanProvider()) // 中文强

const model = models.getModel("deepseek-chat")
```

对比 rag-chatbot-fork：它手写 `PROVIDER === 'gemini' ? ... : ...` 两个分支；
Pi 里 30+ 家厂商都已经适配好，换模型 = 换一个 model id。

### 2. 检索工具（复用 RAG 专题的知识）

把 rag-chatbot-fork 的检索逻辑打包成一个 **Pi 工具**：

```ts
import type { Tool } from "@earendil-works/pi-ai"
import { Type } from "typebox"

// 工具定义：schema 描述参数（TypeBox，JSON Schema）
export const searchKnowledgeBase: Tool = {
  name: "search_kb",
  description: "Search the team knowledge base for relevant content",
  parameters: Type.Object({
    query: Type.String(),     // 检索关键词
    topK: Type.Number({ default: 5 }),
  }),
}

// 工具执行：embedding + 向量检索（复用 RAG 专题的全部知识）
async function runSearchKb(args: { query: string; topK: number }) {
  const qvec = await embed(args.query)                    // ① 向量化
  const matches = await vectorStore.query(qvec, args.topK) // ② 检索（可加 B3 的 hybrid/rerank）
  return matches.map(m => m.text).join("\n---\n")         // ③ 返回上下文
}
```

**对照 RAG 专题**：这里的 `embed` / `query` 正是 B1-B3 学的 chunking、embedding 选型、检索优化——知识完全复用。

### 3. 用 agent loop 串起来

```ts
import { agentLoop } from "@earendil-works/pi-agent"

const stream = agentLoop(
  [{ role: "user", content: "sidecar 最新文档怎么说？" }],   // 用户消息
  {
    systemPrompt: "你是知识库助手，回答必须基于 search_kb 的结果。",
    messages: [],
    tools: [searchKnowledgeBase],   // ← RAG 变成 agent 的工具
  },
  config,
  undefined,   // abort signal
  streamFn,    // Models.streamSimple 满足
)

// 事件流里能看到完整过程：
// agent_start → message(user) → turn → toolCall(search_kb)
// → toolResult → 继续生成 → agent_end
for await (const event of stream) { /* 渲染事件 */ }
```

**这就是"agentic RAG"（B5 的 Agentic RAG 模式）**——从"两段式"升级成"智能体自主检索"。

## 对比：rag-chatbot-fork vs Pi 构建的 RAG

| 维度 | rag-chatbot-fork | 用 Pi 构建 |
| ---- | ---------------- | ---------- |
| LLM 接入 | 手写 gemini/qwen 两分支 | 30+ 厂商统一接入 |
| 检索 | 硬编码在 /chat 流程里 | 封装成工具，agent 自主调用 |
| 多轮检索 | 不支持 | 天然支持（agent loop） |
| 流式 | 自写事件 | pi-ai 事件流 |
| 多语言降级 | 手写 titleDictionary | 模型自带多语言 |
| 工具扩展 | 无 | 加一个 Tool 定义即可 |
| 部署 | Cloudflare Worker | Node/Bun 任意环境 |

**结论**：rag-chatbot-fork 适合"单一固定流程"（博客问答机器人）；Pi 适合"灵活、会演化、要多种能力"的应用。
前者是**专器**，后者是**通用积木**。

## 更进一步的组合拳

- **B3 Hybrid Search** → 在 `runSearchKb` 里加 BM25 + RRF 融合
- **B4 评估** → 用 ragas 评估这个 agent 的检索质量
- **⑥ TUI** → 用 pi-tui 给 RAG 应用做终端界面（滚动知识库结果、流式回答）
- **⑤ coding-agent** → 把 RAG 工具装进 coding agent，让它编程时也能查你的知识库

## 动手练习

```text
任务：给 rag-chatbot-fork 加"自主多轮检索"
目标：问题复杂时 agent 自己决定检索几次、每次用什么关键词

步骤：
1. 定义 search_kb 工具（schema + 执行）
2. 用 pi-ai 换掉手写 provider 分支
3. 用 agentLoop 替换 /chat 的固定四步
4. 观察事件流里 toolCall 的出现次数
```

## 自测

::: details 测验 · 点击展开

**1. "RAG-as-Tool"相比朴素 RAG 的核心优势是？**
- ✅ **LLM 自主决定是否检索、检索几次，且可与其他工具组合**
- ❌ 更快
- ❌ 不需要向量库
- ❌ 更便宜

**2. 用 Pi 构建 RAG，embedding/检索的知识来自哪里？**
- ✅ **复用 RAG 专题 B1-B3 的内容（chunking、选型、hybrid/rerank）**
- ❌ 完全重新发明
- ❌ Pi 内置了向量库
- ❌ 不需要 embedding

**3. pi-ai 相比 rag-chatbot-fork 手写 provider 的优势是？**
- ✅ **30+ 厂商已适配，换模型 = 换 id，不用改代码**
- ❌ 更快
- ❌ 免费
- ❌ 没有区别

**4. agent loop 让 RAG 获得什么新能力？**
- ✅ **多轮自主检索、工具组合、流式事件**
- ❌ 更长的答案
- ❌ 更多参数
- ❌ 更小的上下文

**5. rag-chatbot-fork 和 Pi 的关系，最准确的说法是？**
- ✅ **前者是专器（固定流程），后者是通用积木（可组合）**
- ❌ 完全一样
- ❌ 前者更好
- ❌ 两者互斥不能一起用

:::

## 小结

- RAG × Pi 的化学反应：**把 RAG 封装成 agent 工具**（RAG-as-Tool）
- 三个模块：pi-ai（统一 LLM）+ 检索工具（复用 B 系列知识）+ agentLoop（自主调用）
- 本质是 B5 的 **Agentic RAG** 落地
- rag-chatbot-fork 是"专器"，Pi 是"积木"——不同场景不同选择

---

**推荐阅读**：Pi 文档 [Tools](https://pi.dev/docs/latest) · RAG 专题 [B5 高级 RAG 模式](/rag/b5-advanced-rag-patterns)

**返回**：[Pi 专题首页](/pi/) ｜ [RAG 专题首页](/rag/)
