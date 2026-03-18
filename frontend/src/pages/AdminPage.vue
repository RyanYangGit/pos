<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'
import { useAuth } from '@/composables/useAuth'
import { authHeaders } from '@/utils/token'

const { isSuperAdmin } = useAuth()

// --- Tabs ---
type Tab = 'users' | 'companies'
const activeTab = ref<Tab>('users')

// --- Companies ---
interface CompanyItem { id: string; name: string; isActive: boolean }
const companies = ref<CompanyItem[]>([])
const showCompanyForm = ref(false)
const editingCompany = ref<CompanyItem | null>(null)
const companyForm = ref({ name: '', isActive: true })

async function loadCompanies() {
  const res = await fetch('/api/companies', { headers: authHeaders() })
  const data = await res.json()
  companies.value = data.map((c: any) => ({ id: c.id, name: c.name, isActive: c.is_active }))
}

function openAddCompany() {
  editingCompany.value = null
  companyForm.value = { name: '', isActive: true }
  showCompanyForm.value = true
}

function openEditCompany(company: CompanyItem) {
  editingCompany.value = company
  companyForm.value = { name: company.name, isActive: company.isActive }
  showCompanyForm.value = true
}

async function handleSaveCompany() {
  try {
    if (editingCompany.value) {
      const res = await fetch(`/api/companies/${editingCompany.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: companyForm.value.name, is_active: companyForm.value.isActive }),
      })
      if (!res.ok) { showFailToast('更新失敗'); return }
    } else {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: companyForm.value.name }),
      })
      if (!res.ok) { showFailToast('建立失敗'); return }
    }
    showCompanyForm.value = false
    showSuccessToast('已儲存')
    await loadCompanies()
  } catch { showFailToast('操作失敗') }
}

async function handleDeleteCompany(id: string) {
  try {
    await showConfirmDialog({ title: '確定要刪除此公司嗎？' })
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) { showFailToast('刪除失敗'); return }
    showSuccessToast('已刪除')
    await loadCompanies()
  } catch { /* cancelled */ }
}

// --- Users ---
interface UserItem { id: string; username: string; displayName: string; role: string; companyId: string | null }
const users = ref<UserItem[]>([])
const showUserForm = ref(false)
const editingUser = ref<UserItem | null>(null)
const userForm = ref({ username: '', displayName: '', password: '', role: 'cashier', companyId: '' })

async function loadUsers() {
  const res = await fetch('/api/users', { headers: authHeaders() })
  const data = await res.json()
  users.value = data.map((u: any) => ({
    id: u.id, username: u.username, displayName: u.display_name, role: u.role, companyId: u.company_id,
  }))
}

function openAddUser() {
  editingUser.value = null
  userForm.value = { username: '', displayName: '', password: '', role: 'cashier', companyId: '' }
  showUserForm.value = true
}

function openEditUser(user: UserItem) {
  editingUser.value = user
  userForm.value = { username: user.username, displayName: user.displayName, password: '', role: user.role, companyId: user.companyId || '' }
  showUserForm.value = true
}

async function handleSaveUser() {
  try {
    if (editingUser.value) {
      const body: any = { display_name: userForm.value.displayName, role: userForm.value.role }
      if (userForm.value.password) body.password = userForm.value.password
      if (isSuperAdmin.value && userForm.value.companyId) body.company_id = userForm.value.companyId
      const res = await fetch(`/api/users/${editingUser.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      })
      if (!res.ok) { showFailToast((await res.json()).detail || '更新失敗'); return }
    } else {
      const body: any = {
        username: userForm.value.username,
        display_name: userForm.value.displayName,
        password: userForm.value.password,
        role: userForm.value.role,
      }
      if (isSuperAdmin.value && userForm.value.companyId) body.company_id = userForm.value.companyId
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      })
      if (!res.ok) { showFailToast((await res.json()).detail || '建立失敗'); return }
    }
    showUserForm.value = false
    showSuccessToast('已儲存')
    await loadUsers()
  } catch { showFailToast('操作失敗') }
}

async function handleDeleteUser(id: string) {
  try {
    await showConfirmDialog({ title: '確定要刪除此帳號嗎？' })
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) { showFailToast((await res.json()).detail || '刪除失敗'); return }
    showSuccessToast('已刪除')
    await loadUsers()
  } catch { /* cancelled */ }
}

onMounted(async () => {
  if (isSuperAdmin.value) {
    await loadCompanies()
  }
  await loadUsers()
})
</script>

