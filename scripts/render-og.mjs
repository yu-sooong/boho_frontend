/**
 * 以站內 SproutLogo 路徑渲染 OG 圖（1200×630）
 * 用法：node scripts/render-og.mjs
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.resolve(__dirname, '../public/og.png')

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
      background:
        radial-gradient(ellipse 80% 70% at 15% 20%, rgba(15, 118, 110, 0.10), transparent 55%),
        radial-gradient(ellipse 60% 50% at 90% 80%, rgba(16, 185, 129, 0.08), transparent 50%),
        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 45%, #ecfdf5 100%);
      display: flex;
      align-items: center;
      padding: 0 96px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 56px;
      width: 100%;
    }
    .logo {
      width: 220px;
      height: 220px;
      flex-shrink: 0;
      filter: drop-shadow(0 12px 28px rgba(15, 23, 42, 0.08));
    }
    .copy { min-width: 0; }
    .brand {
      font-size: 96px;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #0f172a;
      line-height: 1.05;
    }
    .sub {
      margin-top: 22px;
      font-size: 32px;
      font-weight: 700;
      color: #0f766e;
      letter-spacing: 0.02em;
    }
    .bar {
      margin-top: 28px;
      width: 72px;
      height: 6px;
      border-radius: 999px;
      background: #10b981;
    }
  </style>
</head>
<body>
  <div class="row">
    <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 18,8 L 38,8 L 38,48 A 30,30 0 0,1 18,62 Z" fill="#1e293b"/>
      <path d="M 38,22 L 54,22 A 34,34 0 0,1 88,56 A 34,34 0 0,1 54,90 L 38,90 L 38,68 L 54,68 A 12,12 0 0,0 66,56 A 12,12 0 0,0 54,44 L 38,44 Z" fill="#1e293b"/>
      <g>
        <path d="M 26,74 L 30,74 L 30,90 L 26,90 Z" fill="#10b981"/>
        <path d="M 27,74 C 14,74 10,63 12,56 C 18,56 26,64 27,74 Z" fill="#10b981"/>
        <path d="M 29,72 C 42,65 46,52 45,44 C 35,46 28,59 29,72 Z" fill="#10b981"/>
      </g>
    </svg>
    <div class="copy">
      <div class="brand">補亦樂乎</div>
      <div class="sub">台中補習班地圖・立案核查・家長評價</div>
      <div class="bar"></div>
    </div>
  </div>
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
})
await page.setContent(html, { waitUntil: 'networkidle' })
// 等字體載入
await page.evaluate(async () => {
  if (document.fonts?.ready) await document.fonts.ready
})
await mkdir(path.dirname(outPath), { recursive: true })
const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
await writeFile(outPath, buf)
await browser.close()
console.log('Wrote', outPath)
