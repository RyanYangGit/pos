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
  <div class="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-gray-800 truncate">{{ item.productName }}</div>
      <div class="text-xs text-gray-400 mt-0.5">{{ formatCurrency(item.unitPrice) }}</div>
    </div>
    <div class="flex items-center gap-2">
      <button
        class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold active:scale-90 active:bg-gray-200"
        @click="item.quantity > 1 ? emit('decrement', item.productId) : emit('remove', item.productId)"
      >
        {{ item.quantity > 1 ? '−' : '✕' }}
      </button>
      <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
      <button
        class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold active:scale-90 active:bg-gray-200"
        @click="emit('increment', item.productId)"
      >
        +
      </button>
    </div>
    <div class="w-20 text-right text-sm font-bold text-gray-800">
      {{ formatCurrency(item.subtotal) }}
    </div>
  </div>
</template>
