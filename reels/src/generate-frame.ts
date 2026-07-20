/**
 * 產生白色系 iPhone 風格外框 PNG（螢幕區透明 + Dynamic Island）
 * 執行：npm run frame:generate
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { PATHS } from './config.js'
import { FRAME } from './layout.js'

const { width: W, height: H } = FRAME
const inset = 28
const outerR = 78
const innerR = 52
const screenW = W - inset * 2
const screenH = H - inset * 2

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body {
    margin: 0;
    width: ${W}px;
    height: ${H}px;
    background: transparent;
  }
  svg { display: block; }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#f4f4f5"/>
      <stop offset="100%" stop-color="#e4e4e7"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#d4d4d8" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- 外陰影（略透明，方便合成） -->
  <rect x="18" y="22" width="${W - 36}" height="${H - 36}" rx="${outerR}" fill="#000" opacity="0.08" filter="url(#soft)"/>

  <!-- 機身：evenodd 挖空螢幕 -->
  <path
    fill="url(#body)"
    fill-rule="evenodd"
    d="
      M ${outerR} 0
      H ${W - outerR}
      A ${outerR} ${outerR} 0 0 1 ${W} ${outerR}
      V ${H - outerR}
      A ${outerR} ${outerR} 0 0 1 ${W - outerR} ${H}
      H ${outerR}
      A ${outerR} ${outerR} 0 0 1 0 ${H - outerR}
      V ${outerR}
      A ${outerR} ${outerR} 0 0 1 ${outerR} 0
      Z
      M ${inset + innerR} ${inset}
      H ${inset + screenW - innerR}
      A ${innerR} ${innerR} 0 0 1 ${inset + screenW} ${inset + innerR}
      V ${inset + screenH - innerR}
      A ${innerR} ${innerR} 0 0 1 ${inset + screenW - innerR} ${inset + screenH}
      H ${inset + innerR}
      A ${innerR} ${innerR} 0 0 1 ${inset} ${inset + screenH - innerR}
      V ${inset + innerR}
      A ${innerR} ${innerR} 0 0 1 ${inset + innerR} ${inset}
      Z
    "
  />

  <!-- 金屬邊高光 -->
  <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="${outerR - 2}"
    fill="none" stroke="url(#rim)" stroke-width="3" opacity="0.85"/>

  <!-- 側邊按鈕（靜音／音量／電源） -->
  <rect x="0" y="220" width="5" height="52" rx="2" fill="#d4d4d8"/>
  <rect x="0" y="300" width="5" height="86" rx="2" fill="#d4d4d8"/>
  <rect x="0" y="400" width="5" height="86" rx="2" fill="#d4d4d8"/>
  <rect x="${W - 5}" y="340" width="5" height="120" rx="2" fill="#d4d4d8"/>

  <!-- Dynamic Island（蓋在影片上方） -->
  <rect x="${W / 2 - 92}" y="42" width="184" height="38" rx="19" fill="#0a0a0a"/>
  <circle cx="${W / 2 + 58}" cy="61" r="5" fill="#1a1a1a"/>
</svg>
</body>
</html>`

async function main() {
  mkdirSync(PATHS.publicDir, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({
    path: PATHS.framePng,
    omitBackground: true,
    type: 'png',
  })
  await browser.close()
  console.log(`[frame] 已產生 ${PATHS.framePng}`)
  console.log(
    `[frame] 畫布 ${W}×${H}；螢幕洞 inset=${inset}px radius=${innerR}px（見 src/config.ts FRAME.screen）`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
