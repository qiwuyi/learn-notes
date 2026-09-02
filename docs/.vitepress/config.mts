import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '学习笔记',
  description: '多主题学习笔记站：RAG、LLM、前端、更多……',
  lang: 'zh-CN',
  cleanUrls: true,
  // GitHub Pages 子路径部署：必须与仓库名一致，否则资源路径 404
  base: '/learn-notes/',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'RAG 专题', link: '/rag/' },
      { text: 'Pi Agent 专题', link: '/pi/' },
      { text: 'AI 基础', link: '/ai/' },
      { text: '工具速查', link: '/tools/git-cheatsheet' },
      { text: 'Go 学习站', link: 'https://golangstar.cn/' },
      { text: '关于', link: '/about' },
    ],

    sidebar: {
      // RAG 专题的侧边栏
      '/rag/': [
        {
          text: 'RAG 原理课程',
          collapsed: false,
          items: [
            { text: '专题首页', link: '/rag/' },
            { text: '① 全流程概览', link: '/rag/01-rag-pipeline-overview' },
            { text: '② 摄入流水线', link: '/rag/02-ingestion-pipeline' },
            { text: '③ 查询流水线', link: '/rag/03-retrieval-generation' },
            { text: 'RAG 速查表', link: '/rag/glossary' },
          ],
        },
        {
          text: '进阶专题（B 系列）',
          collapsed: false,
          items: [
            { text: 'B1 · Chunking 策略全解', link: '/rag/b1-chunking-strategies' },
            { text: 'B2 · Embedding 模型选型', link: '/rag/b2-embedding-models' },
            { text: 'B3 · 检索优化：Hybrid + Rerank', link: '/rag/b3-hybrid-search-rerank' },
            { text: 'B4 · RAG 评估', link: '/rag/b4-rag-evaluation' },
            { text: 'B5 · 高级 RAG 模式', link: '/rag/b5-advanced-rag-patterns' },
            { text: 'B6 · 向量数据库对比', link: '/rag/b6-vector-databases' },
          ],
        },
      ],
      // Pi Agent 专题的侧边栏
      '/pi/': [
        {
          text: 'Pi Agent Harness',
          collapsed: false,
          items: [
            { text: '专题首页', link: '/pi/' },
            { text: '① 项目总览与架构', link: '/pi/01-overview-architecture' },
            { text: '② pi-ai：统一 LLM API', link: '/pi/02-pi-ai-unified-api' },
            { text: '③ agent-loop：核心循环', link: '/pi/03-agent-loop' },
            { text: '④ AgentHarness：会话/工具/压缩', link: '/pi/04-agent-harness' },
            { text: '⑤ coding-agent：CLI 产品化', link: '/pi/05-coding-agent-cli' },
            { text: '⑥ pi-tui：终端 UI 引擎', link: '/pi/06-tui-engine' },
            { text: '⑦ 用 Pi 构建 RAG 应用', link: '/pi/07-pi-rag-app' },
            { text: '⑧ AI Coding 笔试实战', link: '/pi/08-ai-coding-exam' },
          ],
        },
      ],
      // AI 基础专题的侧边栏
      '/ai/': [
        {
          text: 'AI 基础（微软课程精选）',
          collapsed: false,
          items: [
            { text: '专题首页', link: '/ai/' },
            { text: '① 课程全景与学习路径', link: '/ai/01-curriculum-map' },
            { text: '② 神经网络基础', link: '/ai/02-neural-networks' },
            { text: '③ Embeddings 深度理解', link: '/ai/03-embeddings' },
            { text: '④ Transformer 深度理解', link: '/ai/04-transformer' },
            { text: '⑤ 从语言模型到 RAG', link: '/ai/05-llm-to-rag' },
          ],
        },
      ],
      // 工具速查的侧边栏
      '/tools/': [
        {
          text: '工具速查',
          collapsed: false,
          items: [
            { text: 'Git 指令速查', link: '/tools/git-cheatsheet' },
          ],
        },
      ],
      // 其他专题以后在这里加
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' },
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    darkModeSwitchLabel: '外观',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
  },

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
  },
})
