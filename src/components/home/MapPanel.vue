<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { Loader2, Locate } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { School } from '@/types'
import { useGeolocation } from '@/composables/useGeolocation'

const props = withDefaults(
  defineProps<{
    schools: School[]
    selectedId?: string | null
    interactive?: boolean
    /** 已存在的使用者座標（從 store 傳入，避免返回頁面時重複定位並飛走） */
    userLat?: number | null
    userLng?: number | null
  }>(),
  { interactive: true, selectedId: null, userLat: null, userLng: null },
)

const emit = defineEmits<{
  select: [id: string]
  located: [coords: { lng: number; lat: number }]
  /** 地圖圖層就緒，父層可據此還原視角 */
  ready: []
}>()

defineExpose({ fitToSchools, flyToUser })

const container = ref<HTMLDivElement | null>(null)
const geo = useGeolocation()
const mapFailed = ref(false)
const mapFailReason = ref('此裝置無法顯示互動地圖')
let map: maplibregl.Map | null = null
let resizeObserver: ResizeObserver | null = null
let userMarker: maplibregl.Marker | null = null
let hoverPopup: maplibregl.Popup | null = null
let lastUserCoords: [number, number] | null = null

function markMapFailed(reason?: string) {
  mapFailed.value = true
  if (reason) mapFailReason.value = reason
  try {
    map?.remove()
  } catch {
    /* ignore */
  }
  map = null
  emit('ready')
}

function googleMapsUrl(school: School): string {
  if (school.lng && school.lat) {
    return `https://www.google.com/maps/search/?api=1&query=${school.lat},${school.lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.address || school.name)}`
}

// ── 類別顏色定義 ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: [string, string][] = [
  ['文理類', '#0f766e'],
  ['外語類', '#0369a1'],
  ['才藝類', '#7c3aed'],
  ['音樂類', '#d97706'],
  ['體育類', '#dc2626'],
  ['技藝類', '#059669'],
  ['語文類', '#0284c7'],
  ['數理類', '#6d28d9'],
  ['藝術類', '#b45309'],
]
const DEFAULT_COLOR = '#374151'
/** 已選取：深藍＋粗白邊，避開音樂類橘／稽查橘圈 */
const SELECTED_COLOR = '#1d4ed8'
const PENALTY_RING = '#d97706'
/**
 * 叢集：品牌 teal 單色階（只表數量）
 * 用較深階，避免過亮搶戲、也避開灰階沉悶
 */
const CLUSTER_COLORS = {
  sm: '#0d9488',
  md: '#0f766e',
  lg: '#115e59',
} as const

function categoryColor(categories: string[]): string {
  for (const cat of categories) {
    const found = CATEGORY_COLORS.find(([k]) => cat.includes(k) || k.includes(cat))
    if (found) return found[1]
  }
  return DEFAULT_COLOR
}

function pinImageName(color: string, hasPenalty = false) {
  return `pin-${color.replace('#', '')}${hasPenalty ? '-p' : ''}`
}

// ── SVG Pin 圖示載入 ──────────────────────────────────────────────────────────

/**
 * 產生水滴形 pin SVG，以 data URL 載入為 MapLibre image
 * scale=2 對應 retina 2x，搭配 pixelRatio:2 傳給 addImage
 * hasPenalty：外圈 amber，標示有稽查紀錄（不改科目色）
 */
function createPinSvg(color: string, selected = false, hasPenalty = false): string {
  const stroke = selected
    ? `stroke="white" stroke-width="3.2"`
    : ''
  const outerHalo = selected
    ? `<path d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z" fill="none" stroke="#0f172a" stroke-width="1.6" opacity="0.35"/>`
    : ''
  const dotR = selected ? 7 : 5.5
  const dotOpacity = selected ? 1 : 0.9
  const ring = hasPenalty
    ? `<circle cx="14" cy="14" r="13" fill="#fff7ed" stroke="${PENALTY_RING}" stroke-width="3"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="72" viewBox="0 0 28 36">
    ${ring}
    ${outerHalo}
    <path d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z"
      fill="${color}" ${stroke}/>
    <circle cx="14" cy="14" r="${dotR}" fill="white" opacity="${dotOpacity}"/>
  </svg>`
}

