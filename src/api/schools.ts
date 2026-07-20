import { apiGet } from './client'
import type {
  ApiMapResult,
  ApiSchoolDetail,
  ApiSearchResult,
  ApiSchoolSummary,
} from './types'

export interface SearchParams {
  keyword?: string
  district?: string
  category?: string
  status?: string
  page?: number
  limit?: number
  lat?: number   // 使用者緯度（有值時後端依距離排序）
  lng?: number   // 使用者經度
}

export function searchSchools(params: SearchParams = {}) {
  return apiGet<ApiSearchResult>('/schools/search', {
    keyword: params.keyword,
    district: params.district,
    category: params.category,
    status: params.status,
    page: params.page,
    limit: params.limit,
    lat: params.lat,
    lng: params.lng,
  })
}

export function getSchoolDetail(id: string) {
  return apiGet<ApiSchoolDetail & { fromCache?: boolean }>(`/schools/${id}`)
}

export function getMapPins() {
  return apiGet<ApiMapResult>('/schools/map')
}

export function getNearbySchools(
  lng: number,
  lat: number,
  radius?: number,
  limit?: number,
) {
  return apiGet<ApiSearchResult>('/schools/nearby', { lng, lat, radius, limit })
}

export function getDistricts() {
  return apiGet<{ data: string[]; fromCache?: boolean }>('/schools/districts')
}

export function getCategories() {
  return apiGet<{ data: string[]; fromCache?: boolean }>('/schools/categories')
}

/** 一次載入所有活躍學校（前端做篩選/排序/距離計算） */
export function getAllSchools() {
  return apiGet<{ data: ApiSchoolSummary[]; total: number; fromCache?: boolean }>('/schools/all')
}
