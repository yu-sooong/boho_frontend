<script setup lang="ts">
import PenaltyBadge from '@/components/common/PenaltyBadge.vue'
import RatingStars from '@/components/common/RatingStars.vue'
import Sk from '@/components/common/Sk.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Tag from '@/components/common/Tag.vue'
import Toast from '@/components/common/Toast.vue'
import ReviewCard from '@/components/detail/ReviewCard.vue'
import ReviewSheet from '@/components/detail/ReviewSheet.vue'
import MapPanel from '@/components/home/MapPanel.vue'
import { trackEvent } from '@/analytics'
import { SITE_URL } from '@/config/site'
import { useFavorites } from '@/composables/useFavorites'
import { usePageSeo } from '@/composables/usePageSeo'
import { useReviews } from '@/composables/useReviews'
import { useSchoolStore } from '@/stores/schoolStore'
import { goBackOrHome } from '@/utils/navigation'
import { shareOrCopy } from '@/utils/share'
import { ArrowLeft, Columns2, ExternalLink, Heart, MapPin, MapPinOff, MessageSquareText, Navigation, Phone, Share2, ShieldCheck } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { favorites, isFavorite, toggleFavorite, otherFavoriteId } = useFavorites()
const store = useSchoolStore()
const comparePeerName = ref<string | null>(null)

const {
  displayReviews,
  reviewCount,
  averageRating,
  reviewTags,
  isLoading: isLoadingReviews,
} = useReviews(() => props.id)

const showReviewSheet = ref(false)
const reviewDraftRating = ref(0)
const showToast = ref(false)
const toastMessage = ref('感謝分享！審核通過後會公開顯示')
const toastTone = ref<'success' | 'info'>('success')

const school = computed(() => store.currentDetail)

