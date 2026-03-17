<script setup lang="ts">
import { ref } from 'vue'
import { LOCALE } from '@/constants/locale'
import { PAYMENT_METHODS, type PaymentMethod } from '@/constants/payment'
import { formatCurrency } from '@/utils/format'

defineProps<{
  show: boolean
  totalItems: number
  totalAmount: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [paymentMethod: PaymentMethod, note: string]
}>()

const selectedPayment = ref<PaymentMethod>('cash')
const note = ref('')
const loading = ref(false)

async function handleConfirm() {
  loading.value = true
  emit('confirm', selectedPayment.value, note.value)
  // Reset after emit
  setTimeout(() => {
    loading.value = false
    note.value = ''
    selectedPayment.value = 'cash'
  }, 500)
}

function handleClose() {
  emit('update:show', false)
  note.value = ''
  selectedPayment.value = 'cash'
}
</script>

<template>
  <van-popup
    :show="show"
    round
    closeable
    position="bottom"
    :duration="0"
    :style="{ maxHeight: '90%' }"
    @update:show="handleClose"
  >
    <div class="px-6 pt-8 pb-6">
      <h2 class="text-xl font-bold text-center text-gray-800 mb-4">{{ LOCALE.checkoutTitle }}</h2>

      <div class="text-center text-gray-500 mb-2">
        商品 {{ totalItems }} {{ LOCALE.items }}
      </div>

      <div class="text-center text-3xl font-bold text-gray-900 mb-6">
        {{ formatCurrency(totalAmount) }}
      </div>

      <!-- Payment Methods -->
      <div class="mb-4">
        <div class="text-sm text-gray-500 mb-3">{{ LOCALE.paymentMethod }}</div>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="method in PAYMENT_METHODS"
            :key="method.value"
            class="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95"
            :class="selectedPayment === method.value
              ? 'border-accent bg-red-50'
              : 'border-gray-200 bg-white'"
            @click="selectedPayment = method.value"
          >
            <span class="text-3xl mb-1">{{ method.icon }}</span>
            <span class="text-sm font-medium">{{ method.label }}</span>
          </button>
        </div>
      </div>

      <!-- Note -->
      <div class="mb-6">
        <div class="text-sm text-gray-500 mb-2">{{ LOCALE.note }}</div>
        <van-field
          v-model="note"
          :placeholder="LOCALE.notePlaceholder"
          type="textarea"
          rows="1"
          autosize
          class="rounded-lg !bg-gray-50"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          class="flex-1 h-14 rounded-xl text-base font-medium border border-gray-300 text-gray-600 transition-all active:scale-[0.98] active:bg-gray-50"
          @click="handleClose"
        >
          {{ LOCALE.cancel }}
        </button>
        <button
          class="flex-1 h-14 rounded-xl text-base font-bold text-white bg-accent transition-all active:scale-[0.98]"
          :disabled="loading"
          @click="handleConfirm"
        >
          {{ loading ? '...' : LOCALE.confirm }}
        </button>
      </div>
    </div>
  </van-popup>
</template>
