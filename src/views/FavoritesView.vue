<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Sk from '@/components/common/Sk.vue'
import Tag from '@/components/common/Tag.vue'
import Toast from '@/components/common/Toast.vue'
import CompareTable from '@/components/favorites/CompareTable.vue'
import { trackEvent } from '@/analytics'
import { SITE_URL } from '@/config/site'
import { useFavorites } from '@/composables/useFavorites'
import { useGeolocation } from '@/composables/useGeolocation'
import { usePageSeo } from '@/composables/usePageSeo'
import { useSchoolStore } from '@/stores/schoolStore'
import type { School } from '@/types'
import { distanceKm, formatDistanceKm } from '@/utils/geo'
import { shareOrCopy } from '@/utils/share'
import { Columns2, Heart, MapPin, RotateCcw, Share2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

usePageSeo({
  title: '我的收藏 | 補亦樂乎',
  description: '收藏補習班並對照立案、地址與公開稽查等資訊。',
  robots: 'noindex',
})

const { favorites, ensureFavorites, toggleFavorite } = useFavorites()
const store = useSchoolStore()
const geo = useGeolocation()
const locating = geo.isLoading
const locateError = geo.error
const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const loadedSchools = ref<School[]>([])
const selectedIds = ref<string[]>([])
const showToast = ref(false)
const toastMessage = ref('')
const toastTone = ref<'success' | 'info'>('success')
let locateTried = false
let compareTrackedKey = ''
/** 使用者按「重新選擇」後，不要因剛好兩間收藏又自動選回去 */
let suppressAutoSelect = false
let loadGen = 0

function flashToast(message: string, tone: 'success' | 'info' = 'success') {
  toastMessage.value = message
  toastTone.value = tone
  showToast.value = true
  window.setTimeout(() => {
    showToast.value = false
  }, 2800)
}

async function requestUserLocation() {
  const coords = await geo.request()
  if (coords) store.setUserCoords(coords.lat, coords.lng)
  return coords
}

/** 對照／列表用：前端以使用者座標與班座標算距離 */
function liveDistance(s: School): string {
  if (store.userLat == null || store.userLng == null) return ''
  return formatDistanceKm(distanceKm(store.userLat, store.userLng, s.lat, s.lng))
}

function queryPair(): [string, string] | null {
  const qA = typeof route.query.a === 'string' ? route.query.a : ''
  const qB = typeof route.query.b === 'string' ? route.query.b : ''
  if (qA && qB && qA !== qB) return [qA, qB]
  return null
}

async function loadFavorites() {
  const gen = ++loadGen
  isLoading.value = true

  // 分享連結：先確認兩班存在，再寫入對方瀏覽器收藏（避免幽靈 id）
  const pair = queryPair()
  if (pair) {
    const shared = await Promise.all(pair.map((id) => store.ensureCached(id)))
    const okIds = shared.filter((s): s is School => s != null).map((s) => s.id)
    if (okIds.length === 2) {
      ensureFavorites(okIds, 'compare_share')
    }
  }

  const ids = [...favorites.value]
  const results = await Promise.all(ids.map((id) => store.ensureCached(id)))
  if (gen !== loadGen) return

  loadedSchools.value = results.filter((s): s is School => s != null)
  isLoading.value = false
  syncSelection()

  if (favorites.value.length >= 2 && !locateTried && store.userLat == null) {
    locateTried = true
    void requestUserLocation()
  }
}

function syncSelection() {
  const available = new Set(favorites.value)
  selectedIds.value = selectedIds.value.filter((id) => available.has(id))

  const pair = queryPair()
  if (pair && available.has(pair[0]) && available.has(pair[1])) {
    suppressAutoSelect = false
    selectedIds.value = [pair[0], pair[1]]
    return
  }

  // 剛清掉對照／網址時，不要自動再選滿兩間
  if (suppressAutoSelect) return

  if (selectedIds.value.length === 0 && favorites.value.length === 2) {
    selectedIds.value = [...favorites.value]
  }
}

watch(favorites, loadFavorites, { deep: true })
watch(
  () => [route.query.a, route.query.b] as const,
  (next, prev) => {
    // 僅在真正換了分享參數時重載；清掉 query 只重算選取
    if (next[0] === prev?.[0] && next[1] === prev?.[1]) return
    if (queryPair()) {
      void loadFavorites()
    } else {
      syncSelection()
    }
  },
)

onMounted(loadFavorites)

const favoriteSchools = computed(() =>
  loadedSchools.value.filter((s) => favorites.value.includes(s.id)),
)

const compareLeft = computed(() =>
  favoriteSchools.value.find((s) => s.id === selectedIds.value[0]) ?? null,
)
const compareRight = computed(() =>
  favoriteSchools.value.find((s) => s.id === selectedIds.value[1]) ?? null,
)

const canCompare = computed(
  () => !!(compareLeft.value && compareRight.value && selectedIds.value.length === 2),
)

function toggleSelect(id: string) {
  suppressAutoSelect = false
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    return
  }
  if (selectedIds.value.length >= 2) {
    selectedIds.value = [selectedIds.value[1], id]
    return
  }
  selectedIds.value = [...selectedIds.value, id]
}

