import { LOCALE } from './locale'

export type Role = 'super_admin' | 'admin' | 'cashier'

export interface TabDefinition {
  path: string
  name: string
  label: string
  icon: string
  emoji: string
  roles: Role[]
}

export const TAB_DEFINITIONS: TabDefinition[] = [
  { path: '/pos', name: 'pos', label: LOCALE.tabPos, icon: 'cash-register', emoji: '\u{1F4B0}', roles: ['admin', 'cashier'] },
  { path: '/orders', name: 'orders', label: LOCALE.tabOrders, icon: 'orders-o', emoji: '\u{1F4CB}', roles: ['admin', 'cashier'] },
  { path: '/products', name: 'products', label: LOCALE.tabProducts, icon: 'apps-o', emoji: '\u{1F4E6}', roles: ['admin'] },
  { path: '/dashboard', name: 'dashboard', label: LOCALE.tabDashboard, icon: 'chart-trending-o', emoji: '\u{1F4CA}', roles: ['admin'] },
  { path: '/admin', name: 'admin', label: LOCALE.tabAdmin, icon: 'manager-o', emoji: '\u{1F5A5}', roles: ['admin', 'super_admin'] },
]

export function getTabsForRole(role: Role): TabDefinition[] {
  return TAB_DEFINITIONS.filter(tab => tab.roles.includes(role))
}
