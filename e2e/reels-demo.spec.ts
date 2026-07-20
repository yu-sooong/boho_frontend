/**
 * 補亦樂乎 Reels／Threads 素材 — UI 錄影（約 45–50 秒）
 *
 * ── 分鏡腳本（旁白可後製）────────────────────────────────────────
 *  0–3s    Loading → 歡迎導覽「報名前，先查清楚」
 *  3–14s   導覽放慢（搜尋／篩選／地圖／列表各停約 2 秒）
 * 14–20s   搜尋「美語」
 * 20–27s   篩選「西屯區」→ 套用
 * 27–35s   切地圖 → 預覽立案狀態
 * 35–42s   詳情：立案徽章 → 收藏
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
  await page.waitForFunction(() => !!window.__e2eHome, null, { timeout: 20_000 })
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 12_000 }).catch(() => {})
}

async function clickTourNext(page: Page) {
  const next = page.locator('.driver-popover-next-btn')
  await next.waitFor({ state: 'visible', timeout: 8_000 })
  await next.click()
}

/** 導覽每步停留，讓觀眾看清楚 */
async function runSlowTour(page: Page) {
  await page.locator('.driver-popover').waitFor({ state: 'visible', timeout: 15_000 })
  await sleep(2200) // 歡迎

  for (let i = 0; i < 4; i++) {
    await clickTourNext(page)
    await sleep(2100)
  }
  await clickTourNext(page) // 開始探索
  await page.locator('.driver-popover').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  await sleep(600)
}

test('補亦樂乎核心互動 demo', async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000)
  await installReelsMocks(page)

  await page.addInitScript(() => {
    try {
      localStorage.removeItem('buyu:homeTourDone')
      localStorage.removeItem('buyu:favorites')
    } catch {
      // ignore
    }
  })

  const t0 = Date.now()
  await page.goto('/')
  await waitForHomeReady(page)

  // 1) 導覽
  await runSlowTour(page)

  // 2) 搜尋
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

  // 3) 篩選行政區
  await page.getByRole('button', { name: '篩選' }).first().click()
  await page.getByRole('heading', { name: /篩選條件/ }).waitFor({ state: 'visible' })
  await sleep(700)
  await page.getByRole('button', { name: '西屯區', exact: true }).click()
  await sleep(900)
  await page.getByRole('button', { name: '套用篩選' }).click()
  await sleep(1400)

  // 4) 地圖 + 預覽
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

  // 5) 詳情：立案 → 收藏
  await page.getByRole('button', { name: /查看完整資訊/ }).click()
  await page.waitForURL(new RegExp(`/schools/${schoolId}`), { timeout: 10_000 })
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(2200)

  await page.getByRole('button', { name: '加入收藏' }).click()
  await sleep(1200)

  // 6) 評價
  await page.getByRole('heading', { name: '家長評價' }).scrollIntoViewIfNeeded()
  await sleep(2800)

  // 再輕微上滾一點，讓評價卡片完整入鏡
  await page.mouse.wheel(0, 120)
  await sleep(1600)

  const elapsed = Date.now() - t0
  if (elapsed < TARGET_MS) await sleep(TARGET_MS - elapsed)
  console.log(`[reels:record] 片長約 ${((Date.now() - t0) / 1000).toFixed(1)}s → ${OUT_DIR}`)
})
