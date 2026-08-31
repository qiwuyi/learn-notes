---
title: 关于本站
---

# 关于本站

这是一个用 [VitePress](https://vitepress.dev/zh/) 搭建的多主题学习笔记站。

## 内容来源

- **RAG 专题**：由 AI 老师基于 `rag-chatbot-fork` 仓库源码整理的交互式课程，帮助你从概念到代码理解 RAG 原理。
- **更多专题**：陆续添加中。

## 维护方式

本站完全由 Markdown 驱动：

```
docs/
├── index.md          ← 主页
├── rag/              ← RAG 专题（示例：如何加一个专题）
│   ├── index.md
│   ├── 01-xxx.md
│   └── ...
├── <新专题>/         ← 加新专题 = 新建目录 + 写 Markdown
└── .vitepress/       ← 站点配置（导航、侧边栏）
```

添加一篇新笔记：
1. 在对应专题目录下新建 `.md` 文件
2. 若想出现在侧边栏，在 `docs/.vitepress/config.mts` 的对应 `items` 里加一行
3. 提交推送，GitHub Actions 自动构建部署

## 技术栈

- [VitePress](https://vitepress.dev/zh/) —— 静态站点生成器
- [GitHub Pages](https://pages.github.com/) —— 托管
- [GitHub Actions](https://github.com/features/actions) —— 自动构建部署
