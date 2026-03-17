<script setup lang="ts">
import { ref, computed } from 'vue'
import { LOCALE } from '@/constants/locale'
import { PAYMENT_METHODS, type PaymentMethod } from '@/constants/payment'
import { formatDate } from '@/utils/format'
import { useOrders } from '@/composables/useOrders'
import type { OrderDoc } from '@/db/schemas/order'
import OrderList from '@/components/order/OrderList.vue'
import OrderDetail from '@/components/order/OrderDetail.vue'

const { orders } = useOrders()

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
</script>

<template>
  <div class="h-full flex flex-col bg-surface">
    <div class="p-3 space-y-2">
      <h1 class="text-lg font-bold text-gray-800 px-1">{{ LOCALE.orderHistory }}</h1>

      <!-- Filters -->
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        <select
          v-model="selectedDate"
          class="h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 outline-none"
        >
          <option value="">{{ LOCALE.filterByDate }}</option>
          <option v-for="d in dateOptions" :key="d" :value="d">{{ d }}</option>
        </select>
        <select
          v-model="selectedPayment"
          class="h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 outline-none"
        >
          <option value="">{{ LOCALE.filterByPayment }}</option>
          <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex-1 overflow-auto px-3 pb-3">
      <OrderList :orders="filteredOrders" @select="handleSelectOrder" />
    </div>

    <OrderDetail
      v-model:show="showDetail"
      :order="selectedOrder"
    />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
