/**
 * 把 UI raw 錄影套進 3D 手機外框舞台，輸出滿版 9:16 mp4
 *
 * 流程：找 raw webm → 靜態伺服 stage → Playwright 錄舞台 → ffmpeg 轉 1080×1920
 */
import { createServer } from 'node:http'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'test-results/reels')
const STAGE_DIR = path.join(__dirname, 'reels-stage')
const TARGET_W = 1080
const TARGET_H = 1920

function findLatestWebm(dir) {
  if (!existsSync(dir)) return null
  const found = []
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      const st = statSync(p)
      if (st.isDirectory()) {
        if (name === 'stage-record') continue
        walk(p)
      } else if (name.endsWith('.webm') && !name.startsWith('buyu-')) {
        found.push(p)
      }
    }
  }
  walk(dir)
  // 也接受 buyu-reels-raw.webm
  const rawNamed = path.join(dir, 'buyu-reels-raw.webm')
  if (existsSync(rawNamed)) found.push(rawNamed)
  if (!found.length) return null
  found.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return found[0]
}

function resolveFfmpeg() {
  for (const bin of ['ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']) {
    const r = spawnSync(bin, ['-version'], { encoding: 'utf8' })
    if (r.status === 0) return bin
  }
  try {
    const require = createRequire(import.meta.url)
    return require('@ffmpeg-installer/ffmpeg').path
  } catch {
    return null
  }
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (filePath.endsWith('.webm')) return 'video/webm'
  if (filePath.endsWith('.mp4')) return 'video/mp4'
  if (filePath.endsWith('.js')) return 'text/javascript'
  if (filePath.endsWith('.css')) return 'text/css'
  return 'application/octet-stream'
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      let rel = decodeURIComponent(url.pathname)
      if (rel === '/') rel = '/index.html'
      const filePath = path.join(rootDir, rel)
      if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
        res.writeHead(404)
        res.end('not found')
        return
      }
      res.writeHead(200, { 'Content-Type': contentType(filePath) })
      res.end(readFileSync(filePath))
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, port })
    })
  })
}

const webm = findLatestWebm(OUT_DIR)
if (!webm) {
  console.error('[compose-reels] 找不到 raw webm，請先跑：npx playwright test e2e/reels-demo.spec.ts --project=reels')
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(STAGE_DIR, { recursive: true })

const rawOut = path.join(OUT_DIR, 'buyu-reels-raw.webm')
copyFileSync(webm, rawOut)
copyFileSync(rawOut, path.join(STAGE_DIR, 'screen.webm'))
console.log(`[compose-reels] raw ← ${webm}`)

const { server, port } = await startStaticServer(STAGE_DIR)
const stageUrl = `http://127.0.0.1:${port}/?src=./screen.webm`
const recordDir = path.join(OUT_DIR, 'stage-record')
mkdirSync(recordDir, { recursive: true })

console.log(`[compose-reels] stage ${stageUrl}`)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: TARGET_W, height: TARGET_H },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: recordDir,
    size: { width: TARGET_W, height: TARGET_H },
  },
})
const page = await context.newPage()
await page.goto(stageUrl, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('body[data-done="1"]', { timeout: 100_000 })
await page.waitForTimeout(400)
await context.close()
await browser.close()
server.close()

const staged = findLatestWebm(recordDir)
if (!staged) {
  console.error('[compose-reels] 舞台錄影失敗')
  process.exit(1)
}

const stagedWebm = path.join(OUT_DIR, 'buyu-reels-staged.webm')
copyFileSync(staged, stagedWebm)

const ffmpeg = resolveFfmpeg()
if (!ffmpeg) {
  console.error('[compose-reels] 需要 ffmpeg')
  process.exit(1)
}

const mp4Out = path.join(OUT_DIR, 'buyu-reels.mp4')
execFileSync(
  ffmpeg,
  [
    '-y',
    '-i',
    stagedWebm,
    '-vf',
    `scale=${TARGET_W}:${TARGET_H}:flags=lanczos`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-an',
    mp4Out,
  ],
  { stdio: 'inherit' },
)

const probe = spawnSync(ffmpeg, ['-i', mp4Out], { encoding: 'utf8' })
const info = `${probe.stderr ?? ''}`
const dim = info.match(/(\d{3,4})x(\d{3,4})/)
const dur = info.match(/Duration:\s*([\d:.]+)/)

// 方便預覽：抽一幀
const preview = path.join(OUT_DIR, 'preview-staged.jpg')
execFileSync(
  ffmpeg,
  ['-y', '-ss', '00:00:12', '-i', mp4Out, '-frames:v', '1', preview],
  { stdio: 'inherit' },
)

writeFileSync(
  path.join(OUT_DIR, 'STORYBOARD.txt'),
  `補亦樂乎 Reels 分鏡（約 45–50s）

0–3s   手機旋轉進場＋片頭「報名前，先查清楚」
3–14s  導覽放慢（搜尋／篩選／地圖／列表）
14–20s 搜尋「美語」
20–27s 篩選西屯區
27–35s 地圖預覽立案
35–42s 詳情＋收藏
42–48s 家長評價特寫 → 片尾品牌

成品：${mp4Out}
`,
)

console.log(`[compose-reels] ✅ ${mp4Out}`)
console.log(`[compose-reels] size=${dim ? `${dim[1]}x${dim[2]}` : '?'} duration=${dur?.[1] ?? '?'}`)
console.log(`[compose-reels] preview ${preview}`)
