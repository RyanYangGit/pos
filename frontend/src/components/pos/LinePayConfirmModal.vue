<script setup lang="ts">
import { formatCurrency } from '@/utils/format'

defineProps<{
  show: boolean
  totalAmount: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:show', false)
}
</script>

<template>
  <van-popup
    :show="show"
    round
    :close-on-click-overlay="false"
    position="bottom"
    :duration="0"
    :style="{ maxHeight: '90%' }"
  >
    <div class="px-4 pt-5 pb-4 text-center">
      <!-- LINE Pay icon -->
      <div class="linepay-icon mb-3">💳</div>

      <h2 class="fw-bold mb-2 title">LINE Pay 收款</h2>

      <div class="text-muted mb-3 subtitle">請客人掃描收款碼付款</div>

      <!-- Amount -->
      <div class="amount-box mb-4">
        <div class="small text-muted mb-1">應收金額</div>
        <div class="fw-bold amount">{{ formatCurrency(totalAmount) }}</div>
      </div>

      <!-- Waiting indicator -->
      <div class="d-flex align-items-center justify-content-center gap-2 mb-4 waiting">
        <span class="waiting-dot" />
        <span>等待客人付款中...</span>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-3">
        <button
          class="btn flex-grow-1 fw-medium border action-cancel"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          class="btn flex-grow-1 fw-bold action-confirm"
          @click="handleConfirm"
        >
          確認收款
        </button>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.linepay-icon {
  font-size: 3rem;
}
.title {
  font-size: 1.25rem;
  color: var(--c-text);
}
.subtitle {
  font-size: 0.875rem;
}
.amount-box {
  background-color: var(--c-surface, #f5f5f5);
  border-radius: var(--radius, 12px);
  padding: 1.25rem;
}
.amount {
  font-size: 2.25rem;
  color: var(--c-text);
}
.waiting {
  color: #06c755;
  font-size: 0.875rem;
  font-weight: 500;
}
.waiting-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #06c755;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
.action-cancel {
  height: 56px;
  border-radius: var(--radius, 12px);
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
  border-radius: var(--radius, 12px);
  font-size: 1rem;
  background-color: #06c755;
  border-color: #06c755;
  color: #fff;
  min-height: 44px;
}
.action-confirm:hover,
.action-confirm:active {
  background-color: #05b34c;
  border-color: #05b34c;
  color: #fff;
}
</style>
