import type { ReviewIdentity, ReviewPeriod } from '@/data/reviewConstants'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Review {
  id: string
  schoolId: string
  identity: ReviewIdentity
  period: ReviewPeriod
  date: string
  rating: number
  content: string
  tags: string[]
  status: ReviewStatus
  /** 匿名裝置識別（防濫用；不會公開） */
  deviceId?: string
}

export interface PenaltyRecord {
  id: string
  date: string
  content: string
  handling: string
  sourceUrl: string
}

export interface School {
  id: string
  name: string
  address: string
  district: string
  phone: string
  distanceKm: number
  categoryTags: string[] // 科目，例如 英文、數學
  levelTags: string[] // 國小、國中...
  extraTags: string[] // 小班制、升私中...
  status: '立案中' | '已廢止'
  rating: number
  reviewCount: number
  reviewTags: string[]
  reviews: Review[]
  penalties: PenaltyRecord[]
  lng: number
  lat: number
}

export interface DistrictStat {
  districtName: string
  cityName: string
  totalSchools: number
  /** 占全市立案補習班比例（%） */
  shareOfCityPercent: number
  /** 各區平均班數 */
  cityAverageSchools: number
  densityRatioToAverage: number
  densityLevel: number // 1~5
  categoryDistribution: { label: string; percent: number }[]
  /** district：本區類別；city：全市（後備） */
  categoryScope: 'district' | 'city'
  summary: string
}

export interface ReviewSubmitPayload {
  schoolId: string
  identity: ReviewIdentity
  period: ReviewPeriod
  rating: number
  content: string
  tags: string[]
}
