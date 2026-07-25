/**
 * 渲染 Threads 行銷圖／短動畫
 * 用法：node scripts/marketing/render-posters.mjs
 */
import { chromium } from 'playwright'
import { mkdir, readdir, rename } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, 'out')

const jobs = [
  { file: 'poster-map.html', out: 'threads-map.png' },
  { file: 'poster-pain.html', out: 'threads-pain.png' },
  { file: 'poster-devices-a.html', out: 'threads-devices-a.png' },
  { file: 'poster-devices-b.html', out: 'threads-devices-b.png' },
  { file: 'poster-saas-hero.html', out: 'threads-saas-hero.png', width: 1080, height: 1350 },
  { file: 'poster-viral-keynote.html', out: 'threads-viral-keynote.png', width: 1080, height: 1350 },
  { file: 'poster-anim.html', out: 'threads-anim-frame.png', waitMs: 2200 },
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()

for (const job of jobs) {
  const w = job.width ?? 1080
  const h = job.height ?? 1080
  const page = await browser.newPage({
    viewport: { width: w, height: h, deviceScaleFactor: 1 },
  })
  const htmlPath = path.join(__dirname, job.file)
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  if (job.waitMs) await page.waitForTimeout(job.waitMs)
  const outPath = path.join(outDir, job.out)
  await page.screenshot({ path: outPath, type: 'png' })
  console.log('Wrote', outPath)
  await page.close()
}

// 約 6 秒循環文案動畫（WebM，可上傳 Threads 或轉 GIF）
{
  const animUrl = pathToFileURL(path.join(__dirname, 'poster-anim.html')).href
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    recordVideo: { dir: outDir, size: { width: 1080, height: 1080 } },
  })
  const vpage = await context.newPage()
  await vpage.goto(animUrl, { waitUntil: 'networkidle' })
  await vpage.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await vpage.waitForTimeout(6500)
  await context.close()

  const files = (await readdir(outDir)).filter((f) => f.endsWith('.webm'))
  const generated = files.filter((f) => f !== 'threads-anim.webm').sort()
  const latest = generated.at(-1)
  if (latest) {
    const dest = path.join(outDir, 'threads-anim.webm')
    await rename(path.join(outDir, latest), dest)
    console.log('Wrote', dest)
  }
}

await browser.close()
console.log('Done →', outDir)
