/**
 * 遠端預覽站 QA + 輕量 Monkey（不依賴本地 Vite、不依賴 __e2eHome）
 * 執行：npm run test:e2e:remote
 */
import { test, expect, type Page, type Request, type Response } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://boho-frontend.sscode543.workers.dev'

type NetIssue = {
  kind: 'http_error' | 'request_failed' | 'page_error' | 'console_error'
  detail: string
}

async function attachMonitors(page: Page) {
  const issues: NetIssue[] = []
  const apiCalls: { method: string; url: string; status?: number; ms?: number }[] = []

  page.on('pageerror', (err) => {
    issues.push({ kind: 'page_error', detail: String(err) })
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      issues.push({ kind: 'console_error', detail: msg.text() })
    }
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (
      url.includes('googletagmanager') ||
      url.includes('google-analytics') ||
      url.includes('fonts.g') ||
      url.includes('maps.')
    ) {
      return
    }
    issues.push({
      kind: 'request_failed',
      detail: `${req.failure()?.errorText ?? 'failed'} ${req.method()} ${url}`,
    })
  })

  const started = new Map<Request, number>()
  page.on('request', (req) => {
    if (req.url().includes('api.yujii.app')) started.set(req, Date.now())
  })
  page.on('response', (res: Response) => {
    const req = res.request()
    const url = res.url()
    if (url.includes('api.yujii.app')) {
      const t0 = started.get(req)
      apiCalls.push({
        method: req.method(),
        url,
        status: res.status(),
        ms: t0 ? Date.now() - t0 : undefined,
      })
      if (res.status() >= 400) {
        issues.push({ kind: 'http_error', detail: `${res.status()} ${req.method()} ${url}` })
      }
    }
  })

  return { issues, apiCalls }
}

async function skipTourBeforeLoad(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('buyu:homeTourDone', '1')
    } catch {
      /* ignore */
    }
  })
}

async function dismissOverlays(page: Page) {
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 15_000 }).catch(() => {})
  await page.evaluate(() => {
    document.querySelectorAll('.driver-overlay, .driver-popover').forEach((el) => el.remove())
  })
  const skip = page.getByRole('button', { name: '略過' }).or(page.getByText('略過'))
  if (await skip.count()) {
    await skip.first().click({ timeout: 2000, force: true }).catch(() => {})
  }
  await page.keyboard.press('Escape').catch(() => {})
}

test.describe.configure({ mode: 'serial' })

