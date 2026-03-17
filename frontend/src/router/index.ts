import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '@/constants/roles'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: Role[]
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/pos',
    },
    {
      path: '/pos',
      name: 'pos',
      component: () => import('@/pages/POSPage.vue'),
      meta: { roles: ['admin', 'cashier'] },
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/pages/OrdersPage.vue'),
      meta: { roles: ['admin', 'cashier'] },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/pages/ProductsPage.vue'),
      meta: { roles: ['admin'] },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
      meta: { roles: ['admin'] },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { roles: ['admin', 'super_admin'] },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { roles: ['admin', 'super_admin'] },
    },
  ],
})

export default router

export function installAuthGuard(getUserRole: () => Role | null) {
  router.beforeEach((to) => {
    const roles = to.meta.roles
    if (!roles) return true

    const userRole = getUserRole()
    // No user logged in — let navigation proceed; App.vue handles auth screen
    if (!userRole) return true

    if (!roles.includes(userRole)) {
      return '/pos'
    }

    return true
  })
}
