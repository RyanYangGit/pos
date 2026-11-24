<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showFailToast } from 'vant'
import { formatCurrency } from '@/utils/format'
import { authHeaders } from '@/utils/token'
import { useVendors } from '@/composables/useVendors'

interface Line { name: string; price: number; quantity: number; total: number }
interface VendorGroup {
  vendor_id: string | null
  vendor_name: string
  items: Line[]
  total_quantity: number
  total_amount: number
}

const { vendors } = useVendors()

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const month = ref(monthKey(new Date()))
const vendorId = ref('')  // '' = all vendors
const groups = ref<VendorGroup[]>([])
const loading = ref(false)
const error = ref('')

const isCurrentMonth = computed(() => month.value === monthKey(new Date()))
const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${y} 年 ${Number(m)} 月`
})

function shiftMonth(delta: number) {
  const [y, m] = month.value.split('-').map(Number)
  month.value = monthKey(new Date(y!, m! - 1 + delta, 1))
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ month: month.value })
    if (vendorId.value) params.set('vendor_id', vendorId.value)
    const res = await fetch(`/api/reports/vendor-monthly?${params}`, { headers: authHeaders() })
    if (!res.ok) throw new Error()
    groups.value = (await res.json()).vendors
  } catch {
    groups.value = []
    error.value = '需要網路連線才能查看廠商月報'
  } finally {
    loading.value = false
  }
}

watch([month, vendorId], load, { immediate: true })

async function exportExcel() {
  if (groups.value.length === 0) return
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const usedNames = new Set<string>()
    for (const g of groups.value) {
      const rows: (string | number)[][] = [
        [`${g.vendor_name}　${monthLabel.value}銷售報表`],
        [],
        ['品名', '價格', '數量', '總價'],
        ...g.items.map(l => [l.name, l.price, l.quantity, l.total]),
        ['合計', '', g.total_quantity, g.total_amount],
      ]
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 28 }, { wch: 8 }, { wch: 8 }, { wch: 10 }]
      // Sheet names: max 31 chars, no []:*?/\ and unique
      let name = g.vendor_name.replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31) || '廠商'
      while (usedNames.has(name)) name = `${name.slice(0, 28)}_${usedNames.size}`
      usedNames.add(name)
      XLSX.utils.book_append_sheet(wb, ws, name)
    }
    const who = groups.value.length === 1 ? groups.value[0]!.vendor_name : '全部廠商'
    XLSX.writeFile(wb, `${who}_${month.value}_銷售報表.xlsx`)
  } catch {
    showFailToast('匯出失敗')
  }
}
</script>

<template>
  <div class="vendor-report bg-white rounded p-3">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h3 class="small fw-bold text-primary mb-0">廠商月報</h3>
      <button class="btn-export extra-small" :disabled="groups.length === 0" @click="exportExcel">
        <van-icon name="down" size="12" /> 匯出 Excel
      </button>
    </div>

    <div class="d-flex align-items-center justify-content-center gap-3 mb-3">
      <button class="btn-month" aria-label="上個月" @click="shiftMonth(-1)">‹</button>
      <span class="small fw-medium text-primary month-label">{{ monthLabel }}</span>
      <button class="btn-month" aria-label="下個月" :disabled="isCurrentMonth" @click="shiftMonth(1)">›</button>
    </div>

    <div v-if="vendors.length > 1" class="d-flex flex-wrap gap-2 mb-3">
      <button class="chip" :class="{ 'chip--active': vendorId === '' }" @click="vendorId = ''">全部廠商</button>
      <button
        v-for="v in vendors"
        :key="v.id"
        class="chip"
        :class="{ 'chip--active': vendorId === v.id }"
        @click="vendorId = v.id"
      >{{ v.name }}</button>
    </div>

    <div v-if="loading" class="text-center py-3 text-muted small">載入中…</div>
    <div v-else-if="error" class="text-center py-3 text-muted small">{{ error }}</div>
    <div v-else-if="groups.length === 0" class="text-center py-3 text-muted small">這個月沒有銷售</div>
    <div v-else class="d-flex flex-column gap-4">
      <div v-for="g in groups" :key="g.vendor_id ?? 'none'">
        <div class="d-flex justify-content-between align-items-baseline mb-2">
          <span class="small fw-bold text-primary">{{ g.vendor_name }}</span>
          <span class="small fw-bold text-accent num">{{ formatCurrency(g.total_amount) }}</span>
        </div>
        <table class="w-100 report-table">
          <thead>
            <tr>
              <th class="text-start">品名</th>
              <th class="text-end">價格</th>
              <th class="text-end">數量</th>
              <th class="text-end">總價</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in g.items" :key="`${l.name}|${l.price}`">
              <td class="text-start">{{ l.name }}</td>
              <td class="text-end num">{{ formatCurrency(l.price) }}</td>
              <td class="text-end num">{{ l.quantity }}</td>
              <td class="text-end num">{{ formatCurrency(l.total) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="text-start">合計</td>
              <td></td>
              <td class="text-end num">{{ g.total_quantity }}</td>
              <td class="text-end num">{{ formatCurrency(g.total_amount) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vendor-report {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.bg-white { background-color: #fff; }
.rounded { border-radius: var(--radius) !important; }
.text-primary { color: var(--c-text) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.text-accent { color: var(--c-accent); }
.extra-small { font-size: 0.75rem; }
.fw-medium { font-weight: 500; }
.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.month-label { min-width: 7em; text-align: center; }

.btn-month {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  background: #fff;
  color: var(--c-text);
  font-size: 1.125rem;
  line-height: 1;
}
.btn-month:disabled { opacity: 0.35; }

.btn-export {
  border: 1px solid #4ade80;
  color: #16a34a;
  background: transparent;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  min-height: 32px;
}
.btn-export:disabled { opacity: 0.4; }

.chip {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  background: #fff;
  color: var(--c-text);
  font-size: 0.8125rem;
  min-height: 36px;
}
.chip--active {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.report-table { font-size: 0.8125rem; border-collapse: collapse; }
.report-table th {
  color: var(--c-text-muted);
  font-weight: 500;
  padding: 4px 0 6px;
  border-bottom: 1px solid var(--c-border);
}
.report-table td { padding: 6px 0; color: var(--c-text); border-bottom: 1px solid var(--c-surface); }
.report-table td + td, .report-table th + th { padding-left: 12px; }
.report-table tfoot td { font-weight: 700; border-bottom: none; border-top: 1px solid var(--c-border); }
</style>
