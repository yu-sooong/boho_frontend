/**
 * 本機全頁 QA + Monkey（Vite :5173 + 後端 :3000）
 * 執行：npx playwright test e2e/local-qa-monkey.spec.ts --project=local-qa
 */
import { test, expect, type Page, type Request, type Response } from '@playwright/test'
import { seedCityOnboarding } from './helpers/seedCity'

type NetIssue = {
  kind: 'http_error' | 'request_failed' | 'page_error' | 'console_error'
  detail: string
}

async function attachMonitors(page: Page) {
  const issues: NetIssue[] = []
  const apiCalls: { method: string; url: string; status?: number }[] = []

  page.on('pageerror', (err) => {
    issues.push({ kind: 'page_error', detail: String(err) })
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text()
      // Vite HMR / 地圖 tile 偶發噪音略過
      if (/favicon|Download the Vue Devtools|net::ERR_ABORTED.*tiles/i.test(t)) return
      issues.push({ kind: 'console_error', detail: t })
    }
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (/googletagmanager|google-analytics|fonts\.g|basemaps\.cartocdn|favicon/i.test(url)) return
    issues.push({
      kind: 'request_failed',
      detail: `${req.failure()?.errorText ?? 'failed'} ${req.method()} ${url}`,
    })
  })
  page.on('response', (res: Response) => {
    const req = res.request()
    const url = res.url()
    if (!/127\.0\.0\.1:3000|localhost:3000|\/api\//.test(url)) return
    apiCalls.push({ method: req.method(), url, status: res.status() })
    if (res.status() >= 500) {
      issues.push({ kind: 'http_error', detail: `${res.status()} ${req.method()} ${url}` })
    }
  })

  return { issues, apiCalls }
}

async function dismissOverlays(page: Page) {
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 12_000 }).catch(() => {})
  await page.keyboard.press('Escape').catch(() => {})
}

test.describe.configure({ mode: 'serial' })