async function loadPinImage(
  m: maplibregl.Map,
  name: string,
  color: string,
  selected = false,
  hasPenalty = false,
): Promise<void> {
  if (m.hasImage(name)) return
  return new Promise((resolve, reject) => {
    const svg = createPinSvg(color, selected, hasPenalty)
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    const img = new Image(56, 72)
    img.onload = () => {
      if (!m.hasImage(name)) m.addImage(name, img, { pixelRatio: 2 })
      resolve()
    }
    img.onerror = reject
    img.src = url
  })
}

async function loadAllPinImages(m: maplibregl.Map): Promise<void> {
  const uniqueColors = [...new Set(CATEGORY_COLORS.map(([, c]) => c)), DEFAULT_COLOR]
  await Promise.all([
    ...uniqueColors.flatMap((c) => [
      loadPinImage(m, pinImageName(c, false), c, false, false),
      loadPinImage(m, pinImageName(c, true), c, false, true),
    ]),
    loadPinImage(m, 'pin-selected', SELECTED_COLOR, true, false),
    loadPinImage(m, 'pin-selected-p', SELECTED_COLOR, true, true),
  ])
}

// ── 可視範圍（台中＋外圍緩衝，避免拖到全世界／世界副本重複標記）──────────────
/** SW → NE；略大於台中市界，方便看鄰近地帶，但不能縮到全球 */
const TAICHUNG_MAX_BOUNDS: [[number, number], [number, number]] = [
  [120.25, 23.88],
  [121.35, 24.55],
]
const MAP_MIN_ZOOM = 9.5
const MAP_MAX_ZOOM = 18

function isInsideTaichung(lng: number, lat: number): boolean {
  const [[west, south], [east, north]] = TAICHUNG_MAX_BOUNDS
  return lng >= west && lng <= east && lat >= south && lat <= north
}

// ── 底圖 ─────────────────────────────────────────────────────────────────────

const BASEMAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  // OpenMapTiles 公開字型（非 MapLibre demo）；目前底圖為 raster，此欄為 style 規格所需
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
}

// ── GeoJSON ──────────────────────────────────────────────────────────────────

type SchoolFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: {
      id: string
      name: string
      categories: string
      pinImage: string
      hasPenalty: number
    }
    geometry: { type: 'Point'; coordinates: [number, number] }
  }>
}

function schoolHasPenalty(s: School): boolean {
  return (s.penaltyCount ?? 0) > 0 || s.penalties.length > 0
}

function toGeoJSON(schools: School[]): SchoolFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: schools
      .filter((s) => s.lng !== 0 && s.lat !== 0)
      .map((s) => {
        const hasPenalty = schoolHasPenalty(s)
        return {
          type: 'Feature' as const,
          properties: {
            id: s.id,
            name: s.name,
            categories: s.categoryTags.join('・'),
            pinImage: pinImageName(categoryColor(s.categoryTags), hasPenalty),
            hasPenalty: hasPenalty ? 1 : 0,
          },
          geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] as [number, number] },
        }
      }),
  }
}

// ── 圖層 ─────────────────────────────────────────────────────────────────────

function addLayers() {
  if (!map) return

  // 叢集圓形（保持 circle 層，效能佳）
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'schools',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        CLUSTER_COLORS.sm,
        10,
        CLUSTER_COLORS.md,
        50,
        CLUSTER_COLORS.lg,
      ],
      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
      'circle-opacity': 0.92,
      'circle-stroke-width': [
        'case',
        ['>', ['get', 'penalty_sum'], 0],
        3,
        2,
      ],
      'circle-stroke-color': [
        'case',
        ['>', ['get', 'penalty_sum'], 0],
        PENALTY_RING,
        '#ffffff',
      ],
    },
  })

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'schools',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 13,
    },
    paint: { 'text-color': '#ffffff' },
  })

  // 個別圖釘：水滴形 SVG pin，依類別顏色
  map.addLayer({
    id: 'unclustered-point',
    type: 'symbol',
    source: 'schools',
    filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], props.selectedId ?? '']],
    layout: {
      'icon-image': ['get', 'pinImage'],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 0.75, 16, 0.95],
    },
    paint: { 'icon-opacity': 0.95 },
  })

  // 選中圖釘：深藍＋粗白邊，明顯大於一般針
  map.addLayer({
    id: 'selected-point',
    type: 'symbol',
    source: 'schools',
    filter: ['==', ['get', 'id'], props.selectedId ?? ''],
    layout: {
      'icon-image': [
        'case',
        ['==', ['get', 'hasPenalty'], 1],
        'pin-selected-p',
        'pin-selected',
      ],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.72, 14, 1.05, 16, 1.28],
    },
  })
}

