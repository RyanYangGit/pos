<script setup lang="ts">
import type { CartItem } from '@/composables/useCart'
import { formatCurrency } from '@/utils/format'

defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  increment: [productId: string]
  decrement: [productId: string]
  remove: [productId: string]
}>()
</script>

<template>
  <div class="d-flex align-items-center gap-3 py-3 border-bottom cart-item-row">
    <div class="flex-grow-1 min-width-0">
      <div class="fw-medium small text-truncate item-name">{{ item.productName }}</div>
      <div class="item-unit-price mt-1">{{ formatCurrency(item.unitPrice) }}</div>
    </div>
    <div class="d-flex align-items-center gap-2">
      <button
        class="btn qty-btn d-flex align-items-center justify-content-center fw-bold"
        @click="item.quantity > 1 ? emit('decrement', item.productId) : emit('remove', item.productId)"
      >
        {{ item.quantity > 1 ? '−' : '✕' }}
      </button>
      <span class="text-center small fw-medium qty-display">{{ item.quantity }}</span>
      <button
        class="btn qty-btn d-flex align-items-center justify-content-center fw-bold"
        @click="emit('increment', item.productId)"
      >
        +
      </button>
    </div>
    <div class="fw-bold small text-end item-subtotal">
      {{ formatCurrency(item.subtotal) }}
    </div>
  </div>
</template>

<style scoped>
.cart-item-row {
  border-color: var(--c-surface) !important;
}
.cart-item-row:last-child {
  border-bottom: none !important;
}
.min-width-0 {
  min-width: 0;
}
.item-name {
  color: var(--c-text);
}
.item-unit-price {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--c-surface);
  font-size: 1.125rem;
  padding: 0;
  min-height: 32px;
  color: var(--c-text);
}
.qty-btn:hover,
.qty-btn:active {
  background-color: var(--c-border);
}
.qty-display {
  width: 32px;
}
.item-subtotal {
  width: 80px;
  color: var(--c-text);
}
</style>
