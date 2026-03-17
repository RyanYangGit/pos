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
  <div class="settings-page h-100 overflow-auto bg-surface">
    <div class="container-narrow mx-auto px-4 py-4 d-flex flex-column gap-4">

      <!-- Account card -->
      <div class="bg-white rounded border">
        <div class="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar d-flex align-items-center justify-content-center">
              <van-icon name="user-o" size="20" class="text-primary-icon" />
            </div>
            <div>
              <div class="small fw-semibold text-primary">{{ currentUser?.displayName }}</div>
              <div class="extra-small text-muted mt-1">{{ currentUser?.username }}</div>
              <div v-if="companyName" class="extra-small text-muted mt-1">{{ companyName }}</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <span class="badge-role"
              :class="{
                'badge-super': currentUser?.role === 'super_admin',
                'badge-admin': currentUser?.role === 'admin',
                'badge-cashier': currentUser?.role === 'cashier',
              }">
              {{ roleLabel }}
            </span>
            <button
              class="btn-danger-outline"
              @click="handleLogout"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      <!-- Shop settings -->
      <div class="bg-white rounded border">
        <div class="px-4 py-3 border-bottom">
          <h2 class="small fw-semibold text-primary">店舖設定</h2>
        </div>
        <div>
          <div class="d-flex align-items-center px-4 py-3 gap-3 border-bottom">
            <label class="form-label-fixed small text-muted flex-shrink-0 mb-0">{{ LOCALE.shopName }}</label>
            <input
              v-model="shopName"
              type="text"
              class="form-control form-control-sm input-custom"
              @blur="saveSettings"
            />
          </div>
          <div class="d-flex align-items-center px-4 py-3 gap-3 border-bottom">
            <label class="form-label-fixed small text-muted flex-shrink-0 mb-0">{{ LOCALE.deviceName }}</label>
            <input
              v-model="deviceName"
              type="text"
              class="form-control form-control-sm input-custom"
              @blur="saveSettings"
            />
          </div>
          <div class="d-flex align-items-center px-4 py-3 gap-3">
            <label class="form-label-fixed small text-muted flex-shrink-0 mb-0">{{ LOCALE.orderPrefix }}</label>
            <input
              v-model="orderPrefix"
              type="text"
              placeholder="A"
              class="form-control form-control-sm input-custom"
              style="width: 128px;"
              @blur="saveSettings"
            />
          </div>
        </div>
      </div>

      <!-- Sync -->
      <div class="bg-white rounded border">
        <div class="px-4 py-3 border-bottom">
          <h2 class="small fw-semibold text-primary">雲端同步</h2>
        </div>
        <div class="d-flex align-items-center justify-content-between px-4 py-3">
          <div>
            <div class="small text-primary">{{ LOCALE.cloudSync }}</div>
            <div class="extra-small text-muted mt-1">開啟後將資料同步至伺服器</div>
          </div>
          <van-switch
            :model-value="syncEnabled"
            size="24"
            @update:model-value="toggleSync($event as boolean)"
          />
        </div>
      </div>

      <!-- Data -->
      <div class="bg-white rounded border">
        <div class="px-4 py-3 border-bottom">
          <h2 class="small fw-semibold text-primary">資料管理</h2>
        </div>
        <div class="px-4 py-3 d-flex flex-wrap gap-2">
          <button class="btn-outline" @click="handleExportCsv">匯出 CSV</button>
          <button class="btn-outline" @click="handleExportJson">匯出 JSON 備份</button>
          <button class="btn-outline" @click="handleImport">匯入 JSON</button>
          <button class="btn-danger-outline" @click="handleClearData">清除所有資料</button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.settings-page {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.h-100 { height: 100%; }
.bg-surface { background-color: var(--c-surface); }
.bg-white { background-color: #fff; }
.text-primary { color: var(--c-text) !important; }
.text-muted { color: var(--c-text-muted) !important; }
.rounded { border-radius: var(--radius) !important; }
.border { border: 1px solid var(--c-border) !important; }
.border-bottom { border-bottom: 1px solid var(--c-surface) !important; }
.extra-small { font-size: 0.75rem; }

.container-narrow { max-width: 672px; }

.form-label-fixed { width: 96px; }

.input-custom {
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
  min-height: 44px;
}
.input-custom:focus {
  outline: none;
  border-color: var(--c-primary);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--c-surface);
}
.text-primary-icon { color: var(--c-primary); }

.badge-role {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.badge-super { background-color: #f3e8ff; color: #7c3aed; }
.badge-admin { background-color: #dbeafe; color: #2563eb; }
.badge-cashier { background-color: var(--c-surface); color: var(--c-text-muted); }

.btn-outline {
  height: 36px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: transparent;
  font-size: 0.875rem;
  color: var(--c-text);
  cursor: pointer;
}
.btn-outline:active {
  background-color: var(--c-surface);
}

.btn-danger-outline {
  height: 36px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  border: 1px solid #fecaca;
  background: transparent;
  font-size: 0.875rem;
  color: #dc3545;
  font-weight: 500;
  cursor: pointer;
}
.btn-danger-outline:active {
  background-color: #fff5f5;
}
</style>
