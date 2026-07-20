import { trackEvent } from '@/analytics'
import { ApiError } from '@/api/client'
import { createReview, getSchoolReviews, mapApiReview } from '@/api/reviews'
import { getDeviceId } from '@/composables/useDeviceId'
import type { Review, ReviewSubmitPayload } from '@/types'
import {
  computed,
  onMounted,
  ref,
  watch,
  type MaybeRefOrGetter,
  toValue,
} from 'vue'

/** 伺服器已收下、尚未公開時，用來在同裝置詳情頁顯示「審核中」的快取鍵（評價本體在後端） */
const PENDING_KEY = 'buyu:reviews:pending'

function loadPending(): Review[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as Review[]) : []
  } catch {
    return []
  }
}

const localPending = ref<Review[]>(loadPending())

watch(
  localPending,
  (value) => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(value))
  },
  { deep: true },
)

export function useReviews(schoolId: MaybeRefOrGetter<string>) {
  const deviceId = getDeviceId()
  const approvedReviews = ref<Review[]>([])
  const summary = ref({ count: 0, averageRating: 0, tags: [] as string[] })
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  async function load() {
    const id = toValue(schoolId)
    if (!id) return
    isLoading.value = true
    loadError.value = null
    try {
      const result = await getSchoolReviews(id)
      approvedReviews.value = result.data.map(mapApiReview)
      summary.value = result.summary
      // 已公開者從「審核中」快取移除
      const approvedIds = new Set(approvedReviews.value.map((r) => r.id))
      localPending.value = localPending.value.filter((r) => !approvedIds.has(r.id))
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : '載入評價失敗'
      approvedReviews.value = []
      summary.value = { count: 0, averageRating: 0, tags: [] }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(load)
  watch(() => toValue(schoolId), load)

  const myPendingReviews = computed(() =>
    localPending.value.filter(
      (r) => r.schoolId === toValue(schoolId) && r.deviceId === deviceId && r.status === 'pending',
    ),
  )

  const displayReviews = computed(() => [
    ...myPendingReviews.value,
    ...approvedReviews.value,
  ])

  const reviewCount = computed(() => summary.value.count)
  const averageRating = computed(() => summary.value.averageRating)
  const reviewTags = computed(() => summary.value.tags)

  async function submitReview(payload: ReviewSubmitPayload): Promise<Review> {
    const content = payload.content.trim()
    if (!payload.identity || !payload.period) {
      throw new Error('請選擇身份與就讀／接觸時期')
    }
    if (payload.rating < 1 || payload.rating > 5) {
      throw new Error('請選擇星等評分')
    }
    if (content.length < 15) {
      throw new Error('請至少寫下 15 字的具體經驗')
    }

    try {
      const result = await createReview({
        schoolId: payload.schoolId,
        identity: payload.identity,
        period: payload.period,
        rating: Math.round(Number(payload.rating)),
        content,
        tags: payload.tags,
        deviceId: getDeviceId(),
      })
      const review = mapApiReview({
        ...result.data,
        status: 'pending',
        deviceId: getDeviceId(),
      })
      localPending.value = [review, ...localPending.value.filter((r) => r.id !== review.id)]
      trackEvent('submit_review', {
        school_id: payload.schoolId,
        rating: payload.rating,
      })
      return review
    } catch (e) {
      if (e instanceof ApiError) throw new Error(e.message || `送出失敗（${e.status}）`)
      throw e instanceof Error ? e : new Error('送出失敗，請稍後再試')
    }
  }

  return {
    approvedReviews,
    myPendingReviews,
    displayReviews,
    reviewCount,
    averageRating,
    reviewTags,
    isLoading,
    loadError,
    load,
    submitReview,
  }
}
