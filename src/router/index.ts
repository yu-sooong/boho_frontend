import { createRouter, createWebHistory } from 'vue-router'
import { useCityStore } from '@/stores/cityStore'

/** Cloudflare Build 設 VITE_MAINTENANCE_MODE=true 後重建，依賴 API 的頁面導向維運頁 */
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

/** 維運期間仍可開的靜態／說明頁 */
const MAINTENANCE_ALLOWED = new Set([
  'maintenance',
  'dashboard',
  'more',
  'about',
  'contact',
  'privacy',
  'terms',
  'review-policy',
  'guide',
  'guide-article',
  'ai-pick',
  'not-found',
])

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/find',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/schools/:id',
      name: 'school-detail',
      component: () => import('@/views/DetailView.vue'),
      props: true,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
    },
    {
      path: '/district-stats',
      name: 'district-stats',
      component: () => import('@/views/DistrictStatsView.vue'),
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideListView.vue'),
    },
    {
      path: '/guide/:slug',
      name: 'guide-article',
      component: () => import('@/views/GuideArticleView.vue'),
    },
    {
      path: '/ai-pick',
      name: 'ai-pick',
      component: () => import('@/views/ComingSoonView.vue'),
      props: {
        title: 'AI 選班',
        description:
          '依需求收斂條件、整理候選選項的功能還在規劃中（非正式聊天 AI）。目前請先用找班篩選與文章專區的選班指南。',
      },
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('@/views/MoreView.vue'),
    },
    {
      path: '/more/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/more/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
    },
    {
      path: '/more/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue'),
    },
    {
      path: '/more/terms',
      name: 'terms',
      component: () => import('@/views/TermsView.vue'),
    },
    {
      path: '/more/review-policy',
      name: 'review-policy',
      component: () => import('@/views/ReviewPolicyView.vue'),
    },
    {
      path: '/admin/reviews',
      name: 'admin-reviews',
      component: () => import('@/views/AdminReviewsView.vue'),
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('@/views/MaintenanceView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (MAINTENANCE_MODE) {
    if (to.name && MAINTENANCE_ALLOWED.has(String(to.name))) return true
    return { name: 'maintenance', replace: true }
  }

  // 找班／情報需已選縣市；否則回導覽（不預先打 schools API）
  if (to.name === 'home' || to.name === 'district-stats') {
    const cityStore = useCityStore()
    if (!cityStore.cityId) {
      return { name: 'dashboard', query: { needCity: '1' }, replace: true }
    }
  }
  return true
})

export default router
