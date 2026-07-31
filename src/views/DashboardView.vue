<script setup lang="ts">
/**
 * 導覽入口：選縣市 → Top 捷徑篩選進地圖
 * 配色與全站一致（白底／gray／primary），不做獨立主題
 */
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import CityPickerSheet from '@/components/common/CityPickerSheet.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import Sk from '@/components/common/Sk.vue'
import SproutLogo from '@/components/common/SproutLogo.vue'
import type { ApiDistrictStat } from '@/api/types'
import { trackEvent } from '@/analytics'
import { useDetectedRegion } from '@/composables/useDetectedRegion'
import { usePageSeo } from '@/composables/usePageSeo'
import { SITE_URL } from '@/config/site'
import { type CityId } from '@/data/cities'
import { useCityStore } from '@/stores/cityStore'
import { useStatsStore } from '@/stores/statsStore'
import { addCityInterest, hasCityInterest } from '@/utils/cityInterest'
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Compass,
  Filter,
  Map,
  MapPin,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

usePageSeo({
  title: '導覽｜補亦樂乎',
  description: '選擇縣市後用地圖找立案補習班。',
  ogTitle: '補亦樂乎｜導覽',
  ogDescription: '先選範圍，再用地圖找班。',
  ogUrl: `${SITE_URL}/`,
})

const TOP_N = 5

const cityStore = useCityStore()
const statsStore = useStatsStore()
const router = useRouter()
const route = useRoute()
const { region, isLoading: locating, error: locateError, detect } = useDetectedRegion({
  auto: true,
})

const pickerOpen = ref(false)
const onlyPenalty = ref(false)
const ctaArrowNudge = ref(false)
let ctaArrowNudgeTimer: ReturnType<typeof setTimeout> | null = null
const rankTab = ref<'district' | 'category'>('district')
const needCityHint = computed(() => route.query.needCity === '1')
const interestSaved = ref(false)
const statsLoading = computed(
  () => statsStore.isLoading && statsStore.districtStats.length === 0,
)

function nudgeCtaArrow() {
  if (!cityStore.cityId) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctaArrowNudge.value = false
  // 強制重播：先卸再掛 class
  requestAnimationFrame(() => {
    ctaArrowNudge.value = true
    if (ctaArrowNudgeTimer) clearTimeout(ctaArrowNudgeTimer)
    ctaArrowNudgeTimer = setTimeout(() => {
      ctaArrowNudge.value = false
      ctaArrowNudgeTimer = null
    }, 700)
  })
}

function toggleOnlyPenalty() {
  onlyPenalty.value = !onlyPenalty.value
  nudgeCtaArrow()
}

watch(
  region,
  (r) => {
    if (!r) return
    interestSaved.value = hasCityInterest(r.name)
    if (r.supported && r.cityId && !cityStore.cityId) {
      cityStore.completeOnboarding(r.cityId)
    }
  },
  { immediate: true },
)

const unsupported = computed(() => !!(region.value && !region.value.supported))
const cityName = computed(() => cityStore.city?.name ?? '')

const nearbyCityId = computed(() =>
  region.value?.supported ? region.value.cityId : null,
)
const nearbyLabel = computed(() =>
  region.value?.supported ? region.value.name : null,
)

const allDistricts = computed(() => statsStore.districtStats)

const topDistricts = computed(() => {
  const list = [...allDistricts.value]
  if (onlyPenalty.value) {
    return list
      .filter((d) => (d.penaltyCount ?? 0) > 0)
      .sort((a, b) => (b.penaltyCount ?? 0) - (a.penaltyCount ?? 0))
      .slice(0, TOP_N)
  }
  return list.sort((a, b) => b.count - a.count).slice(0, TOP_N)
})

const topCategories = computed(() => {
  const cats = statsStore.categoryStats
  return [...cats].sort((a, b) => b.count - a.count).slice(0, TOP_N)
})

const citySchoolTotal = computed(() => {
  if (!allDistricts.value.length) return 0
  return allDistricts.value.reduce((sum, d) => sum + d.count, 0)
})

