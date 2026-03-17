import { ref, onMounted, onUnmounted } from 'vue'
import type { Subscription } from 'rxjs'
import { getDatabase } from '@/db'
import type { OrderDoc } from '@/db/schemas/order'
import type { CartItem } from './useCart'
import type { PaymentMethod } from '@/constants/payment'
import { generateId, generateOrderNumber } from '@/utils/id'
import { todayDateKey } from '@/utils/format'

export function useOrders() {
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

  async function createOrder(
    cartItems: CartItem[],
    totalAmount: number,
    paymentMethod: PaymentMethod,
    note?: string,
  ): Promise<OrderDoc> {
    const db = getDatabase()

    // Get and update settings for order number
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
    }

    await db.orders.insert(order)

    // Deduct stock for products that have stock tracking
    for (const item of cartItems) {
      const product = await db.products.findOne(item.productId).exec()
      if (product && product.stock !== null) {
        const newStock = Math.max(0, product.stock - item.quantity)
        await product.patch({ stock: newStock, updatedAt: Date.now() })
      }
    }

    return order
  }

  return { orders, createOrder }
}