function clearCompare() {
  suppressAutoSelect = true
  selectedIds.value = []
  if (route.query.a || route.query.b) {
    void router.replace({ name: 'favorites', query: {} })
  }
}

function syncCompareQuery() {
  if (!compareLeft.value || !compareRight.value) return
  const a = compareLeft.value.id
  const b = compareRight.value.id
  if (route.query.a === a && route.query.b === b) return
  void router.replace({ name: 'favorites', query: { a, b } })
}

async function shareCompare() {
  if (!compareLeft.value || !compareRight.value) return
  const a = compareLeft.value.id
  const b = compareRight.value.id
  const url = `${SITE_URL}/favorites?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
  const title = '兩班對照 | 補亦樂乎'
  const text = `對照「${compareLeft.value.name}」與「${compareRight.value.name}」的公開資料`
  const result = await shareOrCopy({ title, text, url })
  if (result === 'shared' || result === 'copied') {
    trackEvent('share_compare', {
      school_a: a,
      school_b: b,
      method: result,
    })
  }
  if (result === 'copied') flashToast('連結已複製')
  else if (result === 'failed') flashToast('分享失敗，請手動複製', 'info')
}

async function shareSchool(school: School) {
  const url = `${SITE_URL}/schools/${school.id}`
  const title = `${school.name} | 補亦樂乎`
  const text = `查看${school.name}的立案狀態、地址與就讀經驗`
  const result = await shareOrCopy({ title, text, url })
  if (result === 'shared' || result === 'copied') {
    trackEvent('share_school', { school_id: school.id, method: result, source: 'favorites' })
  }
  if (result === 'copied') flashToast('連結已複製')
  else if (result === 'failed') flashToast('分享失敗，請手動複製', 'info')
}

function onCompareFeedback(message: string, tone: 'success' | 'info' = 'success') {
  flashToast(message, tone)
}

watch(canCompare, (ok) => {
  if (ok && compareLeft.value && compareRight.value) {
    syncCompareQuery()
    const key = `${compareLeft.value.id}|${compareRight.value.id}`
    if (compareTrackedKey !== key) {
      compareTrackedKey = key
      trackEvent('compare_schools', {
        school_a: compareLeft.value.id,
        school_b: compareRight.value.id,
      })
    }
    if (!locateTried && store.userLat == null) {
      locateTried = true
      void requestUserLocation()
    }
  }
})

watch(selectedIds, () => {
  if (canCompare.value) syncCompareQuery()
})
</script>

<template>
  <div class="flex min-h-screen flex-col pb-20 md:pb-0">
    <AppHeader />
    <div class="mx-auto w-full max-w-2xl flex-1 px-3 py-4 sm:px-4 sm:py-5">
      <h1 class="font-heading text-xl font-bold text-gray-900 sm:text-2xl">我的收藏</h1>
      <p class="mt-1 text-sm text-gray-500">
        收藏只存在這個瀏覽器；換裝置或清除資料後會消失。
      </p>

      <!-- 兩班對照：0／1／2+ 都先露出 -->
      <section
        class="mt-4 rounded-md border border-gray-200 bg-white p-3 sm:mt-5 sm:p-4"
        data-testid="compare-panel"
      >
        <div class="flex items-start gap-2.5">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700"
          >
            <Columns2 :size="18" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="font-heading text-base font-bold text-gray-900">兩班對照</h2>
            <p class="mt-0.5 text-sm leading-relaxed text-gray-500">
              <span class="sm:hidden">並排看立案、地區、稽查等公開資料。不評分。</span>
              <span class="hidden sm:inline">
                並排看地區、類別、聯絡方式與有無公開稽查——方便決定要不要去現場。不評分、不排名。
              </span>
            </p>
          </div>
        </div>

        <div v-if="favoriteSchools.length === 0" class="mt-3">
          <p class="text-sm text-gray-600">收藏兩間後即可在此對照。</p>
          <RouterLink
            to="/find"
            class="mt-3 inline-flex min-h-10 items-center rounded-md bg-primary-700 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800"
          >
            去找班收藏
          </RouterLink>
        </div>

        <div v-else-if="favoriteSchools.length === 1" class="mt-3">
          <p class="text-sm text-gray-600">
            已收藏
            <span class="font-medium text-gray-800">{{ favoriteSchools[0].name }}</span>
            。再收藏一間即可對照。
          </p>
          <RouterLink
            to="/find"
            class="mt-3 inline-flex min-h-10 items-center rounded-md bg-primary-700 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800"
          >
            再找一間
          </RouterLink>
        </div>

        <div v-else class="mt-3 space-y-3">
          <p v-if="!canCompare" class="text-sm text-gray-600">
            請選兩間（已選 {{ selectedIds.length }}/2）
          </p>

          <div v-if="!canCompare" class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              v-for="school in favoriteSchools"
              :key="school.id"
              type="button"
              class="min-h-11 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-xs"
              :class="
                selectedIds.includes(school.id)
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50 sm:hover:border-gray-300'
              "
              @click="toggleSelect(school.id)"
            >
              {{ school.name }}
            </button>
          </div>

          <CompareTable
            v-if="canCompare && compareLeft && compareRight"
            :left="compareLeft"
            :right="compareRight"
            :locating="locating"
            :locate-error="locateError"
            @request-locate="requestUserLocation"
            @feedback="onCompareFeedback"
          />

          <div
            v-if="canCompare"
            class="grid grid-cols-2 gap-2"
            data-testid="compare-toolbar"
          >
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              @click="clearCompare"
            >
              <RotateCcw :size="15" class="text-gray-500" />
              重新選擇
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-primary-700 text-sm font-medium text-white transition-colors hover:bg-primary-800 active:bg-primary-800"
              data-testid="share-compare"
              @click="shareCompare"
            >
              <Share2 :size="15" />
              分享連結
            </button>
          </div>
        </div>
      </section>

      <Transition name="fade" mode="out-in">
        <div v-if="isLoading" class="mt-6 space-y-3">
          <div v-for="i in 3" :key="i" class="space-y-3 rounded-md border border-gray-100 p-4">
            <div class="flex items-start justify-between gap-3">
              <Sk class="h-5 w-48" />
              <Sk class="h-5 w-5 rounded-full" />
            </div>
            <Sk class="h-4 w-full" />
          </div>
        </div>

        <div v-else class="mt-6">
          <h2
            v-if="favoriteSchools.length"
            class="mb-3 text-sm font-semibold text-gray-800"
          >
            收藏清單（{{ favoriteSchools.length }}）
          </h2>

          <div v-if="favoriteSchools.length" class="space-y-3">
            <div
              v-for="school in favoriteSchools"
              :key="school.id"
              class="rounded-md border border-gray-200 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <RouterLink
                  :to="`/schools/${school.id}`"
                  class="min-w-0 font-heading font-bold text-gray-900 hover:text-primary-700"
                >
                  {{ school.name }}
                </RouterLink>
                <div class="flex shrink-0 items-center">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    aria-label="分享此補習班"
                    @click="shareSchool(school)"
                  >
                    <Share2 :size="18" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary-700 hover:bg-primary-50"
                    aria-label="取消收藏"
                    @click="toggleFavorite(school.id)"
                  >
                    <Heart :size="20" class="fill-primary-700 text-primary-700" />
                  </button>
                </div>
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
                <span v-if="liveDistance(school)" class="shrink-0 text-sm text-gray-500">
                  {{ liveDistance(school) }}
                </span>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            class="mt-4"
            :icon="Heart"
            title="還沒有收藏的補習班"
            description="在列表或詳情點愛心即可收藏；收藏兩間後可對照公開資料。"
            cta-label="去找班看看"
            cta-to="/find"
          />
        </div>
      </Transition>
    </div>
    <BottomTabBar />

    <Toast v-if="showToast" :tone="toastTone">{{ toastMessage }}</Toast>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
