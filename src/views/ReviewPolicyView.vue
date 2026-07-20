<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import ReviewGuidelines from '@/components/detail/ReviewGuidelines.vue'
import { SITE_URL } from '@/config/site'
import { REVIEW_POLICY } from '@/data/reviewConstants'
import { usePageSeo } from '@/composables/usePageSeo'

usePageSeo({
  title: '評價怎麼審核 | 補亦樂乎',
  description:
    '補亦樂乎評價採匿名投稿與人工審核：公開只顯示身份與接觸時期；具體親身經驗會刊出，廣告與攻擊會退件。',
  ogTitle: '評價怎麼審核 | 補亦樂乎',
  ogUrl: `${SITE_URL}/more/review-policy`,
})
</script>

<template>
  <div class="flex min-h-screen flex-col pb-20 md:pb-0">
    <AppHeader />

    <div class="flex-1">
      <SubpageHeader :title="REVIEW_POLICY.title" />

      <div class="mx-auto w-full max-w-2xl px-4 py-5 md:px-6">
        <ReviewGuidelines />
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
