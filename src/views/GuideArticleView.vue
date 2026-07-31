<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { SITE_URL } from '@/config/site'
import { getGuide, GUIDES } from '@/data/guides'
import { usePageSeo } from '@/composables/usePageSeo'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const guide = computed(() => getGuide(String(route.params.slug ?? '')))

const related = computed(() =>
  GUIDES.filter((g) => g.slug !== guide.value?.slug).slice(0, 3),
)

usePageSeo(
  computed(() => {
    const g = guide.value
    if (!g) {
      return {
        title: '找不到文章 | 補亦樂乎',
        description: '這篇文章不存在或已移除。',
        robots: 'noindex',
      }
    }
    return {
      title: `${g.title} | 補亦樂乎`,
      description: g.summary,
      ogTitle: g.title,
      ogUrl: `${SITE_URL}/guide/${g.slug}`,
    }
  }),
)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <div class="flex-1 pb-20 md:pb-10">
      <template v-if="guide">
        <SubpageHeader :title="guide.title" />

        <article class="mx-auto max-w-xl px-4 py-5 md:px-6">
          <div class="mb-5 flex flex-wrap items-center gap-2">
            <span
              v-for="tag in guide.tags"
              :key="tag"
              class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600"
            >
              {{ tag }}
            </span>
            <span class="text-xs text-gray-400">更新 {{ guide.updatedAt }}</span>
          </div>

          <p class="mb-6 text-sm leading-relaxed text-gray-600">
            {{ guide.summary }}
          </p>

          <div class="space-y-5">
            <template v-for="(block, i) in guide.blocks" :key="i">
              <p
                v-if="block.type === 'p'"
                class="text-sm leading-relaxed text-gray-700"
              >
                {{ block.text }}
              </p>
              <h2
                v-else-if="block.type === 'h2'"
                class="font-heading text-base font-bold text-gray-900"
              >
                {{ block.text }}
              </h2>
              <ul
                v-else-if="block.type === 'ul'"
                class="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700"
              >
                <li v-for="(item, j) in block.items" :key="j">{{ item }}</li>
              </ul>
              <p
                v-else-if="block.type === 'callout'"
                class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
              >
                {{ block.text }}
              </p>
              <RouterLink
                v-else-if="block.type === 'cta'"
                :to="block.to"
                class="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
              >
                {{ block.label }}
              </RouterLink>
            </template>
          </div>

          <section v-if="related.length" class="mt-10 border-t border-gray-100 pt-6">
            <h2 class="mb-3 font-heading text-sm font-bold text-gray-900">相關文章</h2>
            <ul class="space-y-2">
              <li v-for="g in related" :key="g.slug">
                <RouterLink
                  :to="`/guide/${g.slug}`"
                  class="text-sm font-medium text-primary-700 hover:underline"
                >
                  {{ g.title }}
                </RouterLink>
              </li>
            </ul>
          </section>

          <p class="mt-8">
            <RouterLink to="/guide" class="text-sm font-medium text-gray-500 hover:text-gray-800">
              ← 回文章專區
            </RouterLink>
          </p>
        </article>
      </template>

      <template v-else>
        <SubpageHeader title="找不到文章" />
        <div class="mx-auto max-w-xl px-4 py-10 text-center">
          <p class="text-sm text-gray-500">這篇文章不存在或連結有誤。</p>
          <RouterLink
            to="/guide"
            class="mt-4 inline-block text-sm font-medium text-primary-700 hover:underline"
          >
            回文章專區
          </RouterLink>
        </div>
      </template>
    </div>

    <BottomTabBar />
  </div>
</template>
