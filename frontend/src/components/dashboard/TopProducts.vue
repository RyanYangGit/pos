<script setup lang="ts">
import { LOCALE } from '@/constants/locale'
import { formatCurrency } from '@/utils/format'

defineProps<{
  products: { name: string; quantity: number; revenue: number }[]
}>()
</script>

<template>
  <div class="top-products bg-white rounded p-3">
    <h3 class="small fw-bold text-primary mb-3">{{ LOCALE.topProducts }}</h3>
    <div v-if="products.length === 0" class="text-center py-3 text-muted small">{{ LOCALE.noData }}</div>
    <div v-else class="d-flex flex-column gap-2">
      <div
        v-for="(product, idx) in products"
        :key="product.name"
        class="d-flex align-items-center gap-3"
      >
        <span class="rank-badge flex-shrink-0">
          {{ idx + 1 }}
        </span>
        <span class="flex-grow-1 small text-primary text-truncate">{{ product.name }}</span>
        <span class="extra-small text-muted flex-shrink-0">{{ product.quantity }}件</span>
        <span class="small fw-medium text-primary flex-shrink-0 num">{{ formatCurrency(product.revenue) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-products {
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

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--c-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--c-text-muted);
}
</style>
