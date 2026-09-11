<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useSidebar } from 'vitepress/theme'
import { onMounted, ref } from 'vue'

const { Layout } = DefaultTheme
const { hasSidebar } = useSidebar()

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
