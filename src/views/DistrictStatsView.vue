<script setup lang="ts">
import DensityMap from '@/components/stats/DensityMap.vue'
import DistrictSelect from '@/components/stats/DistrictSelect.vue'
import DonutChart from '@/components/stats/DonutChart.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import LogoSpinner from '@/components/common/LogoSpinner.vue'
import {
  DEFAULT_DISTRICT_ID,
  getDistrictById,
  isValidDistrictId,
} from '@/data/districtMeta'
import { SITE_URL } from '@/config/site'
import { useStatsStore } from '@/stores/statsStore'
import {
  buildDistrictStatView,
  countByDistrictName,
  densityByDistrictName,
} from '@/utils/districtStatsView'
import { dataVizGreens, densityScale, densitySelectedColor } from '@/utils/dataVizColors'
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageSeo } from '@/composables/usePageSeo'

usePageSeo({
  title: '台中市地區教育情報 | 補亦樂乎',
  description:
    '查看台中市各行政區立案補習班數量與類別分布，幫助家長了解所在區域的補教資源概況。',
  ogTitle: '台中市地區教育情報 | 補亦樂乎',
  ogDescription: '台中市各行政區補習班數量與類別分布一覽，地圖視覺化呈現。',
  ogUrl: `${SITE_URL}/district-stats`,
})

const route = useRoute()
const router = useRouter()
const store = useStatsStore()
const {
  summary,
  districtStats,
  categoryStats,
  districtCategoryStats,
  isLoading,
  isLoadingDistrictCategories,
  error,
} = storeToRefs(store)

onMounted(() => {
  void store.loadAll()
})

const selectedId = computed(() => {
  const q = route.query.district
  const id = typeof q === 'string' ? q : DEFAULT_DISTRICT_ID
  return getDistrictById(id).id
})

const selectedName = computed(() => getDistrictById(selectedId.value).name)

watch(
  selectedName,
  (name) => {
    if (name) void store.loadDistrictCategories(name)
  },
  { immediate: true },
)

watch(
  () => route.query.district,
  (q) => {
    if (typeof q === 'string' && !isValidDistrictId(q)) {
      router.replace({ query: { district: DEFAULT_DISTRICT_ID } })
    }
  },
  { immediate: true },
)

const countsByName = computed(() => countByDistrictName(districtStats.value))
const densityByName = computed(() => densityByDistrictName(districtStats.value))

const cityAverage = computed(() => {
  const total = summary.value?.totalActive ?? districtStats.value.reduce((s, d) => s + d.count, 0)
  const n = Math.max(1, summary.value?.districtCount ?? (districtStats.value.length || 1))
  return total / n
})

const catsForView = computed(() =>
  districtCategoryStats.value.length ? districtCategoryStats.value : categoryStats.value,
)

const stat = computed(() =>
  buildDistrictStatView({
    districtId: selectedId.value,
    districtStats: districtStats.value,
    categoryStats: catsForView.value,
    summary: summary.value,
  }),
)

function selectDistrict(id: string) {
  router.replace({ query: { district: id } })
}
</script>

