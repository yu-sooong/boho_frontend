/**
 * 把 Playwright webm 轉成 IG 可用的滿版 9:16 mp4（1080×1920）
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'test-results/reels-15s')
const TARGET_W = 1080
const TARGET_H = 1920

function findLatestWebm(dir) {
  if (!existsSync(dir)) return null
  const found = []
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      const st = statSync(p)
      if (st.isDirectory()) walk(p)
      else if (name.endsWith('.webm')) found.push(p)
    }
  }
  walk(dir)
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

const webm = findLatestWebm(OUT_DIR)
if (!webm) {
  console.error('[finalize-reels] 找不到 webm，請先跑 npm run reels:15s')
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })
const webmOut = path.join(OUT_DIR, 'buyu-reels-15s.webm')
const mp4Out = path.join(OUT_DIR, 'buyu-reels-15s.mp4')
copyFileSync(webm, webmOut)

const ffmpeg = resolveFfmpeg()
if (!ffmpeg) {
  console.error('[finalize-reels] 需要 ffmpeg（或安裝 @ffmpeg-installer/ffmpeg）')
  console.error(`已複製原始檔：${webmOut}`)
  process.exit(1)
}

// 等比放大到 1080×1920；來源應已是 9:16
execFileSync(
  ffmpeg,
  [
    '-y',
    '-i',
    webmOut,
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

const probe = spawnSync(
  ffmpeg,
  ['-i', mp4Out],
  { encoding: 'utf8' },
)
const info = `${probe.stderr ?? ''}`
const dim = info.match(/(\d{3,4})x(\d{3,4})/)
const dur = info.match(/Duration:\s*([\d:.]+)/)
console.log(`[finalize-reels] ${mp4Out}`)
console.log(`[finalize-reels] size=${dim ? `${dim[1]}x${dim[2]}` : '?'} duration=${dur?.[1] ?? '?'}`)
if (dim && (dim[1] !== String(TARGET_W) || dim[2] !== String(TARGET_H))) {
  console.warn('[finalize-reels] 警告：輸出尺寸不是 1080x1920')
  process.exit(2)
}
