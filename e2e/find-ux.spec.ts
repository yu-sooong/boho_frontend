/**
 * 找班 UX：底欄、關鍵字提示／chip、空狀態清除、收藏、篩選預覽、定位失敗提示
 */
import { test, expect, type Page } from '@playwright/test'
import { seedCityOnboarding } from './helpers/seedCity'

type E2eHome = {
  setMobileMode: (mode: 'list' | 'map') => void
  setDistricts: (districts: string[]) => void
  setKeyword?: (kw: string) => void
  availableDistricts: () => string[]
  firstSchoolId: () => string | null
  getState: () => {
    mobileMode: 'list' | 'map'
    keyword: string
    filterCount: number
  }
}

declare global {
  interface Window {
    __e2eHome?: E2eHome
    __e2eSetKeyword?: (kw: string) => void
  }
}

async function waitForHomeReady(page: Page) {
  await seedCityOnboarding(page)
  await page.goto('/find')
  await expect(page).toHaveURL(/\/find/)
  await page.waitForFunction(() => !!window.__e2eHome, null, { timeout: 20_000 })
  await page.waitForFunction(
    () => (window.__e2eHome?.availableDistricts().length ?? 0) > 0,
    null,
    { timeout: 40_000 },
  )
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {})
}

test.describe('找班 UX', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('手機地圖模式仍顯示底欄', async ({ page }) => {
    await waitForHomeReady(page)
    await page.evaluate(() => window.__e2eHome!.setMobileMode('map'))
    await page.waitForFunction(
      () => window.__e2eHome?.getState().mobileMode === 'map',
      null,
      { timeout: 5_000 },
    )
    await expect(page.getByRole('navigation').getByText('導覽')).toBeVisible()
    await expect(page.getByRole('navigation').getByText('情報')).toBeVisible()
    await expect(page.getByRole('navigation').getByText('更多')).toBeVisible()
  })

  test('關鍵字不足 2 字顯示提示；滿 2 字出現 chip', async ({ page }) => {
    await waitForHomeReady(page)
    // 列表列與地圖浮層各有一支搜尋框；列表模式用可見的那支
    const search = page.getByRole('searchbox', { name: '搜尋補習班名稱或地址' }).first()
    await search.fill('補')
    await expect(page.getByTestId('keyword-hint')).toBeVisible()
    await search.fill('補習')
    await expect(page.getByTestId('keyword-chip')).toBeVisible()
    await expect(page.getByTestId('keyword-hint')).toHaveCount(0)
  })

  test('空結果可一鍵清除篩選', async ({ page }) => {
    await waitForHomeReady(page)
    const search = page.getByRole('searchbox', { name: '搜尋補習班名稱或地址' }).first()
    await search.fill('zzznoresult999')
    await expect(page.getByText('找不到符合條件的補習班')).toBeVisible({ timeout: 10_000 })
    await page.getByTestId('empty-clear-filters').click()
    await expect(page.getByTestId('empty-clear-filters')).toHaveCount(0)
  })

  test('列表卡片可收藏', async ({ page }) => {
    await waitForHomeReady(page)
    const fav = page.getByTestId('school-card-favorite').first()
    await expect(fav).toBeVisible()
    await expect(fav).toHaveAttribute('aria-pressed', 'false')
    await fav.click()
    await expect(fav).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/\/find/)
    await fav.click()
    await expect(fav).toHaveAttribute('aria-pressed', 'false')
    await expect(page).toHaveURL(/\/find/)
  })

  test('篩選面板顯示約幾筆預覽', async ({ page }) => {
    await waitForHomeReady(page)
    await page.getByRole('button', { name: '篩選' }).first().click()
    await expect(page.getByTestId('filter-apply')).toBeVisible()
    await expect(page.getByTestId('filter-apply')).toContainText(/約\s*[\d,]+\s*間/, {
      timeout: 8_000,
    })
  })

  test('定位失敗顯示提示', async ({ page }) => {
    await page.addInitScript(() => {
      const geo = {
        getCurrentPosition(
          _ok: PositionCallback,
          err?: PositionErrorCallback,
        ) {
          err?.({
            code: 1,
            message: 'denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        },
        watchPosition() {
          return 0
        },
        clearWatch() {},
      }
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: geo,
      })
    })
    await waitForHomeReady(page)
    await page.evaluate(() => window.__e2eHome!.setMobileMode('map'))
    await page.getByTestId('map-locate').click()
    await expect(page.getByTestId('locate-hint')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('locate-hint')).toContainText(/定位/)
  })
})
