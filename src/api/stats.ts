import { apiGet } from './client'
import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from './types'

export function getStatsSummary() {
  return apiGet<ApiSummary>('/stats/summary')
}

export function getStatsDistricts() {
  return apiGet<{ data: ApiDistrictStat[]; fromCache?: boolean }>('/stats/districts')
}

export function getStatsCategories(district?: string) {
  return apiGet<{ data: ApiCategoryStat[]; fromCache?: boolean }>('/stats/categories', {
    district: district || undefined,
  })
}