<template>
  <div class="min-h-screen pb-20 md:pb-0">
    <AppHeader />
    <div class="mx-auto max-w-2xl pb-10 md:max-w-3xl">
      <SubpageHeader :title="`${stat.districtName}教育情報`" />

      <div v-if="isLoading && !districtStats.length" class="flex justify-center py-24">
        <LogoSpinner size="lg" />
      </div>

      <div
        v-else-if="error && !districtStats.length"
        class="mx-4 mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        地區情報載入失敗，請稍後再試。
        <button
          type="button"
          class="ml-2 font-medium text-primary-700 underline hover:text-primary-800"
          @click="store.loadAll()"
        >
          重新載入
        </button>
      </div>

      <div v-else class="space-y-3 px-4 pt-3">
        <DistrictSelect
          class="md:hidden"
          :model-value="selectedId"
          @update:model-value="selectDistrict"
        />

        <div class="rounded-md border border-gray-200 p-3">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-gray-800">全{{ stat.cityName }}密度分布</h2>
              <p class="mt-0.5 text-xs text-gray-500">
                <span class="md:hidden">點地圖可切換行政區。目前：{{ stat.districtName }}</span>
                <span class="hidden md:inline">
                  點地圖或右側選單切換行政區。目前：{{ stat.districtName }}
                </span>
              </p>
            </div>
            <DistrictSelect
              class="hidden w-full max-w-[220px] shrink-0 md:block"
              :model-value="selectedId"
              @update:model-value="selectDistrict"
            />
          </div>

          <div class="relative -mx-3 mt-1 pb-[4.25rem]">
            <DensityMap
              :selected-id="selectedId"
              :counts-by-name="countsByName"
              :density-by-name="densityByName"
              :city-average="cityAverage"
              @select="selectDistrict"
            />

            <div class="pointer-events-none absolute inset-x-0 bottom-0 px-1.5 pb-0">
              <div
                class="grid grid-cols-3 gap-1 rounded-md border border-white/60 bg-white/90 px-2 py-1.5 shadow-md backdrop-blur-md sm:gap-2 sm:px-3 sm:py-2"
              >
                <div class="text-center">
                  <p class="font-mono text-base font-bold text-primary-700 sm:text-lg">
                    <AnimatedNumber :value="stat.totalSchools" />
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500">本區立案班數</p>
                </div>
                <div class="text-center">
                  <p class="font-mono text-base font-bold text-primary-700 sm:text-lg">
                    <AnimatedNumber :value="stat.shareOfCityPercent" :decimals="1" suffix="%" />
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500">占全市比例</p>
                </div>
                <div class="text-center">
                  <p class="font-mono text-base font-bold text-primary-700 sm:text-lg">
                    <AnimatedNumber :value="stat.cityAverageSchools" />
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500">各區平均班數</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>密度低</span>
            <span
              class="h-1.5 flex-1 rounded-full"
              :style="{
                background: `linear-gradient(90deg, ${densityScale[0]}, ${densitySelectedColor})`,
              }"
            />
            <span>密度高</span>
          </div>
        </div>

        <div class="rounded-md border border-gray-200 p-3">
          <h2 class="text-sm font-semibold text-gray-800">補習資源充沛度</h2>
          <div class="mt-2 flex gap-1.5">
            <span
              v-for="n in 5"
              :key="n"
              class="h-3 w-3 rounded-full"
              :class="n <= stat.densityLevel ? 'bg-primary-700' : 'border border-gray-300 bg-white'"
            />
          </div>
          <p class="mt-1.5 text-xs text-gray-500">
            本區 <AnimatedNumber :value="stat.totalSchools" class="font-semibold text-gray-700" /> 班，為{{ stat.cityName }}各區平均的
            <AnimatedNumber :value="stat.densityRatioToAverage" :decimals="1" class="font-semibold text-gray-700" /> 倍
          </p>
        </div>

        <div class="rounded-md border border-gray-200 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-gray-800">本區類別分布</h2>
            <span
              v-if="isLoadingDistrictCategories"
              class="text-xs text-gray-500"
            >更新中…</span>
          </div>
          <div v-if="stat.categoryDistribution.length" class="flex items-center gap-3">
            <DonutChart :segments="stat.categoryDistribution" />
            <ul class="min-w-0 flex-1 space-y-1 text-xs">
              <li
                v-for="(seg, i) in stat.categoryDistribution"
                :key="seg.label"
                class="flex items-center justify-between gap-2"
              >
                <span class="flex min-w-0 items-center gap-1.5 text-gray-700">
                  <span
                    class="h-2 w-2 shrink-0 rounded-full"
                    :style="{ background: dataVizGreens[i % dataVizGreens.length] }"
                  />
                  <span class="truncate">{{ seg.label }}</span>
                </span>
                <span class="shrink-0 font-mono text-gray-500">
                  <AnimatedNumber :value="seg.percent" suffix="%" :duration="640" />
                </span>
              </li>
            </ul>
          </div>
          <p v-else class="text-xs text-gray-500">此區尚無類別分布資料</p>
        </div>

        <p class="text-xs leading-relaxed text-gray-500">{{ stat.summary }}</p>
        <p class="text-xs text-gray-400">
          統計僅含平台已同步之立案資料；人口與學校鄰近度等指標待後續開放資料補齊。
        </p>
      </div>
    </div>
    <BottomTabBar />
  </div>
</template>
