import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStatsCategories, getStatsDistricts, getStatsSummary } from '@/api/stats'
import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from '@/api/types'
import { useCityStore } from '@/stores/cityStore'

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

  function resetForCity() {
    summary.value = null
    districtStats.value = []
    categoryStats.value = []
    districtCategoryStats.value = []
    districtCategoryName.value = null
    loadedCity.value = null
    error.value = null
  }

  async function loadAll(force = false) {
    const cityName = cityStore.city?.name
    if (!cityName) return
    if (!force && loadedCity.value === cityName && summary.value !== null) return

    isLoading.value = true
    error.value = null
    try {
      const [s, d, c] = await Promise.all([
        getStatsSummary(cityName),
        getStatsDistricts(cityName),
        getStatsCategories(undefined, cityName),
      ])
      summary.value = s
      districtStats.value = d.data
      categoryStats.value = c.data
      loadedCity.value = cityName
      districtCategoryStats.value = []
      districtCategoryName.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : '統計資料載入失敗'
    } finally {
      isLoading.value = false
    }
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
      resetForCity()
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
    loadDistrictCategories,
    getDistrictCount,
    resetForCity,
  }
})
