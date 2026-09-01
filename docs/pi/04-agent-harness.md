---
title: Pi ④ AgentHarness 会话/工具/压缩
---

# AgentHarness：会话/工具/压缩/技能

Pi 专题第四课 · 深入拆解 `packages/agent/src/harness/`

::: tip 本课目标
agent-loop 是"发动机"，但一个能用的产品还需要：**会话怎么存、工具怎么组织、上下文太长怎么办、技能怎么扩展**。
这一课讲 Pi 的 AgentHarness——把这些能力打包的"产品级运行时"。
:::

## AgentHarness 解决什么

纯 agent-loop 只回答"怎么循环"。但真实产品要处理：

```text
① 会话持久化    重新打开还能接着聊
② 工具注册    哪些工具可用、怎么安全执行
③ 上下文管理    历史太长怎么办（compaction）
④ 技能扩展    用户自定义指令/工作流（skills）
⑤ 分支/恢复    中途换模型、恢复历史会话
```

AgentHarness 就是把这些全包起来的"服务层"。

## ① 会话系统（session）

`harness/session/` 目录：

```text
session/
├── session.ts      ← 会话核心（消息、分支树）
├── state.ts        ← 状态管理
├── context.ts      ← 上下文
├── memory.ts       ← 记忆
├── jsonl/          ← 基于 JSONL 的会话存储
│   ├── codec.ts    ← 编解码
│   ├── repo.ts     ← 会话仓库
│   └── storage.ts  ← 存储后端
└── testing/        ← 一致性测试
```

设计要点：
- **JSONL 存储**：每行一条 JSON 消息，追加写、易恢复、可 grep——适合会话日志
- **SessionTree（会话树）**：支持分支（改主意了回退到某个节点）
- **多后端**：`session-backends/` 包可插拔不同存储

## ② 工具集（tools）

`harness/tools/` 是 coding agent 的手：

| 工具 | 作用 | 安全设计 |
| ---- | ---- | -------- |
| `bash.ts` | 执行 shell 命令 | 超时、输出截断 |
| `read.ts` | 读文件 | 路径限制 |
| `write.ts` | 写文件 | 权限/校验 |
| `edit.ts` / `edit-diff.ts` | 精确改文件 | 先 diff 再应用 |
| `image.ts` | 图片处理 | — |
| `file-mutation-queue.ts` | 文件变更队列 | **串行化写操作** |

关键设计：**file-mutation-queue**——多个工具并发写同一文件时，用队列串行化，避免冲突。这是"parallel 工具执行 + 文件安全"的平衡。

## ③ Compaction（上下文压缩）

LLM 上下文窗口有限，长会话的历史会爆。**Compaction** 是"把旧对话压缩成摘要"的机制：

```text
原始历史（几千条消息，超窗口）
        │
        ▼  compaction
摘要 + 最近的关键消息（重新放回窗口）
        │
        ▼
LLM 继续工作，但"记忆"被压缩保留了
```

`harness/compaction/`：
- `compaction.ts`：触发策略（何时压缩）
- `branch-summarization.ts`：**分支摘要**（分支对话压缩）
- `utils.ts`：工具函数

Pi 的 compaction 很先进：不只是简单 summarize，还支持**分支摘要**——多个分支分别压缩，保留各分支要点。

## ④ Skills（技能）

`harness/skills.ts` —— 用户可定义的扩展技能：

```text
skills = 一组"命名指令"，agent 可以动态调用
例：
  "review"  → 代码审查流程
  "release" → 发布流程
```

它让用户/团队把**重复工作流**固化成可复用技能，agent 按需触发。

## ⑤ 分支与错误体系

### 分支
- 会话树支持**导航**（回到历史节点）
- `LaneBusy` 等错误表示"这条轨道正忙"（支持多 lane 并发）

### TaggedError 错误体系

Pi 用 `TaggedError`（带标签的错误）——比裸 Error 信息更丰富：

```ts
class LaneBusy extends TaggedError("LaneBusy")<{ lane: string; message: string }> {}
class MissingIdentities extends TaggedError("MissingIdentities")<{ tools: string[]; models: string[]; message: string }> {}
class NoActiveRun extends TaggedError("NoActiveRun")<{ lane: string; message: string }> {}
// ...十几类
```

好处：错误**可结构化判断**（`error instanceof LaneBusy` 且带 lane 字段），而不是 parse 字符串。

## 完整图景

```text
                AgentHarness
        ┌───────────┼───────────────┐
        │           │               │
   Session       Tools          Compaction
 (会话/分支)   (bash/read/write)  (上下文压缩)
        │           │               │
        └───────────┼───────────────┘
                    │
              agent-loop
              (核心循环)
                    │
              pi-ai (统一 LLM)
```

AgentHarness 是"壳"，agent-loop 是"芯"，pi-ai 是"底座"。

## 自测

::: details 测验 · 点击展开

**1. Compaction（压缩）解决什么问题？**
- ✅ **上下文窗口有限，长会话历史爆掉 → 压缩成摘要保留**
- ❌ 压缩磁盘占用
- ❌ 加密会话数据
- ❌ 加速网络请求

**2. file-mutation-queue 的设计目的是？**
- ✅ **多个工具并发写同一文件时串行化，避免冲突**
- ❌ 加快文件写入
- ❌ 压缩文件
- ❌ 备份文件

**3. 会话用 JSONL 存储的好处是？**
- ✅ **每行一条 JSON，追加写、易恢复、可 grep**
- ❌ 它是最快的格式
- ❌ 它是唯一的格式
- ❌ 它加密数据

**4. TaggedError 相比普通 Error 的优势是？**
- ✅ **错误带结构化标签和字段，可程序化判断（instanceof + 字段）**
- ❌ 它更短
- ❌ 它不需要 throw
- ❌ 它自动重试

**5. Skills（技能）的本质是？**
- ✅ **把重复工作流固化成可复用的命名指令，agent 按需触发**
- ❌ 一种编程语言
- ❌ 一种数据库
- ❌ 一种网络协议

:::

## 小结

- AgentHarness = **会话 + 工具 + 压缩 + 技能** 的产品级运行时
- 会话：JSONL 存储 + 分支树 + 多后端
- 工具：bash/read/write/edit + **文件变更队列**保证安全
- Compaction：**分支摘要**式上下文压缩
- Skills：可复用工作流；TaggedError：结构化错误体系

---

**推荐阅读**：Pi 源码 `packages/agent/src/harness/`（目录结构）· `harness/session/`（会话）

**下一课**：[⑤ coding-agent：CLI 产品化](/pi/05-coding-agent-cli)
