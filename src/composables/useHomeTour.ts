import { driver, type DriveStep, type PopoverDOM } from 'driver.js'
import 'driver.js/dist/driver.css'
import { TOUR_SPROUT_SVG } from '@/composables/tourSprout'

const STORAGE_KEY = 'buyu:homeTourDone'
const SPROUT_ID = 'buyu-tour-sprout'

let scheduled = false

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
}

function visibleTourEl(name: string): Element | undefined {
  const nodes = document.querySelectorAll(`[data-tour="${name}"]`)
  return (
    [...nodes].find((el) => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0
    }) ?? undefined
  )
}

function elOrSkip(name: string): Element {
  return visibleTourEl(name) ?? document.documentElement
}

function ensureSprout(): HTMLElement {
  let el = document.getElementById(SPROUT_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = SPROUT_ID
    el.className = 'buyu-tour-sprout'
    el.innerHTML = TOUR_SPROUT_SVG
    document.body.appendChild(el)
  }
  return el
}

function removeSprout(): void {
  document.getElementById(SPROUT_ID)?.remove()
}

/** Logo 小圖示飛到說明框旁邊（無聲伴遊，不另取名字） */
function flySproutToPopover(popover: PopoverDOM): void {
  const sprout = ensureSprout()
  const rect = popover.wrapper.getBoundingClientRect()
  const size = 52
  const gap = 10

  // 優先放在說明框左上外側；空間不夠則改右側或上方
  let left = rect.left - size - gap
  let top = rect.top - 4

  if (left < 8) {
    left = Math.min(rect.right + gap, window.innerWidth - size - 8)
  }
  if (top < 8) {
    top = Math.max(8, rect.top + 8)
  }
  if (top + size > window.innerHeight - 8) {
    top = window.innerHeight - size - 8
  }

  sprout.classList.add('is-visible')
  // 先觸發一次 reflow，讓 transition 生效
  void sprout.offsetWidth
  sprout.style.left = `${left}px`
  sprout.style.top = `${top}px`
}

function buildSteps(opts: {
  ensureListMode: () => void
  ensureMapVisible: () => void
}): DriveStep[] {
  return [
    {
      popover: {
        title: '歡迎使用補亦樂乎',
        description: '用地圖與列表查台中立案補習班、稽查紀錄與家長評價。接下來用 4 步認識首頁。',
        align: 'center',
      },
    },
    {
      element: () => elOrSkip('tour-search'),
      skipMissingElement: true,
      popover: {
        title: '搜尋補習班',
        description: '輸入名稱或地址，立刻縮小範圍。',
        side: 'bottom',
        align: 'start',
      },
      onHighlightStarted: () => opts.ensureListMode(),
    },
    {
      element: () => elOrSkip('tour-filter'),
      skipMissingElement: true,
      popover: {
        title: '篩選條件',
        description: '可依行政區、補習類別縮小範圍。',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: () => elOrSkip(isMobile() ? 'tour-map-btn' : 'tour-map'),
      skipMissingElement: true,
      popover: {
        title: isMobile() ? '切換地圖' : '地圖找班',
        description: isMobile()
          ? '點這裡打開地圖，再點圖釘預覽位置與立案狀態。'
          : '點圖釘可預覽；進詳情可看立案、稽查與評價。',
        side: isMobile() ? 'top' : 'left',
        align: 'center',
      },
      onHighlightStarted: () => {
        if (!isMobile()) opts.ensureMapVisible()
      },
    },
    {
      element: () => elOrSkip('tour-list'),
      skipMissingElement: true,
      popover: {
        title: '列表瀏覽',
        description: '滑動瀏覽結果、點卡片看詳情；也可愛心收藏，方便下次回來。',
        side: 'top',
        align: 'center',
      },
      onHighlightStarted: () => opts.ensureListMode(),
    },
  ]
}

export function hasCompletedHomeTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

export function markHomeTourDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

export function resetHomeTour(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    scheduled = false
  } catch {
    // ignore
  }
}

export function startHomeTour(handlers: {
  ensureListMode: () => void
  ensureMapVisible: () => void
}): void {
  ensureSprout()

  const d = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    smoothScroll: true,
    overlayColor: 'rgba(15, 23, 42, 0.45)',
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: 'buyu-tour-popover',
    nextBtnText: '下一步',
    prevBtnText: '返回',
    doneBtnText: '開始探索',
    progressText: '{{current}}／{{total}}',
    showButtons: ['next', 'previous', 'close'],
    skipMissingElement: true,
    steps: buildSteps(handlers),
    onPopoverRender: (popover) => {
      popover.closeButton.textContent = '略過'
      popover.closeButton.setAttribute('aria-label', '略過導覽')
      popover.closeButton.title = '略過'
      // 等 popover 定位後再飛 logo 圖示
      requestAnimationFrame(() => flySproutToPopover(popover))
    },
    onDestroyed: () => {
      markHomeTourDone()
      removeSprout()
    },
  })

  d.drive()
}

export function maybeStartHomeTour(handlers: {
  ensureListMode: () => void
  ensureMapVisible: () => void
  isReady: () => boolean
}): void {
  if (hasCompletedHomeTour() || scheduled) return
  scheduled = true

  let tries = 0
  const maxTries = 40

  const tick = () => {
    tries += 1
    if (handlers.isReady() && visibleTourEl('tour-search')) {
      window.setTimeout(() => startHomeTour(handlers), 450)
      return
    }
    if (tries < maxTries) {
      window.setTimeout(tick, 200)
    } else {
      scheduled = false
    }
  }

  tick()
}
