import path from 'node:path'
import { fileURLToPath } from 'node:url'

export { COMP, COPY, FRAME, type AdInputProps } from './layout.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const REELS_ROOT = path.resolve(__dirname, '..')

/** 僅供 Playwright 開啟；成品文案不出現此網址 */
export const RECORD_BASE_URL = 'http://localhost:5173'

export const PATHS = {
  tempDir: path.join(REELS_ROOT, 'temp'),
  outDir: path.join(REELS_ROOT, 'out'),
  publicDir: path.join(REELS_ROOT, 'public'),
  recordedWebm: path.join(REELS_ROOT, 'temp', 'recorded.webm'),
  recordedMp4: path.join(REELS_ROOT, 'temp', 'recorded.mp4'),
  framePng: path.join(REELS_ROOT, 'public', 'iphone-frame.png'),
  finalMp4: path.join(REELS_ROOT, 'out', 'final-ad.mp4'),
  remotionEntry: path.join(REELS_ROOT, 'src', 'remotion', 'index.ts'),
}