// ── 事件 ─────────────────────────────────────────────────────────────────────

function setupEvents() {
  if (!map) return

  hoverPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -4],
    anchor: 'bottom',
    className: 'school-popup',
  })

  // 叢集點擊 → 放大
  map.on('click', 'clusters', (e: MapMouseEvent) => {
    e.preventDefault()
    const features = map?.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    if (!features?.length) return
    const clusterId = features[0].properties?.cluster_id as number
    const source = map?.getSource('schools') as GeoJSONSource
    const geometry = features[0].geometry
    if (geometry.type !== 'Point') return
    void source.getClusterExpansionZoom(clusterId).then((zoom) => {
      map?.flyTo({
        center: geometry.coordinates as [number, number],
        zoom: zoom + 0.5,
        duration: 400,
      })
    })
  })

  // 圖釘點擊 → 選取
  for (const layer of ['unclustered-point', 'selected-point'] as const) {
    map.on('click', layer, (e: MapMouseEvent) => {
      e.preventDefault()
      hoverPopup?.remove()
      const features = map?.queryRenderedFeatures(e.point, { layers: [layer] })
      const id = features?.[0]?.properties?.id as string | undefined
      if (id) emit('select', id)
    })
  }

  // Hover tooltip（跟著滑鼠游標）
  for (const layer of ['unclustered-point', 'selected-point'] as const) {
    map.on('mouseenter', layer, (e: MapMouseEvent) => {
      if (!map) return
      map.getCanvas().style.cursor = 'pointer'
      const features = map.queryRenderedFeatures(e.point, { layers: [layer] })
      if (!features?.length) return
      const { name, categories, hasPenalty } = features[0].properties as {
        name: string
        categories: string
        hasPenalty?: number
      }
      hoverPopup
        ?.setLngLat(e.lngLat)
        .setHTML(
          `<div class="popup-name">${name}</div>` +
          (categories ? `<div class="popup-cats">${categories}</div>` : '') +
          (hasPenalty ? `<div class="popup-penalty">有稽查紀錄</div>` : ''),
        )
        .addTo(map)
    })
    map.on('mousemove', layer, (e: MapMouseEvent) => { hoverPopup?.setLngLat(e.lngLat) })
    map.on('mouseleave', layer, () => {
      if (map) map.getCanvas().style.cursor = ''
      hoverPopup?.remove()
    })
  }

  map.on('mouseenter', 'clusters', () => { if (map) map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'clusters', () => { if (map) map.getCanvas().style.cursor = '' })
}

// ── fitToSchools（供父層呼叫）───────────────────────────────────────────────

function fitToSchools(schools: School[] = props.schools) {
  const valid = schools.filter((s) => s.lng !== 0 && s.lat !== 0)
  if (!valid.length || !map) return
  if (valid.length === 1) {
    map.flyTo({ center: [valid[0].lng, valid[0].lat], zoom: 15, duration: 600 })
    return
  }
  const bounds = new maplibregl.LngLatBounds()
  valid.forEach((s) => bounds.extend([s.lng, s.lat]))
  map.fitBounds(bounds, { padding: 64, maxZoom: 14, minZoom: 11, duration: 600 })
}

function flyToUser() {
  if (!lastUserCoords || !map) return
  map.flyTo({ center: lastUserCoords, zoom: 14, duration: 800 })
}

// ── 選中狀態更新 ─────────────────────────────────────────────────────────────

function updateSelectedFilter() {
  if (!map?.getLayer('unclustered-point')) return
  const sid = props.selectedId ?? ''
  map.setFilter('unclustered-point', ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], sid]])
  map.setFilter('selected-point', ['==', ['get', 'id'], sid])
}

