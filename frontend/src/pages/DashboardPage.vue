<script setup lang="ts">
import { ref, computed } from 'vue'
import { LOCALE } from '@/constants/locale'
import { useDailySales } from '@/composables/useDailySales'
import DailySummary from '@/components/dashboard/DailySummary.vue'
import PaymentBreakdown from '@/components/dashboard/PaymentBreakdown.vue'
import TopProducts from '@/components/dashboard/TopProducts.vue'

const {
  startDate,
  endDate,
  totalRevenue,
  totalTransactions,
  avgTransaction,
  paymentBreakdown,
  topProducts,
} = useDailySales()

// Date picker state
const showDatePicker = ref(false)
const pickerType = ref<'start' | 'end'>('start')

function pad(n: number) { return String(n).padStart(2, '0') }

function formatDisplay(d: Date): string {
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

const isToday = computed(() => {
  const now = new Date()
  return isSameDay(startDate.value, now) && isSameDay(endDate.value, now)
})

const isSingleDay = computed(() => isSameDay(startDate.value, endDate.value))

const dateLabel = computed(() => {
  if (isToday.value) return '今日'
  if (isSingleDay.value) return formatDisplay(startDate.value)
  return `${formatDisplay(startDate.value)} ~ ${formatDisplay(endDate.value)}`
})

// Quick presets
function setToday() {
  const now = new Date()
  startDate.value = now
  endDate.value = now
}

function setYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  startDate.value = new Date(d)
  endDate.value = new Date(d)
}

function setLast7Days() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  startDate.value = start
  endDate.value = end
}

function setThisMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
  endDate.value = now
}

// Vant date picker helpers
const currentPickerDate = ref<string[]>([])

function openPicker(type: 'start' | 'end') {
  pickerType.value = type
  const d = type === 'start' ? startDate.value : endDate.value
  currentPickerDate.value = [
    String(d.getFullYear()),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
  ]
  showDatePicker.value = true
}

function onPickerConfirm({ selectedValues }: { selectedValues: string[] }) {
  const [y, m, d] = selectedValues.map(Number)
  const picked = new Date(y, m - 1, d)
  if (pickerType.value === 'start') {
    startDate.value = picked
    if (picked > endDate.value) endDate.value = picked
  } else {
    endDate.value = picked
    if (picked < startDate.value) startDate.value = picked
  }
  showDatePicker.value = false
}

const minDate = new Date(2024, 0, 1)
const maxDate = new Date()
</script>

<template>
  <div class="dashboard-page h-100 overflow-auto bg-surface p-3">
    <h1 class="fs-5 fw-bold text-primary px-1 mb-3">{{ LOCALE.dailyReport }}</h1>

    <!-- Date range selector -->
    <div class="bg-white rounded p-3 mb-3">
      <!-- Quick presets -->
      <div class="d-flex gap-2 mb-3 flex-wrap">
        <button
          class="btn btn-sm preset-btn"
          :class="isToday ? 'active' : ''"
          @click="setToday"
        >今日</button>
        <button
          class="btn btn-sm preset-btn"
          @click="setYesterday"
        >昨日</button>
        <button
          class="btn btn-sm preset-btn"
          @click="setLast7Days"
        >近7天</button>
        <button
          class="btn btn-sm preset-btn"
          @click="setThisMonth"
        >本月</button>
      </div>

      <!-- Custom date range -->
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm date-btn flex-grow-1" @click="openPicker('start')">
          {{ formatDisplay(startDate) }}
        </button>
        <span class="text-muted small">~</span>
        <button class="btn btn-sm date-btn flex-grow-1" @click="openPicker('end')">
          {{ formatDisplay(endDate) }}
        </button>
      </div>
    </div>

    <div class="d-flex flex-column gap-3">
      <DailySummary
        :total-revenue="totalRevenue"
        :total-transactions="totalTransactions"
        :avg-transaction="avgTransaction"
      />

      <PaymentBreakdown :data="paymentBreakdown" />

      <TopProducts :products="topProducts" />
    </div>

    <!-- Date picker popup -->
    <van-popup
      v-model:show="showDatePicker"
      position="bottom"
      round
      :duration="0"
    >
      <van-date-picker
        v-model="currentPickerDate"
        :title="pickerType === 'start' ? '開始日期' : '結束日期'"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onPickerConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.dashboard-page {
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
.bg-white { background-color: #fff; }
.text-primary { color: var(--c-text) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.h-100 { height: 100%; }
.rounded { border-radius: var(--radius) !important; }

.preset-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  background: #fff;
  color: var(--c-text);
  font-size: 0.8125rem;
  font-weight: 500;
  min-height: 36px;
}
.preset-btn:hover,
.preset-btn:active,
.preset-btn.active {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.date-btn {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 40px;
  text-align: center;
}
.date-btn:hover,
.date-btn:active {
  border-color: var(--c-primary);
}
</style>
