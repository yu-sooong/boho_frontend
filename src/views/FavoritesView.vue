<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Sk from '@/components/common/Sk.vue'
import Tag from '@/components/common/Tag.vue'
import { useFavorites } from '@/composables/useFavorites'
import { useSchoolStore } from '@/stores/schoolStore'
import type { School } from '@/types'
import { Heart, MapPin } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { usePageSeo } from '@/composables/usePageSeo'

usePageSeo({
  title: '我的收藏 | 補亦樂乎',
  description: '查看您收藏的台中市補習班清單，方便比較與追蹤。',
  robots: 'noindex',
})

const { favorites, toggleFavorite } = useFavorites()
const store = useSchoolStore()

const isLoading = ref(true)
const loadedSchools = ref<School[]>([])

async function loadFavorites() {
  isLoading.value = true
  const results = await Promise.all(
    favorites.value.map((id) => store.ensureCached(id)),
  )
  loadedSchools.value = results.filter((s): s is School => s != null)
  isLoading.value = false
}

watch(favorites, loadFavorites, { deep: true })

onMounted(loadFavorites)

const favoriteSchools = computed(() =>
  loadedSchools.value.filter((s) => favorites.value.includes(s.id)),
)
</script>

<template>
  <div class="flex min-h-screen flex-col pb-20 md:pb-0">
    <AppHeader />
    <div class="mx-auto w-full max-w-2xl flex-1 px-4 py-5">
      <h1 class="font-heading text-2xl font-bold text-gray-900">我的收藏</h1>
      <p class="mt-1 text-sm text-gray-500">
        收藏只存在這個瀏覽器；換裝置或清除網站資料後會消失。
      </p>

      <Transition name="fade" mode="out-in">
        <div v-if="isLoading" class="mt-4 space-y-3">
          <div v-for="i in 3" :key="i" class="space-y-3 rounded-md border border-gray-100 p-4">
            <div class="flex items-start justify-between gap-3">
              <Sk class="h-5 w-48" />
              <Sk class="h-5 w-5 rounded-full" />
            </div>
            <Sk class="h-4 w-full" />
            <div class="flex gap-2 pt-1">
              <Sk class="h-6 w-14 rounded-full" />
              <Sk class="h-6 w-16 rounded-full" />
              <Sk class="h-6 w-12 rounded-full" />
            </div>
          </div>
        </div>

        <div v-else>
          <div v-if="favoriteSchools.length" class="mt-4 space-y-3">
            <div
              v-for="school in favoriteSchools"
              :key="school.id"
              class="rounded-md border border-gray-200 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <RouterLink
                  :to="`/schools/${school.id}`"
                  class="font-heading font-bold text-gray-900 hover:text-primary-700"
                >
                  {{ school.name }}
                </RouterLink>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary-700 hover:bg-primary-50"
                  aria-label="取消收藏"
                  @click="toggleFavorite(school.id)"
                >
                  <Heart :size="20" class="fill-primary-700 text-primary-700" />
                </button>
              </div>
              <p class="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin :size="14" class="shrink-0" />
                {{ school.address }}
              </p>
              <div class="mt-3 flex items-center justify-between">
                <div class="flex flex-wrap gap-1.5">
                  <Tag
                    v-for="tag in [...school.categoryTags, ...school.levelTags, ...school.extraTags]"
                    :key="tag"
                  >
                    {{ tag }}
                  </Tag>
                </div>
                <span v-if="school.distanceKm > 0" class="shrink-0 text-sm text-gray-500">
                  {{
                    school.distanceKm < 1
                      ? `${Math.round(school.distanceKm * 1000)} 公尺`
                      : `${school.distanceKm.toFixed(1)} 公里`
                  }}
                </span>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            class="mt-8"
            :icon="Heart"
            title="還沒有收藏的補習班"
            description="在補習班頁點愛心即可收藏，方便下次比較。"
            cta-label="去看看有哪些補習班"
            cta-to="/"
          />
        </div>
      </Transition>
    </div>
    <BottomTabBar />
  </div>
</template>