<template>
  <div class="admin-page d-flex flex-column bg-surface h-100">
    <!-- Header -->
    <div class="bg-white border-bottom px-4 py-3 d-flex align-items-center gap-4 flex-shrink-0">
      <h1 class="fs-5 fw-bold text-primary mb-0">後台管理</h1>
      <div class="tab-group d-flex gap-1 p-1 rounded">
        <button
          class="tab-btn"
          :class="activeTab === 'users' ? 'tab-btn--active' : ''"
          @click="activeTab = 'users'; loadUsers()"
        >帳號管理</button>
        <button
          v-if="isSuperAdmin"
          class="tab-btn"
          :class="activeTab === 'companies' ? 'tab-btn--active' : ''"
          @click="activeTab = 'companies'; loadCompanies()"
        >公司管理</button>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="flex-grow-1 overflow-auto px-4 py-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="small fw-semibold text-muted mb-0">帳號列表</h2>
        <button class="btn-primary d-flex align-items-center gap-1" @click="openAddUser">
          <van-icon name="plus" size="14" />新增帳號
        </button>
      </div>
      <div class="bg-white rounded border overflow-hidden">
        <table class="table table-sm mb-0 admin-table">
          <thead>
            <tr>
              <th class="text-start">顯示名稱</th>
              <th class="text-start">帳號</th>
              <th class="text-start">角色</th>
              <th v-if="isSuperAdmin" class="text-start">公司</th>
              <th class="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="users.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">尚無帳號</td>
            </tr>
            <tr v-for="user in users" :key="user.id">
              <td class="fw-medium text-primary">{{ user.displayName }}</td>
              <td class="text-muted">{{ user.username }}</td>
              <td>
                <span class="badge-role"
                  :class="{
                    'badge-super': user.role === 'super_admin',
                    'badge-admin': user.role === 'admin',
                    'badge-cashier': user.role === 'cashier',
                  }">
                  {{ user.role === 'super_admin' ? '平台管理員' : user.role === 'admin' ? '管理員' : '收銀員' }}
                </span>
              </td>
              <td v-if="isSuperAdmin" class="text-muted extra-small">
                {{ companies.find(c => c.id === user.companyId)?.name || (user.role === 'super_admin' ? '—' : user.companyId) }}
              </td>
              <td class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-2">
                  <button class="btn-outline btn-sm" @click="openEditUser(user)">編輯</button>
                  <button class="btn-danger-outline btn-sm" @click="handleDeleteUser(user.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Companies Tab (super_admin only) -->
    <div v-else-if="activeTab === 'companies' && isSuperAdmin" class="flex-grow-1 overflow-auto px-4 py-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="small fw-semibold text-muted mb-0">公司列表</h2>
        <button class="btn-primary d-flex align-items-center gap-1" @click="openAddCompany">
          <van-icon name="plus" size="14" />新增公司
        </button>
      </div>
      <div class="bg-white rounded border overflow-hidden">
        <table class="table table-sm mb-0 admin-table">
          <thead>
            <tr>
              <th class="text-start">公司名稱</th>
              <th class="text-start">ID</th>
              <th class="text-center">狀態</th>
              <th class="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="companies.length === 0">
              <td colspan="4" class="text-center py-5 text-muted">尚無公司</td>
            </tr>
            <tr v-for="company in companies" :key="company.id">
              <td class="fw-medium text-primary">{{ company.name }}</td>
              <td class="text-muted font-monospace extra-small">{{ company.id }}</td>
              <td class="text-center">
                <span class="status-badge" :class="company.isActive ? 'status-active' : 'status-inactive'">
                  {{ company.isActive ? '啟用' : '停用' }}
                </span>
              </td>
              <td class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-2">
                  <button class="btn-outline btn-sm" @click="openEditCompany(company)">編輯</button>
                  <button class="btn-danger-outline btn-sm" @click="handleDeleteCompany(company.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Form Dialog -->
    <van-popup v-model:show="showUserForm" round position="center" :duration="0" :style="{ width: '440px' }">
      <div class="dialog-content px-4 pt-4 pb-4 d-flex flex-column gap-3">
        <h2 class="fs-6 fw-bold text-primary">{{ editingUser ? '編輯帳號' : '新增帳號' }}</h2>
        <div class="d-flex flex-column gap-3">
          <div v-if="!editingUser">
            <label class="form-label extra-small text-muted">帳號</label>
            <input v-model="userForm.username" type="text" class="form-control form-control-sm input-custom" />
          </div>
          <div>
            <label class="form-label extra-small text-muted">顯示名稱</label>
            <input v-model="userForm.displayName" type="text" class="form-control form-control-sm input-custom" />
          </div>
          <div>
            <label class="form-label extra-small text-muted">密碼{{ editingUser ? '（留空則不更改）' : '' }}</label>
            <input v-model="userForm.password" type="password" class="form-control form-control-sm input-custom" />
          </div>
          <div>
            <label class="form-label extra-small text-muted">角色</label>
            <select v-model="userForm.role" class="form-select form-select-sm select-custom">
              <option value="cashier">收銀員</option>
              <option value="admin">管理員</option>
              <option v-if="isSuperAdmin" value="super_admin">平台管理員</option>
            </select>
          </div>
          <div v-if="isSuperAdmin">
            <label class="form-label extra-small text-muted">所屬公司</label>
            <select v-model="userForm.companyId" class="form-select form-select-sm select-custom">
              <option value="">— 無（平台管理員）</option>
              <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>
        <div class="d-flex gap-3 pt-1">
          <button class="flex-grow-1 btn-outline-dialog" @click="showUserForm = false">取消</button>
          <button class="flex-grow-1 btn-primary-dialog" @click="handleSaveUser">儲存</button>
        </div>
      </div>
    </van-popup>

    <!-- Company Form Dialog -->
    <van-popup v-model:show="showCompanyForm" round position="center" :duration="0" :style="{ width: '400px' }">
      <div class="dialog-content px-4 pt-4 pb-4 d-flex flex-column gap-3">
        <h2 class="fs-6 fw-bold text-primary">{{ editingCompany ? '編輯公司' : '新增公司' }}</h2>
        <div class="d-flex flex-column gap-3">
          <div>
            <label class="form-label extra-small text-muted">公司名稱</label>
            <input v-model="companyForm.name" type="text" class="form-control form-control-sm input-custom" />
          </div>
          <div v-if="editingCompany" class="d-flex align-items-center justify-content-between">
            <span class="small text-primary">啟用狀態</span>
            <van-switch v-model="companyForm.isActive" size="22" />
          </div>
        </div>
        <div class="d-flex gap-3 pt-1">
          <button class="flex-grow-1 btn-outline-dialog" @click="showCompanyForm = false">取消</button>
          <button class="flex-grow-1 btn-primary-dialog" :disabled="!companyForm.name.trim()" @click="handleSaveCompany">儲存</button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.admin-page {
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
.border-top { border-top: 1px solid var(--c-surface) !important; }
.extra-small { font-size: 0.75rem; }

/* Tab group */
.tab-group {
  background-color: var(--c-surface);
  border-radius: var(--radius-sm);
}
.tab-btn {
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-muted);
  cursor: pointer;
  min-height: 44px;
}
.tab-btn--active {
  background-color: #fff;
  color: var(--c-text);
}

