/**
 * Playwright：iPhone 視窗操作 localhost 並錄成 webm（畫面不露出開發網址）
 */
import { chromium, devices, type Page } from 'playwright'
import { mkdirSync, renameSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { COPY, PATHS, RECORD_BASE_URL } from './config.js'
import { installReelsMocks } from '../../e2e/helpers/reelsMocks.ts'
import { DEMO_SCHOOL_ID } from '../../e2e/fixtures/reelsMock.ts'

type E2eHome = {
  openPreview: (id: string) => void
  firstSchoolId: () => string | null
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

async function runSlowTour(page: Page) {
  await page.locator('.driver-popover').waitFor({ state: 'visible', timeout: 15_000 })
  await sleep(2200)
  for (let i = 0; i < 4; i++) {
    await clickTourNext(page)
    await sleep(2100)
  }
  await clickTourNext(page)
  await page.locator('.driver-popover').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  await sleep(600)
}

async function runDemoFlow(page: Page) {
  const t0 = Date.now()
  const TARGET_MS = 48_000

  await page.addInitScript(() => {
    try {
      localStorage.removeItem('buyu:homeTourDone')
      localStorage.removeItem('buyu:favorites')
    } catch {
      // ignore
    }
  })

  await page.goto(`${RECORD_BASE_URL}/`, { waitUntil: 'domcontentloaded' })
  await waitForHomeReady(page)
  await runSlowTour(page)

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

  await page.getByRole('button', { name: '篩選' }).first().click()
  await page.getByRole('heading', { name: /篩選條件/ }).waitFor({ state: 'visible' })
  await sleep(700)
  await page.getByRole('button', { name: '西屯區', exact: true }).click()
  await sleep(900)
  await page.getByRole('button', { name: '套用篩選' }).click()
  await sleep(1400)

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

  await page.getByRole('button', { name: /查看完整資訊/ }).click()
  await page.waitForURL(new RegExp(`/schools/${schoolId}`), { timeout: 10_000 })
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(2200)

  await page.getByRole('button', { name: '加入收藏' }).click()
  await sleep(1200)

  await page.getByRole('heading', { name: '家長評價' }).scrollIntoViewIfNeeded()
  await sleep(2800)
  await page.mouse.wheel(0, 120)
  await sleep(1600)

  const elapsed = Date.now() - t0
  if (elapsed < TARGET_MS) await sleep(TARGET_MS - elapsed)
  console.log(`[record] 流程片長約 ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

function pickRecordedWebm(dir: string): string {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.webm') && !f.startsWith('recorded'))
    .map((f) => path.join(dir, f))
  if (!files.length) throw new Error('找不到錄影 webm')
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return files[0]
}

export async function recordAppDemo(): Promise<string> {
  mkdirSync(PATHS.tempDir, { recursive: true })

  const device = devices['iPhone 14 Pro'] ?? devices['iPhone 13 Pro'] ?? devices['iPhone 12 Pro']
  if (!device) throw new Error('Playwright 找不到 iPhone 裝置預設')

  // 固定 9:16 手機視窗（DSF=1 + video.size 同尺寸，避免灰邊）
  const viewport = { width: 390, height: 844 }
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: device.userAgent,
    isMobile: true,
    hasTouch: true,
    locale: 'zh-TW',
    geolocation: { latitude: 24.1477, longitude: 120.6736 },
    permissions: ['geolocation'],
    deviceScaleFactor: 1,
    viewport,
    recordVideo: {
      dir: PATHS.tempDir,
      size: { width: viewport.width, height: viewport.height },
    },
  })

  const page = await context.newPage()
  await installReelsMocks(page)

  console.log(`[record] 開啟 ${RECORD_BASE_URL}（僅錄影用，成品文案為 ${COPY.cta}）`)
  console.log(`[record] 裝置 ${viewport.width}×${viewport.height}`)

  try {
    await runDemoFlow(page)
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }

  const raw = pickRecordedWebm(PATHS.tempDir)
  if (existsSync(PATHS.recordedWebm)) {
    try {
      renameSync(PATHS.recordedWebm, `${PATHS.recordedWebm}.bak`)
    } catch {
      // ignore
    }
  }
  renameSync(raw, PATHS.recordedWebm)
  console.log(`[record] 已儲存 ${PATHS.recordedWebm}`)
  return PATHS.recordedWebm
}

// CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('recorder.ts')
if (isMain) {
  recordAppDemo().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
