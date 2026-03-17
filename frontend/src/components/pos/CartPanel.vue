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
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h2 class="text-base font-bold text-gray-800">
        {{ LOCALE.cart }} ({{ totalItems }}{{ LOCALE.items }})
      </h2>
      <button
        v-if="items.length > 0"
        class="text-sm text-accent active:opacity-70"
        @click="emit('clear')"
      >
        {{ LOCALE.cartClear }}
      </button>
    </div>

    <!-- Items -->
    <div class="flex-1 overflow-auto px-4">
      <div v-if="items.length === 0" class="flex items-center justify-center h-full text-gray-400 text-sm">
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
    <div class="border-t border-gray-200 p-4 bg-white">
      <!-- Total -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-base font-medium text-gray-600">{{ LOCALE.total }}</span>
        <span class="text-xl font-bold text-gray-900">{{ formatCurrency(totalAmount) }}</span>
      </div>

      <!-- Payment Methods -->
      <div v-if="items.length > 0" class="mb-3">
        <div class="flex gap-2">
          <button
            v-for="method in PAYMENT_METHODS"
            :key="method.value"
            class="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all active:scale-95"
            :class="selectedPayment === method.value
              ? 'border-accent bg-red-50 text-accent'
              : 'border-gray-200 bg-white text-gray-900'"
            @click="selectedPayment = method.value"
          >
            <span>{{ method.icon }}</span>
            <span>{{ method.label }}</span>
          </button>
        </div>
      </div>

      <!-- Note (collapsible inline) -->
      <div v-if="items.length > 0" class="mb-3">
        <input
          v-model="note"
          type="text"
          :placeholder="LOCALE.notePlaceholder"
          class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none bg-gray-50"
        />
      </div>

      <!-- Confirm Button -->
      <button
        class="w-full h-14 rounded-xl text-white text-lg font-bold transition-all active:scale-[0.98]"
        :class="items.length > 0 ? 'bg-accent' : 'bg-gray-300 cursor-not-allowed'"
        :disabled="items.length === 0 || loading"
        @click="handleConfirm"
      >
        {{ loading ? '...' : `${LOCALE.confirm} ${totalAmount > 0 ? formatCurrency(totalAmount) : ''}` }}
      </button>
    </div>
  </div>
</template>