test.describe('遠端 QA：補亦樂乎預覽站', () => {
  test.use({
    baseURL: BASE,
    locale: 'zh-TW',
    geolocation: { latitude: 24.1477, longitude: 120.6736 },
    permissions: ['geolocation'],
    viewport: { width: 1280, height: 800 },
  })

  test('首頁載入、打 API、列表可見', async ({ page }) => {
    const mon = await attachMonitors(page)
    await skipTourBeforeLoad(page)
    const allResp = page.waitForResponse(
      (r) => r.url().includes('/api/schools/all') && r.ok(),
      { timeout: 60_000 },
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const resp = await allResp
    expect(resp.status()).toBe(200)
    await dismissOverlays(page)

    await expect(page.getByText(/共\s*[\d,]+\s*間補習班/)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('searchbox')).toBeVisible()

    console.log('API_CALLS', JSON.stringify(mon.apiCalls, null, 2))
    console.log('ISSUES', JSON.stringify(mon.issues, null, 2))
    expect(mon.issues.filter((i) => i.kind === 'page_error')).toEqual([])
    expect(mon.issues.filter((i) => i.kind === 'http_error')).toEqual([])
  })

  test('詳情頁可開啟且評價區塊可載入', async ({ page }) => {
    const mon = await attachMonitors(page)
    await skipTourBeforeLoad(page)
    const id = '6a58a402e59598a1d93824b8'

    // A) 硬載入詳情：應打 GET /schools/:id + reviews
    const hardDetail = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/schools/${id}`) &&
        !r.url().includes('/reviews') &&
        r.ok(),
      { timeout: 30_000 },
    )
    const reviewsHard = page.waitForResponse(
      (r) => r.url().includes(`/api/reviews/school/${id}`) && r.ok(),
      { timeout: 30_000 },
    )
    await page.goto(`/schools/${id}`, { waitUntil: 'domcontentloaded' })
    await hardDetail
    await reviewsHard
    await dismissOverlays(page)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/家長評價|還沒有評價|尚無評分/).first()).toBeVisible()

    // B) 先載首頁再 SPA 進詳情：驗證是否短路掉 detail API（產品風險）
    const mon2 = await attachMonitors(page)
    const allResp = page.waitForResponse(
      (r) => r.url().includes('/api/schools/all') && r.ok(),
      { timeout: 60_000 },
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await allResp
    await dismissOverlays(page)

    const reviewsSoft = page.waitForResponse(
      (r) => r.url().includes(`/api/reviews/school/${id}`) && r.ok(),
      { timeout: 30_000 },
    )
    await page.locator(`a[href="/schools/${id}"]`).first().click({ timeout: 10_000 })
    await expect(page).toHaveURL(new RegExp(`/schools/${id}`))
    await reviewsSoft
    const detailFromList = mon2.apiCalls.some(
      (c) => c.url.includes(`/api/schools/${id}`) && !c.url.includes('/reviews') && c.method === 'GET',
    )
    console.log('DETAIL_FROM_LIST_HIT_DETAIL_API', detailFromList)
    console.log('HARD_DETAIL_API', JSON.stringify(mon.apiCalls, null, 2))
    console.log('SOFT_DETAIL_API', JSON.stringify(mon2.apiCalls, null, 2))
    console.log('DETAIL_ISSUES', JSON.stringify([...mon.issues, ...mon2.issues], null, 2))
    // 修 H1 後：從列表進詳情也必須打 detail API
    expect(detailFromList).toBe(true)
    expect([...mon.issues, ...mon2.issues].filter((i) => i.kind === 'page_error')).toEqual([])
  })

  test('行政區統計頁載入', async ({ page }) => {
    const mon = await attachMonitors(page)
    await skipTourBeforeLoad(page)
    const summary = page.waitForResponse(
      (r) => r.url().includes('/api/stats/summary') && r.ok(),
      { timeout: 30_000 },
    )
    await page.goto('/district-stats', { waitUntil: 'domcontentloaded' })
    await summary.catch(() => null)
    await dismissOverlays(page)
    await page.waitForTimeout(1500)
    const text = await page.locator('body').innerText()
    expect(text.length).toBeGreaterThan(20)
    console.log('STATS_API', JSON.stringify(mon.apiCalls, null, 2))
    console.log('STATS_ISSUES', JSON.stringify(mon.issues, null, 2))
    expect(mon.issues.filter((i) => i.kind === 'page_error')).toEqual([])
  })

  test('靜態／Coming Soon／404／Admin 未授權', async ({ page }) => {
    const mon = await attachMonitors(page)
    await skipTourBeforeLoad(page)
    for (const path of ['/guide', '/ai-pick', '/more', '/more/about', '/more/contact', '/favorites']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await dismissOverlays(page)
      await expect(page.locator('#app')).not.toBeEmpty()
    }

    await page.goto('/schools/000000000000000000000000', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await page.waitForTimeout(1500)

    await page.goto('/this-route-should-404', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await expect(page.getByText(/找不到|不存在|404/i).first()).toBeVisible({ timeout: 10_000 })

    await page.goto('/admin/reviews', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await expect(page.getByText('評價審核')).toBeVisible({ timeout: 10_000 })

    const tokenInput = page.locator('input[type="password"]').first()
    await tokenInput.fill('definitely-wrong-token')
    await page.getByRole('button', { name: /載入待審/ }).click()
    await expect(page.getByText(/未授權|失敗|錯誤|Token/i).first()).toBeVisible({ timeout: 10_000 })

    console.log('MISC_API', JSON.stringify(mon.apiCalls, null, 2))
    console.log('MISC_ISSUES', JSON.stringify(mon.issues, null, 2))
    expect(mon.issues.filter((i) => i.kind === 'page_error')).toEqual([])
  })

  test('Monkey：隨機點擊導覽 40 秒', async ({ page }) => {
    const mon = await attachMonitors(page)
    await skipTourBeforeLoad(page)
    const allResp = page.waitForResponse(
      (r) => r.url().includes('/api/schools/all') && r.ok(),
      { timeout: 60_000 },
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await allResp
    await dismissOverlays(page)

    const deadline = Date.now() + 40_000
    let clicks = 0
    while (Date.now() < deadline) {
      const clickable = page.locator(
        'a[href], button:not([disabled]), [role="button"], [role="tab"]',
      )
      const n = await clickable.count()
      if (n === 0) break
      const idx = Math.floor(Math.random() * Math.min(n, 50))
      const el = clickable.nth(idx)
      const box = await el.boundingBox().catch(() => null)
      if (!box || box.width < 2 || box.height < 2) {
        await page.waitForTimeout(80)
        continue
      }
      const label = (
        ((await el.innerText().catch(() => '')) + ' ' + ((await el.getAttribute('href')) ?? ''))
      ).slice(0, 100)
      if (/送出評價|刪除|退件|通過|Admin/.test(label)) {
        await page.waitForTimeout(40)
        continue
      }
      await el.click({ timeout: 1500, force: true }).catch(() => {})
      clicks += 1
      await page.waitForTimeout(180 + Math.floor(Math.random() * 350))
      await dismissOverlays(page)
    }

    const search = page.getByRole('searchbox').first()
    if (await search.count()) {
      await search.fill('🔥\'"><script>alert(1)</script>', { timeout: 2000 }).catch(() => {})
      await page.waitForTimeout(800)
      await search.fill('', { timeout: 2000 }).catch(() => {})
    }

    console.log('MONKEY_CLICKS', clicks)
    console.log('MONKEY_API', JSON.stringify(mon.apiCalls, null, 2))
    console.log('MONKEY_ISSUES', JSON.stringify(mon.issues, null, 2))
    const fatal = mon.issues.filter((i) => i.kind === 'page_error')
    expect(fatal, JSON.stringify(fatal)).toEqual([])
  })
})
