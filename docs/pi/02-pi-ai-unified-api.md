---
title: Pi ② pi-ai 统一 LLM API
---

# pi-ai：统一 LLM API 设计

Pi 专题第二课 · 深入拆解 `packages/ai`

::: tip 本课目标
这是 Pi 最值得读的一层。学完你能理解：**怎么把 30+ 家 LLM 厂商的 API 统一成一个优雅的接口**——这是所有 LLM 应用框架（LangChain、Vercel AI SDK、Pi）都要解决的经典问题。
:::

## 要解决的问题

每家 LLM 厂商的 API 都不一样：

```text
OpenAI:   POST /v1/chat/completions   body: { model, messages }
Anthropic: POST /v1/messages          body: { model, messages, max_tokens }
Google:   POST /v1beta/...:generateContent  body: { contents }
DeepSeek: POST /v1/chat/completions   body: { model, messages }  ← OpenAI 兼容
Qwen:     POST /compatible-mode/v1/chat/completions              ← OpenAI 兼容
```

如果应用直接调厂商 API，换模型 = 改代码。**统一层要解决**：
1. 把各家请求/响应格式映射成统一类型
2. 让"换厂商"变成"换一个配置"
3. 同时保留各家特有能力（思考模式、tool calling、图片等）

## 核心抽象：Api / Provider / Model

Pi 用三个概念分层解耦：

```ts
// ① Api —— 协议类型（字符串字面量联合）
type KnownApi =
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "bedrock-converse-stream"
  | "pi-messages"
  // ...

// ② Provider —— 厂商适配单元
interface Provider<TApi extends Api> {
  readonly id: string        // "openai" | "deepseek" | "qwen-token-plan"...
  readonly name: string
  readonly auth: ProviderAuth  // apiKey 或 oauth
  getModels(): readonly Model<TApi>[]
  // ...
}

// ③ Model —— 一个具体模型
interface Model<TApi extends Api> {
  id: string                  // "gpt-4o" / "deepseek-chat"
  provider: string            // 属于哪个 provider
  api: TApi                   // 用什么协议调用
  contextWindow: number
  // 成本、能力、图像支持...
}
```

**为什么 `api` 单独成一个维度？** 因为"厂商"和"协议"不是一一对应的：

```text
OpenAI 用 "openai-responses" 协议
DeepSeek 也用 "openai-completions" 协议（兼容 OpenAI）
OpenRouter 聚合多家，也用 OpenAI 兼容协议
Google 用自己的 "google-generative-ai" 协议
```

所以：**协议（api）是可复用的，厂商（provider）声明自己用哪些协议**。这就避免了"每个厂商一套代码"的爆炸。

## Provider 的实际数量：30+ 家

Pi 的 `providers/` 目录（这是它最强的卖点）：

```text
OpenAI / Anthropic / Google / Google Vertex / Azure OpenAI
Amazon Bedrock / Mistral / Groq / Cerebras / NVIDIA
OpenRouter / Vercel AI Gateway / Cloudflare Workers AI / AI Gateway
DeepSeek / Qwen (通义) / MoonshotAI (Kimi) / MiniMax / Xiaomi (小米)
ZAI (智谱) / xAI / HuggingFace / Fireworks / Together / Baseten
OpenCode / Radius / ant-ling / kimi-coding / ...
```

注意有大量**中国厂商**：DeepSeek、Qwen、MoonshotAI、MiniMax、Xiaomi、ZAI。每个 provider 通常配一个 `xxx.models.ts`（模型目录，自动生成）和 `xxx.ts`（适配实现）。

## 请求-响应流：流式是关键

LLM 调用几乎都要**流式（stream）**。Pi 的统一设计里：

