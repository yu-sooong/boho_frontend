<script setup lang="ts">
import { Compass, Home, LayoutGrid, Menu } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = computed(() => [
  { names: ['dashboard'], label: '導覽', icon: LayoutGrid, to: '/' },
  { names: ['home', 'school-detail'], label: '找班', icon: Home, to: '/find' },
  { names: ['district-stats'], label: '情報', icon: Compass, to: '/district-stats' },
  { names: ['favorites', 'more', 'contact', 'privacy', 'terms', 'guide', 'guide-article', 'about', 'review-policy', 'ai-pick'], label: '更多', icon: Menu, to: '/more' },
])

function isActive(names: string[]) {
  return names.includes(String(route.name ?? ''))
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/90 backdrop-blur-md md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="flex items-stretch justify-around">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.label"
        :to="tab.to"
        class="flex min-h-12 flex-1 flex-col items-center gap-1 py-2.5"
        :aria-label="tab.label"
        :aria-current="isActive(tab.names) ? 'page' : undefined"
      >
        <component
          :is="tab.icon"
          :size="22"
          :stroke-width="1.6"
          :class="isActive(tab.names) ? 'text-primary-700' : 'text-gray-400'"
        />
        <span
          class="text-[11px] leading-none"
          :class="isActive(tab.names) ? 'font-semibold text-primary-700' : 'text-gray-400'"
        >
          {{ tab.label }}
        </span>
        <span
          class="h-[3px] w-6 rounded-full transition-colors"
          :class="isActive(tab.names) ? 'bg-primary-600' : 'bg-transparent'"
        />
      </RouterLink>
    </div>
  </nav>
</template>
