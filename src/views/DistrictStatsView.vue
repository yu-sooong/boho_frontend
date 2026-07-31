<script setup lang="ts">
import DensityMap from '@/components/stats/DensityMap.vue'
import DistrictPickerSheet from '@/components/stats/DistrictPickerSheet.vue'
import DonutChart from '@/components/stats/DonutChart.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import CitySelect from '@/components/common/CitySelect.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import LogoSpinner from '@/components/common/LogoSpinner.vue'
import {
  getCityDistrictMap,
  getDistrictById,
  isValidDistrictId,
} from '@/data/districtMeta'
import { SITE_URL } from '@/config/site'
import { useCityStore } from '@/stores/cityStore'
import { useSchoolStore } from '@/stores/schoolStore'
import { useStatsStore } from '@/stores/statsStore'
import {
  buildDistrictStatView,
  buildStatsFromSchools,
  countByDistrictName,
  densityByDistrictName,
} from '@/utils/districtStatsView'
import { dataVizGreens, densityScale, densitySelectedColor } from '@/utils/dataVizColors'
import { Check, ChevronDown, Map as MapIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trackEvent } from '@/analytics'
import { usePageSeo } from '@/composables/usePageSeo'

const cityStore = useCityStore()
const schoolStore = useSchoolStore()
const route = useRoute()
const router = useRouter()
const store = useStatsStore()
const {
  summary: apiSummary,
  districtStats: apiDistrictStats,
  categoryStats: apiCategoryStats,
  districtCategoryStats: apiDistrictCategoryStats,
  isLoading,
  isLoadingDistrictCategories,
  error,
} = storeToRefs(store)

const cityMap = computed(() => getCityDistrictMap(cityStore.cityId))

usePageSeo(computed(() => {
  const cityName = cityStore.city?.name ?? cityMap.value.cityName
  return {
    title: `${cityName}地區教育情報 | 補亦樂乎`,
    description:
      `查看${cityName}各行政區立案補習班數量、公開稽查占比與類別分布；統計描述公開資料覆蓋，不代表區域或班所優劣。`,
    ogTitle: `${cityName}地區教育情報 | 補亦樂乎`,
    ogDescription: `${cityName}立案、稽查與類別分布一覽。`,
    ogUrl: `${SITE_URL}/district-stats`,
  }
}))

const mockBundle = computed(() => {
  if (!cityStore.isMock) return null
  return buildStatsFromSchools(schoolStore.allSchools, cityMap.value.districts)
})

const districtStats = computed(() =>
  cityStore.isMock ? (mockBundle.value?.districtStats ?? []) : apiDistrictStats.value,
)

const categoryStats = computed(() =>
  cityStore.isMock ? (mockBundle.value?.categoryStats ?? []) : apiCategoryStats.value,
)

const summary = computed(() =>
  cityStore.isMock ? (mockBundle.value?.summary ?? null) : apiSummary.value,
)

onMounted(() => {
  void store.loadAll(true)
})

watch(
  () => cityStore.cityId,
  (id) => {
    if (!id) return
    const map = getCityDistrictMap(id)
    router.replace({ query: { district: map.defaultId } })
    void store.loadAll(true)
  },
)

const selectedId = computed(() => {
  const q = route.query.district
  const fallback = cityMap.value.defaultId
  const id = typeof q === 'string' ? q : fallback
  return getDistrictById(cityStore.cityId, id).id
})

