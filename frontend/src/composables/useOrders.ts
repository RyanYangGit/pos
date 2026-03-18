import { ref, onMounted, onUnmounted } from 'vue'
import { getDatabase } from '@/db'
import { authHeaders } from '@/utils/token'
import type { OrderDoc } from '@/db/schemas/order'
import type { CartItem } from './useCart'
import type { PaymentMethod } from '@/constants/payment'
import { generateId, generateOrderNumber } from '@/utils/id'
import { todayDateKey } from '@/utils/format'

export function useOrders() {
  const orders = ref<OrderDoc[]>([])
  let unsub: (() => void) | null = null
  let syncTimer: ReturnType<typeof setInterval> | null = null

  function loadLocal() {
    const db = getDatabase()
    const sub = db.orders.find().$.subscribe((docs: any[]) => {
      const sorted = docs.map((d: any) => d.toJSON() as OrderDoc)
      sorted.sort((a, b) => b.createdAt - a.createdAt)
      orders.value = sorted
    })
    unsub = () => sub.unsubscribe()
  }

  // Pull orders from server → merge into local DB (don't overwrite local unsynced orders)
  async function pullFromServer() {
    try {
      const res = await fetch('/api/orders', { headers: authHeaders() })
      if (!res.ok) return
      const data: any[] = await res.json()
      const db = getDatabase()

      for (const o of data) {
        // Upsert: server orders get merged into local DB
        await db.orders.upsert({
          id: o.id,
          orderNumber: o.orderNumber,
          items: o.items.map((i: any) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            subtotal: i.subtotal,
          })),
          totalAmount: o.totalAmount,
          paymentMethod: o.paymentMethod,
          note: o.note || null,
          deviceId: o.deviceId,
          createdAt: o.createdAt,
          cancelledAt: o.cancelledAt || null,
          syncedAt: Date.now(), // came from server, so it's synced
        })
      }
    } catch { /* offline — use local data */ }
  }

  // Push unsynced orders to server — one at a time so one failure doesn't block the rest
  async function pushUnsyncedOrders() {
    const unsynced = orders.value.filter(o => !o.syncedAt)
    if (unsynced.length === 0) return

    const db = getDatabase()
    for (const order of unsynced) {
      try {
        const res = await fetch('/api/sync/orders/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            changeRows: [{
              newDocumentState: {
                id: order.id,
                orderNumber: order.orderNumber,
                items: order.items.map(i => ({
                  productId: i.productId,
                  productName: i.productName,
                  unitPrice: i.unitPrice,
                  quantity: i.quantity,
                  subtotal: i.subtotal,
                })),
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                note: order.note,
                deviceId: order.deviceId,
                createdAt: order.createdAt,
              },
              assumedMasterState: null,
            }],
          }),
        })
        if (res.ok) {
          const doc = await db.orders.findOne(order.id).exec()
          if (doc) await doc.patch({ syncedAt: Date.now() })
        }
      } catch { /* offline — try again next cycle */ }
    }
  }

  // Full sync cycle: push first, then pull
  async function syncOrders() {
    await pushUnsyncedOrders()
    await pullFromServer()
  }

  onMounted(() => {
    loadLocal()
    // Sync on startup (push then pull)
    setTimeout(syncOrders, 2000)
    // Sync every 30 seconds
    syncTimer = setInterval(syncOrders, 30_000)
  })

  onUnmounted(() => {
    unsub?.()
    if (syncTimer) clearInterval(syncTimer)
  })

  async function createOrder(
    cartItems: CartItem[],
    totalAmount: number,
    paymentMethod: PaymentMethod,
    note?: string,
  ): Promise<OrderDoc> {
    const db = getDatabase()

    const settings = await db.app_settings.findOne('default').exec()
    if (!settings) throw new Error('Settings not found')

    const today = todayDateKey()
    let seq = settings.nextOrderSeq
    if (settings.lastOrderDate !== today) {
      seq = 1
    }

    const orderNumber = generateOrderNumber(settings.orderPrefix, seq, today)

    await settings.patch({
      nextOrderSeq: seq + 1,
      lastOrderDate: today,
    })

    const order: OrderDoc = {
      id: generateId(),
      orderNumber,
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      totalAmount,
      paymentMethod,
      note: note || null,
      deviceId: settings.deviceName,
      createdAt: Date.now(),
      syncedAt: null,
      cancelledAt: null,
    }

    // Save locally first
    await db.orders.insert(order)

    // Deduct stock locally
    for (const item of cartItems) {
      const product = await db.products.findOne(item.productId).exec()
      if (product && product.stock !== null) {
        const newStock = Math.max(0, product.stock - item.quantity)
        await product.patch({ stock: newStock, updatedAt: Date.now() })
        // Push stock to server
        try {
          await fetch(`/api/products/${item.productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ stock: newStock }),
          })
        } catch { /* offline */ }
      }
    }

    // Push order to server immediately
    await pushUnsyncedOrders()

    return order
  }

  async function cancelOrder(orderId: string) {
    const db = getDatabase()

    // Cancel on server first
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '取消失敗' }))
      throw new Error(err.detail || '取消失敗')
    }

    // Update local DB
    const doc = await db.orders.findOne(orderId).exec()
    if (doc) await doc.patch({ cancelledAt: Date.now() })

    // Restore stock locally
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      for (const item of order.items) {
        const product = await db.products.findOne(item.productId).exec()
        if (product && product.stock !== null) {
          const newStock = product.stock + item.quantity
          await product.patch({ stock: newStock, updatedAt: Date.now() })
        }
      }
    }
  }

  return { orders, createOrder, cancelOrder }
}
