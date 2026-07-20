import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { PATHS } from './config.js'

function resolveFfmpeg(): string {
  for (const bin of ['ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']) {
    const r = spawnSync(bin, ['-version'], { encoding: 'utf8' })
    if (r.status === 0) return bin
  }
  try {
    const require = createRequire(import.meta.url)
    return require('@ffmpeg-installer/ffmpeg').path as string
  } catch {
    throw new Error('找不到 ffmpeg，請安裝或 npm i -D @ffmpeg-installer/ffmpeg')
  }
}

/** webm → mp4（Remotion OffthreadVideo 較穩） */
export function convertWebmToMp4(inputWebm: string, outputMp4 = PATHS.recordedMp4): string {
  const ffmpeg = resolveFfmpeg()
  console.log(`[convert] ${inputWebm} → ${outputMp4}`)
  execFileSync(
    ffmpeg,
    [
      '-y',
      '-i',
      inputWebm,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      outputMp4,
    ],
    { stdio: 'inherit' },
  )
  return outputMp4
}
