import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ApiError } from '@/api/client'
import { getAllSchools, getSchoolDetail } from '@/api/schools'
import type { ApiSchoolDetail, ApiSchoolSummary } from '@/api/types'
import type { PenaltyRecord, School } from '@/types'
import { isMongoObjectId } from '@/utils/objectId'

// ── 常數 ──────────────────────────────────────────────────────────────────────

const DISPLAY_STEP = 20

/** 台灣合理座標範圍（含離島），過濾 Geocoding 異常資料 */
const TAIWAN_BOUNDS = { minLng: 119.0, maxLng: 122.5, minLat: 21.5, maxLat: 25.5 }

function isInTaiwan(lng: number, lat: number): boolean {
  return (
    lng >= TAIWAN_BOUNDS.minLng &&
    lng <= TAIWAN_BOUNDS.maxLng &&
    lat >= TAIWAN_BOUNDS.minLat &&
    lat <= TAIWAN_BOUNDS.maxLat
  )
}

/** Haversine 公式：回傳兩點距離（公尺） */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── 型別轉換：API → 前端 view model ──────────────────────────────────────────

function statusLabel(s: ApiSchoolSummary['status']): School['status'] {
  return s === 'active' ? '立案中' : '已廢止'
}

function summaryToSchool(s: ApiSchoolSummary): School {
  const [lng, lat] = s.location?.coordinates ?? [0, 0]
  const validCoords = s.location != null && isInTaiwan(lng, lat)
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    district: s.district ?? '',
    phone: s.phone ?? '',
    distanceKm: 0,           // 由 sortedSchools computed 動態計算
    categoryTags: s.categories ?? [],
    levelTags: [],
    extraTags: [],
    status: statusLabel(s.status),
    rating: 0,
    reviewCount: 0,
    reviewTags: [],
    reviews: [],
    penalties: [],
    lng: validCoords ? lng : 0,
    lat: validCoords ? lat : 0,
  }
}

