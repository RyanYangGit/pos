import { ref, computed } from 'vue'
import type { ProductDoc } from '@/db/schemas/product'

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

const items = ref<CartItem[]>([])

export function useCart() {
  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.subtotal, 0)
  )

  const isEmpty = computed(() => items.value.length === 0)

  function addItem(product: ProductDoc) {
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.quantity++
      existing.subtotal = existing.unitPrice * existing.quantity
    } else {
      items.value.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        subtotal: product.price,
      })
    }
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      item.quantity = quantity
      item.subtotal = item.unitPrice * quantity
    }
  }

  function removeItem(productId: string) {
    const idx = items.value.findIndex(i => i.productId === productId)
    if (idx >= 0) {
      items.value.splice(idx, 1)
    }
  }

  function clearCart() {
    items.value = []
  }

  function getItems(): CartItem[] {
    return [...items.value]
  }

  return {
    items,
    totalItems,
    totalAmount,
    isEmpty,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItems,
  }
}
