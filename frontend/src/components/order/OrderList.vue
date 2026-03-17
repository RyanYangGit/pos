<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { PAYMENT_LABEL, type PaymentMethod } from '@/constants/payment'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { OrderDoc } from '@/db/schemas/order'

defineProps<{
  orders: OrderDoc[]
}>()

const emit = defineEmits<{
  select: [order: OrderDoc]
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="order in orders"
      :key="order.id"
      class="bg-white rounded-lg px-4 py-3 active:bg-gray-50 cursor-pointer"
      @click="emit('select', order)"
    >
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-bold text-gray-800">{{ order.orderNumber }}</span>
        <span class="text-base font-bold text-accent">{{ formatCurrency(order.totalAmount) }}</span>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>{{ formatDateTime(order.createdAt) }}</span>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {{ PAYMENT_LABEL[order.paymentMethod as PaymentMethod] }}
          </span>
          <span class="text-xs" :class="order.syncedAt ? 'text-success' : 'text-warning'">
            {{ order.syncedAt ? LOCALE.synced : LOCALE.notSynced }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="orders.length === 0" class="text-center py-20 text-gray-400 text-sm">
      {{ LOCALE.noOrders }}
    </div>
  </div>
</template>
