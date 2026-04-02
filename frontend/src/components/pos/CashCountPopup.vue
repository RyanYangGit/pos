<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { formatCurrency } from '@/utils/format'
import { authHeaders } from '@/utils/token'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const bill1000 = ref(0)
const bill500 = ref(0)
const bill100 = ref(0)
const coin50 = ref(0)
const coin10 = ref(0)
const coin5 = ref(0)
const coin1 = ref(0)
const note = ref('')
const saving = ref(false)

const total = computed(() =>
  bill1000.value * 1000
  + bill500.value * 500
  + bill100.value * 100
  + coin50.value * 50
  + coin10.value * 10
  + coin5.value * 5
  + coin1.value * 1
)

const denominations = [
  { label: '$1,000', model: bill1000, unit: 1000 },
  { label: '$500', model: bill500, unit: 500 },
  { label: '$100', model: bill100, unit: 100 },
  { label: '$50', model: coin50, unit: 50 },
  { label: '$10', model: coin10, unit: 10 },
  { label: '$5', model: coin5, unit: 5 },
  { label: '$1', model: coin1, unit: 1 },
]

watch(() => props.show, (val) => {
  if (val) {
    bill1000.value = 0
    bill500.value = 0
    bill100.value = 0
    coin50.value = 0
    coin10.value = 0
    coin5.value = 0
    coin1.value = 0
    note.value = ''
  }
})

async function handleSave() {
  saving.value = true
  try {
    const res = await fetch('/api/cash-counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        bill_1000: bill1000.value,
        bill_500: bill500.value,
        bill_100: bill100.value,
        coin_50: coin50.value,
        coin_10: coin10.value,
        coin_5: coin5.value,
        coin_1: coin1.value,
        note: note.value || null,
      }),
    })
    if (res.ok) {
      showSuccessToast(`已記錄 ${formatCurrency(total.value)}`)
      emit('update:show', false)
    } else {
      showFailToast('儲存失敗')
    }
  } catch {
    showFailToast('儲存失敗')
  } finally {
    saving.value = false
  }
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
    @update:show="emit('update:show', $event)"
  >
    <div class="px-4 pt-5 pb-4">
      <h2 class="fw-bold text-center mb-3 title">點鈔記錄</h2>

      <div class="d-flex flex-column gap-2 mb-3">
        <div
          v-for="d in denominations"
          :key="d.unit"
          class="d-flex align-items-center gap-3 denom-row"
        >
          <span class="denom-label fw-medium">{{ d.label }}</span>
          <div class="d-flex align-items-center gap-2 flex-grow-1">
            <button class="btn-qty" @click="d.model.value = Math.max(0, d.model.value - 1)">−</button>
            <input
              v-model.number="d.model.value"
              type="number"
              inputmode="numeric"
              min="0"
              class="qty-input text-center"
            />
            <button class="btn-qty" @click="d.model.value++">+</button>
          </div>
          <span class="denom-subtotal text-end">{{ formatCurrency(d.model.value * d.unit) }}</span>
        </div>
      </div>

      <!-- Total -->
      <div class="total-bar d-flex align-items-center justify-content-between mb-3">
        <span class="fw-medium">合計</span>
        <span class="fw-bold total-amount">{{ formatCurrency(total) }}</span>
      </div>

      <!-- Note -->
      <input
        v-model="note"
        type="text"
        placeholder="備註（選填）"
        class="form-control note-input mb-3"
      />

      <!-- Save -->
      <button
        class="btn w-100 fw-bold save-btn"
        :disabled="saving || total === 0"
        @click="handleSave"
      >
        {{ saving ? '儲存中...' : '儲存記錄' }}
      </button>
    </div>
  </van-popup>
</template>

<style scoped>
.title {
  font-size: 1.125rem;
  color: var(--c-text);
}
.denom-row {
  padding: 6px 0;
}
.denom-label {
  width: 60px;
  font-size: 0.875rem;
  color: var(--c-text);
  flex-shrink: 0;
}
.denom-subtotal {
  width: 80px;
  font-size: 0.8125rem;
  color: var(--c-text-muted, #6c757d);
  flex-shrink: 0;
}
.btn-qty {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--c-border, #dee2e6);
  background: #fff;
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--c-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 36px;
}
.btn-qty:active {
  background-color: var(--c-surface, #f5f5f5);
}
.qty-input {
  width: 56px;
  height: 36px;
  border: 1px solid var(--c-border, #dee2e6);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text);
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-input:focus {
  outline: none;
  border-color: var(--c-primary, #1a1a2e);
}
.total-bar {
  padding: 12px 16px;
  background-color: var(--c-surface, #f5f5f5);
  border-radius: 10px;
}
.total-amount {
  font-size: 1.5rem;
  color: var(--c-accent, #e94560);
}
.note-input {
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border, #dee2e6);
  font-size: 0.875rem;
}
.note-input:focus {
  outline: none;
  border-color: var(--c-primary, #1a1a2e);
  box-shadow: none;
}
.save-btn {
  height: 50px;
  border-radius: 10px;
  font-size: 1rem;
  background-color: var(--c-primary, #1a1a2e);
  border-color: var(--c-primary, #1a1a2e);
  color: #fff;
  min-height: 44px;
}
.save-btn:disabled {
  opacity: 0.4;
}
.save-btn:hover,
.save-btn:active {
  background-color: var(--c-primary, #1a1a2e);
  color: #fff;
}
</style>
