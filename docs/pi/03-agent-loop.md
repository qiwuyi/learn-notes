---
title: Pi ③ agent-loop 智能体核心循环
---

# agent-loop：智能体核心循环

Pi 专题第三课 · 深入拆解 `packages/agent/src/agent-loop.ts`

::: tip 本课目标
理解"智能体"最核心的机制——**agent loop（智能体循环）**。它是所有 AI 编程助手（Claude Code、Codex、Pi）的心脏：
让 LLM 不是"答一次就完"，而是"想 → 调工具 → 看结果 → 再想"直到完成任务。
:::

## 从一个问题开始

LLM 本身不会用工具。问 GPT："帮我改这个文件"它只能给建议。但 coding agent 能真正改文件。差别在哪？

答案：**agent loop**。它是一个循环：

```text
用户消息
  │
  ▼
① 把整个上下文（系统提示 + 历史 + 工具定义）发给 LLM
  │
  ▼
② LLM 返回：要么直接回答（stopReason: end）
  │        要么请求调用工具（content 里带 toolCall）
  │
  ▼
③ 执行 LLM 要的工具（改文件/跑命令/搜索）
  │
  ▼
④ 把工具结果放回上下文
  │
  └──────────▶ 回到 ①（LLM 看到结果，继续）
```

**LLM 是"大脑"，工具是"手"，循环是"把两者连起来"的机制。**

## Pi 的双层循环设计

Pi 的 `runLoop` 用了**双层 while**（这是它优雅的地方）：

```ts
// 外层循环：继续处理用户后续消息
while (true) {
  // 内层循环：处理工具调用直到本回合完成
  while (hasMoreToolCalls || pendingMessages.length > 0) {
    // 1. 注入待处理消息（用户中途输入、steering）
    for (const msg of pendingMessages) { push(msg) }
    pendingMessages = []

    // 2. 流式调用 LLM → assistant 消息
    const message = await streamAssistantResponse(...)

    // 3. 出错/中止 → 结束
    if (message.stopReason === "error" || "aborted") { end; return }

    // 4. 提取工具调用
    const toolCalls = message.content.filter(c => c.type === "toolCall")

    // 5. 有工具调用 → 执行
    if (toolCalls.length > 0) {
      const results = await executeToolCalls(...)
      pushAll(results)   // 工具结果进上下文
      hasMoreToolCalls = !results.terminate  // 没说要停就继续
    }

    // 6. 回合结束，记录
    lastCompletedTurn = { message, toolResults, ... }
  }

  // 内层退出 = 本回合完成
  // 外层检查：有没有用户跟进消息？
  const followUp = await config.getFollowUpMessages?.()
  if (followUp.length > 0) { pendingMessages = followUp; continue }
  break  // 没有 → 整个 agent 结束
}
```

### 为什么需要两层？

**内层**回答："这个回合要不要继续调工具？"（LLM 一次可以连续调多个工具，或调完再看结果再调）

**外层**回答："这个任务做完后，用户有没有接着说？"（比如 agent 改完文件，用户又输入"再加个测试"）

两者是不同粒度的问题，分开处理代码才清晰。

## 工具调用执行：核心细节

看 `executeToolCalls` 的几个关键设计：

### 1. 顺序 vs 并行

```ts
type ToolExecutionMode = "sequential" | "parallel"
```
- **sequential**：每个工具调用等前一个完成再开始（安全、慢）
- **parallel**：允许的工具同时执行（快，但有副作用冲突风险）
- 默认通常 sequential，某些安全工具可并行

### 2. before/after 钩子（可拦截）

```ts
// 工具执行前（可阻止）
interface BeforeToolCallResult { block?: boolean; reason?: string; terminate?: boolean }
// 工具执行后（可改写结果）
interface AfterToolCallResult { content?: ...; isError?: boolean; terminate?: boolean }
```

这层钩子让上层能实现：权限确认（"要运行 `rm -rf`，先问用户"）、结果改写、错误处理。

### 3. 截断保护

```ts
// stopReason === "length" 表示输出被 token 上限截断，
// 工具参数可能残缺 → 全部失败而不是执行坏调用
const executed = message.stopReason === "length"
  ? await failToolCallsFromTruncatedMessage(toolCalls, emit)
  : await executeToolCalls(...)
```
这是**防御性设计**：宁可不执行，也不执行半截的参数。

