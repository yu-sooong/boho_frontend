<script setup lang="ts">
import LoadingScreen from '@/components/common/LoadingScreen.vue'
import CompareHintToast from '@/components/favorites/CompareHintToast.vue'
import { onMounted, ref } from 'vue'

const loading = ref(true)

onMounted(() => {
  // Logo 動畫約 0.7s；勿再硬等，否則 PageSpeed 會判「延遲渲染」
  const MIN_SPLASH_MS = 700
  setTimeout(() => {
    loading.value = false
  }, MIN_SPLASH_MS)
})
</script>

<template>
  <Transition name="loading-fade">
    <LoadingScreen v-if="loading" />
  </Transition>
  <!-- 縣市引導改由 Dashboard 處理，避免全螢幕擋住首屏、也不預載地圖 -->
  <RouterView v-show="!loading" />
  <CompareHintToast />
</template>

<style>
.loading-fade-leave-active {
  transition: opacity 0.4s ease;
}
.loading-fade-leave-to {
  opacity: 0;
}
</style>
