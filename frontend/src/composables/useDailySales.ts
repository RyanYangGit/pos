import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Subscription } from 'rxjs'
import { getDatabase } from '@/db'
import type { OrderDoc } from '@/db/schemas/order'
import type { PaymentMethod } from '@/constants/payment'
import { formatDateKey } from '@/utils/format'

export function useDailySales() {
  const orders = ref<OrderDoc[]>([])
  let sub: Subscription | null = null

  // Date range — defaults to today
  const today = new Date()
  const startDate = ref(today)
  const endDate = ref(today)

  onMounted(() => {
    const db = getDatabase()
    sub = db.orders
      .find({ sort: [{ createdAt: 'desc' }] })
      .$.subscribe((docs: any[]) => {
        orders.value = docs.map((d: any) => d.toJSON() as OrderDoc)
      })
  })

  onUnmounted(() => {
    sub?.unsubscribe()
  })

  function dateToKey(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}${m}${day}`
  }

  const filteredOrders = computed(() => {
    const startKey = dateToKey(startDate.value)
    const endKey = dateToKey(endDate.value)
    return orders.value.filter(o => {
      if (o.cancelledAt) return false
      const key = formatDateKey(o.createdAt)
      return key >= startKey && key <= endKey
    })
  })

  const totalRevenue = computed(() =>
    filteredOrders.value.reduce((sum, o) => sum + o.totalAmount, 0)
  )

  const totalTransactions = computed(() => filteredOrders.value.length)

  const avgTransaction = computed(() =>
    totalTransactions.value > 0
      ? Math.round(totalRevenue.value / totalTransactions.value)
      : 0
  )

  const paymentBreakdown = computed(() => {
    const map: Record<string, number> = {}
    for (const order of filteredOrders.value) {
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
    for (const order of filteredOrders.value) {
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
    startDate,
    endDate,
    filteredOrders,
    totalRevenue,
    totalTransactions,
    avgTransaction,
    paymentBreakdown,
    topProducts,
  }
}
