<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { PAYMENT_LABEL, type PaymentMethod } from '@/constants/payment'
import { formatCurrency } from '@/utils/format'

defineProps<{
  data: { method: PaymentMethod; amount: number; percentage: number }[]
}>()

const barColors: Record<string, string> = {
  cash: 'bg-green-400',
  line_pay: 'bg-blue-400',
  transfer: 'bg-purple-400',
}
</script>

<template>
  <div class="bg-white rounded-xl p-4">
    <h3 class="text-sm font-bold text-gray-700 mb-3">{{ LOCALE.paymentBreakdown }}</h3>
    <div v-if="data.length === 0" class="text-sm text-gray-400 text-center py-4">{{ LOCALE.noData }}</div>
    <div v-else class="space-y-3">
      <div v-for="item in data" :key="item.method">
        <div class="flex items-center justify-between text-sm mb-1">
          <span class="text-gray-600">{{ PAYMENT_LABEL[item.method] }}</span>
          <span class="font-medium">{{ formatCurrency(item.amount) }} ({{ item.percentage }}%)</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="barColors[item.method] || 'bg-gray-400'"
            :style="{ width: `${item.percentage}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
