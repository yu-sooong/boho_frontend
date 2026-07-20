<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MapPanel from '@/components/home/MapPanel.vue'
import SchoolCard from '@/components/home/SchoolCard.vue'
import SchoolPreviewPanel from '@/components/home/SchoolPreviewPanel.vue'
import SearchFilterBar from '@/components/home/SearchFilterBar.vue'
import FilterPanel from '@/components/home/FilterPanel.vue'
import Sk from '@/components/common/Sk.vue'
import { trackEvent } from '@/analytics'
import { SITE_URL } from '@/config/site'
import { useDebounceFn } from '@/composables/useDebounce'
import { maybeStartHomeTour } from '@/composables/useHomeTour'
import { usePageSeo } from '@/composables/usePageSeo'
import { useSchoolStore } from '@/stores/schoolStore'
import { MapPin, Search } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

usePageSeo({
  title: '補亦樂乎 | 台中市補習班地圖查詢・公開資訊・家長評價',
  description:
    '免費查詢台中市近 3,000 間立案補習班，地圖找班、立案狀態核查、稽查紀錄查詢、真實家長評價，報名前先查，讓孩子上到有保障的補習班。',
  ogTitle: '補亦樂乎 | 台中市補習班地圖查詢',
  ogDescription:
    '免費查詢台中市近 3,000 間立案補習班，地圖找班、立案狀態核查、稽查紀錄查詢、真實家長評價，報名前先查。',
  ogUrl: `${SITE_URL}/`,
})

const store = useSchoolStore()
const router = useRouter()

const scrolled = ref(false)
const filterOpen = ref(false)
const listSheetOpen = ref(false)   // 手機地圖模式：查看列表 Sheet
const mapPanelRef = ref<InstanceType<typeof MapPanel> | null>(null)
/** 地圖圖層是否已就緒（供 e2e / 返回還原使用） */
const mapReady = ref(false)

// ── 地圖預覽面板（不進 store：進詳情後應關閉，不在返回時重開）────────────────
const showPreview = ref(false)

/** 從 sortedSchools 找選中的學校（含距離資訊） */
const previewSchool = computed(() =>
  store.selectedSchoolId
    ? (store.sortedSchools.find((s) => s.id === store.selectedSchoolId) ??
       store.allSchools.find((s) => s.id === store.selectedSchoolId) ??
       null)
    : null,
)

/** 地圖圖釘點擊（只有這個操作才打開預覽） */
function onMapSelect(id: string) {
  store.setSelectedSchool(id)
  showPreview.value = true
  trackEvent('select_map_pin', { school_id: id })
}

/** 關閉預覽，清除選中 */
function closePreview() {
  showPreview.value = false
  store.setSelectedSchool(null)
}

/** 前往詳情頁（關閉預覽，避免返回時卡在預覽層） */
function goToDetail(id: string, source: 'list' | 'preview' = 'list') {
  showPreview.value = false
  trackEvent('select_school', { school_id: id, source })
  void router.push(`/schools/${id}`)
}

const trackSearch = useDebounceFn(() => {
  const kw = store.keyword.trim()
  if (kw.length < 2) return
  trackEvent('search_schools', {
    keyword_length: kw.length,
    result_count: store.totalFiltered,
  })
}, 600)

watch(
  () => store.keyword,
  () => trackSearch(),
)

watch(
  [() => store.selectedDistricts.slice(), () => store.selectedCategories.slice()],
  ([districts, categories]) => {
    if (districts.length === 0 && categories.length === 0) return
    trackEvent('apply_filter', {
      district_count: districts.length,
      category_count: categories.length,
      result_count: store.totalFiltered,
    })
  },
  { deep: true },
)

// ── 是否有篩選條件 ───────────────────────────────────────────────────────────
const hasActiveFilter = computed(
  () =>
    store.selectedDistricts.length > 0 ||
    store.selectedCategories.length > 0 ||
    store.keyword.length >= 2,
)

const mapSchools = computed(() =>
  hasActiveFilter.value ? store.filteredMapPins : store.allMapPins,
)

// ── 篩選變動時 fitBounds ─────────────────────────────────────────────────────
watch(
  [() => store.keyword, () => store.selectedDistricts, () => store.selectedCategories],
  () => {
    // 篩選變動時關閉預覽與列表 Sheet
    if (showPreview.value) closePreview()
    listSheetOpen.value = false

    if (hasActiveFilter.value && store.filteredMapPins.length > 0) {
      nextTick(() => mapPanelRef.value?.fitToSchools(store.filteredMapPins))
    } else if (!hasActiveFilter.value) {
      nextTick(() => mapPanelRef.value?.flyToUser())
    }
  },
  { deep: true },
)

