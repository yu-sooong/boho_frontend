import { apiGet } from './client'
import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from './types'

export function getStatsSummary(city?: string) {
  return apiGet<ApiSummary>('/stats/summary', { city })
}

export function getStatsDistricts(city?: string) {
  return apiGet<{ data: ApiDistrictStat[]; fromCache?: boolean }>('/stats/districts', { city })
}

export function getStatsCategories(district?: string, city?: string) {
  return apiGet<{ data: ApiCategoryStat[]; fromCache?: boolean }>('/stats/categories', {
    city,
    district: district || undefined,
  })
}
