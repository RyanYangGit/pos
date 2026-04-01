<script setup lang="ts">
import { ref, computed } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { PAYMENT_METHODS, type PaymentMethod } from '@/constants/payment'
import { formatDate } from '@/utils/format'
import { useOrders } from '@/composables/useOrders'
import { useAuth } from '@/composables/useAuth'
import type { OrderDoc } from '@/db/schemas/order'
import OrderList from '@/components/order/OrderList.vue'
import OrderDetail from '@/components/order/OrderDetail.vue'

const { userRole } = useAuth()
const isAdmin = computed(() => userRole.value === 'admin' || userRole.value === 'super_admin')
const { orders, cancelOrder, deleteOrder } = useOrders()

const today = formatDate(Date.now())
const selectedDate = ref<string>(today)
const selectedPayment = ref<string>('')
const orderTab = ref<'completed' | 'cancelled' | 'all'>('completed')
const showDetail = ref(false)
const selectedOrder = ref<OrderDoc | null>(null)
const page = ref(1)
const PAGE_SIZE = 20

const filteredOrders = computed(() => {
  let result = orders.value

  // Tab filter
  if (orderTab.value === 'completed') {
    result = result.filter(o => !o.cancelledAt)
  } else if (orderTab.value === 'cancelled') {
    result = result.filter(o => !!o.cancelledAt)
  }

  if (selectedDate.value) {
    result = result.filter(o => formatDate(o.createdAt) === selectedDate.value)
  }
  if (selectedPayment.value) {
    result = result.filter(o => o.paymentMethod === selectedPayment.value)
  }
  return result
})

const pagedOrders = computed(() => {
  if (selectedDate.value) return filteredOrders.value // no pagination when date selected
  return filteredOrders.value.slice(0, page.value * PAGE_SIZE)
})

const hasMore = computed(() => {
  if (selectedDate.value) return false
  return page.value * PAGE_SIZE < filteredOrders.value.length
})

function loadMore() {
  page.value++
}

const completedCount = computed(() => orders.value.filter(o => !o.cancelledAt).length)
const cancelledCount = computed(() => orders.value.filter(o => !!o.cancelledAt).length)

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

async function handleDeleteOrder(orderId: string) {
  try {
    await deleteOrder(orderId)
    showDetail.value = false
    showSuccessToast('訂單已永久刪除')
  } catch (e: any) {
    showFailToast(e?.message || '刪除失敗')
  }
}
</script>

<template>
  <div class="orders-page d-flex flex-column bg-surface h-100">
    <div class="p-3">
      <h1 class="fs-5 fw-bold text-primary px-1 mb-2">{{ LOCALE.orderHistory }}</h1>

      <!-- Order tabs -->
      <div class="d-flex gap-1 mb-2 order-tab-group p-1 rounded">
        <button
          class="order-tab-btn"
          :class="orderTab === 'completed' ? 'order-tab-btn--active' : ''"
          @click="orderTab = 'completed'; page = 1"
        >成交 ({{ completedCount }})</button>
        <button
          class="order-tab-btn"
          :class="orderTab === 'cancelled' ? 'order-tab-btn--active' : ''"
          @click="orderTab = 'cancelled'; page = 1"
        >已取消 ({{ cancelledCount }})</button>
        <button
          class="order-tab-btn"
          :class="orderTab === 'all' ? 'order-tab-btn--active' : ''"
          @click="orderTab = 'all'; page = 1"
        >全部 ({{ orders.length }})</button>
      </div>

      <!-- Filters -->
      <div class="d-flex gap-2 overflow-auto no-scrollbar">
        <select
          v-model="selectedDate"
          class="form-select form-select-sm filter-select"
          @change="page = 1"
        >
          <option :value="today">今天</option>
          <option v-for="d in dateOptions" :key="d" :value="d">{{ d }}</option>
          <option value="">全部日期</option>
        </select>
        <select
          v-model="selectedPayment"
          class="form-select form-select-sm filter-select"
          @change="page = 1"
        >
          <option value="">{{ LOCALE.filterByPayment }}</option>
          <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex-grow-1 overflow-auto px-3 pb-3">
      <div class="small text-muted mb-2 px-1">{{ filteredOrders.length }} 筆訂單</div>
      <OrderList :orders="pagedOrders" @select="handleSelectOrder" />
      <div v-if="hasMore" class="text-center py-3">
        <button class="btn-load-more" @click="loadMore">
          載入更多 ({{ pagedOrders.length }}/{{ filteredOrders.length }})
        </button>
      </div>
    </div>

    <OrderDetail
      v-model:show="showDetail"
      :order="selectedOrder"
      :can-delete="isAdmin"
      @cancel="handleCancelOrder"
      @delete="handleDeleteOrder"
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

.order-tab-group {
  background-color: var(--c-surface);
  border-radius: var(--radius-sm);
}
.order-tab-btn {
  flex: 1;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-text-muted);
  cursor: pointer;
  min-height: 36px;
}
.order-tab-btn--active {
  background-color: #fff;
  color: var(--c-text);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-load-more {
  padding: 8px 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-text-muted);
  cursor: pointer;
  min-height: 44px;
}
.btn-load-more:active {
  background-color: var(--c-surface);
}
</style>
