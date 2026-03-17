<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { formatCurrency } from '@/utils/format'

defineProps<{
  totalRevenue: number
  totalTransactions: number
  avgTransaction: number
}>()
</script>

<template>
  <div class="grid grid-cols-3 gap-3">
    <div class="bg-white rounded-xl p-4 text-center">
      <div class="text-xs text-gray-400 mb-1">{{ LOCALE.totalRevenue }}</div>
      <div class="text-xl font-bold text-accent">{{ formatCurrency(totalRevenue) }}</div>
    </div>
    <div class="bg-white rounded-xl p-4 text-center">
      <div class="text-xs text-gray-400 mb-1">{{ LOCALE.totalTransactions }}</div>
      <div class="text-xl font-bold text-gray-800">{{ totalTransactions }}</div>
    </div>
    <div class="bg-white rounded-xl p-4 text-center">
      <div class="text-xs text-gray-400 mb-1">{{ LOCALE.avgTransaction }}</div>
      <div class="text-xl font-bold text-gray-800">{{ formatCurrency(avgTransaction) }}</div>
    </div>
  </div>
</template>
