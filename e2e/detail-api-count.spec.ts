/**
 * 快速檢查詳情頁 API 次數（schools/:id、reviews）
 * 跑：cd frontend && PLAYWRIGHT_BASE_URL=https://boho-frontend.sscode543.workers.dev npx playwright test e2e/detail-api-count.spec.ts --project=remote-qa
 */
import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://boho-frontend.sscode543.workers.dev'
const SCHOOL_ID = process.env.SCHOOL_ID ?? '6a58a402e59598a1d938247e'

function trackApis(page: Page) {
  const hits: string[] = []
  page.on('request', (req) => {
    const u = req.url()
    if (!u.includes('api.yujii.app')) return
    if (u.includes(`/schools/${SCHOOL_ID}`) && !u.includes('reviews')) {
      hits.push('detail')
    }
    if (u.includes(`/reviews/school/${SCHOOL_ID}`)) {
      hits.push('reviews')
    }
  })
  return {
    hits,
    count: (kind: 'detail' | 'reviews') => hits.filter((h) => h === kind).length,
    reset: () => {
      hits.length = 0
    },
  }
}

test.describe('詳情頁 API 次數', () => {
  test.use({ baseURL: BASE, locale: 'zh-TW' })

  test('進詳情／返回再進，印出呼叫次數', async ({ page }) => {
    const api = trackApis(page)

    await page.addInitScript(() => {
      try {
        localStorage.setItem('buyu:homeTourDone', '1')
      } catch {
        /* ignore */
      }
    })

    // 先載首頁（暖列表 cache）
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForResponse(
      (r) => r.url().includes('/api/schools/all') && r.ok(),
      { timeout: 60_000 },
    )
    await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 15_000 }).catch(() => {})

    api.reset()
    await page.goto(`/schools/${SCHOOL_ID}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const firstDetail = api.count('detail')
    const firstReviews = api.count('reviews')
    console.log(`[1st enter] detail=${firstDetail} reviews=${firstReviews} raw=${JSON.stringify(api.hits)}`)

    api.reset()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    await page.goto(`/schools/${SCHOOL_ID}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const secondDetail = api.count('detail')
    const secondReviews = api.count('reviews')
    console.log(`[2nd enter] detail=${secondDetail} reviews=${secondReviews} raw=${JSON.stringify(api.hits)}`)

    // 期望：第一次各至少 1；reviews 不應 ≥2（雙重觸發）；第二次 detail 理想為 0（已 cache）
    expect(firstDetail, '第一次應打 detail').toBeGreaterThanOrEqual(1)
    expect(firstReviews, '第一次應打 reviews').toBeGreaterThanOrEqual(1)

    if (firstReviews >= 2) {
      console.log('⚠ 優化空間：reviews 被打兩次以上（疑似 onMounted + watch 重複）')
    }
    if (secondDetail >= 1) {
      console.log('⚠ 優化空間：第二次仍打 detail（cache 未命中或 currentDetail 被清掉）')
    }
    if (secondReviews >= 2) {
      console.log('⚠ 優化空間：第二次 reviews 仍雙重請求')
    }
    if (firstReviews === 1 && secondDetail === 0 && secondReviews <= 1) {
      console.log('✓ 目前行為合理（無明顯雙重／重複 detail）')
    }
  })
})
