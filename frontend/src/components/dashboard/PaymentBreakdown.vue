<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { PAYMENT_LABEL, type PaymentMethod } from '@/constants/payment'
import { formatCurrency } from '@/utils/format'

defineProps<{
  data: { method: PaymentMethod; amount: number; percentage: number }[]
}>()

const barColors: Record<string, string> = {
  cash: 'bar-green',
  line_pay: 'bar-blue',
  transfer: 'bar-purple',
}
</script>

<template>
  <div class="payment-breakdown bg-white rounded p-3">
    <h3 class="small fw-bold text-primary mb-3">{{ LOCALE.paymentBreakdown }}</h3>
    <div v-if="data.length === 0" class="text-center py-3 text-muted small">{{ LOCALE.noData }}</div>
    <div v-else class="d-flex flex-column gap-3">
      <div v-for="item in data" :key="item.method">
        <div class="d-flex align-items-center justify-content-between small mb-1">
          <span class="text-muted">{{ PAYMENT_LABEL[item.method] }}</span>
          <span class="fw-medium num">{{ formatCurrency(item.amount) }} ({{ item.percentage }}%)</span>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :class="barColors[item.method] || 'bar-gray'"
            :style="{ width: `${item.percentage}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-breakdown {
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
.text-primary { color: var(--c-text) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.fw-medium { font-weight: 500; }
.num { font-variant-numeric: tabular-nums; }

.bar-track {
  height: 8px;
  background-color: var(--c-surface);
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
}
.bar-green { background-color: #4ade80; }
.bar-blue { background-color: #60a5fa; }
.bar-purple { background-color: #a78bfa; }
.bar-gray { background-color: #9ca3af; }
</style>
