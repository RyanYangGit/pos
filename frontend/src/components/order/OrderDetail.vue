<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { PAYMENT_LABEL, type PaymentMethod } from '@/constants/payment'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { OrderDoc } from '@/db/schemas/order'

defineProps<{
  show: boolean
  order: OrderDoc | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    closeable
    :duration="0"
    :style="{ height: '75%' }"
    @update:show="emit('update:show', $event)"
  >
    <div v-if="order" class="px-4 pt-8 pb-6">
      <h2 class="text-lg font-bold text-center mb-1">{{ LOCALE.orderDetail }}</h2>
      <div class="text-center text-sm text-gray-400 mb-4">{{ order.orderNumber }}</div>

      <div class="space-y-3 mb-4">
        <div v-for="item in order.items" :key="item.productId" class="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <div class="text-sm font-medium text-gray-800">{{ item.productName }}</div>
            <div class="text-xs text-gray-400">{{ formatCurrency(item.unitPrice) }} × {{ item.quantity }}</div>
          </div>
          <span class="text-sm font-bold">{{ formatCurrency(item.subtotal) }}</span>
        </div>
      </div>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">{{ LOCALE.total }}</span>
          <span class="text-lg font-bold text-accent">{{ formatCurrency(order.totalAmount) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">{{ LOCALE.paymentMethod }}</span>
          <span>{{ PAYMENT_LABEL[order.paymentMethod as PaymentMethod] }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">時間</span>
          <span>{{ formatDateTime(order.createdAt) }}</span>
        </div>
        <div v-if="order.note" class="flex justify-between">
          <span class="text-gray-500">{{ LOCALE.note }}</span>
          <span>{{ order.note }}</span>
        </div>
      </div>
    </div>
  </van-popup>
</template>
