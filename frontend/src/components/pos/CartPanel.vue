<script setup lang="ts">
import { ref } from 'vue'
import { LOCALE } from '@/constants/locale'
import { PAYMENT_METHODS, type PaymentMethod } from '@/constants/payment'
import type { CartItem as CartItemType } from '@/composables/useCart'
import { formatCurrency } from '@/utils/format'
import CartItem from './CartItem.vue'

defineProps<{
  items: CartItemType[]
  totalItems: number
  totalAmount: number
}>()

const emit = defineEmits<{
  increment: [productId: string]
  decrement: [productId: string]
  remove: [productId: string]
  clear: []
  confirm: [paymentMethod: PaymentMethod, note: string]
}>()

const selectedPayment = ref<PaymentMethod>('cash')
const note = ref('')
const loading = ref(false)

async function handleConfirm() {
  loading.value = true
  emit('confirm', selectedPayment.value, note.value)
  setTimeout(() => {
    loading.value = false
    note.value = ''
    selectedPayment.value = 'cash'
  }, 500)
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
      <h2 class="fw-bold mb-0 cart-title">
        {{ LOCALE.cart }} ({{ totalItems }}{{ LOCALE.items }})
      </h2>
      <button
        v-if="items.length > 0"
        class="btn btn-link p-0 text-decoration-none clear-btn"
        @click="emit('clear')"
      >
        {{ LOCALE.cartClear }}
      </button>
    </div>

    <!-- Items -->
    <div class="flex-grow-1 overflow-auto px-3">
      <div v-if="items.length === 0" class="d-flex align-items-center justify-content-center h-100 small empty-text">
        {{ LOCALE.cartEmpty }}
      </div>
      <CartItem
        v-for="item in items"
        :key="item.productId"
        :item="item"
        @increment="emit('increment', $event)"
        @decrement="emit('decrement', $event)"
        @remove="emit('remove', $event)"
      />
    </div>

    <!-- Footer: Payment + Confirm -->
    <div class="border-top p-3 bg-white">
      <!-- Total -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <span class="fw-medium total-label">{{ LOCALE.total }}</span>
        <span class="fw-bold total-amount">{{ formatCurrency(totalAmount) }}</span>
      </div>

      <!-- Payment Methods -->
      <div v-if="items.length > 0" class="mb-3">
        <div class="d-flex gap-2">
          <button
            v-for="method in PAYMENT_METHODS"
            :key="method.value"
            class="btn flex-grow-1 d-flex align-items-center justify-content-center gap-1 fw-medium small payment-btn"
            :class="selectedPayment === method.value ? 'payment-active' : 'payment-inactive'"
            @click="selectedPayment = method.value"
          >
            <span>{{ method.icon }}</span>
            <span>{{ method.label }}</span>
          </button>
        </div>
      </div>

      <!-- Note -->
      <div v-if="items.length > 0" class="mb-3">
        <input
          v-model="note"
          type="text"
          :placeholder="LOCALE.notePlaceholder"
          class="form-control note-input"
        />
      </div>

      <!-- Confirm Button -->
      <button
        class="btn w-100 fw-bold confirm-btn"
        :class="items.length > 0 ? 'btn-confirm-active' : 'btn-confirm-disabled'"
        :disabled="items.length === 0 || loading"
        @click="handleConfirm"
      >
        {{ loading ? '...' : `${LOCALE.confirm} ${totalAmount > 0 ? formatCurrency(totalAmount) : ''}` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-title {
  font-size: 1rem;
  color: var(--c-text);
}
.clear-btn {
  font-size: 0.875rem;
  color: var(--c-accent);
}
.clear-btn:hover {
  color: var(--c-accent);
}
.empty-text {
  color: var(--c-text-muted);
}
.total-label {
  font-size: 1rem;
  color: var(--c-text-muted);
}
.total-amount {
  font-size: 1.25rem;
  color: var(--c-text);
}
.payment-btn {
  padding: 0.625rem;
  border-radius: 8px;
  border-width: 2px;
  border-style: solid;
  min-height: 44px;
}
.payment-active {
  border-color: var(--c-accent);
  background-color: #fef2f2;
  color: var(--c-accent);
}
.payment-active:hover {
  background-color: #fef2f2;
  color: var(--c-accent);
  border-color: var(--c-accent);
}
.payment-inactive {
  border-color: var(--c-border);
  background-color: #fff;
  color: var(--c-text);
}
.payment-inactive:hover {
  background-color: #fff;
  color: var(--c-text);
  border-color: var(--c-border);
}
.note-input {
  height: 40px;
  padding: 0 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
  background-color: var(--c-surface);
}
.note-input:focus {
  border-color: var(--c-primary);
  outline: none;
  box-shadow: none;
}
.confirm-btn {
  height: 56px;
  border-radius: var(--radius);
  font-size: 1.125rem;
  min-height: 44px;
  color: #fff;
}
.btn-confirm-active {
  background-color: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}
.btn-confirm-active:hover,
.btn-confirm-active:active {
  background-color: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}
.btn-confirm-disabled {
  background-color: var(--c-border);
  border-color: var(--c-border);
  color: #fff;
  cursor: not-allowed;
}
</style>
