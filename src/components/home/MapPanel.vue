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
let map: maplibregl.Map | null = null
let resizeObserver: ResizeObserver | null = null
let userMarker: maplibregl.Marker | null = null
let hoverPopup: maplibregl.Popup | null = null
let lastUserCoords: [number, number] | null = null

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
const SELECTED_COLOR = '#f59e0b'

function categoryColor(categories: string[]): string {
  for (const cat of categories) {
    const found = CATEGORY_COLORS.find(([k]) => cat.includes(k) || k.includes(cat))
    if (found) return found[1]
  }
  return DEFAULT_COLOR
}

function pinImageName(color: string) {
  return `pin-${color.replace('#', '')}`
}

// ── SVG Pin 圖示載入 ──────────────────────────────────────────────────────────

/**
 * 產生水滴形 pin SVG，以 data URL 載入為 MapLibre image
 * scale=2 對應 retina 2x，搭配 pixelRatio:2 傳給 addImage
 */
function createPinSvg(color: string, selected = false): string {
  const stroke = selected ? `stroke="white" stroke-width="2.5"` : ''
  const dotR = selected ? 6.5 : 5.5
  const dotOpacity = selected ? 1 : 0.9
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="72" viewBox="0 0 28 36">
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
): Promise<void> {
  if (m.hasImage(name)) return
  return new Promise((resolve, reject) => {
    const svg = createPinSvg(color, selected)
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
    ...uniqueColors.map((c) => loadPinImage(m, pinImageName(c), c, false)),
    loadPinImage(m, 'pin-selected', SELECTED_COLOR, true),
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

function toGeoJSON(schools: School[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: schools
      .filter((s) => s.lng !== 0 && s.lat !== 0)
      .map((s) => ({
        type: 'Feature' as const,
        properties: {
          id: s.id,
          name: s.name,
          categories: s.categoryTags.join('・'),
          pinImage: pinImageName(categoryColor(s.categoryTags)),
        },
        geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
      })),
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
      'circle-color': ['step', ['get', 'point_count'], '#0f766e', 10, '#0369a1', 50, '#7c3aed'],
      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
      'circle-opacity': 0.88,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
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

  // 選中圖釘：amber 色，較大，白邊
  map.addLayer({
    id: 'selected-point',
    type: 'symbol',
    source: 'schools',
    filter: ['==', ['get', 'id'], props.selectedId ?? ''],
    layout: {
      'icon-image': 'pin-selected',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 0.9, 16, 1.1],
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
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || !zoom) return
      map?.flyTo({
        center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
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
      const { name, categories } = features[0].properties as { name: string; categories: string }
      hoverPopup
        ?.setLngLat(e.lngLat)
        .setHTML(
          `<div class="popup-name">${name}</div>` +
          (categories ? `<div class="popup-cats">${categories}</div>` : ''),
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

  map.addControl(new maplibregl.AttributionControl({ compact: true }))

  map.on('load', async () => {
    if (!map) return

    // 先載入所有 pin 圖示，再建圖層
    await loadAllPinImages(map)

    map.addSource('schools', {
      type: 'geojson',
      data: toGeoJSON(props.schools),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 40,
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
    <div ref="container" class="absolute inset-0 h-full w-full" />

    <!-- 定位按鈕 -->
    <button
      v-if="interactive"
      type="button"
      class="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-50 disabled:opacity-50"
      :disabled="geo.isLoading.value"
      title="重新定位我的位置"
      aria-label="重新定位我的位置"
      @click="() => onLocate(true)"
    >
      <Loader2 v-if="geo.isLoading.value" :size="18" class="animate-spin text-primary-700" />
      <Locate v-else :size="18" class="text-gray-600" />
    </button>

    <!-- 類別顏色圖例（桌面才顯示） -->
    <div
      v-if="interactive && schools.length > 0"
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
          <path d="M14 0C6.27 0 0 6.27 0 14c0 4.83 2.46 9.1 6.22 11.67L14 36l7.78-10.33C25.54 23.1 28 18.83 28 14 28 6.27 21.73 0 14 0z" :fill="SELECTED_COLOR" stroke="white" stroke-width="2.5"/>
        </svg>
        已選取
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
</style>