const districtRankTitle = computed(() =>
  onlyPenalty.value ? '公開稽查筆數較多行政區' : '班數較多行政區',
)

const maxDistrictMetric = computed(() => {
  const first = topDistricts.value[0]
  if (!first) return 1
  return onlyPenalty.value ? Math.max(first.penaltyCount ?? 1, 1) : Math.max(first.count, 1)
})

const maxCategoryMetric = computed(() => Math.max(topCategories.value[0]?.count ?? 1, 1))

function districtMetric(d: ApiDistrictStat) {
  return onlyPenalty.value ? (d.penaltyCount ?? 0) : d.count
}

function setRankTab(next: 'district' | 'category') {
  if (next === rankTab.value) return
  rankTab.value = next
}

watch(
  () => cityStore.city?.name,
  (name) => {
    if (name) void statsStore.loadShortcuts()
  },
  { immediate: true },
)

function pickCity(id: CityId) {
  cityStore.completeOnboarding(id)
  trackEvent('select_city', { city_id: id, source: 'dashboard' })
}

function openPicker() {
  pickerOpen.value = true
}

function goFind(extra?: Record<string, string>) {
  if (!cityStore.cityId) {
    void router.replace({ name: 'dashboard', query: { needCity: '1' } })
    openPicker()
    return
  }
  const query: Record<string, string> = { ...extra }
  if (onlyPenalty.value) query.penalty = '1'
  void router.push({ name: 'home', query })
}

function goDistrict(d: string) {
  trackEvent('dashboard_rank_tap', { type: 'district', value: d, penalty: onlyPenalty.value })
  goFind({ district: d })
}

function goCategory(cat: string) {
  trackEvent('dashboard_rank_tap', { type: 'category', value: cat, penalty: onlyPenalty.value })
  goFind({ category: cat })
}

function goStats() {
  if (!cityStore.cityId) {
    void router.replace({ name: 'dashboard', query: { needCity: '1' } })
    openPicker()
    return
  }
  void router.push({ name: 'district-stats' })
}

function notifyInterest() {
  const name = region.value?.name
  if (!name) return
  const added = addCityInterest(name)
  interestSaved.value = true
  trackEvent('city_interest', { region: name, newly_added: added })
}

const swipeX = ref<number | null>(null)
function onSwipeStart(e: TouchEvent) {
  swipeX.value = e.changedTouches[0]?.clientX ?? null
}
function onSwipeEnd(e: TouchEvent) {
  const start = swipeX.value
  swipeX.value = null
  if (start == null) return
  const end = e.changedTouches[0]?.clientX
  if (end == null) return
  const dx = end - start
  if (Math.abs(dx) < 48) return
  if (dx < 0) setRankTab('category')
  else setRankTab('district')
}

onMounted(() => {
  const warm = () => {
    void import('@/views/HomeView.vue')
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(warm, { timeout: 2500 })
  } else {
    setTimeout(warm, 1200)
  }
})
</script>

