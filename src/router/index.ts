import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      component: () => import('../components/layout/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      redirect: { name: 'overview' },
      children: [
        {
          path: 'overview',
          name: 'overview',
          component: () => import('../views/OverviewView.vue'),
        },
        {
          path: 'systems-status',
          name: 'systems-status',
          component: () => import('../views/SystemsStatusView.vue'),
        },
        {
          path: 'threat-intelligence',
          name: 'threat-intelligence',
          component: () => import('../views/ThreatIntelligenceView.vue'),
        },
        {
          path: 'movies-series',
          name: 'movies-series',
          component: () => import('../views/MoviesSeriesView.vue'),
        },
        {
          path: 'music',
          name: 'music',
          component: () => import('../views/MusicView.vue'),
        },
        {
          path: 'my-collections',
          name: 'my-collections',
          component: () => import('../views/MyCollectionsView.vue'),
        },
        {
          path: 'working',
          name: 'working',
          component: () => import('../views/WorkingView.vue'),
        },
        {
          path: 'ogar-analytics',
          name: 'ogar-analytics',
          component: () => import('../views/OgarAnalyticsView.vue'),
        },
        {
          path: 'shopping',
          name: 'shopping',
          component: () => import('../views/ShoppingView.vue'),
        },
        {
          path: 'ogar-english',
          name: 'ogar-english',
          component: () => import('../views/OgarEnglishView.vue'),
        },
        {
          path: 'documents',
          name: 'documents',
          component: () => import('../views/DocumentsView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.ready
  if (to.meta.requiresAuth && !authStore.user) {
    return { name: 'login' }
  }
})

export default router