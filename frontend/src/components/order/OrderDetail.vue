<script setup lang="ts">
import { ref } from 'vue'
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
  cancel: [orderId: string]
}>()

const showConfirm = ref(false)
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
      <div class="text-center small text-muted mb-1">{{ order.orderNumber }}</div>
      <div v-if="order.cancelledAt" class="text-center mb-3">
        <span class="badge-cancelled">{{ LOCALE.cancelled }}</span>
      </div>
      <div v-else class="mb-3"></div>

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
          <span class="fs-5 fw-bold" :class="order.cancelledAt ? 'text-muted text-decoration-line-through' : 'text-accent'">{{ formatCurrency(order.totalAmount) }}</span>
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

      <!-- Cancel button -->
      <div v-if="!order.cancelledAt" class="mt-4">
        <button
          class="btn btn-outline-danger w-100 cancel-btn"
          @click="showConfirm = true"
        >
          {{ LOCALE.cancelOrder }}
        </button>
      </div>
    </div>
  </van-popup>

  <!-- Confirm dialog -->
  <van-dialog
    v-model:show="showConfirm"
    :title="LOCALE.cancelOrder"
    :message="LOCALE.cancelOrderConfirm"
    show-cancel-button
    :confirm-button-text="LOCALE.cancelOrder"
    :cancel-button-text="LOCALE.cancel"
    confirm-button-color="#dc3545"
    @confirm="order && emit('cancel', order.id)"
  />
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
.text-decoration-line-through { text-decoration: line-through; }
.badge-cancelled {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  background-color: #dc3545;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
}
.cancel-btn {
  height: 44px;
  border-radius: var(--radius);
  font-weight: 600;
}
</style>
