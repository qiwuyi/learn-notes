---
title: Pi ⑤ coding-agent CLI 产品化
---

# coding-agent：CLI 产品化

Pi 专题第五课 · 深入拆解 `packages/coding-agent`

::: tip 本课目标
前面学的是"库"，这一课看它怎么变成一个**可用的命令行产品**：用户输入 `pi` 就进入一个交互式 AI 编程助手。
学完你能理解一个 coding agent CLI 的完整构成：参数解析、配置、工具链、RPC、打包发布。
:::

## 产品长什么样

```bash
$ pi                          # 启动交互式 TUI
$ pi "帮我重构这个函数"        # 直接给任务
$ pi --model deepseek-chat    # 指定模型
$ pi --continue               # 恢复上次会话
$ pi --list-models            # 列出可用模型
```

它在终端里跑一个 TUI（终端 UI），像 Claude Code 那样：你输入，它边想边打字，用工具改文件。

## CLI 目录结构

```text
packages/coding-agent/
├── src/
│   ├── main.ts          ← 入口（Node 版）
│   ├── cli.ts           ← CLI 定义
│   ├── config.ts        ← 配置管理
│   ├── migrations.ts    ← 配置迁移
│   ├── package-manager-cli.ts  ← 包管理器交互
│   ├── rpc-entry.ts     ← RPC 入口（给 server 模式用）
│   ├── bun/             ← Bun 运行时版入口
│   ├── cli/             ← 各子命令
│   │   ├── args.ts      ← 参数解析
│   │   ├── auth-check.ts ← 认证检查
│   │   ├── config-selector.ts ← 配置选择
│   │   ├── list-models.ts ← 列出模型
│   │   ├── session-picker.ts ← 会话选择器
│   │   ├── startup-ui.ts ← 启动界面
│   │   └── ...
│   └── client/          ← 客户端库
└── examples/            ← 示例
```

关键点：**它不只是"一个命令"**，而是一个有子命令、有配置、有会话恢复、有 RPC 的完整应用。

## ① 配置系统

`config.ts` —— 用户配置管理：

```text
配置内容：
  - 默认 provider / 模型（如 deepseek-chat）
  - 各厂商 API key（或走环境变量）
  - 工具开关（哪些工具允许）
  - 系统提示 / 自定义技能
  - 主题、快捷键（TUI）
```

`migrations.ts` —— 配置迁移：老版本配置 → 新版本结构，保证升级不丢配置。

## ② 工具链集成

coding-agent 复用了 `pi-agent` 的 harness 工具集，但加了**产品级安全**：

- **project-trust.ts**：项目信任（首次运行确认"信任这个目录？"）
- **文件操作**：read/write/edit 都有路径限制
- **bash 工具**：命令超时、输出截断、确认重命令

产品层和库层的区别就在这：**库给你能力，产品给你安全护栏**。

## ③ RPC / 客户端-服务端

Pi 不只是本地 CLI，还支持 **server 模式**：

```text
packages/server   ← 服务端（托管会话、跑 agent）
packages/client   ← 客户端（连接 server）
packages/protocol ← 两者通信协议
```

```bash
pi server start          # 起服务端
pi --connect localhost   # 客户端连上去
```

这让 Pi 能：
- 多个终端共享一个 agent 会话
- 远程/无人值守运行
- 集成到编辑器/CI

`rpc-entry.ts` 就是给这种模式用的入口。

## ④ 多运行时支持

Pi 同时支持 **Node 和 Bun**：

```text
src/main.ts        ← Node 版
src/bun/cli.ts     ← Bun 版
```

为什么？Bun 启动更快、自带 TS 支持、是 AI 工具链的热门运行时。Pi 的发布产物同时出 Node 包和 Bun 二进制。

## ⑤ 打包发布

看 package.json scripts / 发布流程（从 AGENTS.md 和仓库结构可见）：

```text
release:patch / release:minor   ← 统一版本号（lockstep versioning）
build-binaries.yml              ← CI 构建 Node + Bun 二进制
publish-npm                     ← 用 OIDC 可信发布（不本地 publish）
announce-pi-dev-release         ← 验证发布后更新 pi.dev 版本标记
```

**亮点**：
- **lockstep 版本**：所有包同一个版本号，一起发
- **OIDC 可信发布**：CI 用 GitHub OIDC 直接发 npm，不需要本地 token/OTP
- **发布前 smoke test**：从仓库外安装、跑 --help/--version/实际 prompt

## 产品化的启示

从库到产品的路径（可复用到你自己的项目）：

```text
① 能力层（pi-ai + agent）      ← 通用能力
② 运行时层（AgentHarness）      ← 状态/工具/会话
③ 产品层（coding-agent）       ← CLI/配置/安全/多运行时
④ 发布层（版本/CI/分发）        ← lockstep + OIDC + 双运行时
```

## 自测

::: details 测验 · 点击展开

**1. coding-agent 和 pi-agent 的关系是？**
- ✅ **coding-agent 是产品层，复用 agent 的 harness，加上 CLI/配置/安全**
- ❌ 两者完全无关
- ❌ coding-agent 是 agent 的子集
- ❌ agent 依赖 coding-agent

**2. project-trust 解决什么？**
- ✅ **首次运行确认是否信任目录，防 agent 乱改不该改的东西**
- ❌ 加密项目文件
- ❌ 加速编译
- ❌ 管理依赖版本

**3. Pi 的 server/client/protocol 三包解决什么？**
- ✅ **多终端共享会话、远程/无人值守运行、集成编辑器**
- ❌ 加速 LLM 调用
- ❌ 备份会话
- ❌ 压缩模型

**4. "lockstep 版本"的意思是？**
- ✅ **所有包共用一个版本号，一起发布**
- ❌ 每个包独立版本
- ❌ 不用版本号
- ❌ 只发主版本

**5. OIDC 可信发布的好处是？**
- ✅ **CI 直接发布 npm，无需本地 token/OTP，更安全**
- ❌ 需要人工审核
- ❌ 更慢
- ❌ 只能发私有包

:::

## 小结

- coding-agent 是一个**完整产品**：CLI + 配置 + 工具链安全 + RPC + 双运行时
- 产品层 = 库的能力 + **安全护栏 + 配置 + 多运行时分发**
- 支持 server 模式（client/server/protocol），可远程和集成
- 发布：lockstep 版本 + OIDC 可信发布 + 双运行时构建

---

**推荐阅读**：Pi 源码 `packages/coding-agent/src/main.ts` · `packages/coding-agent/src/cli/`

**返回**：[Pi 专题首页](/pi/)
