import type { Page } from '@playwright/test'
import {
  DEMO_SCHOOL_ID,
  mockReviews,
  mockSchoolAll,
  mockSchoolDetail,
} from '../fixtures/reelsMock'

/** 廣告片全程走 mock（後註冊的 route 優先） */
export async function installReelsMocks(page: Page) {
  await page.route('**/api/reviews/school/**', async (route) => {
    const id = route.request().url().split('/').pop() ?? DEMO_SCHOOL_ID
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReviews(id)),
    })
  })

  await page.route(/\/api\/schools\/[a-fA-F0-9]{24}(?:\?|$)/, async (route) => {
    const parts = new URL(route.request().url()).pathname.split('/')
    const id = parts[parts.length - 1]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSchoolDetail(id)),
    })
  })

  await page.route('**/api/schools/map**', async (route) => {
    const all = mockSchoolAll()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: all.data.map((s) => ({
          id: s.id,
          name: s.name,
          district: s.district,
          categories: s.categories,
          location: s.location,
        })),
      }),
    })
  })

  await page.route('**/api/schools/all**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSchoolAll()),
    })
  })
}
