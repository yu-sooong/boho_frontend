import { describe, expect, it } from 'vitest'
import { detectRegionFromCoords } from '@/utils/taiwanRegions'

describe('detectRegionFromCoords', () => {
  it('detects supported cities', () => {
    expect(detectRegionFromCoords(24.15, 120.67)?.cityId).toBe('taichung')
    expect(detectRegionFromCoords(25.014, 121.455)?.cityId).toBe('newtaipei') // 板橋
    expect(detectRegionFromCoords(22.63, 120.30)?.cityId).toBe('kaohsiung')
  })

  it('detects unsupported Chiayi without blocking', () => {
    const r = detectRegionFromCoords(23.48, 120.45)
    expect(r?.name).toBe('嘉義市')
    expect(r?.supported).toBe(false)
    expect(r?.cityId).toBeNull()
  })

  it('prefers Taipei city over New Taipei bbox', () => {
    const r = detectRegionFromCoords(25.04, 121.56)
    expect(r?.name).toBe('台北市')
    expect(r?.supported).toBe(false)
  })
})
