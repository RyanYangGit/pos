<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { useDailySales } from '@/composables/useDailySales'
import DailySummary from '@/components/dashboard/DailySummary.vue'
import PaymentBreakdown from '@/components/dashboard/PaymentBreakdown.vue'
import TopProducts from '@/components/dashboard/TopProducts.vue'

const {
  totalRevenue,
  totalTransactions,
  avgTransaction,
  paymentBreakdown,
  topProducts,
} = useDailySales()
</script>

<template>
  <div class="h-full overflow-auto bg-surface p-3 space-y-3">
    <h1 class="text-lg font-bold text-gray-800 px-1">{{ LOCALE.dailyReport }}</h1>

    <DailySummary
      :total-revenue="totalRevenue"
      :total-transactions="totalTransactions"
      :avg-transaction="avgTransaction"
    />

    <PaymentBreakdown :data="paymentBreakdown" />

    <TopProducts :products="topProducts" />
  </div>
</template>
