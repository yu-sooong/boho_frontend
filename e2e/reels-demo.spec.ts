/**
 * 補亦樂乎 Reels／Threads 素材 — UI 錄影（約 45–50 秒）
 *
 * ── 分鏡腳本（旁白可後製）────────────────────────────────────────
 *  0–4s    Loading → 找班列表
 *  4–12s   搜尋「美語」
 * 12–22s   篩選「西屯區」→ 套用
 * 22–32s   切地圖 → 預覽立案狀態
 * 32–42s   詳情：立案徽章 → 收藏
 * 42–48s   滾到家長評價、停留
 *
 * 產出 raw：test-results/reels/（再經 npm run reels:compose 套 3D 手機外框）
 * 執行：npm run reels:demo
 */
import { test, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_SCHOOL_ID } from './fixtures/reelsMock'
import { installReelsMocks } from './helpers/reelsMocks'
import { seedCityOnboarding } from './helpers/seedCity'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../test-results/reels')
const TARGET_MS = 48_000

type E2eHome = {
  openPreview: (id: string) => void
  firstSchoolId: () => string | null
  setMobileMode: (mode: 'list' | 'map') => void
  getState: () => { mapReady: boolean; keyword: string }
}

declare global {
  interface Window {
    __e2eHome?: E2eHome
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function waitForHomeReady(page: Page) {
  await seedCityOnboarding(page)
  await page.goto('/find')
  await page.waitForFunction(() => !!window.__e2eHome, null, { timeout: 20_000 })
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 12_000 }).catch(() => {})
  await sleep(2200)
}

test('補亦樂乎核心互動 demo', async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000)
  await installReelsMocks(page)

  await page.addInitScript(() => {
    try {
      localStorage.removeItem('buyu:favorites')
    } catch {
      // ignore
    }
  })

  const t0 = Date.now()
  await waitForHomeReady(page)

  // 1) 搜尋
  const search = page.getByRole('searchbox', { name: '搜尋補習班名稱或地址' }).first()
  await search.click()
  await sleep(300)
  await search.pressSequentially('美語', { delay: 160 })
  await page.waitForFunction(
    () => (window.__e2eHome?.getState().keyword ?? '').includes('美語'),
    null,
    { timeout: 5_000 },
  )
  await sleep(1800)

  // 2) 篩選行政區
  await page.getByRole('button', { name: '篩選' }).first().click()
  await page.getByRole('heading', { name: /篩選條件/ }).waitFor({ state: 'visible' })
  await sleep(700)
  await page.getByRole('button', { name: '西屯區', exact: true }).click()
  await sleep(900)
  await page.getByRole('button', { name: /套用/ }).click()
  await sleep(1400)

  // 3) 地圖 + 預覽
  await page.getByRole('button', { name: '地圖' }).click()
  await page.waitForFunction(
    () => window.__e2eHome?.getState().mapReady === true,
    null,
    { timeout: 15_000 },
  )
  await sleep(2000)

  await page.waitForFunction(() => !!window.__e2eHome?.firstSchoolId(), null, { timeout: 10_000 })
  const schoolId =
    (await page.evaluate(() => window.__e2eHome!.firstSchoolId())) ?? DEMO_SCHOOL_ID

  await page.evaluate((id) => window.__e2eHome!.openPreview(id), schoolId)
  await sleep(2400)

  // 4) 詳情
  await page.goto(`/schools/${schoolId}`)
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 })
  await sleep(1600)

  const fav = page.getByRole('button', { name: /收藏|加入收藏|取消收藏/ }).first()
  if (await fav.isVisible().catch(() => false)) {
    await fav.click()
    await sleep(900)
  }

  await page.getByText(/評價|家長/).first().scrollIntoViewIfNeeded().catch(() => {})
  await sleep(2200)

  const elapsed = Date.now() - t0
  if (elapsed < TARGET_MS) await sleep(TARGET_MS - elapsed)

  testInfo.annotations.push({ type: 'reels-out', description: OUT_DIR })
})
