import { apiGet } from './client'
import type {
  ApiMapResult,
  ApiSchoolDetail,
  ApiSchoolListItem,
  ApiSearchResult,
} from './types'

export interface SearchParams {
  /** MongoDB city 欄位：台中市／新北市／高雄市 */
  city?: string
  keyword?: string
  district?: string
  category?: string
  status?: string
  /** 僅有稽查紀錄 */
  hasPenalty?: boolean
  page?: number
  limit?: number
  lat?: number
  lng?: number
}

export function searchSchools(params: SearchParams = {}) {
  return apiGet<ApiSearchResult>('/schools/search', {
    city: params.city,
    keyword: params.keyword,
    district: params.district,
    category: params.category,
    status: params.status,
    hasPenalty: params.hasPenalty ? 'true' : undefined,
    page: params.page,
    limit: params.limit,
    lat: params.lat,
    lng: params.lng,
  })
}

export function getSchoolDetail(id: string) {
  return apiGet<ApiSchoolDetail & { fromCache?: boolean }>(`/schools/${id}`)
}

export function getMapPins(city?: string) {
  return apiGet<ApiMapResult>('/schools/map', { city })
}

export function getNearbySchools(
  lng: number,
  lat: number,
  radius?: number,
  limit?: number,
  city?: string,
) {
  return apiGet<ApiSearchResult>('/schools/nearby', { lng, lat, radius, limit, city })
}

export function getDistricts(city?: string) {
  return apiGet<{ data: string[]; fromCache?: boolean }>('/schools/districts', { city })
}

export function getCategories(city?: string) {
  return apiGet<{ data: string[]; fromCache?: boolean }>('/schools/categories', { city })
}

/** 一次載入該縣市活躍學校精簡列（前端做篩選／排序／距離） */
export function getAllSchools(city?: string) {
  return apiGet<{ data: ApiSchoolListItem[]; total: number; fromCache?: boolean }>(
    '/schools/all',
    { city },
  )
}