<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0">
    <AppHeader />

    <main class="mx-auto max-w-lg px-4 pb-12 pt-5 md:max-w-xl md:px-6 md:pt-8">
      <header class="mb-5">
        <div class="flex items-center gap-2.5">
          <SproutLogo svg-class="h-9 w-9 shrink-0" />
          <div class="min-w-0">
            <h1 class="font-heading text-lg font-bold tracking-tight text-gray-900">補亦樂乎</h1>
            <p class="text-xs text-gray-500">選縣市，用地圖找班</p>
          </div>
        </div>
      </header>

      <p
        v-if="needCityHint"
        class="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900"
      >
        請先選擇縣市
      </p>

      <section
        v-if="unsupported && region"
        class="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3.5 py-3"
        aria-live="polite"
      >
        <p class="text-sm font-semibold text-sky-950">偵測到你在{{ region.name }}</p>
        <p class="mt-0.5 text-xs leading-relaxed text-sky-900/80">
          尚未上線，可先選已開放縣市，或留下通知。
        </p>
        <button
          type="button"
          class="mt-2.5 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-sky-200 bg-white text-sm font-medium text-sky-900 disabled:opacity-60 sm:w-auto sm:px-4"
          :disabled="interestSaved"
          @click="notifyInterest"
        >
          <Bell :size="15" />
          {{ interestSaved ? '已記錄通知' : `通知我${region.name}上線` }}
        </button>
      </section>

      <p v-else-if="locating" class="mb-4 text-xs text-gray-400">確認所在縣市…</p>
      <p
        v-else-if="locateError && !region"
        class="mb-4 text-xs text-gray-500"
      >
        {{ locateError }}
        <button type="button" class="ml-1 font-medium text-primary-700 underline" @click="detect(true)">
          重試
        </button>
      </p>

      <section class="space-y-3" aria-label="出發找班">
        <div class="overflow-hidden rounded-md border border-gray-200">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-gray-50 active:bg-gray-50"
            :aria-expanded="pickerOpen"
            aria-haspopup="dialog"
            @click="openPicker"
          >
            <MapPin :size="18" stroke-width="1.75" class="shrink-0 text-gray-400" aria-hidden="true" />
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] font-medium text-gray-900">選擇縣市</span>
              <span
                v-if="cityName && citySchoolTotal > 0"
                class="mt-0.5 block text-[11px] text-gray-500"
              >
                約
                <AnimatedNumber :value="citySchoolTotal" class="font-medium text-gray-600" />
                間立案
              </span>
            </span>
            <span class="max-w-[40%] truncate text-sm text-gray-700">
              {{ cityStore.city?.name ?? '請選擇' }}
            </span>
            <ChevronRight :size="16" class="shrink-0 text-gray-300" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 border-t border-gray-100 px-3.5 py-3 text-left hover:bg-gray-50 active:bg-gray-50 disabled:opacity-50"
            :disabled="!cityStore.cityId"
            :aria-pressed="onlyPenalty"
            @click="toggleOnlyPenalty"
          >
            <Filter
              :size="18"
              stroke-width="1.75"
              class="shrink-0"
              :class="onlyPenalty ? 'text-amber-700' : 'text-gray-400'"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] font-medium text-gray-900">只顯示有公開稽查紀錄</span>
              <span class="block text-[11px] text-gray-500">進地圖與下方捷徑時一併套用</span>
            </span>
            <span
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
              :class="onlyPenalty ? 'bg-amber-600' : 'bg-gray-200'"
              aria-hidden="true"
            >
              <span
                class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                :class="onlyPenalty ? 'left-[1.35rem]' : 'left-0.5'"
              />
            </span>
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 border-t border-gray-100 px-3.5 py-3.5 text-left transition-colors"
            :class="
              cityStore.cityId
                ? 'hover:bg-primary-50/60 active:bg-primary-50'
                : 'opacity-60'
            "
            @click="cityStore.cityId ? goFind() : openPicker()"
          >
            <Map
              :size="18"
              stroke-width="1.75"
              class="shrink-0"
              :class="cityStore.cityId ? 'text-primary-700' : 'text-gray-400'"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1">
              <span
                class="block text-[13px] font-semibold"
                :class="cityStore.cityId ? 'text-primary-800' : 'text-gray-500'"
              >
                {{ cityStore.cityId ? '前往地圖找班' : '請先選擇縣市' }}
              </span>
              <span class="block text-[11px] text-gray-500">
                {{ cityStore.cityId ? '打開列表與地圖' : '選完縣市後再進來' }}
              </span>
            </span>
            <ArrowRight
              :size="18"
              stroke-width="2"
              class="cta-go-arrow shrink-0"
              :class="[
                cityStore.cityId ? 'text-primary-700' : 'text-gray-300',
                ctaArrowNudge ? 'cta-go-arrow--nudge' : '',
              ]"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      <section v-if="cityStore.cityId" class="mt-8" aria-label="熱門篩選排名">
        <div class="mb-3">
          <h2 class="text-sm font-semibold text-gray-900">熱門篩選 Top {{ TOP_N }}</h2>
          <p class="mt-0.5 text-xs text-gray-500">
            點選進地圖 · 左右滑切換
            <span v-if="statsLoading"> · 載入中</span>
          </p>
        </div>

        <div
          class="mb-3 flex gap-5 border-b border-gray-100"
          role="tablist"
          aria-label="排名類型"
        >
          <button
            type="button"
            role="tab"
            class="-mb-px border-b-2 pb-2 text-sm transition-colors"
            :class="
              rankTab === 'district'
                ? 'border-primary-700 font-semibold text-gray-900'
                : 'border-transparent font-medium text-gray-400 hover:text-gray-600'
            "
            :aria-selected="rankTab === 'district'"
            @click="setRankTab('district')"
          >
            行政區
          </button>
          <button
            type="button"
            role="tab"
            class="-mb-px border-b-2 pb-2 text-sm transition-colors"
            :class="
              rankTab === 'category'
                ? 'border-primary-700 font-semibold text-gray-900'
                : 'border-transparent font-medium text-gray-400 hover:text-gray-600'
            "
            :aria-selected="rankTab === 'category'"
            @click="setRankTab('category')"
          >
            類別
          </button>
        </div>

        <div
          class="touch-pan-y"
          @touchstart.passive="onSwipeStart"
          @touchend.passive="onSwipeEnd"
        >
          <div
            v-show="rankTab === 'district'"
            role="tabpanel"
            class="overflow-hidden rounded-md border border-gray-200"
          >
            <p class="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
              {{ districtRankTitle }}
              <span v-if="onlyPenalty" class="text-amber-800"> · 已套用稽查篩選</span>
            </p>
            <ul
              v-if="statsLoading"
              class="divide-y divide-gray-100"
              aria-busy="true"
              aria-label="行政區排名載入中"
            >
              <li v-for="i in TOP_N" :key="`d-sk-${i}`" class="flex min-h-14 items-center gap-3 px-3 py-2.5">
                <Sk class="h-4 w-4 shrink-0" />
                <span class="min-w-0 flex-1 space-y-2">
                  <Sk class="h-4 w-24" />
                  <Sk class="h-1.5 w-full rounded-full" />
                </span>
                <Sk class="h-4 w-8 shrink-0" />
              </li>
            </ul>
            <ol v-else-if="topDistricts.length" class="divide-y divide-gray-100">
              <li v-for="(d, idx) in topDistricts" :key="d.district">
                <button
                  type="button"
                  class="flex w-full min-h-14 items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                  @click="goDistrict(d.district)"
                >
                  <span
                    class="w-6 shrink-0 text-center font-mono text-sm font-semibold tabular-nums"
                    :class="idx < 3 ? 'text-primary-700' : 'text-gray-400'"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-gray-900">{{ d.district }}</span>
                    <span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <span
                        class="block h-full rounded-full"
                        :class="onlyPenalty ? 'bg-amber-500' : 'bg-primary-600'"
                        :style="{ width: `${Math.round((districtMetric(d) / maxDistrictMetric) * 100)}%` }"
                      />
                    </span>
                  </span>
                  <span class="shrink-0 text-right text-xs text-gray-500">
                    <template v-if="onlyPenalty">
                      <AnimatedNumber
                        :value="d.penaltyCount ?? 0"
                        class="text-sm font-semibold text-gray-800"
                      />
                      <span class="block text-[10px] text-amber-700">公開稽查</span>
                    </template>
                    <template v-else>
                      <AnimatedNumber :value="d.count" class="text-sm font-semibold text-gray-800" />
                      <span class="block text-[10px] text-gray-400">間</span>
                    </template>
                  </span>
                  <ChevronRight :size="16" class="shrink-0 text-gray-300" />
                </button>
              </li>
            </ol>
            <p v-else class="px-3 py-6 text-center text-xs text-gray-400">
              {{ onlyPenalty ? '此縣市暫無稽查排名資料' : '暫時無法載入行政區排名' }}
            </p>
          </div>

          <div
            v-show="rankTab === 'category'"
            role="tabpanel"
            class="overflow-hidden rounded-md border border-gray-200"
          >
            <p class="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
              班數較多類別
              <span v-if="onlyPenalty" class="text-amber-800"> · 進地圖後套用稽查篩選</span>
            </p>
            <ul
              v-if="statsLoading"
              class="divide-y divide-gray-100"
              aria-busy="true"
              aria-label="類別排名載入中"
            >
              <li v-for="i in TOP_N" :key="`c-sk-${i}`" class="flex min-h-14 items-center gap-3 px-3 py-2.5">
                <Sk class="h-4 w-4 shrink-0" />
                <span class="min-w-0 flex-1 space-y-2">
                  <Sk class="h-4 w-28" />
                  <Sk class="h-1.5 w-full rounded-full" />
                </span>
                <Sk class="h-4 w-8 shrink-0" />
              </li>
            </ul>
            <ol v-else-if="topCategories.length" class="divide-y divide-gray-100">
              <li v-for="(c, idx) in topCategories" :key="c.category">
                <button
                  type="button"
                  class="flex w-full min-h-14 items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                  @click="goCategory(c.category)"
                >
                  <span
                    class="w-6 shrink-0 text-center font-mono text-sm font-semibold tabular-nums"
                    :class="idx < 3 ? 'text-primary-700' : 'text-gray-400'"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-gray-900">{{ c.category }}</span>
                    <span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <span
                        class="block h-full rounded-full bg-primary-600"
                        :style="{ width: `${Math.round((c.count / maxCategoryMetric) * 100)}%` }"
                      />
                    </span>
                  </span>
                  <span class="shrink-0 text-right text-xs text-gray-500">
                    <AnimatedNumber :value="c.count" class="text-sm font-semibold text-gray-800" />
                    <span class="block text-[10px] text-gray-400">間</span>
                  </span>
                  <ChevronRight :size="16" class="shrink-0 text-gray-300" />
                </button>
              </li>
            </ol>
            <p v-else class="px-3 py-6 text-center text-xs text-gray-400">
              暫時無法載入類別排名
            </p>
          </div>
        </div>

        <button
          type="button"
          class="mt-3 flex w-full min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3 text-left text-sm text-gray-600 hover:bg-gray-50"
          @click="goStats"
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
            <Compass :size="15" />
          </span>
          <span class="min-w-0 flex-1">
            要看完整占比與密度？開{{ cityName }}地區情報
          </span>
          <ChevronRight :size="16" class="shrink-0 text-gray-300" />
        </button>
      </section>

      <p class="mt-10 text-[11px] leading-relaxed text-gray-400">
        資料來自主管機關公開資訊；就讀經驗經審核後刊登。不販售置頂、不以付費刪改評價。
      </p>
    </main>

    <CityPickerSheet
      v-model="pickerOpen"
      :selected-id="cityStore.cityId"
      :nearby-city-id="nearbyCityId"
      :nearby-label="nearbyLabel"
      @select="pickCity"
    />

    <BottomTabBar />
  </div>
</template>

<style scoped>
@keyframes cta-go-nudge {
  0% {
    transform: translateX(0);
    opacity: 1;
    filter: brightness(1);
  }
  18% {
    transform: translateX(5px);
    opacity: 0.35;
    filter: brightness(1.35);
  }
  36% {
    transform: translateX(-3px);
    opacity: 1;
    filter: brightness(1);
  }
  54% {
    transform: translateX(6px);
    opacity: 0.45;
    filter: brightness(1.4);
  }
  72% {
    transform: translateX(0);
    opacity: 1;
    filter: brightness(1.15);
  }
  100% {
    transform: translateX(0);
    opacity: 1;
    filter: brightness(1);
  }
}

.cta-go-arrow--nudge {
  animation: cta-go-nudge 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .cta-go-arrow--nudge {
    animation: none;
  }
}
</style>
