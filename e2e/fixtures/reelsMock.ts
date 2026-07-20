/** Reels 廣告素材用 mock（短班名、可重播、不露出真實業者） */

export const DEMO_SCHOOL_ID = 'a1b2c3d4e5f6789012345678'

const DEMO_SCHOOLS = [
  {
    id: DEMO_SCHOOL_ID,
    name: '小樹美語補習班',
    categories: ['外語類'],
    status: 'active' as const,
    address: '台中市西屯區河南路二段100號',
    district: '西屯區',
    phone: '04-1234-5678',
    location: { type: 'Point' as const, coordinates: [120.641, 24.162] as [number, number] },
    penaltyCount: 0,
  },
  {
    id: 'a1b2c3d4e5f6789012345679',
    name: '晨光美語短期補習班',
    categories: ['外語類'],
    status: 'active' as const,
    address: '台中市南屯區公益路200號',
    district: '南屯區',
    phone: '04-2345-6789',
    location: { type: 'Point' as const, coordinates: [120.637, 24.150] as [number, number] },
    penaltyCount: 0,
  },
  {
    id: 'a1b2c3d4e5f678901234567a',
    name: '樂學美語文理班',
    categories: ['外語類', '文理類'],
    status: 'active' as const,
    address: '台中市北區進化路50號',
    district: '北區',
    phone: '04-3456-7890',
    location: { type: 'Point' as const, coordinates: [120.675, 24.157] as [number, number] },
    penaltyCount: 0,
  },
  {
    id: 'a1b2c3d4e5f678901234567b',
    name: '青芽數學教室',
    categories: ['文理類'],
    status: 'active' as const,
    address: '台中市西區民生路88號',
    district: '西區',
    phone: '04-4567-8901',
    location: { type: 'Point' as const, coordinates: [120.668, 24.144] as [number, number] },
    penaltyCount: 0,
  },
]

export function mockSchoolAll() {
  return { data: DEMO_SCHOOLS, total: DEMO_SCHOOLS.length }
}

export function mockSchoolDetail(id: string) {
  const s = DEMO_SCHOOLS.find((x) => x.id === id) ?? DEMO_SCHOOLS[0]
  return {
    id: s.id,
    name: s.name,
    categories: s.categories,
    status: s.status,
    address: s.address,
    city: '台中市',
    district: s.district,
    phone: s.phone,
    licenseNumber: '中市補字第12345號',
    licenseDate: '2019-08-01',
    location: s.location,
    penalties: [],
    source: 'demo',
    sourceUrl: 'https://boho.yujii.app',
    syncedAt: new Date().toISOString(),
  }
}

export function mockReviews(schoolId: string) {
  return {
    data: [
      {
        id: 'demo-review-1',
        schoolId,
        identity: 'parent',
        period: 'within_1y',
        rating: 5,
        content: '老師很耐心，進度清楚，報名前有核對立案狀態比較安心。',
        tags: ['老師耐心', '進度清楚'],
        status: 'approved',
        date: '2026-06-12',
      },
      {
        id: 'demo-review-2',
        schoolId,
        identity: 'student',
        period: 'current',
        rating: 4,
        content: '環境整潔、課後有回饋。建議家長先看稽查與評價再決定。',
        tags: ['環境整潔', '課後回饋'],
        status: 'approved',
        date: '2026-05-28',
      },
    ],
    summary: {
      count: 2,
      averageRating: 4.5,
      tags: ['老師耐心', '進度清楚', '環境整潔'],
    },
  }
}