/* Inputs */
.select-custom {
  height: 36px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
  background-color: #fff;
  min-width: 160px;
}
.select-custom:focus {
  outline: none;
  border-color: var(--c-primary);
}
.input-custom {
  height: 40px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
}
.input-custom:focus {
  outline: none;
  border-color: var(--c-primary);
}

/* Buttons */
.btn-primary {
  height: 36px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  border: none;
  background-color: var(--c-primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.4; }

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
.btn-outline:active { background-color: var(--c-surface); }

.btn-danger-outline {
  height: 36px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #fecaca;
  background: transparent;
  font-size: 0.75rem;
  color: #dc3545;
  cursor: pointer;
}
.btn-danger-outline:active { background-color: #fff5f5; }

.btn-sm {
  height: 28px;
  min-height: 44px;
  padding: 0 12px;
}

/* Table */
.admin-table { font-size: 0.875rem; }
.admin-table thead tr {
  background-color: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
}
.admin-table thead th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-table tbody td {
  padding: 12px 16px;
  vertical-align: middle;
}
.admin-table tbody tr + tr {
  border-top: 1px solid var(--c-surface);
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}
.status-active { background-color: #dcfce7; color: #15803d; }
.status-inactive { background-color: var(--c-surface); color: var(--c-text-muted); }

/* Role badges */
.badge-role {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.badge-super { background-color: #f3e8ff; color: #7c3aed; }
.badge-admin { background-color: #dbeafe; color: #2563eb; }
.badge-cashier { background-color: var(--c-surface); color: var(--c-text-muted); }

/* Dialog */
.dialog-content {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}
.btn-outline-dialog {
  height: 44px;
  min-height: 44px;
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  background: transparent;
  font-size: 0.875rem;
  color: var(--c-text);
  cursor: pointer;
}
.btn-outline-dialog:active { background-color: var(--c-surface); }
.btn-primary-dialog {
  height: 44px;
  min-height: 44px;
  border-radius: var(--radius);
  border: none;
  background-color: var(--c-primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-primary-dialog:disabled { opacity: 0.4; }
</style>
