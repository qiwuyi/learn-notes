---
title: Pi ① 项目总览与架构
---

# Pi 项目总览与 monorepo 架构

Pi 专题第一课

## 这个项目是什么

**Pi Agent Harness** 是 earendil-works 开源的 AI 智能体工具包。它的定位从 README 一句话就能看清：

> AI agent toolkit: unified LLM API, agent loop, TUI, coding agent CLI

拆开看四件事：
1. **unified LLM API** —— 统一的多厂商 LLM 接口
2. **agent loop** —— 智能体循环运行时
3. **TUI** —— 终端界面库
4. **coding agent CLI** —— 编程智能体命令行工具

## 为什么值得学

- **⭐ 10 万+ star**（2025 年 8 月创建，一年暴涨），是"智能体框架"品类的头部项目
- **TypeScript monorepo**，代码质量极高（AGENTS.md 里是教科书级的工程规范）
- 覆盖了 LLM 应用开发的**完整工程栈**：接入层 → 运行时 → 产品层
- 学会了它，你就懂了 Claude Code / Codex 这类工具的底层原理

## Monorepo 结构

```text
pi/
├── packages/
│   ├── ai/            ← 统一 LLM API（核心，最值得读）
│   ├── agent/         ← Agent 运行时（循环 + harness）
│   ├── coding-agent/  ← 编程智能体 CLI（产品层）
│   ├── tui/           ← 终端 UI 库
│   ├── client/        ← 客户端（与 server 配对）
│   ├── server/        ← 服务端（RPC/会话托管）
│   ├── protocol/      ← 客户端-服务端协议定义
│   ├── session-backends/ ← 会话存储后端
│   ├── telemetry/     ← 厂商中立遥测
│   └── evals/         ← 智能体评估
├── AGENTS.md          ← 给 AI 开发者看的工程规范（非常精彩）
├── package.json       ← 根工作区配置
└── wr/                ← 内置"工作区规则"等 AI 工具
```

关键观察：**从 ai → agent → coding-agent，是层层依赖的**：

```text
coding-agent ──依赖──▶ agent ──依赖──▶ ai
（产品）            （运行时）       （接入）
```

## 三层架构详解

### 层 1：pi-ai（接入层）
`packages/ai` 提供统一模型接口。核心抽象：

```ts
// 一个 Model 描述一个具体模型（如 "gpt-4o"）
interface Model<Api> {
  id: string
  provider: string
  api: Api            // 用什么协议调它
  contextWindow: number
  // ...成本、能力等元数据
}

// 一个 Provider 是厂商适配单元（OpenAI、DeepSeek…）
interface Provider<Api> {
  id: string
  auth: ProviderAuth  // 认证方式
  getModels(): Model[]  // 它有哪些模型
  // ...流式调用等
}
```

关键设计：**模型（Model）与厂商（Provider）解耦，通过 `api` 字段声明协议**。
`api` 是"协议层"（openai-responses / anthropic-messages / google-generative-ai…），
所以同一家厂商可以有多个协议实现，不同厂商也可以共享同一协议。

### 层 2：pi-agent-core（运行时层）
`packages/agent` 提供智能体循环。核心是 `agent-loop.ts`：

```ts
// 双层循环：
// 外层：等用户新消息（follow-up）
// 内层：处理工具调用直到完成
while (true) {
  while (hasMoreToolCalls || pendingMessages.length > 0) {
    // 1. 注入待处理消息
    // 2. 流式调用 LLM → assistant 消息
    // 3. 提取 toolCalls
    // 4. 执行工具 → toolResults
    // 5. 把结果加回上下文 → 继续
  }
  // 没有工具调用了，看看有没有用户跟进消息
}
```

上层还有 **AgentHarness**：把循环 + 会话持久化 + 工具集 + 压缩 + 技能 打包成可用的产品级运行时。

### 层 3：pi-coding-agent（产品层）
`packages/coding-agent` 是命令行产品：`pi` 命令启动交互式编程助手，内置工具（bash / read / edit / write），支持配置、会话恢复、技能扩展。

## 这个项目的"气质"（从 AGENTS.md 看）

读 AGENTS.md 能强烈感受到这个项目的工程文化：

- **简洁直接**：回答要短、技术性、无废话；禁止 emoji 提交
- **类型严格**：不用 `any`；只用"可擦除 TypeScript"（Node 原生 strip 模式，不用 enum/namespace）
- **审慎变更**：改动前先读全文；不保留没人要的向后兼容
- **AI 友好**：AGENTS.md 就是"给 AI 开发者写的规则"，甚至能让你 AI 帮它开发自己

> 这解释了为什么它质量高、涨星快——**它是"被 AI 优化的代码库"，工程规范极其克制**。

## 自测

::: details 测验 · 点击展开

**1. Pi 的三个核心包按依赖方向排列是？**
- ❌ ai → coding-agent → agent
- ✅ **coding-agent → agent → ai**（产品依赖运行时，运行时依赖接入层）
- ❌ agent → ai → coding-agent
- ❌ 三者互相独立

**2. pi-ai 里 Model 和 Provider 的关系是？**
- ✅ **Model 描述具体模型，Provider 是厂商适配单元，通过 api 协议字段解耦**
- ❌ Model 就是 Provider
- ❌ Provider 是模型的一个字段
- ❌ 两者无关联

**3. agent-loop 的双层循环结构是？**
- ✅ **外层等用户新消息，内层处理工具调用直到完成**
- ❌ 只有一个 while 循环
- ❌ 外层处理工具，内层等消息
- ❌ 没有循环

**4. "可擦除 TypeScript"指的是？**
- ❌ 编译后删除所有类型
- ✅ **只用不需要 JS 发射的语法（不用 enum/namespace），Node 可直接 strip 运行**
- ❌ 不用 TypeScript
- ❌ 用 JavaScript 写

**5. 为什么 Pi 能一年涨到 10 万星？**
- ❌ 因为它最贵
- ✅ **高质量工程规范 + 完整覆盖 LLM 应用栈 + 开源生态**
- ❌ 因为它用了 C++
- ❌ 因为它没有竞争对手

:::

## 小结

- Pi = **统一 LLM API + Agent 运行时 + 编程 CLI** 的完整智能体工具包
- 三层架构：**ai（接入）→ agent（运行时）→ coding-agent（产品）**
- 核心抽象：Model/Provider/Api 解耦；双层 agent loop
- 工程文化：简洁、严格类型、AI 友好的 AGENTS.md

---

**推荐阅读**：[Pi 官方文档](https://pi.dev/docs/latest) ｜ [Pi GitHub 仓库](https://github.com/earendil-works/pi)

**下一课**：[② pi-ai：统一 LLM API 设计](/pi/02-pi-ai-unified-api)
