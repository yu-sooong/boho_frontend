/**
 * 一鍵：錄影 → 轉檔 → Remotion 渲染 final-ad.mp4
 * 成品文案只出現 boho.yujii.app，不會露出 localhost 開發網址
 */
import { createServer, type Server } from 'node:http'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { COPY, PATHS, REELS_ROOT, type AdInputProps } from './config.js'
import { convertWebmToMp4 } from './convert-video.js'
import { recordAppDemo } from './recorder.js'

async function ensureFrame() {
  if (existsSync(PATHS.framePng)) return
  console.log('[ad] 尚未有外框，先產生 iphone-frame.png…')
  const { execFileSync } = await import('node:child_process')
  execFileSync('npx', ['tsx', 'src/generate-frame.ts'], {
    cwd: REELS_ROOT,
    stdio: 'inherit',
  })
}

function startAssetServer(filePath: string): Promise<{ server: Server; url: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = req.url?.split('?')[0] ?? '/'
      if (url === '/recorded.mp4' || url === '/') {
        try {
          const data = readFileSync(filePath)
          res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Length': data.length,
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
          })
          res.end(data)
        } catch (e) {
          res.writeHead(500)
          res.end(String(e))
        }
        return
      }
      res.writeHead(404)
      res.end('not found')
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('asset server failed'))
        return
      }
      resolve({ server, url: `http://127.0.0.1:${addr.port}/recorded.mp4` })
    })
  })
}

async function main() {
  mkdirSync(PATHS.tempDir, { recursive: true })
  mkdirSync(PATHS.outDir, { recursive: true })
  mkdirSync(PATHS.publicDir, { recursive: true })

  console.log('══════════════════════════════════════')
  console.log(' 補亦樂乎 · 一鍵廣告片 (Playwright + Remotion)')
  console.log('══════════════════════════════════════')

  await ensureFrame()

  let mp4 = PATHS.recordedMp4
  if (process.env.AD_SKIP_RECORD === '1' && existsSync(PATHS.recordedMp4)) {
    console.log('\n[Step 1/3] 略過錄影（AD_SKIP_RECORD=1）')
  } else {
    console.log('\n[Step 1/3] Playwright 錄影…')
    const webm = await recordAppDemo()
    console.log('\n[Step 2/3] 轉成 mp4 供 Remotion…')
    mp4 = convertWebmToMp4(webm, PATHS.recordedMp4)
  }
  copyFileSync(mp4, path.join(PATHS.publicDir, 'recorded.mp4'))
  console.log(`[media] ${statSync(mp4).size} bytes`)

  const { server, url: videoSrc } = await startAssetServer(mp4)
  console.log(`[ad] 媒體服務 ${videoSrc}`)

  const inputProps: AdInputProps = {
    videoSrc,
    title: COPY.title,
    subtitle: COPY.subtitle,
    brand: COPY.brand,
    cta: COPY.cta,
  }

  try {
    console.log('\n[Step 3/3] Remotion bundle + render…')
    console.log(`[ad] 標題「${inputProps.title}」／CTA ${inputProps.cta}`)

    const serveUrl = await bundle({
      entryPoint: PATHS.remotionEntry,
      publicDir: PATHS.publicDir,
      webpackOverride: (config) => config,
    })

    const composition = await selectComposition({
      serveUrl,
      id: 'PhoneAd',
      inputProps,
    })

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: PATHS.finalMp4,
      inputProps,
      chromiumOptions: { disableWebSecurity: true },
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100)
        if (pct % 5 === 0) process.stdout.write(`\r[render] ${pct}%`)
      },
    })
    process.stdout.write('\n')

    console.log('\n✅ 完成')
    console.log(`   ${PATHS.finalMp4}`)
    console.log('   （畫面文案為 boho.yujii.app，未露出開發網址）')
  } finally {
    server.close()
  }
}

main().catch((err) => {
  console.error('\n❌ 失敗:', err)
  process.exit(1)
})