```ts
// 统一流式选项
interface SimpleStreamOptions {
  signal?: AbortSignal      // 取消
  temperature?: number
  maxTokens?: number
  thinkingLevel?: ThinkingLevel  // "off"|"low"|"medium"|"high"...
  // ...
}

// 统一的流式返回：事件流
type AssistantMessageEventStream = AsyncIterable<AssistantMessageEvent>

// 事件包括：
//   text / text-delta（增量文本）
//   toolCall / toolCall-delta
//   thinking-delta（思考过程）
//   usage（token 统计）
//   done（结束，携带完整 AssistantMessage）
```

**为什么事件流而不是直接返回字符串？** 因为 agent 需要：
- 边生成边把文本推给用户（打字机效果）
- 中途拿到 tool call 就停下执行工具
- 实时看到 thinking / usage

## 认证：auth 抽象

每家认证方式也不同（API key、OAuth、AWS SigV4…）。Pi 抽象成 `ProviderAuth`：

```ts
interface ProviderAuth {
  // 支持 apiKey 或 oauth（或两者）
  apiKey?: AuthApiKey
  oauth?: AuthOAuth
}
```

支持**多来源解析**：环境变量、配置文件、OAuth 设备流、AWS 配置文件等，`resolveProviderAuth` 统一解析。

## 代码走读：一个 Provider 长什么样

看一个最简 provider（`faux.ts`，测试用假 provider）就能理解结构：

```ts
export function fauxProvider(): Provider<"pi-messages"> {
  return {
    id: "faux",
    name: "Faux",
    auth: { apiKey: { resolve: () => ({ status: "unconfigured" }) } },
    getModels() { return FAUX_MODELS },  // 静态模型列表
    // stream 实现在 api/ 下
  }
}
```

真实 provider（如 deepseek）只是：
1. 定义 `auth`（读 `DEEPSEEK_API_KEY` 环境变量）
2. 声明 `api: "openai-completions"`（复用 OpenAI 兼容协议！）
3. 给模型目录 + baseUrl

**这就是统一层的威力**：DeepSeek 适配可能只有几十行，因为请求格式是 OpenAI 兼容的，直接复用。

## 自测

::: details 测验 · 点击展开

**1. Pi 用哪三个概念分层解耦 LLM 厂商？**
- ✅ **Api（协议）/ Provider（厂商）/ Model（模型）**
- ❌ Controller / Service / DAO
- ❌ 客户端 / 服务端 / 数据库
- ❌ 输入 / 输出 / 缓存

**2. 为什么 DeepSeek 的适配代码很少？**
- ✅ **它用 OpenAI 兼容协议，直接复用 "openai-completions" 的请求实现**
- ❌ 因为它是开源模型
- ❌ 因为它没有 API
- ❌ 因为 Pi 不支持它

**3. 统一层为什么用"事件流"而不是直接返回字符串？**
- ✅ **agent 需要流式文本、中途工具调用、实时 thinking/usage**
- ❌ 因为字符串太短
- ❌ 因为事件流更快
- ❌ 因为厂商要求

**4. ProviderAuth 抽象解决什么？**
- ✅ **各家认证方式不同（API key / OAuth / SigV4…），统一解析**
- ❌ 加密模型参数
- ❌ 存储聊天记录
- ❌ 计算 token 费用

**5. "厂商"和"协议"的关系是？**
- ✅ **不是一一对应：多厂商可共享同一协议（如 OpenAI 兼容）**
- ❌ 一个厂商只能一个协议
- ❌ 协议必须厂商私有
- ❌ 没有关系

:::

## 小结

- 统一层核心：**Api（协议）/ Provider（厂商）/ Model（模型）** 三维解耦
- **协议可复用**是省代码的关键（DeepSeek 等兼容 OpenAI 协议 → 几十行适配）
- 流式用**事件流**（text/toolCall/thinking/usage/done），满足 agent 需求
- 认证抽象 `ProviderAuth` 统一 API key / OAuth / SigV4

---

**推荐阅读**：Pi 源码 `packages/ai/src/types.ts`（类型定义）· `packages/ai/src/providers/deepseek.ts`（精简适配示例）

**下一课**：[③ agent-loop：智能体核心循环](/pi/03-agent-loop)
