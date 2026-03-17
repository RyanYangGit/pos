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
    <div v-if="order" class="order-detail px-3 pt-5 pb-4">
      <h2 class="fs-5 fw-bold text-center mb-1">{{ LOCALE.orderDetail }}</h2>
      <div class="text-center small text-muted mb-4">{{ order.orderNumber }}</div>

      <div class="d-flex flex-column gap-2 mb-4">
        <div v-for="item in order.items" :key="item.productId" class="d-flex align-items-center justify-content-between py-2 border-bottom">
          <div>
            <div class="small fw-medium text-primary">{{ item.productName }}</div>
            <div class="extra-small text-muted">{{ formatCurrency(item.unitPrice) }} x {{ item.quantity }}</div>
          </div>
          <span class="small fw-bold">{{ formatCurrency(item.subtotal) }}</span>
        </div>
      </div>

      <div class="d-flex flex-column gap-2 small">
        <div class="d-flex justify-content-between">
          <span class="text-muted">{{ LOCALE.total }}</span>
          <span class="fs-5 fw-bold text-accent">{{ formatCurrency(order.totalAmount) }}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted">{{ LOCALE.paymentMethod }}</span>
          <span>{{ PAYMENT_LABEL[order.paymentMethod as PaymentMethod] }}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted">時間</span>
          <span>{{ formatDateTime(order.createdAt) }}</span>
        </div>
        <div v-if="order.note" class="d-flex justify-content-between">
          <span class="text-muted">{{ LOCALE.note }}</span>
          <span>{{ order.note }}</span>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.order-detail {
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
.border-bottom { border-bottom: 1px solid var(--c-surface) !important; }
.extra-small { font-size: 0.75rem; }
.fw-medium { font-weight: 500; }
</style>