/**
 * 地圖就緒後還原視角（從詳情頁返回時 MapPanel 會重建）
 * A：不重開預覽面板；僅還原地圖視角與圖釘高亮
 * 優先：已選補習班座標 → 篩選結果 → 使用者附近
 */
function onMapReady() {
  mapReady.value = true
  restoreMapView()
  tryStartTour()
}

function tryStartTour() {
  maybeStartHomeTour({
    ensureListMode: () => {
      if (store.mobileMode === 'map') store.setMobileMode('list')
    },
    ensureMapVisible: () => {},
    isReady: () => !store.isLoadingAll && store.allSchools.length > 0,
  })
}

function restoreMapView() {
  // 確保返回時不會停在預覽層
  showPreview.value = false

  if (store.selectedSchoolId) {
    const school =
      store.sortedSchools.find((s) => s.id === store.selectedSchoolId) ??
      store.allSchools.find((s) => s.id === store.selectedSchoolId)
    if (school && school.lng !== 0 && school.lat !== 0) {
      nextTick(() => mapPanelRef.value?.fitToSchools([school]))
      return
    }
  }

  if (hasActiveFilter.value && store.filteredMapPins.length > 0) {
    nextTick(() => mapPanelRef.value?.fitToSchools(store.filteredMapPins))
    return
  }

  if (store.userLat != null && store.userLng != null) {
    nextTick(() => mapPanelRef.value?.flyToUser())
  }
}

onMounted(() => {
  store.loadAll()
  tryStartTour()

  // DEV / e2e：暴露 UI 狀態，方便 Playwright 重現導航問題（不進 production build 行為）
  if (import.meta.env.DEV) {
    ;(window as unknown as { __e2eHome?: object }).__e2eHome = {
      openPreview(id: string) {
        store.setSelectedSchool(id)
        showPreview.value = true
      },
      goToDetail: (id: string) => goToDetail(id),
      setMobileMode(mode: 'list' | 'map') {
        store.setMobileMode(mode)
      },
      setDistricts(districts: string[]) {
        store.setDistricts(districts)
      },
      availableDistricts() {
        return [...store.districts]
      },
      firstSchoolId() {
        return store.displaySchools[0]?.id ?? null
      },
      getState() {
        return {
          showPreview: showPreview.value,
          mobileMode: store.mobileMode,
          mapReady: mapReady.value,
          selectedSchoolId: store.selectedSchoolId,
          districts: [...store.selectedDistricts],
          categories: [...store.selectedCategories],
          keyword: store.keyword,
          userLat: store.userLat,
          userLng: store.userLng,
          filterCount: store.totalFiltered,
        }
      },
    }
  }
})

function onListScroll(e: Event) {
  const target = e.target as HTMLElement
  scrolled.value = target.scrollTop > 4
  const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 240
  if (nearBottom && store.hasMore) store.showMore()
}

function onListSheetScroll(e: Event) {
  const target = e.target as HTMLElement
  const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200
  if (nearBottom && store.hasMore) store.showMore()
}