test.describe('本機 QA：全頁操作 + Monkey', () => {
  test.use({
    baseURL: 'http://127.0.0.1:5173',
    locale: 'zh-TW',
    geolocation: { latitude: 24.1477, longitude: 120.6736 },
    permissions: ['geolocation'],
    viewport: { width: 390, height: 844 },
  })

  test('後端 health 與三縣市 all API', async ({ request }) => {
    const health = await request.get('http://127.0.0.1:3000/health')
    expect(health.ok()).toBeTruthy()
    const body = await health.json()
    expect(body.status).toBe('ok')
    expect(body.mongo).toBe('up')

    for (const city of ['taichung', 'newtaipei', 'kaohsiung']) {
      const res = await request.get(`http://127.0.0.1:3000/api/schools/all?city=${city}`)
      expect(res.ok(), `${city} status ${res.status()}`).toBeTruthy()
      const json = await res.json()
      expect(json.total, city).toBeGreaterThan(100)
      expect(Array.isArray(json.data)).toBeTruthy()
    }

    const badNearby = await request.get(
      'http://127.0.0.1:3000/api/schools/nearby?city=taichung&lng=foo&lat=24',
    )
    expect(badNearby.status()).toBe(400)
  })

  test('導覽選縣市 → 找班列表／地圖／詳情', async ({ page }) => {
    const mon = await attachMonitors(page)
    await seedCityOnboarding(page, 'taichung')

    await page.goto('/find', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await expect(page).toHaveURL(/\/find/)
    await expect(page.getByText(/共\s*[\d,]+\s*間/).first()).toBeVisible({ timeout: 40_000 })
    await page.waitForFunction(() => !!window.__e2eHome, null, { timeout: 20_000 }).catch(() => {})

    // 切地圖再回列表（確認切換不會炸掉）
    await page.evaluate(() => window.__e2eHome?.setMobileMode('map')).catch(() => {})
    await page.waitForTimeout(600)
    await page.evaluate(() => window.__e2eHome?.setMobileMode('list')).catch(() => {})
    await page.waitForTimeout(400)

    const firstLink = page.locator('a[href^="/schools/"]:visible').first()
    await expect(firstLink).toBeVisible({ timeout: 20_000 })
    await firstLink.click()
    await expect(page).toHaveURL(/\/schools\//)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })

    // 收藏
    const fav = page.getByRole('button', { name: /取消收藏|加入收藏/ }).first()
    if (await fav.count()) {
      await fav.click().catch(() => {})
      await page.waitForTimeout(300)
    }

    const fatal = mon.issues.filter((i) => i.kind === 'page_error' || i.kind === 'http_error')
    expect(fatal, JSON.stringify(fatal)).toEqual([])
  })

  test('靜態頁與底欄導覽逐一點開', async ({ page }) => {
    const mon = await attachMonitors(page)
    await seedCityOnboarding(page, 'taichung')

    const paths: { path: string; expectText: RegExp }[] = [
      { path: '/', expectText: /補亦樂乎|選縣市|台中|找班/ },
      { path: '/find', expectText: /找班|共\s*[\d,]+\s*間|搜尋/ },
      { path: '/district-stats', expectText: /情報|行政區|統計|密度/ },
      { path: '/favorites', expectText: /收藏|對照/ },
      { path: '/guide', expectText: /文章|指南|選班/ },
      { path: '/guide/how-to-check-registration', expectText: /選|補習|指南|立案|文章/ },
      { path: '/ai-pick', expectText: /AI|規劃中|選班/ },
      { path: '/more', expectText: /更多|關於|條款/ },
      { path: '/more/about', expectText: /關於|資料來源|台中|新北|高雄/ },
      { path: '/more/contact', expectText: /聯絡|來信|常見問題/ },
      { path: '/more/privacy', expectText: /隱私/ },
      { path: '/more/terms', expectText: /服務條款|條款/ },
      { path: '/more/review-policy', expectText: /評價|審核/ },
      { path: '/this-route-should-404', expectText: /找不到|不存在|404/ },
    ]

    for (const { path, expectText } of paths) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await dismissOverlays(page)
      await expect(page.locator('#app')).not.toBeEmpty()
      await expect(page.locator('body')).toContainText(expectText, { timeout: 20_000 })
    }

    // 底欄點擊
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    for (const label of ['導覽', '找班', '情報', '更多']) {
      const nav = page.getByRole('navigation').getByText(label, { exact: true })
      if (await nav.count()) {
        await nav.first().click()
        await dismissOverlays(page)
        await page.waitForTimeout(400)
      }
    }

    const fatal = mon.issues.filter((i) => i.kind === 'page_error' || i.kind === 'http_error')
    expect(fatal, JSON.stringify(fatal)).toEqual([])
  })

  test('收藏兩班對照：選取／分享／重選', async ({ page }) => {
    const mon = await attachMonitors(page)
    await seedCityOnboarding(page, 'taichung')
    await page.goto('/find', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await expect(page.getByText(/共\s*[\d,]+\s*間/).first()).toBeVisible({ timeout: 40_000 })

    // 從列表收藏兩間（心形在卡片上）
    const hearts = page.getByRole('button', { name: /加入收藏|收藏/ })
    const n = await hearts.count()
    expect(n).toBeGreaterThan(1)
    await hearts.nth(0).click()
    await page.waitForTimeout(200)
    await hearts.nth(1).click()
    await page.waitForTimeout(200)

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await expect(page.getByTestId('compare-panel')).toBeVisible({ timeout: 20_000 })

    // 若尚未自動對照，點選兩間
    const table = page.getByTestId('compare-table')
    if (!(await table.isVisible().catch(() => false))) {
      const chips = page.locator('[data-testid="compare-panel"] button')
      const count = await chips.count()
      for (let i = 0; i < Math.min(count, 2); i++) {
        await chips.nth(i).click().catch(() => {})
      }
    }
    await expect(page.getByTestId('compare-table')).toBeVisible({ timeout: 15_000 })

    const share = page.getByTestId('share-compare')
    await expect(share).toBeVisible()
    await share.click()
    await page.waitForTimeout(500)

    await page.getByRole('button', { name: '重新選擇' }).click()
    await page.waitForTimeout(400)
    // 重選後對照表應消失（剛好兩間時也不能自動跳回）
    await expect(page.getByTestId('compare-table')).toHaveCount(0, { timeout: 5_000 })

    const fatal = mon.issues.filter((i) => i.kind === 'page_error' || i.kind === 'http_error')
    expect(fatal, JSON.stringify(fatal)).toEqual([])
  })

  test('Monkey：隨機點擊 45 秒', async ({ page }) => {
    const mon = await attachMonitors(page)
    await seedCityOnboarding(page, 'taichung')
    await page.goto('/find', { waitUntil: 'domcontentloaded' })
    await dismissOverlays(page)
    await expect(page.getByText(/共\s*[\d,]+\s*間/).first()).toBeVisible({ timeout: 40_000 })

    const deadline = Date.now() + 45_000
    let clicks = 0
    while (Date.now() < deadline) {
      const clickable = page.locator(
        'a[href], button:not([disabled]), [role="button"], [role="tab"]',
      )
      const n = await clickable.count()
      if (n === 0) break
      const idx = Math.floor(Math.random() * Math.min(n, 60))
      const el = clickable.nth(idx)
      const box = await el.boundingBox().catch(() => null)
      if (!box || box.width < 2 || box.height < 2) {
        await page.waitForTimeout(60)
        continue
      }
      const label = (
        ((await el.innerText().catch(() => '')) + ' ' + ((await el.getAttribute('href')) ?? ''))
      ).slice(0, 80)
      if (/送出評價|刪除|退件|通過|Admin|登出/.test(label)) {
        await page.waitForTimeout(40)
        continue
      }
      await el.click({ timeout: 1500, force: true }).catch(() => {})
      clicks += 1
      await page.waitForTimeout(160 + Math.floor(Math.random() * 280))
      await dismissOverlays(page)
    }

    const search = page.getByRole('searchbox').first()
    if (await search.count()) {
      await search.fill('🔥\'"><img src=x onerror=alert(1)>', { timeout: 2000 }).catch(() => {})
      await page.waitForTimeout(600)
      await search.fill('', { timeout: 2000 }).catch(() => {})
    }

    console.log('LOCAL_MONKEY_CLICKS', clicks)
    console.log(
      'LOCAL_MONKEY_ISSUES',
      JSON.stringify(
        mon.issues.filter((i) => i.kind === 'page_error' || i.kind === 'http_error'),
        null,
        2,
      ),
    )
    expect(clicks).toBeGreaterThan(8)
    const fatal = mon.issues.filter((i) => i.kind === 'page_error' || i.kind === 'http_error')
    expect(fatal, JSON.stringify(fatal)).toEqual([])
  })
})
