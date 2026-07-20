/** Remotion／Node 共用的純資料（不可 import node:） */

export const FRAME = {
  width: 860,
  height: 1760,
  screen: {
    left: 28 / 860,
    top: 28 / 1760,
    width: 804 / 860,
    height: 1704 / 1760,
    radius: 52,
  },
} as const

export const COMP = {
  width: 1080,
  height: 1920,
  fps: 30,
  phoneWidth: 780,
  phoneTop: 280,
} as const

export const COPY = {
  title: '報名前，先查清楚',
  subtitle: '立案 · 地圖 · 家長評價',
  brand: '補亦樂乎',
  cta: 'boho.yujii.app',
} as const

export type AdInputProps = {
  videoSrc: string
  title: string
  subtitle: string
  brand: string
  cta: string
}
