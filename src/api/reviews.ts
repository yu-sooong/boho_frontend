import { apiGet, apiPatch, apiPost } from './client'
import type { ReviewIdentity, ReviewPeriod } from '@/data/reviewConstants'
import type { Review, ReviewStatus } from '@/types'

export interface ApiReview {
  id: string
  schoolId: string
  identity: ReviewIdentity
  period: ReviewPeriod
  rating: number
  content: string
  tags: string[]
  status: ReviewStatus
  date: string
  schoolName?: string
  deviceId?: string
}

export interface ApiReviewSummary {
  count: number
  averageRating: number
  tags: string[]
}

export interface ApiReviewsResult {
  data: ApiReview[]
  summary: ApiReviewSummary
  fromCache?: boolean
}

export interface SubmitReviewBody {
  schoolId: string
  identity: ReviewIdentity
  period: ReviewPeriod
  rating: number
  content: string
  tags: string[]
  deviceId: string
}

export function getSchoolReviews(schoolId: string) {
  return apiGet<ApiReviewsResult>(`/reviews/school/${schoolId}`)
}

export function createReview(body: SubmitReviewBody) {
  return apiPost<{ data: ApiReview; message: string }>('/reviews', body)
}

export function getPendingReviews(adminToken: string) {
  return apiGet<{ data: ApiReview[]; total: number }>('/reviews/admin/pending', undefined, {
    'X-Admin-Token': adminToken,
  })
}

export function moderateReview(
  id: string,
  status: 'approved' | 'rejected',
  adminToken: string,
  rejectReason?: string,
) {
  return apiPatch<{ message: string; id: string; status: string }>(
    `/reviews/admin/${id}`,
    { status, rejectReason },
    { 'X-Admin-Token': adminToken },
  )
}

export function mapApiReview(r: ApiReview): Review {
  return {
    id: r.id,
    schoolId: r.schoolId,
    identity: r.identity,
    period: r.period,
    date: r.date,
    rating: r.rating,
    content: r.content,
    tags: r.tags ?? [],
    status: r.status,
    deviceId: r.deviceId,
  }
}
