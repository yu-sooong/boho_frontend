/**
 * 篩選 → 地圖預覽 → 詳情 → 返回
 * 驗證 A（不重開預覽）+ B（mobileMode 持久化）
 */
import { test, expect, type Page } from '@playwright/test'

type E2eState = {
  showPreview: boolean
  mobileMode: 'list' | 'map'
  mapReady: boolean
  selectedSchoolId: string | null
  districts: string[]
  categories: string[]
  keyword: string
  userLat: number | null
  userLng: number | null
  filterCount: number
}

type E2eHome = {
  openPreview: (id: string) => void
  goToDetail: (id: string) => void
  setMobileMode: (mode: 'list' | 'map') => void
  setDistricts: (districts: string[]) => void
  availableDistricts: () => string[]
  firstSchoolId: () => string | null
  getState: () => E2eState
}

declare global {
  interface Window {
    __e2eHome?: E2eHome
  }
}

async function waitForHomeReady(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__e2eHome, null, { timeout: 20_000 })
  await page.waitForFunction(
    () => (window.__e2eHome?.availableDistricts().length ?? 0) > 0,
    null,
    { timeout: 30_000 },
  )
  // App.vue LoadingScreen ~1.6s，會擋住 pointer events
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {})
}

async function applyWestDistrictFilter(page: Page) {
  const districts = await page.evaluate(() => window.__e2eHome!.availableDistricts())
  const target = districts.find((d) => d.includes('西屯')) ?? districts[0]
  await page.evaluate((d) => window.__e2eHome!.setDistricts([d]), target)
  await page.waitForFunction(
    () => (window.__e2eHome?.getState().filterCount ?? 0) > 0,
    null,
    { timeout: 10_000 },
  )
  return target
}

async function firstSchoolId(page: Page): Promise<string> {
  await page.waitForFunction(() => !!window.__e2eHome?.firstSchoolId(), null, {
    timeout: 15_000,
  })
  const id = await page.evaluate(() => window.__e2eHome!.firstSchoolId())
  if (!id) throw new Error('找不到補習班 id')
  return id
}

async function openPreviewThenDetail(page: Page, id: string) {
  await page.evaluate((schoolId) => {
    window.__e2eHome!.openPreview(schoolId)
  }, id)
  // 確認預覽已開
  await page.waitForFunction(
    () => window.__e2eHome?.getState().showPreview === true,
    null,
    { timeout: 5_000 },
  )
  // 用 hook 導航（等同點「查看完整資訊」），避開 Transition / Loading 造成的 click 不穩
  await page.evaluate((schoolId) => {
    window.__e2eHome!.goToDetail(schoolId)
  }, id)
  await expect(page).toHaveURL(new RegExp(`/schools/${id}`))
}

async function waitForMapReadyAfterBack(page: Page) {
  await page.waitForFunction(() => !!window.__e2eHome, null, { timeout: 10_000 })
  await page.waitForFunction(() => window.__e2eHome?.getState().mapReady === true, null, {
    timeout: 20_000,
  })
  await page.waitForTimeout(300)
}

test.describe('桌面：地圖預覽 → 詳情 → 返回', () => {
  test('返回後不應停在預覽層', async ({ page }) => {
    await waitForHomeReady(page)
    const district = await applyWestDistrictFilter(page)
    const id = await firstSchoolId(page)

    await openPreviewThenDetail(page, id)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })

    await page.goBack()
    await waitForMapReadyAfterBack(page)

    const after = await page.evaluate(() => window.__e2eHome!.getState())
    expect(after.districts).toContain(district)
    expect(after.showPreview).toBe(false)
    await expect(page.getByText('← 返回列表')).toHaveCount(0)
  })

  test('返回後左欄顯示篩選後列表', async ({ page }) => {
    await waitForHomeReady(page)
    await applyWestDistrictFilter(page)
    const id = await firstSchoolId(page)

    await openPreviewThenDetail(page, id)
    await page.goBack()
    await waitForMapReadyAfterBack(page)

    await expect(page.getByText('← 返回列表')).toHaveCount(0)
    await expect(page.getByText(/共\s*[\d,]+\s*筆結果/)).toBeVisible()
  })
})

test.describe('手機：地圖模式 → 詳情 → 返回', () => {
  test('返回後維持地圖模式', async ({ page }) => {
    await waitForHomeReady(page)
    await applyWestDistrictFilter(page)
    const id = await firstSchoolId(page)

    await page.evaluate(() => window.__e2eHome!.setMobileMode('map'))
    await openPreviewThenDetail(page, id)

    await page.goBack()
    await waitForMapReadyAfterBack(page)

    const after = await page.evaluate(() => window.__e2eHome!.getState())
    expect(after.mobileMode).toBe('map')
    expect(after.showPreview).toBe(false)
  })
})
