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
  <div class="daily-summary row g-3">
    <div class="col-4">
      <div class="bg-white rounded p-3 text-center">
        <div class="extra-small text-muted mb-1">{{ LOCALE.totalRevenue }}</div>
        <div class="fs-5 fw-bold text-accent num">{{ formatCurrency(totalRevenue) }}</div>
      </div>
    </div>
    <div class="col-4">
      <div class="bg-white rounded p-3 text-center">
        <div class="extra-small text-muted mb-1">{{ LOCALE.totalTransactions }}</div>
        <div class="fs-5 fw-bold text-primary num">{{ totalTransactions }}</div>
      </div>
    </div>
    <div class="col-4">
      <div class="bg-white rounded p-3 text-center">
        <div class="extra-small text-muted mb-1">{{ LOCALE.avgTransaction }}</div>
        <div class="fs-5 fw-bold text-primary num">{{ formatCurrency(avgTransaction) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.daily-summary {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.bg-white { background-color: #fff; }
.rounded { border-radius: var(--radius) !important; }
.text-accent { color: var(--c-accent) !important; }
.text-primary { color: var(--c-text) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.extra-small { font-size: 0.75rem; }
.num { font-variant-numeric: tabular-nums; }
</style>
