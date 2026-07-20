<script setup lang="ts">
import SproutLogo from '@/components/common/SproutLogo.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: '找補習班', to: '/', names: ['home', 'school-detail'] },
  { label: '地區情報', to: '/district-stats', names: ['district-stats'] },
  { label: '收藏', to: '/favorites', names: ['favorites'] },
  { label: '文章專區', to: '/guide', names: ['guide'] },
  { label: 'AI 選班', to: '/ai-pick', names: ['ai-pick'] },
  { label: '更多', to: '/more', names: ['more', 'contact', 'privacy', 'terms', 'about', 'review-policy'] },
]

function isActive(names: string[]) {
  return names.includes(String(route.name ?? ''))
}
</script>

<template>
  <header class="hidden h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 md:flex">
    <RouterLink to="/" class="group flex items-center gap-2.5 no-underline">
      <SproutLogo
        svg-class="w-9 h-9 transform transition-transform duration-200 group-hover:scale-105"
      />
      <span class="font-heading text-[17px] font-bold tracking-tight text-gray-900">補亦樂乎</span>
    </RouterLink>

    <nav class="flex items-center gap-0.5 text-[13.5px]" aria-label="主要導覽">
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="relative rounded-md px-3 py-1.5 font-medium transition-colors"
        :class="isActive(item.names)
          ? 'text-primary-700'
          : 'text-gray-500 hover:text-gray-800'"
      >
        {{ item.label }}
        <span
          v-if="isActive(item.names)"
          class="absolute inset-x-2 -bottom-[11px] h-0.5 rounded-full bg-primary-600"
        />
      </RouterLink>
    </nav>
  </header>
</template>
