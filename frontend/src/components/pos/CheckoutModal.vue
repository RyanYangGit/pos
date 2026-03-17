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
    <div class="px-4 pt-5 pb-4">
      <h2 class="fw-bold text-center mb-3 checkout-title">{{ LOCALE.checkoutTitle }}</h2>

      <div class="text-center mb-2 checkout-subtitle">
        商品 {{ totalItems }} {{ LOCALE.items }}
      </div>

      <div class="text-center fw-bold mb-4 checkout-amount">
        {{ formatCurrency(totalAmount) }}
      </div>

      <!-- Payment Methods -->
      <div class="mb-3">
        <div class="small mb-3 section-label">{{ LOCALE.paymentMethod }}</div>
        <div class="payment-grid">
          <button
            v-for="method in PAYMENT_METHODS"
            :key="method.value"
            class="btn d-flex flex-column align-items-center justify-content-center p-3 payment-option"
            :class="selectedPayment === method.value ? 'payment-active' : 'payment-inactive'"
            @click="selectedPayment = method.value"
          >
            <span class="payment-icon mb-1">{{ method.icon }}</span>
            <span class="small fw-medium">{{ method.label }}</span>
          </button>
        </div>
      </div>

      <!-- Note -->
      <div class="mb-4">
        <div class="small mb-2 section-label">{{ LOCALE.note }}</div>
        <van-field
          v-model="note"
          :placeholder="LOCALE.notePlaceholder"
          type="textarea"
          rows="1"
          autosize
          class="rounded note-field"
        />
      </div>

      <!-- Actions -->
      <div class="d-flex gap-3">
        <button
          class="btn flex-grow-1 fw-medium border action-cancel"
          @click="handleClose"
        >
          {{ LOCALE.cancel }}
        </button>
        <button
          class="btn flex-grow-1 fw-bold action-confirm"
          :disabled="loading"
          @click="handleConfirm"
        >
          {{ loading ? '...' : LOCALE.confirm }}
        </button>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.checkout-title {
  font-size: 1.25rem;
  color: var(--c-text);
}
.checkout-subtitle {
  color: var(--c-text-muted);
}
.checkout-amount {
  font-size: 1.875rem;
  color: var(--c-text);
}
.section-label {
  color: var(--c-text-muted);
}
.payment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.payment-option {
  border-radius: var(--radius);
  border-width: 2px;
  border-style: solid;
  min-height: 44px;
}
.payment-active {
  border-color: var(--c-accent);
  background-color: #fef2f2;
}
.payment-active:hover {
  background-color: #fef2f2;
  border-color: var(--c-accent);
}
.payment-inactive {
  border-color: var(--c-border);
  background-color: #fff;
}
.payment-inactive:hover {
  background-color: #fff;
  border-color: var(--c-border);
}
.payment-icon {
  font-size: 1.875rem;
}
.note-field {
  background-color: var(--c-surface) !important;
}
.action-cancel {
  height: 56px;
  border-radius: var(--radius);
  font-size: 1rem;
  border-color: var(--c-border);
  color: var(--c-text);
  min-height: 44px;
}
.action-cancel:hover,
.action-cancel:active {
  background-color: var(--c-surface);
  color: var(--c-text);
}
.action-confirm {
  height: 56px;
  border-radius: var(--radius);
  font-size: 1rem;
  background-color: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
  min-height: 44px;
}
.action-confirm:hover,
.action-confirm:active {
  background-color: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}
</style>
