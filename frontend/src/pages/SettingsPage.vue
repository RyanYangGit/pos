<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { getDatabase } from '@/db'
import { useSync } from '@/composables/useSync'
import { useAuth } from '@/composables/useAuth'
import { exportOrdersCsv, exportAllJson, importJson } from '@/services/export'
import { authHeaders } from '@/utils/token'

const shopName = ref('')
const deviceName = ref('')
const orderPrefix = ref('')
const { syncEnabled, toggleSync } = useSync()
const { currentUser, logout } = useAuth()

const companyName = ref<string | null>(null)

const roleLabel = computed(() => {
  switch (currentUser.value?.role) {
    case 'super_admin': return '平台管理員'
    case 'admin': return LOCALE.roleAdmin
    default: return LOCALE.roleCashier
  }
})

onMounted(async () => {
  if (currentUser.value?.companyId) {
    try {
      const res = await fetch(`/api/companies/${currentUser.value.companyId}`, { headers: authHeaders() })
      if (res.ok) companyName.value = (await res.json()).name
    } catch { /* ignore */ }
  }

  const db = getDatabase()
  const settings = await db.app_settings.findOne('default').exec()
  if (settings) {
    shopName.value = settings.shopName
    deviceName.value = settings.deviceName
    orderPrefix.value = settings.orderPrefix
  }
})

async function saveSettings() {
  const db = getDatabase()
  const settings = await db.app_settings.findOne('default').exec()
  if (settings) {
    await settings.patch({
      shopName: shopName.value,
      deviceName: deviceName.value,
      orderPrefix: orderPrefix.value,
    })
    showSuccessToast('已儲存')
  }
}

async function handleExportCsv() {
  try {
    await exportOrdersCsv()
    showSuccessToast('CSV 已匯出')
  } catch {
    showFailToast('匯出失敗')
  }
}

async function handleExportJson() {
  try {
    await exportAllJson()
    showSuccessToast('JSON 已匯出')
  } catch {
    showFailToast('匯出失敗')
  }
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      await importJson(file)
      showSuccessToast('匯入成功')
    } catch {
      showFailToast('匯入失敗')
    }
  }
  input.click()
}

async function handleClearData() {
  try {
    await showConfirmDialog({ title: '清除資料', message: LOCALE.clearDataConfirm })
    const db = getDatabase()
    await Promise.all([
      db.categories.find().remove(),
      db.products.find().remove(),
      db.orders.find().remove(),
    ])
    showSuccessToast('已清除')
  } catch { /* cancelled */ }
}

async function handleLogout() {
  try {
    await showConfirmDialog({ title: '登出', message: '確定要登出嗎？' })
    await logout()
  } catch { /* cancelled */ }
}
</script>

<template>
  <div class="h-full overflow-auto bg-gray-50">
    <div class="max-w-2xl mx-auto px-6 py-8 space-y-6">

      <!-- Account card -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <van-icon name="user-o" size="20" class="text-primary" />
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-800">{{ currentUser?.displayName }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ currentUser?.username }}</div>
              <div v-if="companyName" class="text-xs text-gray-400 mt-0.5">{{ companyName }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-purple-100 text-purple-700': currentUser?.role === 'super_admin',
                'bg-blue-100 text-blue-700': currentUser?.role === 'admin',
                'bg-gray-100 text-gray-600': currentUser?.role === 'cashier',
              }">
              {{ roleLabel }}
            </span>
            <button
              class="h-9 px-4 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
              @click="handleLogout"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      <!-- Shop settings -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">店舖設定</h2>
        </div>
        <div class="divide-y divide-gray-100">
          <div class="flex items-center px-5 py-3.5 gap-4">
            <label class="w-24 text-sm text-gray-500 shrink-0">{{ LOCALE.shopName }}</label>
            <input
              v-model="shopName"
              type="text"
              class="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
              @blur="saveSettings"
            />
          </div>
          <div class="flex items-center px-5 py-3.5 gap-4">
            <label class="w-24 text-sm text-gray-500 shrink-0">{{ LOCALE.deviceName }}</label>
            <input
              v-model="deviceName"
              type="text"
              class="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
              @blur="saveSettings"
            />
          </div>
          <div class="flex items-center px-5 py-3.5 gap-4">
            <label class="w-24 text-sm text-gray-500 shrink-0">{{ LOCALE.orderPrefix }}</label>
            <input
              v-model="orderPrefix"
              type="text"
              placeholder="A"
              class="w-32 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
              @blur="saveSettings"
            />
          </div>
        </div>
      </div>

      <!-- Sync -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">雲端同步</h2>
        </div>
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <div class="text-sm text-gray-800">{{ LOCALE.cloudSync }}</div>
            <div class="text-xs text-gray-400 mt-0.5">開啟後將資料同步至伺服器</div>
          </div>
          <van-switch
            :model-value="syncEnabled"
            size="24"
            @update:model-value="toggleSync($event as boolean)"
          />
        </div>
      </div>

      <!-- Data -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">資料管理</h2>
        </div>
        <div class="px-5 py-4 flex flex-wrap gap-2">
          <button
            class="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            @click="handleExportCsv"
          >匯出 CSV</button>
          <button
            class="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            @click="handleExportJson"
          >匯出 JSON 備份</button>
          <button
            class="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            @click="handleImport"
          >匯入 JSON</button>
          <button
            class="h-9 px-4 rounded-lg border border-red-100 text-sm text-red-500 hover:bg-red-50"
            @click="handleClearData"
          >清除所有資料</button>
        </div>
      </div>

    </div>
  </div>
</template>