function detailToSchool(s: ApiSchoolDetail): School {
  const penalties: PenaltyRecord[] = s.penalties.map((p, i) => ({
    id: `p-${i}`,
    date: p.date,
    content: p.reason,
    handling: p.action,
    sourceUrl: p.source,
  }))
  const [lng, lat] = s.location?.coordinates ?? [0, 0]
  const validCoords = s.location != null && isInTaiwan(lng, lat)
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    district: s.district ?? '',
    phone: s.phone ?? '',
    distanceKm: 0,
    categoryTags: s.categories ?? [],
    levelTags: [],
    extraTags: [],
    status: statusLabel(s.status),
    rating: 0,
    reviewCount: 0,
    reviewTags: [],
    reviews: [],
    penalties,
    lng: validCoords ? lng : 0,
    lat: validCoords ? lat : 0,
  }
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSchoolStore = defineStore('school', () => {
  // ── 全量資料（一次 API 載入，前端篩選/排序）─────────────────────────────────
  const allSchools = ref<School[]>([])
  const isLoadingAll = ref(false)
  const loadError = ref<string | null>(null)

  // ── 前端分頁：顯示前 N 筆 ────────────────────────────────────────────────────
  const displayLimit = ref(DISPLAY_STEP)

  // ── 篩選條件 ─────────────────────────────────────────────────────────────────
  const keyword = ref('')
  const selectedDistricts = ref<string[]>([])
  const selectedCategories = ref<string[]>([])

  // ── 使用者定位座標 ───────────────────────────────────────────────────────────
  const userLat = ref<number | null>(null)
  const userLng = ref<number | null>(null)

  // ── 詳情頁 ───────────────────────────────────────────────────────────────────
  const currentDetail = ref<School | null>(null)
  const isLoadingDetail = ref(false)
  const detailError = ref<string | null>(null)
  /** 無效 id 或後端 404／400：顯示找不到，而非「載入失敗」 */
  const detailNotFound = ref(false)

  // ── School 快取（id → School），供收藏頁 / 歷史使用 ──────────────────────────
  const schoolCache = ref<Map<string, School>>(new Map())

  // ── 地圖選中的學校 ID（持久化跨路由）──────────────────────────────────────────
  const selectedSchoolId = ref<string | null>(null)

  // ── 手機列表/地圖模式（持久化跨路由，避免詳情返回後掉回 list）────────────────
  const mobileMode = ref<'list' | 'map'>('list')

  // ── Computed：篩選 ────────────────────────────────────────────────────────────

  /** 依 keyword / district / category 即時篩選（前端，無 API round-trip） */
  const filteredSchools = computed<School[]>(() => {
    let result = allSchools.value
    const kw = keyword.value.trim().toLowerCase()

    if (kw.length >= 2) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.address.toLowerCase().includes(kw),
      )
    }
    if (selectedDistricts.value.length > 0) {
      const set = new Set(selectedDistricts.value)
      result = result.filter((s) => set.has(s.district ?? ''))
    }
    if (selectedCategories.value.length > 0) {
      const set = new Set(selectedCategories.value)
      result = result.filter((s) => s.categoryTags.some((c) => set.has(c)))
    }
    return result
  })

  /** 依距離排序並動態算出 distanceKm（有使用者座標時生效） */
  const sortedSchools = computed<School[]>(() => {
    if (userLat.value == null || userLng.value == null) return filteredSchools.value

    const uLat = userLat.value
    const uLng = userLng.value

    return [...filteredSchools.value]
      .map((s) => ({
        ...s,
        distanceKm:
          s.lat !== 0 && s.lng !== 0
            ? Math.round(haversineM(uLat, uLng, s.lat, s.lng)) / 1000
            : 0,
      }))
      .sort((a, b) => {
        // 無座標的排最後
        if (a.distanceKm === 0 && b.distanceKm === 0) return 0
        if (a.distanceKm === 0) return 1
        if (b.distanceKm === 0) return -1
        return a.distanceKm - b.distanceKm
      })
  })

  /** 分頁切片：列表只 render 前 displayLimit 筆 */
  const displaySchools = computed<School[]>(() =>
    sortedSchools.value.slice(0, displayLimit.value),
  )

  /** 地圖用：全量有效座標圖釘（未篩選時用） */
  const allMapPins = computed<School[]>(() =>
    allSchools.value.filter((s) => s.lat !== 0 && s.lng !== 0),
  )

  /** 篩選結果中有效座標的圖釘（篩選時用） */
  const filteredMapPins = computed<School[]>(() =>
    sortedSchools.value.filter((s) => s.lat !== 0 && s.lng !== 0),
  )

  /** 從 allSchools 派生篩選選項（不需額外 API） */
  const districts = computed<string[]>(() => {
    const set = new Set(allSchools.value.map((s) => s.district ?? '').filter(Boolean))
    return [...set].sort()
  })

  const categories = computed<string[]>(() => {
    const set = new Set(allSchools.value.flatMap((s) => s.categoryTags))
    return [...set].sort()
  })

  const hasMore = computed(() => displayLimit.value < sortedSchools.value.length)
  const totalFiltered = computed(() => sortedSchools.value.length)

  // 篩選條件變動時重置分頁
  watch(filteredSchools, () => {
    displayLimit.value = DISPLAY_STEP
  })

  // ── Actions ───────────────────────────────────────────────────────────────────

  /** 一次載入所有學校（帶 Redis 72h cache，通常只打一次 API） */
  async function loadAll() {
    if (allSchools.value.length > 0) return   // 已載入，直接略過
    isLoadingAll.value = true
    loadError.value = null
    try {
      const result = await getAllSchools()
      allSchools.value = result.data.map(summaryToSchool)
      // 填入快取
      allSchools.value.forEach((s) => schoolCache.value.set(s.id, s))
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : '載入失敗，請稍後再試'
    } finally {
      isLoadingAll.value = false
    }
  }

  function showMore() {
    displayLimit.value = Math.min(
      displayLimit.value + DISPLAY_STEP,
      sortedSchools.value.length,
    )
  }

  // ── 詳情 ──────────────────────────────────────────────────────────────────────

  async function fetchDetail(id: string): Promise<School> {
    const cached = schoolCache.value.get(id)
    if (cached) return cached
    const detail = await getSchoolDetail(id)
    const school = detailToSchool(detail)
    schoolCache.value.set(id, school)
    return school
  }

  async function loadDetail(id: string) {
    if (currentDetail.value?.id === id && !detailNotFound.value) return
    isLoadingDetail.value = true
    detailError.value = null
    detailNotFound.value = false
    currentDetail.value = null

    if (!isMongoObjectId(id)) {
      detailNotFound.value = true
      isLoadingDetail.value = false
      return
    }

    try {
      currentDetail.value = await fetchDetail(id)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 400 || e.status === 404)) {
        detailNotFound.value = true
      } else {
        detailError.value = e instanceof Error ? e.message : '載入失敗，請稍後再試'
      }
    } finally {
      isLoadingDetail.value = false
    }
  }

  /** 載入並快取詳情，不碰 currentDetail（可供收藏頁並行請求；失敗回 null） */
  async function ensureCached(id: string): Promise<School | null> {
    if (!isMongoObjectId(id)) return null
    try {
      return await fetchDetail(id)
    } catch {
      return null
    }
  }

  // ── 篩選條件 setters ──────────────────────────────────────────────────────────

  function setKeyword(kw: string) { keyword.value = kw }

  function setDistricts(arr: string[]) { selectedDistricts.value = arr }
  function toggleDistrict(d: string) {
    const idx = selectedDistricts.value.indexOf(d)
    if (idx >= 0) selectedDistricts.value.splice(idx, 1)
    else selectedDistricts.value.push(d)
  }
  function removeDistrict(d: string) {
    selectedDistricts.value = selectedDistricts.value.filter((x) => x !== d)
  }

  function setCategories(arr: string[]) { selectedCategories.value = arr }
  function toggleCategory(c: string) {
    const idx = selectedCategories.value.indexOf(c)
    if (idx >= 0) selectedCategories.value.splice(idx, 1)
    else selectedCategories.value.push(c)
  }
  function removeCategory(c: string) {
    selectedCategories.value = selectedCategories.value.filter((x) => x !== c)
  }

  function clearFilters() {
    keyword.value = ''
    selectedDistricts.value = []
    selectedCategories.value = []
  }

  function setSelectedSchool(id: string | null) { selectedSchoolId.value = id }

  function setMobileMode(mode: 'list' | 'map') {
    mobileMode.value = mode
  }

  /** 定位成功後呼叫：寫入座標，sortedSchools computed 自動重算距離並排序 */
  function setUserCoords(lat: number, lng: number) {
    userLat.value = lat
    userLng.value = lng
    // 不需要重新打 API，computed 自動 recompute
  }

  function getCached(id: string): School | undefined {
    return schoolCache.value.get(id)
  }

  return {
    // state
    allSchools,
    isLoadingAll,
    loadError,
    keyword,
    selectedDistricts,
    selectedCategories,
    userLat,
    userLng,
    currentDetail,
    isLoadingDetail,
    detailError,
    detailNotFound,
    schoolCache,
    selectedSchoolId,
    mobileMode,
    // computed
    filteredSchools,
    sortedSchools,
    displaySchools,
    allMapPins,
    filteredMapPins,
    districts,
    categories,
    hasMore,
    totalFiltered,
    // actions
    loadAll,
    showMore,
    loadDetail,
    ensureCached,
    setKeyword,
    setDistricts, toggleDistrict, removeDistrict,
    setCategories, toggleCategory, removeCategory,
    clearFilters,
    setSelectedSchool,
    setMobileMode,
    setUserCoords,
    getCached,
  }
})
