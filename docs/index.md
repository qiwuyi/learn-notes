---
layout: home
hero:
  name: 学习笔记
  text: 多主题学习笔记站
  tagline: 用 VitePress 组织的结构化学习笔记 —— RAG、LLM、前端、更多专题持续更新中
  actions:
    - theme: brand
      text: 开始学习 RAG
      link: /rag/
    - theme: alt
      text: 关于本站
      link: /about
features:
  - icon: 🔍
    title: RAG 专题
    details: 以 rag-chatbot-fork 为案例，从全流程概览到摄入/查询两条流水线，配交互测验和速查表。
    link: /rag/
  - icon: 🤖
    title: Pi Agent 专题
    details: 拆解 10 万星开源 AI 智能体工具包：统一 LLM API、agent 循环、会话管理、编程 CLI。
    link: /pi/
  - icon: 📚
    title: 结构化组织
    details: 每个主题一个目录，侧边栏自动导航，内置全文搜索，内容用 Markdown 维护，加一篇即上线。
  - icon: 🚀
    title: 持续更新
    details: 后续新主题（LLM 应用、前端、算法等）直接在 docs/ 下新增目录，站点自动扩展。
---

## 专题列表

| 专题 | 说明 | 进度 |
| ---- | ---- | ---- |
| [RAG 原理课程](/rag/) | 检索增强生成原理：基础三课（A 系列）+ 进阶六篇（B 系列） | 🟢 9 篇已完成 |
| [Pi Agent Harness](/pi/) | AI 智能体工具包：统一 LLM API、agent 循环、编程 CLI（10 万星项目） | 🟢 7 篇已完成 |
| ~~更多专题~~ | 待你后续添加 | ⬜ 敬请期待 |

> 💡 想加新专题？把资料写成 Markdown 放到 `docs/<专题名>/` 下，在 `docs/.vitepress/config.mts` 里加一个侧边栏条目即可。
