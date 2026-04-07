<script setup lang="ts">
import { formatCurrency } from '@/utils/format'

export interface CashCountItem {
  id: string
  user_display_name: string
  bill_1000: number
  bill_500: number
  bill_100: number
  coin_50: number
  coin_10: number
  coin_5: number
  coin_1: number
  total: number
  note: string | null
  created_at: string
}

defineProps<{
  items: CashCountItem[]
}>()

function formatTime(isoStr: string): string {
  const d = new Date(isoStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}

function formatBreakdown(c: CashCountItem): string {
  const parts: string[] = []
  if (c.bill_1000) parts.push(`$1000×${c.bill_1000}`)
  if (c.bill_500) parts.push(`$500×${c.bill_500}`)
  if (c.bill_100) parts.push(`$100×${c.bill_100}`)
  if (c.coin_50) parts.push(`$50×${c.coin_50}`)
  if (c.coin_10) parts.push(`$10×${c.coin_10}`)
  if (c.coin_5) parts.push(`$5×${c.coin_5}`)
  if (c.coin_1) parts.push(`$1×${c.coin_1}`)
  return parts.join('、')
}
</script>

<template>
  <div class="cash-list bg-white rounded p-3">
    <h3 class="small fw-bold text-primary mb-3">點鈔紀錄</h3>
    <div v-if="items.length === 0" class="text-center py-3 text-muted small">尚無紀錄</div>
    <div v-else class="d-flex flex-column gap-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="cash-item px-3 py-2"
      >
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="small fw-medium text-primary">{{ item.user_display_name }}</span>
          <span class="small fw-bold text-primary num">{{ formatCurrency(item.total) }}</span>
        </div>
        <div class="extra-small text-muted">
          {{ formatTime(item.created_at) }}
        </div>
        <div class="extra-small text-muted mt-1">{{ formatBreakdown(item) }}</div>
        <div v-if="item.note" class="extra-small text-muted mt-1">備註：{{ item.note }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cash-list {
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
.extra-small { font-size: 0.75rem; }
.fw-medium { font-weight: 500; }
.num { font-variant-numeric: tabular-nums; }

.cash-item {
  border-radius: var(--radius-sm);
  background-color: var(--c-surface);
}
</style>