const selectedName = computed(
  () => getDistrictById(cityStore.cityId, selectedId.value).name,
)

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
    if (typeof q === 'string' && !isValidDistrictId(cityStore.cityId, q)) {
      router.replace({ query: { district: cityMap.value.defaultId } })
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

const catsForView = computed(() => {
  if (cityStore.isMock) {
    return mockBundle.value?.districtCategoryStats(selectedName.value) ?? categoryStats.value
  }
  return apiDistrictCategoryStats.value.length
    ? apiDistrictCategoryStats.value
    : categoryStats.value
})

const stat = computed(() =>
  buildDistrictStatView({
    districtId: selectedId.value,
    districtName: selectedName.value,
    cityName: cityMap.value.cityName,
    districtStats: districtStats.value,
    categoryStats: catsForView.value,
    summary: summary.value,
  }),
)

const pageLoading = computed(
  () => isLoading.value && !districtStats.value.length,
)

const cityWithPenalty = computed(() => summary.value?.withPenalty ?? 0)
const cityPenaltyShare = computed(() => {
  const total = summary.value?.totalActive ?? 0
  if (!total) return 0
  return Math.round((cityWithPenalty.value / total) * 1000) / 10
})

const selectedDistrictRow = computed(() =>
  districtStats.value.find((d) => d.district === selectedName.value) ?? null,
)

const districtWithPenalty = computed(() => selectedDistrictRow.value?.penaltyCount ?? 0)
const districtPenaltyShare = computed(() => {
  const total = selectedDistrictRow.value?.count ?? 0
  if (!total) return 0
  return Math.round((districtWithPenalty.value / total) * 1000) / 10
})

/** 行政區班數排行（完整表） */
const rankedDistricts = computed(() =>
  [...districtStats.value].sort((a, b) => b.count - a.count),
)

const pickerOpen = ref(false)

/** sheet 用：含 id，班數由多到少 */
const pickerItems = computed(() => {
  const byName = new Map(
    cityMap.value.districts.map((d) => [d.name, d.id] as const),
  )
  return rankedDistricts.value
    .map((d) => {
      const id = byName.get(d.district)
      if (!id) return null
      return { id, name: d.district, count: d.count }
    })
    .filter((d): d is { id: string; name: string; count: number } => d != null)
})

const selectedCount = computed(
  () => rankedDistricts.value.find((d) => d.district === selectedName.value)?.count ?? 0,
)

/** 全市班數排名（1 起；手機觸發列顯示，不佔額外區塊） */
const selectedRank = computed(() => {
  const i = rankedDistricts.value.findIndex((d) => d.district === selectedName.value)
  return i >= 0 ? i + 1 : null
})

/** 全市 vs 本區類別占比對照（取前 6） */
const categoryCompare = computed(() => {
  const city = categoryStats.value
  const district = catsForView.value
  const cityTotal = city.reduce((s, c) => s + c.count, 0) || 1
  const distTotal = district.reduce((s, c) => s + c.count, 0) || 1

  const labels = new Set<string>()
  for (const c of city.slice(0, 6)) labels.add(c.category)
  for (const c of district.slice(0, 6)) labels.add(c.category)

  const cityPctByCat = new globalThis.Map(
    city.map((c) => [c.category, (c.count / cityTotal) * 100] as const),
  )
  const distPctByCat = new globalThis.Map(
    district.map((c) => [c.category, (c.count / distTotal) * 100] as const),
  )

  return [...labels]
    .map((label) => ({
      label,
      cityPct: Math.round((cityPctByCat.get(label) ?? 0) * 10) / 10,
      districtPct: Math.round((distPctByCat.get(label) ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.districtPct - a.districtPct || b.cityPct - a.cityPct)
    .slice(0, 6)
})

function selectDistrict(id: string, method: 'map' | 'list' | 'picker' = 'list') {
  if (id !== selectedId.value) {
    trackEvent('stats_select_district', {
      city_id: cityStore.cityId ?? '',
      district_id: id,
      district_name: getDistrictById(cityStore.cityId, id).name,
      method,
    })
  }
  router.replace({ query: { district: id } })
}

function selectDistrictByName(name: string, method: 'map' | 'list' | 'picker' = 'list') {
  const found = cityMap.value.districts.find((d) => d.name === name)
  if (found) selectDistrict(found.id, method)
}

function onMapSelectDistrict(id: string) {
  selectDistrict(id, 'map')
}

function onPickerSelectDistrict(id: string) {
  selectDistrict(id, 'picker')
}

function onListSelectDistrict(name: string) {
  selectDistrictByName(name, 'list')
}

function goFind() {
  if (!cityStore.cityId) {
    void router.push({ name: 'dashboard', query: { needCity: '1' } })
    return
  }
  trackEvent('stats_open_map', {
    city_id: cityStore.cityId,
    district_id: selectedId.value,
    district_name: selectedName.value,
  })
  schoolStore.setMobileMode('map')
  void router.push({
    name: 'home',
    query: {
      district: selectedName.value,
      from: 'stats',
      statsDistrict: selectedId.value,
    },
  })
}
</script>

<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0">
    <AppHeader />
    <div class="mx-auto max-w-2xl pb-10 md:max-w-4xl">
      <div class="border-b border-gray-100 bg-white px-4 py-2.5 md:px-6">
        <CitySelect analytics-source="stats" />
      </div>
      <SubpageHeader :title="`${cityMap.cityName}教育情報`" />

      <div v-if="pageLoading" class="flex justify-center py-24">
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
          @click="store.loadAll(true)"
        >
          重新載入
        </button>
      </div>

      <div v-else class="space-y-4 px-4 pt-3 md:px-6">
        <!-- 全市只當背景脈絡，不搶本區焦點 -->
        <p v-if="summary" class="text-xs leading-relaxed text-gray-500">
          {{ cityMap.cityName }}全市
          <span class="font-medium tabular-nums text-gray-700">
            <AnimatedNumber :value="summary.totalActive" />
          </span>
          間立案
          <span class="text-gray-300">·</span>
          稽查約 {{ cityPenaltyShare }}%
          <span class="text-gray-300">·</span>
          {{ summary.districtCount }} 個行政區
        </p>

        <!-- 1. 選區（地圖＝工具） -->
        <div class="rounded-md border border-gray-200 p-3">
          <div class="mb-2 flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-gray-900">選行政區</h2>
              <p class="mt-0.5 text-xs text-gray-500">
                <span class="md:hidden">點地圖或右側選區</span>
                <span class="hidden md:inline">點地圖或右側列表切換</span>
              </p>
            </div>
            <button
              type="button"
              class="inline-flex max-w-[48%] shrink-0 flex-col items-stretch rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-left md:hidden"
              @click="pickerOpen = true"
            >
              <span class="flex items-center gap-1">
                <span
                  v-if="selectedRank"
                  class="shrink-0 text-[11px] tabular-nums text-gray-400"
                >#{{ selectedRank }}</span>
                <span class="min-w-0 truncate text-sm font-medium text-gray-900">{{ selectedName }}</span>
                <ChevronDown :size="14" class="ml-auto shrink-0 text-gray-400" />
              </span>
              <span class="mt-0.5 text-[11px] tabular-nums text-gray-500">
                {{ selectedCount }} 間・班數排序
              </span>
            </button>
          </div>

          <div class="md:grid md:grid-cols-[minmax(0,1fr)_13.5rem] md:items-stretch md:gap-3">
            <div class="-mx-3 md:mx-0 md:overflow-hidden md:rounded-md md:border md:border-gray-100">
              <DensityMap
                :key="cityStore.cityId ?? 'taichung'"
                :selected-id="selectedId"
                :districts="cityMap.districts"
                :view-box="cityMap.viewBox"
                :counts-by-name="countsByName"
                :density-by-name="densityByName"
                :city-average="cityAverage"
                @select="onMapSelectDistrict"
              />
            </div>

            <div class="mt-3 hidden md:mt-0 md:flex md:flex-col md:rounded-md md:border md:border-gray-100">
              <p class="border-b border-gray-100 px-2.5 py-2 text-xs font-medium text-gray-500">
                班數由多到少
              </p>
              <ul class="max-h-[22rem] flex-1 overflow-y-auto py-1">
                <li v-for="(d, idx) in rankedDistricts" :key="d.district">
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-gray-50"
                    :class="
                      d.district === selectedName
                        ? 'bg-primary-50 font-medium text-primary-900'
                        : 'text-gray-800'
                    "
                    @click="onListSelectDistrict(d.district)"
                  >
                    <span class="w-4 shrink-0 text-center text-[11px] text-gray-400">{{ idx + 1 }}</span>
                    <span class="min-w-0 flex-1 truncate">{{ d.district }}</span>
                    <span class="shrink-0 tabular-nums text-xs text-gray-500">{{ d.count }}</span>
                    <Check
                      v-if="d.district === selectedName"
                      :size="14"
                      class="shrink-0 text-primary-700"
                    />
                  </button>
                </li>
              </ul>
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

        <!-- 2. 本區重點：三欄固定列高，避免數字／圓點高低不齊 -->
        <section class="rounded-md border border-gray-200 p-3" aria-label="本區重點">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-gray-900">
              {{ selectedName }}重點
            </h2>
            <span
              v-if="selectedRank"
              class="text-xs tabular-nums text-gray-400"
            >班數第 {{ selectedRank }}</span>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-x-2 border-b border-gray-100 pb-3">
            <!-- 標籤列 -->
            <p class="text-[11px] leading-4 text-gray-500">立案</p>
            <p class="text-[11px] leading-4 text-gray-500">資源充沛</p>
            <p class="text-[11px] leading-4 text-gray-500">公開稽查</p>

            <!-- 主值列：固定高度、垂直置中 -->
            <p class="mt-1.5 flex h-8 items-center text-xl font-semibold leading-none tabular-nums text-gray-900">
              <AnimatedNumber :value="stat.totalSchools" />
            </p>
            <div class="mt-1.5 flex h-8 items-center gap-1" aria-label="充沛度">
              <span
                v-for="n in 5"
                :key="n"
                class="h-2.5 w-2.5 shrink-0 rounded-full"
                :class="n <= stat.densityLevel ? 'bg-primary-700' : 'border border-gray-300 bg-white'"
              />
            </div>
            <p class="mt-1.5 flex h-8 items-center text-xl font-semibold leading-none tabular-nums text-gray-900">
              <AnimatedNumber :value="districtWithPenalty" />
            </p>

            <!-- 說明列：固定兩行高度 -->
            <p class="mt-1.5 h-8 text-[11px] leading-4 text-gray-500">
              占全市
              <AnimatedNumber :value="stat.shareOfCityPercent" :decimals="1" suffix="%" />
            </p>
            <p class="mt-1.5 h-8 text-[11px] leading-4 text-gray-500">
              約平均
              <AnimatedNumber :value="stat.densityRatioToAverage" :decimals="1" />
              倍
            </p>
            <p class="mt-1.5 h-8 text-[11px] leading-4 text-gray-500">
              本區 {{ districtPenaltyShare }}%
              <template v-if="summary"><br />全市 {{ cityPenaltyShare }}%</template>
            </p>
          </div>

          <button
            type="button"
            class="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800"
            @click="goFind"
          >
            <MapIcon :size="16" stroke-width="1.75" />
            在地圖看{{ selectedName }}
          </button>
        </section>

        <!-- 類別：合併一卡，桌面左右並排、高度跟隨內容（不拉高留白） -->
        <div class="rounded-md border border-gray-200 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-gray-800">類別分布</h2>
            <span
              v-if="!cityStore.isMock && isLoadingDistrictCategories"
              class="text-xs text-gray-500"
            >更新中…</span>
          </div>
          <p class="mb-3 text-xs text-gray-500">
            本區占比與全市對照（一間班可屬多個類別，加總可能超過 100%）
          </p>

          <div
            v-if="stat.categoryDistribution.length || categoryCompare.length"
            class="flex flex-col gap-4 md:flex-row md:items-start md:gap-6"
          >
            <div
              v-if="stat.categoryDistribution.length"
              class="flex shrink-0 items-center gap-3 md:w-[240px]"
            >
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
                  <span class="shrink-0 tabular-nums text-gray-500">{{ seg.percent }}%</span>
                </li>
              </ul>
            </div>

            <ul v-if="categoryCompare.length" class="min-w-0 flex-1 space-y-2.5">
              <li v-for="row in categoryCompare" :key="row.label">
                <div class="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span class="font-medium text-gray-800">{{ row.label }}</span>
                  <span class="tabular-nums text-gray-500">
                    本區 {{ row.districtPct }}% · 全市 {{ row.cityPct }}%
                  </span>
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="w-8 shrink-0 text-[10px] text-gray-400">本區</span>
                    <div class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        class="h-full rounded-full bg-primary-700"
                        :style="{ width: `${Math.min(100, Math.max(row.districtPct, row.districtPct > 0 ? 2 : 0))}%` }"
                      />
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-8 shrink-0 text-[10px] text-gray-400">全市</span>
                    <div class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        class="h-full rounded-full bg-gray-400"
                        :style="{ width: `${Math.min(100, Math.max(row.cityPct, row.cityPct > 0 ? 2 : 0))}%` }"
                      />
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <p v-else class="text-xs text-gray-500">此區尚無類別分布資料</p>
        </div>

        <p class="text-xs text-gray-400">
          統計僅含已同步之立案與稽查公開資料。稽查占比為「有至少一筆公開稽查紀錄」的班數比例；占比僅描述資料覆蓋，不代表區域或班所優劣，亦不構成推薦。
        </p>
      </div>
    </div>
    <DistrictPickerSheet
      v-model="pickerOpen"
      :selected-id="selectedId"
      :items="pickerItems"
      @select="onPickerSelectDistrict"
    />

    <BottomTabBar />
  </div>
</template>
