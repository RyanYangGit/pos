import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Subscription } from 'rxjs'
import { getDatabase } from '@/db'
import type { OrderDoc } from '@/db/schemas/order'
import type { PaymentMethod } from '@/constants/payment'
import { todayDateKey, formatDateKey } from '@/utils/format'

export function useDailySales() {
  const orders = ref<OrderDoc[]>([])
  let sub: Subscription | null = null

  onMounted(() => {
    const db = getDatabase()
    sub = db.orders
      .find({ sort: [{ createdAt: 'desc' }] })
      .$.subscribe(docs => {
        orders.value = docs.map(d => d.toJSON() as OrderDoc)
      })
  })

  onUnmounted(() => {
    sub?.unsubscribe()
  })

  const todayOrders = computed(() => {
    const today = todayDateKey()
    return orders.value.filter(o => formatDateKey(o.createdAt) === today)
  })

  const totalRevenue = computed(() =>
    todayOrders.value.reduce((sum, o) => sum + o.totalAmount, 0)
  )

  const totalTransactions = computed(() => todayOrders.value.length)

  const avgTransaction = computed(() =>
    totalTransactions.value > 0
      ? Math.round(totalRevenue.value / totalTransactions.value)
      : 0
  )

  const paymentBreakdown = computed(() => {
    const map: Record<string, number> = {}
    for (const order of todayOrders.value) {
      map[order.paymentMethod] = (map[order.paymentMethod] || 0) + order.totalAmount
    }
    return Object.entries(map).map(([method, amount]) => ({
      method: method as PaymentMethod,
      amount,
      percentage: totalRevenue.value > 0 ? Math.round((amount / totalRevenue.value) * 100) : 0,
    }))
  })

  const topProducts = computed(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {}
    for (const order of todayOrders.value) {
      for (const item of order.items) {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, quantity: 0, revenue: 0 }
        }
        const entry = map[item.productId]!
        entry.quantity += item.quantity
        entry.revenue += item.subtotal
      }
    }
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  })

  return {
    todayOrders,
    totalRevenue,
    totalTransactions,
    avgTransaction,
    paymentBreakdown,
    topProducts,
  }
}
