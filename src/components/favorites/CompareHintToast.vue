<script setup lang="ts">
import Toast from '@/components/common/Toast.vue'
import { useFavorites } from '@/composables/useFavorites'
import { Columns2 } from 'lucide-vue-next'

const { showCompareHint, dismissCompareHint } = useFavorites()
</script>

<template>
  <Transition name="fade">
    <Toast v-if="showCompareHint" tone="info">
      <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Columns2 :size="16" class="shrink-0 text-primary-300" />
        <span>已收藏。再收藏一間，就能在「我的收藏」對照。</span>
        <RouterLink
          to="/favorites"
          class="font-medium text-primary-300 underline underline-offset-2"
          @click="dismissCompareHint"
        >
          查看收藏
        </RouterLink>
      </span>
    </Toast>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
