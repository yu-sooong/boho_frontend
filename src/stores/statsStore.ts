import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStatsCategories, getStatsDistricts, getStatsSummary } from '@/api/stats'
import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from '@/api/types'
import { useCityStore } from '@/stores/cityStore'

const SESSION_KEY = 'buyu:stats-cache:v1'
/** 前端 session 快取：關分頁前有效；逾時後背景重抓 */
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 小時

type CityStatsBundle = {
  at: number
  districts: ApiDistrictStat[]
  categories: ApiCategoryStat[]
  summary: ApiSummary | null
}

type SessionCache = Record<string, CityStatsBundle>

function readSession(): SessionCache {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SessionCache
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeSession(cache: SessionCache) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cache))
  } catch {
    /* quota / private mode */
  }
}

function getSessionBundle(cityName: string): CityStatsBundle | null {
  const hit = readSession()[cityName]
  if (!hit?.districts?.length) return null
  if (Date.now() - hit.at > SESSION_TTL_MS) return null
  return hit
}

function putSessionBundle(cityName: string, bundle: Omit<CityStatsBundle, 'at'>) {
  const next = {
    ...readSession(),
    [cityName]: { ...bundle, at: Date.now() },
  }
  writeSession(next)
}

export const useStatsStore = defineStore('stats', () => {
  const cityStore = useCityStore()

  const summary = ref<ApiSummary | null>(null)
  const districtStats = ref<ApiDistrictStat[]>([])
  const categoryStats = ref<ApiCategoryStat[]>([])
  /** 目前選中行政區的類別分布（本區） */
  const districtCategoryStats = ref<ApiCategoryStat[]>([])
  const districtCategoryName = ref<string | null>(null)
  /** 目前 summary／districts 對應的縣市（避免切市殘留） */
  const loadedCity = ref<string | null>(null)
  const isLoading = ref(false)
  const isLoadingDistrictCategories = ref(false)
  const error = ref<string | null>(null)

  function applyBundle(cityName: string, bundle: CityStatsBundle | Omit<CityStatsBundle, 'at'>) {
    districtStats.value = bundle.districts
    categoryStats.value = bundle.categories
    summary.value = bundle.summary ?? null
    loadedCity.value = cityName
  }

  function resetForCity() {
    summary.value = null
    districtStats.value = []
    categoryStats.value = []
    districtCategoryStats.value = []
    districtCategoryName.value = null
    loadedCity.value = null
    error.value = null
  }

  /** 導覽／情報：優先 session／記憶體，再打 API */
  async function loadAll(force = false) {
    const cityName = cityStore.city?.name
    if (!cityName) return

    if (!force && loadedCity.value === cityName && districtStats.value.length) {
      return
    }

    if (!force) {
      const cached = getSessionBundle(cityName)
      if (cached) {
        applyBundle(cityName, cached)
        // 背景刷新（不擋 UI）
        void refreshFromNetwork(cityName).catch(() => {
          /* 背景更新失敗保留快取 */
        })
        return
      }
    }

    isLoading.value = true
    error.value = null
    try {
      await refreshFromNetwork(cityName)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '統計資料載入失敗'
    } finally {
      isLoading.value = false
    }
  }

  async function refreshFromNetwork(cityName: string) {
    const [s, d, c] = await Promise.all([
      getStatsSummary(cityName),
      getStatsDistricts(cityName),
      getStatsCategories(undefined, cityName),
    ])
    applyBundle(cityName, {
      districts: d.data,
      categories: c.data,
      summary: s,
    })
    districtCategoryStats.value = []
    districtCategoryName.value = null
    putSessionBundle(cityName, {
      districts: d.data,
      categories: c.data,
      summary: s,
    })
  }

  /**
   * 導覽捷徑：只要 districts + categories（可略過 summary）。
   * 有 session／記憶體時立刻顯示；否則顯示 loading 再取。
   */
  async function loadShortcuts(force = false) {
    const cityName = cityStore.city?.name
    if (!cityName) return

    if (!force && loadedCity.value === cityName && districtStats.value.length) {
      return
    }

    if (!force) {
      const cached = getSessionBundle(cityName)
      if (cached) {
        applyBundle(cityName, cached)
        void refreshShortcutsFromNetwork(cityName).catch(() => {
          /* 背景更新失敗保留快取 */
        })
        return
      }
    }

    isLoading.value = true
    error.value = null
    try {
      await refreshShortcutsFromNetwork(cityName)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '統計資料載入失敗'
    } finally {
      isLoading.value = false
    }
  }

  async function refreshShortcutsFromNetwork(cityName: string) {
    const [d, c] = await Promise.all([
      getStatsDistricts(cityName),
      getStatsCategories(undefined, cityName),
    ])
    const prevSummary =
      loadedCity.value === cityName ? summary.value : getSessionBundle(cityName)?.summary ?? null
    applyBundle(cityName, {
      districts: d.data,
      categories: c.data,
      summary: prevSummary,
    })
    putSessionBundle(cityName, {
      districts: d.data,
      categories: c.data,
      summary: prevSummary,
    })
  }

  async function loadDistrictCategories(districtName: string) {
    const cityName = cityStore.city?.name
    if (!cityName) return
    if (districtCategoryName.value === districtName && districtCategoryStats.value.length) {
      return
    }
    isLoadingDistrictCategories.value = true
    try {
      const res = await getStatsCategories(districtName, cityName)
      districtCategoryStats.value = res.data
      districtCategoryName.value = districtName
    } catch {
      districtCategoryStats.value = categoryStats.value
      districtCategoryName.value = districtName
    } finally {
      isLoadingDistrictCategories.value = false
    }
  }

  function getDistrictCount(districtName: string): number | null {
    const found = districtStats.value.find((d) => d.district === districtName)
    return found?.count ?? null
  }

  watch(
    () => cityStore.cityId,
    (id, prev) => {
      if (!id || id === prev) return
      const name = cityStore.city?.name
      const cached = name ? getSessionBundle(name) : null
      if (cached && name) {
        applyBundle(name, cached)
        districtCategoryStats.value = []
        districtCategoryName.value = null
        error.value = null
      } else {
        resetForCity()
      }
    },
  )

  return {
    summary,
    districtStats,
    categoryStats,
    districtCategoryStats,
    districtCategoryName,
    loadedCity,
    isLoading,
    isLoadingDistrictCategories,
    error,
    loadAll,
    loadShortcuts,
    loadDistrictCategories,
    getDistrictCount,
    resetForCity,
  }
})
