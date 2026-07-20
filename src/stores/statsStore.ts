import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStatsCategories, getStatsDistricts, getStatsSummary } from '@/api/stats'
import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from '@/api/types'

export const useStatsStore = defineStore('stats', () => {
  const summary = ref<ApiSummary | null>(null)
  const districtStats = ref<ApiDistrictStat[]>([])
  const categoryStats = ref<ApiCategoryStat[]>([])
  /** 目前選中行政區的類別分布（本區） */
  const districtCategoryStats = ref<ApiCategoryStat[]>([])
  const districtCategoryName = ref<string | null>(null)
  const isLoading = ref(false)
  const isLoadingDistrictCategories = ref(false)
  const error = ref<string | null>(null)

  async function loadAll() {
    if (summary.value !== null) return
    isLoading.value = true
    error.value = null
    try {
      const [s, d, c] = await Promise.all([
        getStatsSummary(),
        getStatsDistricts(),
        getStatsCategories(),
      ])
      summary.value = s
      districtStats.value = d.data
      categoryStats.value = c.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '統計資料載入失敗'
    } finally {
      isLoading.value = false
    }
  }

  async function loadDistrictCategories(districtName: string) {
    if (districtCategoryName.value === districtName && districtCategoryStats.value.length) {
      return
    }
    isLoadingDistrictCategories.value = true
    try {
      const res = await getStatsCategories(districtName)
      districtCategoryStats.value = res.data
      districtCategoryName.value = districtName
    } catch {
      // 後備：用全市類別
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

  return {
    summary,
    districtStats,
    categoryStats,
    districtCategoryStats,
    districtCategoryName,
    isLoading,
    isLoadingDistrictCategories,
    error,
    loadAll,
    loadDistrictCategories,
    getDistrictCount,
  }
})
