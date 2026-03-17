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
  <div class="order-list d-flex flex-column gap-2">
    <div
      v-for="order in orders"
      :key="order.id"
      class="bg-white rounded p-3 order-item"
      @click="emit('select', order)"
    >
      <div class="d-flex align-items-center justify-content-between mb-1">
        <span class="small fw-bold text-primary">{{ order.orderNumber }}</span>
        <span class="fs-6 fw-bold text-accent">{{ formatCurrency(order.totalAmount) }}</span>
      </div>
      <div class="d-flex align-items-center justify-content-between extra-small text-muted">
        <span>{{ formatDateTime(order.createdAt) }}</span>
        <div class="d-flex align-items-center gap-2">
          <span class="badge-payment">
            {{ PAYMENT_LABEL[order.paymentMethod as PaymentMethod] }}
          </span>
          <span :class="order.syncedAt ? 'text-success' : 'text-warning'" class="extra-small">
            {{ order.syncedAt ? LOCALE.synced : LOCALE.notSynced }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="orders.length === 0" class="text-center py-5 text-muted small">
      {{ LOCALE.noOrders }}
    </div>
  </div>
</template>

<style scoped>
.order-list {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.text-primary { color: var(--c-text) !important; }
.text-accent { color: var(--c-accent) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.bg-white { background-color: #fff; }
.rounded { border-radius: var(--radius) !important; }

.order-item {
  cursor: pointer;
  min-height: 44px;
}
.order-item:active {
  background-color: var(--c-surface) !important;
}

.badge-payment {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: var(--c-surface);
  color: var(--c-text-muted);
  font-size: 0.75rem;
}

.extra-small {
  font-size: 0.75rem;
}

.text-success { color: #198754 !important; }
.text-warning { color: #ffc107 !important; }
</style>
