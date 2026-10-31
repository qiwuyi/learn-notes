<script setup>
import { onMounted, ref } from 'vue'

const storageKey = 'learn-notes-growth-first-week-v1'
const done = ref([false, false, false, false, false])
const message = ref('')

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (Array.isArray(saved) && saved.length === 5 && saved.every(value => typeof value === 'boolean')) {
      done.value = saved
    }
  } catch {
    message.value = '无法读取记录，请检查浏览器的存储设置。'
  }
})

function toggle(index, checked) {
  done.value[index] = checked
  try {
    localStorage.setItem(storageKey, JSON.stringify(done.value))
    message.value = checked ? '已保存，今天完成了。' : '已取消，记录已更新。'
  } catch {
    message.value = '保存失败：请检查浏览器的存储设置。'
  }
}
</script>

<template>
  <div class="tracker">
    <p>首轮目标：5 个工作日里完成 3 次。做了 2 分钟保底版也可以打勾。</p>
    <div class="checks" aria-label="首周学习打卡">
      <label v-for="(_, index) in done" :key="index">
        <input type="checkbox" :checked="done[index]" @change="toggle(index, $event.target.checked)">
        第 {{ index + 1 }} 天
      </label>
    </div>
    <p class="feedback" role="status" aria-live="polite">{{ message || '记录保存在当前设备的浏览器中，不会同步到其他设备。' }}</p>
  </div>
</template>

<style scoped>
.tracker { padding: 16px; border: 1px solid var(--vp-c-divider); border-radius: 8px; }
.tracker p { margin: 0; }
.checks { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.checks label { display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; gap: 8px; border: 1px solid var(--vp-c-divider); border-radius: 8px; cursor: pointer; }
.checks label:hover { border-color: var(--vp-c-brand-1); }
.checks input { width: 18px; height: 18px; accent-color: var(--vp-c-brand-1); }
.checks input:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.feedback { color: var(--vp-c-text-2); font-size: 14px; }
</style>
