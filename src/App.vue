<script setup lang="ts">
import LoadingScreen from '@/components/common/LoadingScreen.vue'
import { onMounted, ref } from 'vue'

const loading = ref(true)

onMounted(() => {
  // 品牌啟動畫面（刻意保留）：讓 logo 動畫完整播放一次。
  // 未來可改為「等關鍵資源就緒」與最短展示時間取 max。
  const MIN_SPLASH_MS = 1600
  setTimeout(() => {
    loading.value = false
  }, MIN_SPLASH_MS)
})
</script>

<template>
  <Transition name="loading-fade">
    <LoadingScreen v-if="loading" />
  </Transition>
  <RouterView />
</template>

<style>
.loading-fade-leave-active {
  transition: opacity 0.4s ease;
}
.loading-fade-leave-to {
  opacity: 0;
}
</style>