function updateSource() {
  const source = map?.getSource('schools') as GeoJSONSource | undefined
  source?.setData(toGeoJSON(props.schools))
}

// ── 定位 ─────────────────────────────────────────────────────────────────────

function placeUserMarker(lng: number, lat: number) {
  if (!map) return
  lastUserCoords = [lng, lat]
  userMarker?.remove()
  const el = document.createElement('div')
  el.style.cssText = `
    width:16px;height:16px;border-radius:50%;
    background:#3b82f6;border:3px solid white;
    box-shadow:0 0 0 6px rgba(59,130,246,0.25);
    pointer-events:none;
  `
  userMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .addTo(map)
}

/** @param fly 是否飛到使用者位置；返回頁面還原時可設 false */
async function onLocate(fly = true) {
  if (geo.isLoading.value) return
  const coords = await geo.request()
  if (!coords || !map) return

  placeUserMarker(coords.lng, coords.lat)
  // 定位在台中外（例如出差）：仍放標記，但不飛出 maxBounds
  if (fly && isInsideTaichung(coords.lng, coords.lat)) {
    map.flyTo({ center: [coords.lng, coords.lat], zoom: 14, duration: 1200 })
  }
  emit('located', coords)
}

// ── 生命週期 ─────────────────────────────────────────────────────────────────

onMounted(() => {
  if (!container.value) return

  const validSchools = props.schools.filter((s) => s.lng !== 0 && s.lat !== 0)
  const selectedSchool = props.selectedId
    ? validSchools.find((s) => s.id === props.selectedId)
    : null

  let initCenter: [number, number] = [120.6469, 24.1697]
  let initZoom = 12

  if (selectedSchool) {
    initCenter = [selectedSchool.lng, selectedSchool.lat]
    initZoom = props.interactive ? 15 : 16
  } else if (validSchools.length === 1) {
    initCenter = [validSchools[0].lng, validSchools[0].lat]
    initZoom = props.interactive ? 15 : 16
  }

  try {
    map = new maplibregl.Map({
      container: container.value,
      style: BASEMAP_STYLE,
      center: initCenter,
      zoom: initZoom,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxBounds: TAICHUNG_MAX_BOUNDS,
      renderWorldCopies: false,
      attributionControl: false,
      interactive: props.interactive,
    })
  } catch (err) {
    markMapFailed(err instanceof Error ? err.message : '無法初始化地圖')
    return
  }

  map.addControl(new maplibregl.AttributionControl({ compact: true }))

  map.on('error', (e) => {
    const msg = e.error?.message ?? String(e.error ?? '')
    if (/webgl|WebGL|Failed to initialize/i.test(msg)) {
      markMapFailed('此瀏覽器不支援 WebGL 地圖')
    }
  })

  map.on('load', async () => {
    if (!map || mapFailed.value) return

    try {
      // 先載入所有 pin 圖示，再建圖層
      await loadAllPinImages(map)

      map.addSource('schools', {
        type: 'geojson',
        data: toGeoJSON(props.schools),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40,
        clusterProperties: {
          // 叢集內有稽查紀錄的點數（>0 則叢集外圈改 amber）
          penalty_sum: ['+', ['get', 'hasPenalty']],
        },
      })
      addLayers()
      setupEvents()
      updateSelectedFilter()

      // 已有定位：只放標記，不飛走（避免從詳情頁返回時蓋掉篩選視角）
      // 尚未定位：首次自動定位並飛到附近
      if (props.interactive) {
        if (props.userLat != null && props.userLng != null) {
          placeUserMarker(props.userLng, props.userLat)
        } else {
          setTimeout(() => onLocate(true), 600)
        }
      }

      emit('ready')
    } catch (err) {
      markMapFailed(err instanceof Error ? err.message : '地圖圖層載入失敗')
    }
  })

  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  userMarker?.remove()
  hoverPopup?.remove()
  map?.remove()
  map = null
})

watch(() => props.schools, updateSource, { deep: false })
watch(() => props.selectedId, updateSelectedFilter)
</script>

