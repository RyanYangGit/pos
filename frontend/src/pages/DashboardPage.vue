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
  <div class="dashboard-page h-100 overflow-auto bg-surface p-3">
    <h1 class="fs-5 fw-bold text-primary px-1 mb-3">{{ LOCALE.dailyReport }}</h1>

    <div class="d-flex flex-column gap-3">
      <DailySummary
        :total-revenue="totalRevenue"
        :total-transactions="totalTransactions"
        :avg-transaction="avgTransaction"
      />

      <PaymentBreakdown :data="paymentBreakdown" />

      <TopProducts :products="topProducts" />
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.bg-surface { background-color: var(--c-surface); }
.text-primary { color: var(--c-text) !important; }
.h-100 { height: 100%; }
</style>
