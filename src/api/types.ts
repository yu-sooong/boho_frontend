/** 後端 API 回傳的資料型別（對應 backend/src/models/school.ts） */

export type ApiSchoolStatus = 'active' | 'closed' | 'revoked'

export interface ApiGeoPoint {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface ApiPenalty {
  date: string
  reason: string
  action: string
  source: string
}

export interface ApiSchoolSummary {
  id: string
  name: string
  categories: string[]
  status: ApiSchoolStatus
  address: string
  district: string
  phone?: string
  location?: ApiGeoPoint
  penaltyCount: number
  distanceM?: number // 附近搜尋才有
}

export interface ApiSchoolDetail {
  id: string
  name: string
  categories: string[]
  status: ApiSchoolStatus
  address: string
  city: string
  district: string
  phone?: string
  licenseNumber?: string
  licenseDate?: string
  closedDate?: string
  location?: ApiGeoPoint
  penalties: ApiPenalty[]
  source: string
  sourceUrl?: string
  syncedAt: string
}

export interface ApiSearchResult {
  data: ApiSchoolSummary[]
  total: number
  page: number
  limit: number
  fromCache?: boolean
}

export interface ApiMapPin {
  id: string
  name: string
  district: string
  categories: string[]
  location: ApiGeoPoint
}

export interface ApiMapResult {
  data: ApiMapPin[]
  fromCache?: boolean
}

export interface ApiDistrictStat {
  district: string
  count: number
}

export interface ApiCategoryStat {
  category: string
  count: number
}

export interface ApiSummary {
  totalActive: number
  totalClosed: number
  districtCount: number
  fromCache?: boolean
}