function onFilterApply({ districts, categories }: { districts: string[]; categories: string[] }) {
  store.setDistricts(districts)
  store.setCategories(categories)
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <AppHeader />

    <div class="flex flex-1 overflow-hidden">
      <!-- ── 桌面左欄：列表 or 預覽面板 ── -->
      <div
        class="flex w-full flex-col overflow-hidden md:w-[40%] md:border-r md:border-gray-200"
        :class="store.mobileMode === 'map' ? 'hidden md:flex' : 'flex'"
      >
        <Transition name="panel-slide" mode="out-in">
          <!-- ── 預覽面板（桌面） ── -->
          <div v-if="showPreview && previewSchool" key="preview" class="flex h-full flex-col overflow-hidden">
            <!-- 預覽頂部：返回列表按鈕 -->
            <div class="shrink-0 border-b border-gray-100 px-4 py-2">
              <button
                type="button"
                class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                @click="closePreview"
              >
                ← 返回列表
              </button>
            </div>
            <div class="flex-1 overflow-hidden">
              <SchoolPreviewPanel
                :school="previewSchool"
                @close="closePreview"
                @detail="(id) => goToDetail(id, 'preview')"
              />
            </div>
          </div>

          <!-- ── 列表面板 ── -->
          <div v-else key="list" class="flex h-full flex-col overflow-hidden">
            <header
              class="z-10 shrink-0 border-b px-4 py-3 transition-colors"
              :class="scrolled ? 'border-gray-200/60 bg-white/80 backdrop-blur-md' : 'border-transparent bg-white'"
            >
              <SearchFilterBar
                :keyword="store.keyword"
                :district="store.selectedDistricts.join(',')"
                :category="store.selectedCategories.join(',')"
                @update:keyword="store.setKeyword"
                @open-filter="filterOpen = true"
              />

              <div
                v-if="store.selectedDistricts.length || store.selectedCategories.length"
                class="mt-2 flex flex-wrap gap-1.5"
              >
                <button
                  v-for="d in store.selectedDistricts"
                  :key="d"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                  @click="store.removeDistrict(d)"
                >
                  {{ d }} ✕
                </button>
                <button
                  v-for="c in store.selectedCategories"
                  :key="c"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                  @click="store.removeCategory(c)"
                >
                  {{ c }} ✕
                </button>
                <button
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700"
                  @click="store.clearFilters()"
                >
                  全部清除
                </button>
              </div>

              <p
                v-if="!store.isLoadingAll && store.totalFiltered > 0"
                class="mt-1.5 text-xs text-gray-500"
              >
                共 {{ store.totalFiltered.toLocaleString() }} 間補習班
              </p>
            </header>

            <div
              data-tour="tour-list"
              class="flex-1 space-y-3 overflow-y-auto p-4"
              @scroll="onListScroll"
            >
              <div
                v-if="store.loadError"
                class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <p>資料載入失敗，請稍後再試。</p>
                <p v-if="store.loadError" class="mt-1 text-xs text-amber-700/80">{{ store.loadError }}</p>
                <button
                  type="button"
                  class="mt-2 font-medium text-primary-700 underline hover:text-primary-800"
                  @click="store.loadAll()"
                >
                  重新載入
                </button>
              </div>

              <Transition name="fade" mode="out-in">
                <div v-if="store.isLoadingAll" class="space-y-3">
                  <div v-for="i in 6" :key="i" class="space-y-3 rounded-md border border-gray-100 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <Sk class="h-5 w-40" />
                      <Sk class="h-5 w-10" />
                    </div>
                    <Sk class="h-4 w-full" />
                    <div class="flex gap-2 pt-1">
                      <Sk class="h-6 w-14 rounded-full" />
                      <Sk class="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>

                <div v-else class="space-y-3">
                  <EmptyState
                    v-if="store.totalFiltered === 0"
                    :icon="Search"
                    title="找不到符合條件的補習班"
                    description="試試換個關鍵字，或清除行政區／類別篩選後再搜尋。"
                  />

                  <SchoolCard
                    v-for="school in store.displaySchools"
                    :key="school.id"
                    :school="school"
                    :selected="school.id === store.selectedSchoolId"
                    @hover="(id) => store.setSelectedSchool(id)"
                  />

                  <div
                    v-if="store.hasMore"
                    class="flex items-center justify-center gap-2 py-4 text-sm text-gray-400"
                  >
                    <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                    載入更多中…
                  </div>

                  <p
                    v-if="!store.hasMore && store.displaySchools.length > 0"
                    class="py-2 text-center text-xs text-gray-500"
                  >
                    已顯示全部 {{ store.totalFiltered.toLocaleString() }} 間
                  </p>
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── 地圖區 ── -->
      <div
        data-tour="tour-map"
        class="relative w-full md:w-[60%]"
        :class="store.mobileMode === 'map' ? 'block' : 'hidden md:block'"
      >
        <MapPanel
          ref="mapPanelRef"
          :schools="mapSchools"
          :selected-id="store.selectedSchoolId"
          :user-lat="store.userLat"
          :user-lng="store.userLng"
          @select="onMapSelect"
          @located="(coords) => store.setUserCoords(coords.lat, coords.lng)"
          @ready="onMapReady"
        >
          <!-- 手機地圖模式：頂部搜尋列 + 已選篩選 chips -->
          <div class="absolute inset-x-0 top-0 p-4 md:hidden">
            <SearchFilterBar
              floating
              show-back
              :keyword="store.keyword"
              :district="store.selectedDistricts.join(',')"
              :category="store.selectedCategories.join(',')"
              @back="store.setMobileMode('list')"
              @update:keyword="store.setKeyword"
              @open-filter="filterOpen = true"
            />
            <!-- 已選 chips（地圖浮層版，半透明） -->
            <div
              v-if="store.selectedDistricts.length || store.selectedCategories.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <button
                v-for="d in store.selectedDistricts"
                :key="d"
                type="button"
                class="inline-flex items-center gap-1 rounded-md bg-white/85 px-2.5 py-1 text-xs font-medium text-primary-700 backdrop-blur-sm"
                @click="store.removeDistrict(d)"
              >
                {{ d }} ✕
              </button>
              <button
                v-for="c in store.selectedCategories"
                :key="c"
                type="button"
                class="inline-flex items-center gap-1 rounded-md bg-white/85 px-2.5 py-1 text-xs font-medium text-primary-700 backdrop-blur-sm"
                @click="store.removeCategory(c)"
              >
                {{ c }} ✕
              </button>
              <button
                type="button"
                class="rounded-full bg-black/30 px-2.5 py-1 text-xs text-white backdrop-blur-sm"
                @click="store.clearFilters()"
              >
                全部清除
              </button>
            </div>
          </div>

          <!-- 手機地圖模式：底部預覽 Sheet（點圖釘後出現） -->
          <Transition name="sheet-up">
            <div
              v-if="showPreview && previewSchool && store.mobileMode === 'map'"
              class="absolute inset-x-0 bottom-0 z-20 md:hidden"
            >
              <div
                class="absolute inset-x-0 bottom-0 top-[-200vh] bg-black/20"
                @click="closePreview"
              />
              <div class="relative z-10 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
                <div class="flex justify-center pt-2.5">
                  <div class="h-1 w-10 rounded-full bg-gray-300" />
                </div>
                <SchoolPreviewPanel
                  :school="previewSchool"
                  @close="closePreview"
                  @detail="(id) => goToDetail(id, 'preview')"
                />
              </div>
            </div>
          </Transition>

          <!-- 手機地圖模式：無預覽時，底部「查看列表」按鈕 + 列表 Sheet -->
          <template v-if="!showPreview && store.mobileMode === 'map'">
            <!-- 「查看 XX 間補習班」浮動按鈕 -->
            <div
              v-if="!listSheetOpen"
              class="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 md:hidden"
            >
              <button
                type="button"
                class="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-lg active:bg-gray-50"
                @click="listSheetOpen = true"
              >
                <span class="inline-block h-2.5 w-2.5 rounded-full bg-primary-600" />
                查看 {{ store.totalFiltered.toLocaleString() }} 間補習班
              </button>
            </div>

            <!-- 列表 Sheet（從下滑入） -->
            <Transition name="sheet-up">
              <div
                v-if="listSheetOpen"
                class="absolute inset-x-0 bottom-0 z-20 md:hidden"
              >
                <div
                  class="absolute inset-x-0 bottom-0 top-[-200vh] bg-black/20"
                  @click="listSheetOpen = false"
                />
                <div class="relative z-10 flex max-h-[72vh] flex-col rounded-t-2xl bg-white shadow-2xl">
                  <!-- Handle + 標題 -->
                  <div class="shrink-0 px-4 pb-3 pt-2.5">
                    <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-semibold text-gray-800">
                        {{ store.totalFiltered.toLocaleString() }} 間補習班
                      </span>
                      <button
                        type="button"
                        class="text-sm text-gray-400 hover:text-gray-600"
                        @click="listSheetOpen = false"
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                  <!-- 列表內容（可滾動） -->
                  <div class="flex-1 space-y-2.5 overflow-y-auto px-4 pb-6" @scroll="onListSheetScroll">
                    <EmptyState
                      v-if="store.totalFiltered === 0"
                      compact
                      :icon="Search"
                      title="找不到符合條件的補習班"
                      description="試試調整關鍵字或篩選條件"
                    />
                    <SchoolCard
                      v-for="school in store.displaySchools"
                      :key="school.id"
                      :school="school"
                      :selected="school.id === store.selectedSchoolId"
                      @hover="(id) => store.setSelectedSchool(id)"
                    />
                    <div
                      v-if="store.hasMore"
                      class="flex items-center justify-center gap-2 py-3 text-sm text-gray-400"
                    >
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                      載入更多中…
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </template>
        </MapPanel>
      </div>
    </div>

    <!-- 手機切換地圖按鈕 -->
    <button
      v-if="store.mobileMode === 'list'"
      type="button"
      data-tour="tour-map-btn"
      class="fixed bottom-20 right-4 z-20 flex items-center gap-1.5 rounded-full bg-primary-700 px-4 py-3 text-sm font-medium text-white shadow-lg md:hidden"
      @click="store.setMobileMode('map')"
    >
      <MapPin :size="16" />
      地圖
    </button>

    <BottomTabBar v-if="store.mobileMode === 'list'" />

    <FilterPanel
      :open="filterOpen"
      :selected-districts="store.selectedDistricts"
      :selected-categories="store.selectedCategories"
      :districts="store.districts"
      :categories="store.categories"
      @close="filterOpen = false"
      @apply="onFilterApply"
    />
  </div>
</template>

<style scoped>
/* 桌面左欄：列表 ↔ 預覽切換動畫 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.22s ease;
}
.panel-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

/* 手機底部 Sheet：從下滑入 */
.sheet-up-enter-active,
.sheet-up-leave-active {
  transition: transform 0.28s cubic-bezier(0.32, 0, 0.67, 0);
}
.sheet-up-enter-from,
.sheet-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