<template>
  <div class="relative h-full w-full bg-[#f4f2ea]">
    <div
      v-show="!mapFailed"
      ref="container"
      class="absolute inset-0 z-0 h-full w-full"
    />

    <div
      v-if="mapFailed"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
      role="status"
    >
      <p class="text-sm font-medium text-gray-800">地圖暫時無法顯示</p>
      <p class="max-w-xs text-xs leading-relaxed text-gray-500">
        {{ mapFailReason }}。列表與詳情仍可正常使用，也可改用 Google 地圖查看位置。
      </p>
      <a
        v-if="schools[0]"
        :href="googleMapsUrl(schools[0])"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-md bg-primary-700 px-3 py-2 text-xs font-medium text-white hover:bg-primary-800"
      >
        在 Google 地圖開啟
      </a>
    </div>

    <!-- 定位按鈕 -->
    <button
      v-if="interactive && !mapFailed"
      type="button"
      class="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-50 disabled:opacity-50"
      :disabled="geo.isLoading.value"
      title="重新定位我的位置"
      aria-label="重新定位我的位置"
      @click="() => onLocate(true)"
    >
      <Loader2 v-if="geo.isLoading.value" :size="18" class="animate-spin text-primary-700" />
      <Locate v-else :size="18" class="text-gray-600" />
    </button>

    <!-- 手機：僅稽查提示（避開中央 FAB） -->
    <div
      v-if="interactive && !mapFailed && schools.length > 0"
      class="pointer-events-none absolute bottom-24 left-3 z-10 max-w-[11rem] rounded-md border border-amber-200/80 bg-white/92 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 shadow backdrop-blur-sm md:hidden"
    >
      橘外圈＝有稽查紀錄
    </div>

    <!-- 類別顏色圖例（桌面才顯示） -->
    <div
      v-if="interactive && !mapFailed && schools.length > 0"
      class="pointer-events-none absolute bottom-6 left-2 z-10 hidden rounded-lg bg-white/92 px-2.5 py-2 text-[10px] text-gray-600 shadow backdrop-blur-sm md:block"
    >
      <div
        v-for="[label, color] in CATEGORY_COLORS.slice(0, 5)"
        :key="label"
        class="flex items-center gap-1.5 py-0.5"
      >
        <svg width="10" height="13" viewBox="0 0 28 36" class="shrink-0">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z" :fill="color"/>
        </svg>
        {{ label }}
      </div>
      <div class="flex items-center gap-1.5 py-0.5">
        <svg width="10" height="13" viewBox="0 0 28 36" class="shrink-0">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z" :fill="DEFAULT_COLOR"/>
        </svg>
        其他
      </div>
      <div class="mt-1.5 flex items-center gap-1.5 border-t border-gray-100 pt-1.5 py-0.5">
        <svg width="11" height="14" viewBox="0 0 28 36" class="shrink-0">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z" :fill="SELECTED_COLOR" stroke="white" stroke-width="3"/>
        </svg>
        已選取
      </div>
      <div class="flex items-center gap-1.5 py-0.5">
        <!-- 圖例用灰色針＋橘圈，避免與文理類綠色混淆；地圖上仍保留各類別色＋橘外圈 -->
        <svg width="14" height="16" viewBox="-2 -2 32 40" class="shrink-0">
          <circle cx="14" cy="14" r="13" fill="#fff7ed" :stroke="PENALTY_RING" stroke-width="3.2"/>
          <path
            d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z"
            :fill="DEFAULT_COLOR"
          />
          <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
        </svg>
        <span>橘外圈＝有稽查</span>
      </div>
    </div>

    <slot />
  </div>
</template>

<style>
.maplibregl-ctrl-attrib { font-size: 10px; }

.school-popup .maplibregl-popup-content {
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
  font-size: 13px;
  max-width: 200px;
  pointer-events: none;
}
.school-popup .popup-name {
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}
.school-popup .popup-cats {
  margin-top: 2px;
  color: #6b7280;
  font-size: 11px;
}
.school-popup .popup-penalty {
  margin-top: 4px;
  color: #b45309;
  font-size: 11px;
  font-weight: 500;
}
</style>
