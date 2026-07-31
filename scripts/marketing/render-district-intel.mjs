/**
 * 渲染「地區教育情報」社群短動畫
 * 用法：node scripts/marketing/render-district-intel.mjs
 *
 * 輸出：
 * - threads-district-intel.{png,webm,mp4}（1:1）
 * - stories-district-intel.{png,webm,mp4}（9:16）
 */
import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readdir, rename, unlink, rmdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, 'out')
const require = createRequire(import.meta.url)

function resolveFfmpeg() {
  try {
    return require('@ffmpeg-installer/ffmpeg').path
  } catch {
    try {
      return require(
        path.resolve(__dirname, '../../reels/node_modules/@ffmpeg-installer/ffmpeg'),
      ).path
    } catch {
      return null
    }
  }
}

function toMp4(webmPath, mp4Path) {
  const ffmpeg = resolveFfmpeg()
  if (!ffmpeg) {
    console.warn('略過 mp4（找不到 @ffmpeg-installer/ffmpeg；可用 reels 套件）')
    return
  }
  const r = spawnSync(
    ffmpeg,
    ['-y', '-i', webmPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path],
    { encoding: 'utf8' },
  )
  if (r.status !== 0) {
    console.warn('mp4 轉檔失敗', r.stderr?.slice(-400))
    return
  }
  console.log('Wrote', mp4Path)
}

const jobs = [
  {
    file: 'poster-district-intel.html',
    png: 'threads-district-intel.png',
    webm: 'threads-district-intel.webm',
    mp4: 'threads-district-intel.mp4',
    width: 1080,
    height: 1080,
    waitMs: 2800,
    recordMs: 9200,
  },
  {
    file: 'poster-district-intel-story.html',
    png: 'stories-district-intel.png',
    webm: 'stories-district-intel.webm',
    mp4: 'stories-district-intel.mp4',
    width: 1080,
    height: 1920,
    waitMs: 2800,
    recordMs: 9200,
  },
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()

for (const job of jobs) {
  const htmlUrl = pathToFileURL(path.join(__dirname, job.file)).href

  {
    const page = await browser.newPage({
      viewport: { width: job.width, height: job.height, deviceScaleFactor: 1 },
    })
    await page.goto(htmlUrl, { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
    })
    await page.waitForTimeout(job.waitMs)
    const outPath = path.join(outDir, job.png)
    await page.screenshot({ path: outPath, type: 'png' })
    console.log('Wrote', outPath)
    await page.close()
  }

  {
    const tmpDir = path.join(outDir, `.tmp-${job.webm}`)
    await mkdir(tmpDir, { recursive: true })
    const context = await browser.newContext({
      viewport: { width: job.width, height: job.height },
      recordVideo: {
        dir: tmpDir,
        size: { width: job.width, height: job.height },
      },
    })
    const vpage = await context.newPage()
    await vpage.goto(htmlUrl, { waitUntil: 'networkidle' })
    await vpage.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
    })
    await vpage.waitForTimeout(job.recordMs)
    await context.close()

    const files = (await readdir(tmpDir)).filter((f) => f.endsWith('.webm'))
    const latest = files.sort().at(-1)
    if (latest) {
      const dest = path.join(outDir, job.webm)
      try {
        await unlink(dest)
      } catch {
        /* ignore */
      }
      await rename(path.join(tmpDir, latest), dest)
      console.log('Wrote', dest)
      toMp4(dest, path.join(outDir, job.mp4))
    }
    try {
      const left = await readdir(tmpDir)
      await Promise.all(left.map((f) => unlink(path.join(tmpDir, f))))
      await rmdir(tmpDir)
    } catch {
      /* ignore */
    }
  }
}

await browser.close()
console.log('Done →', outDir)
console.log('文案／腳本 → scripts/marketing/DISTRICT-INTEL.md')