function flashToast(message: string, tone: 'success' | 'info' = 'success') {
  toastMessage.value = message
  toastTone.value = tone
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

usePageSeo(computed(() => {
  if (store.detailNotFound) {
    return {
      title: '找不到補習班 | 補亦樂乎',
      description: '此補習班頁面不存在或網址有誤。',
      robots: 'noindex',
    }
  }
  if (!school.value) {
    return { title: '補習班詳情 | 補亦樂乎' }
  }
  const name = school.value.name
  const district = school.value.district ?? ''
  const categories = (school.value.categoryTags ?? []).slice(0, 2).join('、')
  const hasPenalty = (school.value.penalties?.length ?? 0) > 0
  const desc = [
    `查看${name}的立案狀態、地址電話`,
    hasPenalty ? '、稽查紀錄' : '',
    '與就讀經驗。',
    district ? `位於${district}。` : '',
    categories ? `補習類別：${categories}。` : '',
  ].filter(Boolean).join('')
  return {
    title: `${name} | 補亦樂乎`,
    description: desc,
    ogTitle: `${name} | 補亦樂乎`,
    ogDescription: desc,
    ogUrl: `${SITE_URL}/schools/${props.id}`,
  }
}))

onMounted(() => store.loadDetail(props.id))
watch(
  () => props.id,
  (id) => {
    void store.loadDetail(id)
  },
)

watch(
  school,
  (s) => {
    if (!s) return
    trackEvent('view_school_detail', {
      school_id: s.id,
      district: s.district || undefined,
      status: s.status,
    })
  },
)

function openGoogleMaps() {
  if (!school.value) return
  const { lat, lng, address, name } = school.value
  trackEvent('click_directions', { school_id: school.value.id })
  let url: string
  if (lat && lng) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name)}`
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function openReviewSheet(prefillRating = 0) {
  if (!school.value) return
  reviewDraftRating.value = prefillRating > 0 ? prefillRating : 0
  showReviewSheet.value = true
  trackEvent('open_review_sheet', {
    school_id: school.value.id,
    prefill_rating: prefillRating || undefined,
  })
}

function onSubmitted() {
  showReviewSheet.value = false
  flashToast('感謝分享！審核通過後會公開顯示')
}

async function shareSchool() {
  if (!school.value) return
  const url = `${SITE_URL}/schools/${school.value.id}`
  const title = `${school.value.name} | 補亦樂乎`
  const text = `查看${school.value.name}的立案狀態、地址與就讀經驗`
  const result = await shareOrCopy({ title, text, url })
  if (result === 'shared' || result === 'copied') {
    trackEvent('share_school', { school_id: school.value.id, method: result })
  }
  if (result === 'copied') flashToast('連結已複製，可貼到 LINE、Facebook')
  else if (result === 'failed') flashToast('分享失敗，請手動複製網址', 'info')
}

/** 已收藏恰好一間「別間」時，引導收藏目前這間並對照 */
const showCompareCta = computed(() => {
  if (!school.value) return false
  if (favorites.value.length !== 1) return false
  return favorites.value[0] !== school.value.id
})

async function refreshComparePeer() {
  const peerId = otherFavoriteId(props.id)
  if (!peerId) {
    comparePeerName.value = null
    return
  }
  const peer = await store.ensureCached(peerId)
  comparePeerName.value = peer?.name ?? '已收藏的班'
}

watch(
  () => [props.id, favorites.value.join(',')],
  () => {
    void refreshComparePeer()
  },
  { immediate: true },
)

function goCompareWithPeer() {
  const peerId = otherFavoriteId(props.id)
  if (!peerId || !school.value) return
  if (!isFavorite(school.value.id)) toggleFavorite(school.value.id)
  trackEvent('compare_schools', { school_a: peerId, school_b: school.value.id, source: 'detail' })
  void router.push({ name: 'favorites', query: { a: peerId, b: school.value.id } })
}
</script>

<template>
  <div
    class="mx-auto min-h-screen max-w-2xl"
    style="padding-bottom: max(5rem, calc(2.5rem + env(safe-area-inset-bottom, 0px)))"
  >
    <!-- 頂部操作列 -->
    <div class="flex items-center justify-between px-4 py-3">
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50"
        aria-label="返回上一頁"
        @click="goBackOrHome(router)"
      >
        <ArrowLeft :size="22" />
      </button>
      <div v-if="school" class="flex items-center gap-1">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50"
          aria-label="分享此補習班"
          @click="shareSchool"
        >
          <Share2 :size="22" />
        </button>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-50"
          :aria-label="isFavorite(school.id) ? '取消收藏' : '加入收藏'"
          @click="toggleFavorite(school.id)"
        >
          <Heart
            :size="22"
            :class="isFavorite(school.id) ? 'fill-primary-700 text-primary-700' : 'text-gray-700'"
          />
        </button>
      </div>
    </div>

    <!-- 找不到補習班（無效 id／404） -->
    <div
      v-if="store.detailNotFound"
      class="flex flex-col items-center gap-3 px-6 py-16 text-center"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700"
      >
        <MapPinOff :size="22" />
      </div>
      <p class="text-xs font-medium tracking-wide text-gray-400">404</p>
      <h1 class="font-heading text-xl font-bold text-gray-900">找不到這間補習班</h1>
      <p class="max-w-sm text-sm leading-relaxed text-gray-500">
        網址可能打錯，或這筆資料已移除。可回找班繼續查詢。
      </p>
      <RouterLink
        to="/find"
        class="mt-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
      >
        回找班
      </RouterLink>
    </div>

    <!-- 暫時錯誤（可重試） -->
    <div
      v-else-if="store.detailError"
      class="mx-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ store.detailError }}
      <button type="button" class="ml-2 underline" @click="store.loadDetail(props.id)">重新載入</button>
    </div>

    <Transition v-else name="fade" mode="out-in">
      <!-- Skeleton 狀態 -->
      <div v-if="store.isLoadingDetail" class="space-y-4 px-4">
        <div class="space-y-3">
          <Sk class="h-7 w-2/3" />
          <div class="flex gap-2">
            <Sk class="h-6 w-14 rounded-full" />
            <Sk class="h-6 w-16 rounded-full" />
            <Sk class="h-6 w-12 rounded-full" />
          </div>
        </div>
        <div class="space-y-2">
          <Sk class="h-4 w-full" />
          <Sk class="h-4 w-3/4" />
        </div>
        <Sk class="h-48 w-full rounded-md" />
        <div class="space-y-4 rounded-md border border-gray-100 p-4">
          <Sk class="h-5 w-20" />
          <div class="flex gap-2">
            <Sk class="h-6 w-28" />
            <Sk class="h-6 w-14 rounded-full" />
          </div>
          <div v-for="i in 3" :key="i" class="space-y-2 border-t border-gray-100 pt-4">
            <div class="flex items-center gap-2">
              <Sk class="h-8 w-8 rounded-full" />
              <div class="space-y-1.5">
                <Sk class="h-3.5 w-20" />
                <Sk class="h-3 w-14" />
              </div>
            </div>
            <Sk class="h-4 w-full" />
          </div>
        </div>
        <Sk class="h-10 w-full rounded-md" />
      </div>

      <!-- 真實內容 -->
      <div v-else-if="school" class="space-y-4 px-4">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">{{ school.name }}</h1>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <Tag v-for="tag in school.categoryTags" :key="tag" active>{{ tag }}</Tag>
            <Tag
              v-for="tag in [...school.levelTags, ...school.extraTags]"
              :key="tag"
            >{{ tag }}</Tag>
            <StatusBadge :status="school.status" />
          </div>
        </div>

        <div
          v-if="showCompareCta"
          class="flex flex-col gap-2 rounded-md border border-primary-200 bg-primary-50/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          data-testid="detail-compare-cta"
        >
          <p class="text-sm leading-relaxed text-gray-700">
            已收藏
            <span class="font-medium text-gray-900">{{ comparePeerName ?? '一間班' }}</span>
            。可與此班對照公開資料。
          </p>
          <button
            type="button"
            class="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary-700 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800"
            @click="goCompareWithPeer"
          >
            <Columns2 :size="16" />
            {{ isFavorite(school.id) ? '開始對照' : '收藏並對照' }}
          </button>
        </div>

        <div class="space-y-2 text-sm text-gray-700">
          <div class="flex items-start gap-2">
            <MapPin :size="16" class="mt-0.5 shrink-0 text-gray-400" />
            <span class="flex-1">{{ school.address }}</span>
            <button
              type="button"
              title="在 Google 地圖開啟"
              aria-label="在 Google 地圖開啟"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-50 hover:text-primary-600"
              @click="openGoogleMaps"
            >
              <ExternalLink :size="15" />
            </button>
          </div>
          <p v-if="school.phone" class="flex items-center gap-2">
            <Phone :size="16" class="shrink-0 text-gray-400" />
            <a :href="`tel:${school.phone}`" class="hover:text-primary-600 hover:underline">
              {{ school.phone }}
            </a>
          </p>
        </div>

        <!-- 地圖 + 導航按鈕（勿套用首頁台中 maxBounds，否則外縣市圖釘會被裁掉） -->
        <div class="overflow-hidden rounded-md border border-gray-200">
          <!-- 靜態小地圖關閉 pointer-events，避免吃掉頁面上下滑動 -->
          <div class="h-48 touch-pan-y pointer-events-none">
            <MapPanel
              v-if="school.lat && school.lng"
              :key="school.id"
              :schools="[school]"
              :selected-id="school.id"
              :interactive="false"
              :center="{ lng: school.lng, lat: school.lat }"
              :max-bounds="null"
            />
            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-1 bg-gray-50 px-4 text-center text-xs text-gray-500"
            >
              <MapPinOff :size="20" class="text-gray-400" />
              尚無精確座標，請用下方導航依地址開啟地圖
            </div>
          </div>
          <button
            type="button"
            class="pointer-events-auto flex w-full items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-700"
            @click="openGoogleMaps"
          >
            <Navigation :size="15" />
            用 Google 地圖導航至此
          </button>
        </div>

        <PenaltyBadge v-if="school.penalties.length" :penalties="school.penalties" />

        <!-- 評價區（空狀態採 Google／App Store 主流：點星開寫評價） -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div class="flex items-start justify-between gap-3 px-4 pt-4">
            <h2 class="font-heading text-base font-bold text-gray-900">就讀經驗</h2>
            <RouterLink
              to="/more/review-policy"
              class="shrink-0 text-xs font-medium text-primary-700 hover:underline"
            >
              審核說明
            </RouterLink>
          </div>

          <template v-if="isLoadingReviews">
            <p class="px-4 py-6 text-sm text-gray-400">評價載入中…</p>
          </template>

          <!-- 尚無評價：邀請卡 -->
          <div v-else-if="!displayReviews.length" class="px-4 pb-4 pt-2">
            <div class="rounded-xl bg-gradient-to-b from-primary-50/80 to-white px-4 py-5 text-center ring-1 ring-primary-100">
              <p class="text-sm font-semibold text-gray-900">成為第一位分享經驗的人</p>
              <p class="mt-1 text-xs leading-relaxed text-gray-500">
                你的親身經驗，能幫下一位更快判斷適不適合
              </p>

              <div class="mt-4 flex flex-col items-center gap-2">
                <p class="text-[11px] font-medium text-gray-400">點一下星等開始</p>
                <RatingStars
                  :rating="0"
                  :size="32"
                  interactive
                  tone="amber"
                  @update:rating="openReviewSheet"
                />
              </div>

              <button
                type="button"
                class="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800"
                @click="openReviewSheet()"
              >
                <MessageSquareText :size="16" stroke-width="1.75" />
                分享就讀經驗
              </button>
              <p class="mt-2 text-[11px] text-gray-400">匿名投稿・通過審核後才公開</p>
            </div>
          </div>

          <!-- 已有評價 -->
          <div v-else class="px-4 pb-4 pt-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="flex items-center gap-1 text-lg font-bold text-gray-900">
                <RatingStars :rating="averageRating" :size="18" />
                {{ averageRating }}
              </span>
              <span class="text-sm text-gray-400">{{ reviewCount }} 則通過審核</span>
            </div>

            <div v-if="reviewTags.length" class="mt-3 flex flex-wrap gap-1.5">
              <Tag v-for="tag in reviewTags" :key="tag" active>{{ tag }}</Tag>
            </div>

            <div class="mt-4 space-y-4">
              <ReviewCard
                v-for="review in displayReviews"
                :key="review.id"
                :review="review"
              />
            </div>

            <button
              type="button"
              class="mt-4 flex w-full min-h-12 items-center justify-between gap-3 rounded-xl bg-primary-50 px-4 text-left ring-1 ring-primary-100 hover:bg-primary-50/80"
              @click="openReviewSheet()"
            >
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-gray-900">也寫一則你的經驗</span>
                <span class="mt-0.5 block text-xs text-gray-500">幫助其他人做決定</span>
              </span>
              <span class="shrink-0 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white">
                去寫
              </span>
            </button>
          </div>

          <div class="flex items-center gap-1.5 border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-[11px] text-gray-500">
            <ShieldCheck :size="13" class="shrink-0 text-primary-600" />
            僅刊登經審核的親身經驗，正負面都保留
          </div>
        </div>
      </div>
    </Transition>

    <ReviewSheet
      v-if="showReviewSheet && school"
      :key="`${school.id}-${reviewDraftRating}`"
      :school="school"
      :initial-rating="reviewDraftRating"
      @close="showReviewSheet = false"
      @submitted="onSubmitted"
    />
    <Toast v-if="showToast" :tone="toastTone">{{ toastMessage }}</Toast>
  </div>
</template>
