<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useSidebar } from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'

const { Layout } = DefaultTheme
const { hasSidebar } = useSidebar()
const { page } = useData()

// 仅 Agent 产品认知专题展示「来源与版权」声明：该专题正文与配图均为第三方内容
const isAgentTopic = computed(() => page.value.relativePath.startsWith('agent/'))

const collapsed = ref(false)
const STORAGE_KEY = 'learn-notes:sidebar-collapsed'

function applyCollapsed(value: boolean) {
  collapsed.value = value
  document.documentElement.classList.toggle('sidebar-collapsed', value)
}

onMounted(() => {
  let saved = false
  try {
    saved = localStorage.getItem(STORAGE_KEY) === '1'
  } catch (e) {
    /* localStorage 不可用时静默降级 */
  }
  applyCollapsed(saved)
})

function toggleSidebar() {
  const next = !collapsed.value
  applyCollapsed(next)
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch (e) {
    /* 忽略存储失败 */
  }
}
</script>

<template>
  <Layout>
    <template #doc-after>
      <div v-if="isAgentTopic" class="agent-source-notice">
        <p class="agent-source-notice__title">来源与版权</p>
        <p>
          本专题正文与配图整理自产品二姐《Agent 产品基础认知手册（精简版）》（<a
            href="https://my.feishu.cn/wiki/P5AhwGmW0io3zCkXUaAcGP78nRh"
            target="_blank"
            rel="noreferrer"
            >飞书原文</a
          >），版权归原作者所有；其中部分图片为 Anthropic、百度智能云、Langfuse、阿里云百炼等平台的官方文档或控制台截图，版权归各自所有者。本站仅作个人学习笔记使用，未获授权，如权利人认为不妥，联系即删。
        </p>
      </div>
    </template>

    <template #layout-bottom>
      <button
        v-if="hasSidebar"
        class="sidebar-collapse-btn"
        type="button"
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-expanded="!collapsed"
        @click="toggleSidebar"
      >
        <svg
          class="sidebar-collapse-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </template>
  </Layout>
</template>
