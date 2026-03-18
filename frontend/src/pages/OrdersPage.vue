<script setup lang="ts">
import { ref, computed } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { PAYMENT_METHODS, type PaymentMethod } from '@/constants/payment'
import { formatDate } from '@/utils/format'
import { useOrders } from '@/composables/useOrders'
import type { OrderDoc } from '@/db/schemas/order'
import OrderList from '@/components/order/OrderList.vue'
import OrderDetail from '@/components/order/OrderDetail.vue'

const { orders, cancelOrder } = useOrders()

const selectedDate = ref<string>('')
const selectedPayment = ref<string>('')
const showDetail = ref(false)
const selectedOrder = ref<OrderDoc | null>(null)

const filteredOrders = computed(() => {
  let result = orders.value
  if (selectedDate.value) {
    result = result.filter(o => formatDate(o.createdAt) === selectedDate.value)
  }
  if (selectedPayment.value) {
    result = result.filter(o => o.paymentMethod === selectedPayment.value)
  }
  return result
})

const dateOptions = computed(() => {
  const dates = new Set(orders.value.map(o => formatDate(o.createdAt)))
  return Array.from(dates).sort().reverse()
})

function handleSelectOrder(order: OrderDoc) {
  selectedOrder.value = order
  showDetail.value = true
}

async function handleCancelOrder(orderId: string) {
  try {
    await cancelOrder(orderId)
    showDetail.value = false
    showSuccessToast(LOCALE.cancelSuccess)
  } catch (e: any) {
    showFailToast(e?.message || '取消失敗')
  }
}
</script>

<template>
  <div class="orders-page d-flex flex-column bg-surface h-100">
    <div class="p-3">
      <h1 class="fs-5 fw-bold text-primary px-1 mb-2">{{ LOCALE.orderHistory }}</h1>

      <!-- Filters -->
      <div class="d-flex gap-2 overflow-auto no-scrollbar">
        <select
          v-model="selectedDate"
          class="form-select form-select-sm filter-select"
        >
          <option value="">{{ LOCALE.filterByDate }}</option>
          <option v-for="d in dateOptions" :key="d" :value="d">{{ d }}</option>
        </select>
        <select
          v-model="selectedPayment"
          class="form-select form-select-sm filter-select"
        >
          <option value="">{{ LOCALE.filterByPayment }}</option>
          <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex-grow-1 overflow-auto px-3 pb-3">
      <OrderList :orders="filteredOrders" @select="handleSelectOrder" />
    </div>

    <OrderDetail
      v-model:show="showDetail"
      :order="selectedOrder"
      @cancel="handleCancelOrder"
    />
  </div>
</template>

<style scoped>
.orders-page {
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

.filter-select {
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
  color: var(--c-text);
  background-color: #fff;
  min-height: 44px;
}
.filter-select:focus {
  outline: none;
  border-color: var(--c-primary);
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
