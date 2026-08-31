import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '学习笔记',
  description: '多主题学习笔记站：RAG、LLM、前端、更多……',
  lang: 'zh-CN',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'RAG 专题', link: '/rag/' },
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