## 流式响应与上下文转换

`streamAssistantResponse` 做了三件关键事：

```ts
// ① 可选上下文变换（如 compaction 压缩历史）
if (config.transformContext) messages = await config.transformContext(messages, signal)

// ② 把内部消息格式转成 LLM 能吃的格式
//    AgentMessage[] → Message[]（转换发生在 LLM 调用边界）
const llmMessages = await config.convertToLlm(messages)

// ③ 组装 Context：系统提示 + 消息 + 工具定义
const llmContext = { systemPrompt, messages: llmMessages, tools }
```

**关键设计：内部消息模型和 LLM 消息模型分离**。agent 内部用 `AgentMessage`（可能带额外字段），只在调用 LLM 那一刻 `convertToLlm` 转换。好处：内部状态更丰富，且能适配任何协议的转换。

## StreamFn 抽象（依赖注入）

agent loop 不直接依赖 pi-ai，而是通过 `StreamFn` 接口：

```ts
type StreamFn = (model, context, options) => AssistantMessageEventStream

// 契约：不能 throw；错误要编码成事件 + stopReason:"error" 的最终消息
```

**为什么？** 可测试性。测试时注入一个"假流"（faux provider），不用真的调 LLM 就能测试整个 agent 循环逻辑。这是高质量工程的体现。

## 完整流程图

```text
┌─────────────────────────────────────────────────────────┐
│  外层 while：等待用户后续消息                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 内层 while：处理工具调用                           │  │
│  │                                                   │  │
│  │  注入 pending 消息                                  │  │
│  │  → streamAssistantResponse（转换→调 LLM→事件流）    │  │
│  │  → 提取 toolCalls                                  │  │
│  │  → 执行工具（顺序/并行，before/after 钩子）          │  │
│  │  → 工具结果回上下文                                  │  │
│  │  → 还有工具调用？→ 继续；否则退出内层                 │  │
│  └───────────────────────────────────────────────────┘  │
│  有 follow-up 消息？→ 继续外层；否则结束                  │
└─────────────────────────────────────────────────────────┘
```

## 自测

::: details 测验 · 点击展开

**1. agent loop 的本质是什么？**
- ✅ **LLM 思考 → 调工具 → 看结果 → 再思考 的循环机制**
- ❌ 让 LLM 一次回答所有问题
- ❌ 缓存 LLM 输出
- ❌ 并发调用多个 LLM

**2. Pi 双层循环各自回答什么问题？**
- ✅ **内层：本回合还调不调工具；外层：用户有没有继续说**
- ❌ 内层管网络，外层管数据库
- ❌ 两层都一样
- ❌ 内层处理消息，外层处理工具

**3. stopReason === "length" 时 Pi 会怎么做？**
- ✅ **工具参数可能被截断，全部失败而不是执行坏调用**
- ❌ 直接执行所有工具
- ❌ 重试一次
- ❌ 忽略继续

**4. 为什么用 StreamFn 接口而不是直接依赖 pi-ai？**
- ✅ **可测试性：注入假流即可测试整个循环，无需真调 LLM**
- ❌ 因为 pi-ai 不好用
- ❌ 因为要支持多语言
- ❌ 没有原因

**5. 内部消息（AgentMessage）和 LLM 消息（Message）分离的意义是？**
- ✅ **内部可带丰富状态，只在 LLM 边界转换，适配任何协议**
- ❌ 更浪费内存
- ❌ 让代码更难读
- ❌ 没有意义

:::

## 小结

- agent loop = **想 → 调工具 → 看结果 → 再想** 的循环，coding agent 的心脏
- Pi 用**双层 while**：内层管工具调用，外层管用户跟进
- 关键细节：顺序/并行执行、before/after 钩子、截断保护、上下文转换
- **StreamFn 依赖注入**让循环可脱离真实 LLM 测试

---

**推荐阅读**：Pi 源码 `packages/agent/src/agent-loop.ts`（核心）· `packages/agent/src/types.ts`（类型契约）

**下一课**：[④ AgentHarness：会话/工具/压缩](/pi/04-agent-harness)
