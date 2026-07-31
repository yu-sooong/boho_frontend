<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { SITE_URL } from '@/config/site'
import { GUIDES } from '@/data/guides'
import { usePageSeo } from '@/composables/usePageSeo'
import { BookOpen, ChevronRight } from 'lucide-vue-next'

usePageSeo({
  title: '文章專區 | 補亦樂乎',
  description:
    '選班相關說明：如何查詢立案、如何閱讀公開稽查紀錄，以及參觀前可確認的常見事項。資料來源為公開資訊，供自行對照。',
  ogTitle: '文章專區 | 補亦樂乎',
  ogUrl: `${SITE_URL}/guide`,
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <div class="flex-1 pb-20 md:pb-10">
      <SubpageHeader title="文章專區" />

      <div class="mx-auto max-w-xl px-4 py-5 md:px-6">
        <div class="mb-5 flex items-start gap-3">
          <div
            class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700"
          >
            <BookOpen :size="20" />
          </div>
          <div>
            <p class="text-sm leading-relaxed text-gray-600">
              整理立案與公開稽查等常見查詢方式，供家長與業者雙方對照參考。本站不業配、不替任何一方背書。
            </p>
          </div>
        </div>

        <ul class="space-y-3">
          <li v-for="guide in GUIDES" :key="guide.slug">
            <RouterLink
              :to="`/guide/${guide.slug}`"
              class="group flex items-start gap-3 rounded-md border border-gray-200 bg-white px-4 py-3.5 transition-colors hover:border-primary-300 hover:bg-primary-50/30"
            >
              <div class="min-w-0 flex-1">
                <div class="mb-1.5 flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in guide.tags"
                    :key="tag"
                    class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600"
                  >
                    {{ tag }}
                  </span>
                </div>
                <h2 class="font-heading text-base font-bold text-gray-900 group-hover:text-primary-800">
                  {{ guide.title }}
                </h2>
                <p class="mt-1 text-sm leading-relaxed text-gray-500">
                  {{ guide.summary }}
                </p>
                <p class="mt-2 text-xs text-gray-400">更新 {{ guide.updatedAt }}</p>
              </div>
              <ChevronRight
                :size="18"
                class="mt-1 shrink-0 text-gray-300 group-hover:text-primary-600"
              />
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
