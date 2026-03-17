<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'
import { formatCurrency } from '@/utils/format'
import { useAuth } from '@/composables/useAuth'
import { authHeaders } from '@/utils/token'
import ProductForm from '@/components/product/ProductForm.vue'

const { isSuperAdmin } = useAuth()

// --- Tabs ---
type Tab = 'products' | 'categories' | 'users' | 'companies'
const activeTab = ref<Tab>(isSuperAdmin.value ? 'users' : 'products')

// --- Company selector (super_admin only) ---
const selectedCompanyId = ref('')

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

// --- Categories (API-based) ---
interface CategoryItem { id: string; name: string; sortOrder: number; companyId: string }
const categories = ref<CategoryItem[]>([])

function buildCompanyParam() {
  return isSuperAdmin.value && selectedCompanyId.value ? `?company_id=${selectedCompanyId.value}` : ''
}

async function loadCategories() {
  if (isSuperAdmin.value && !selectedCompanyId.value) { categories.value = []; return }
  const res = await fetch(`/api/categories${buildCompanyParam()}`, { headers: authHeaders() })
  if (!res.ok) return
  const data = await res.json()
  categories.value = data.map((c: any) => ({ id: c.id, name: c.name, sortOrder: c.sort_order, companyId: c.company_id }))
}

async function apiAddCategory(name: string) {
  const body: any = { name }
  if (isSuperAdmin.value && selectedCompanyId.value) body.company_id = selectedCompanyId.value
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed')
  await loadCategories()
}

async function apiDeleteCategory(id: string) {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) throw new Error('Failed')
  await loadCategories()
}

// --- Products (API-based) ---
interface ProductItem {
  id: string; name: string; price: number; stock: number | null
  barcode: string | null; categoryId: string; isActive: boolean; sortOrder: number; companyId: string
}
const products = ref<ProductItem[]>([])

async function loadProducts() {
  if (isSuperAdmin.value && !selectedCompanyId.value) { products.value = []; return }
  const res = await fetch(`/api/products${buildCompanyParam()}`, { headers: authHeaders() })
  if (!res.ok) return
  const data = await res.json()
  products.value = data.map((p: any) => ({
    id: p.id, name: p.name, price: p.price, stock: p.stock,
    barcode: p.barcode, categoryId: p.category_id, isActive: p.is_active,
    sortOrder: p.sort_order, companyId: p.company_id,
  }))
}

async function apiAddProduct(data: any) {
  const body: any = {
    name: data.name, price: data.price, stock: data.stock ?? null,
    barcode: data.barcode ?? null, category_id: data.categoryId,
    is_active: data.isActive ?? true, sort_order: data.sortOrder ?? 0,
  }
  if (isSuperAdmin.value && selectedCompanyId.value) body.company_id = selectedCompanyId.value
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed')
  await loadProducts()
}

async function apiUpdateProduct(id: string, data: any) {
  const body: any = {}
  if (data.name !== undefined) body.name = data.name
  if (data.price !== undefined) body.price = data.price
  if ('stock' in data) body.stock = data.stock
  if ('barcode' in data) body.barcode = data.barcode
  if (data.categoryId !== undefined) body.category_id = data.categoryId
  if (data.isActive !== undefined) body.is_active = data.isActive
  if (data.sortOrder !== undefined) body.sort_order = data.sortOrder
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed')
  await loadProducts()
}

async function apiDeleteProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) throw new Error('Failed')
  await loadProducts()
}

async function apiToggleProduct(id: string) {
  const prod = products.value.find(p => p.id === id)
  if (!prod) return
  await apiUpdateProduct(id, { isActive: !prod.isActive })
}

// Reload when selected company changes
watch(selectedCompanyId, async () => {
  await Promise.all([loadCategories(), loadProducts()])
})

// --- Users ---
interface UserItem { id: string; username: string; displayName: string; role: string; companyId: string | null }
const users = ref<UserItem[]>([])
const showUserForm = ref(false)
const editingUser = ref<UserItem | null>(null)
const userForm = ref({ username: '', displayName: '', password: '', role: 'cashier', companyId: '' })

async function loadUsers(companyId?: string) {
  const url = companyId ? `/api/users?company_id=${companyId}` : '/api/users'
  const res = await fetch(url, { headers: authHeaders() })
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
  } else {
    await Promise.all([loadCategories(), loadProducts()])
  }
  await loadUsers()
})

// --- Search / Filter ---
const searchQuery = ref('')
const filterCategoryId = ref('')

const filteredProducts = computed(() => {
  let list = products.value
  if (filterCategoryId.value) list = list.filter(p => p.categoryId === filterCategoryId.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q))
  }
  return list
})

function getCategoryName(categoryId: string) {
  return categories.value.find(c => c.id === categoryId)?.name || '—'
}

// --- Product Form ---
const showProductForm = ref(false)
const editingProduct = ref<ProductItem | null>(null)

function handleAdd() {
  editingProduct.value = null
  showProductForm.value = true
}

function handleEdit(product: ProductItem) {
  editingProduct.value = product
  showProductForm.value = true
}

async function handleSaveProduct(data: {
  name: string; price: number; stock: number | null
  barcode: string | null; categoryId: string; isActive: boolean; sortOrder: number
}) {
  try {
    if (editingProduct.value) {
      await apiUpdateProduct(editingProduct.value.id, data)
    } else {
      await apiAddProduct({ ...data, sortOrder: products.value.length })
    }
    showSuccessToast('已儲存')
  } catch { showFailToast('操作失敗') }
}

async function handleDeleteProduct(id: string) {
  try {
    await showConfirmDialog({ title: '確定要刪除嗎？' })
    await apiDeleteProduct(id)
    showSuccessToast('已刪除')
  } catch { /* cancelled */ }
}

async function handleDeleteFromForm() {
  if (!editingProduct.value) return
  try {
    await showConfirmDialog({ title: '確定要刪除嗎？' })
    await apiDeleteProduct(editingProduct.value.id)
    showProductForm.value = false
    showSuccessToast('已刪除')
  } catch { /* cancelled */ }
}

// --- Inline stock edit ---
const editingStockId = ref<string | null>(null)
const editingStockValue = ref('')

function startEditStock(product: ProductItem) {
  editingStockId.value = product.id
  editingStockValue.value = product.stock !== null ? String(product.stock) : ''
}

async function commitStock(product: ProductItem) {
  const raw = editingStockValue.value.trim()
  const newStock = raw === '' ? null : Number(raw)
  if (raw !== '' && isNaN(newStock as number)) { editingStockId.value = null; return }
  await apiUpdateProduct(product.id, { stock: newStock })
  editingStockId.value = null
}

// --- Category ---
const newCategoryName = ref('')

async function handleAddCategory() {
  if (!newCategoryName.value.trim()) return
  try {
    await apiAddCategory(newCategoryName.value.trim())
    newCategoryName.value = ''
    showSuccessToast('已新增')
  } catch { showFailToast('新增失敗') }
}

async function handleDeleteCategory(id: string) {
  try {
    await showConfirmDialog({ title: '確定要刪除此分類嗎？' })
    await apiDeleteCategory(id)
    showSuccessToast('已刪除')
  } catch { /* cancelled */ }
}

// --- Excel Import ---
interface ImportRow { name: string; price: number; stock: number | null; barcode: string | null }
const showImportDialog = ref(false)
const importRows = ref<ImportRow[]>([])
const importCategoryId = ref('')
const importLoading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerImport() { fileInputRef.value?.click() }

async function downloadTemplate() {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([['品名', '價格', '庫存', '條碼'], ['範例商品', 100, 10, '1234567890']])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '商品')
  XLSX.writeFile(wb, '商品匯入範本.xlsx')
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    try {
      const XLSX = await import('xlsx')
      const data = new Uint8Array(ev.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]!]!
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (rows.length < 2) { showFailToast('Excel 無資料'); return }
      const header = rows[0].map((h: any) => String(h).trim())
      const colIdx = {
        name: header.findIndex((h: string) => h.includes('品名')),
        price: header.findIndex((h: string) => h.includes('價格')),
        stock: header.findIndex((h: string) => h.includes('庫存')),
        barcode: header.findIndex((h: string) => h.includes('條碼')),
      }
      if (colIdx.name < 0 || colIdx.price < 0) { showFailToast('找不到「品名」或「價格」欄位'); return }
      const parsed: ImportRow[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const name = String(row[colIdx.name] ?? '').trim()
        if (!name) continue
        const price = Math.round(Number(row[colIdx.price]) || 0)
        const stockVal = colIdx.stock >= 0 ? row[colIdx.stock] : ''
        const stock = (stockVal === '' || stockVal === null || stockVal === undefined) ? null : Number(stockVal) || null
        const barcode = colIdx.barcode >= 0 && row[colIdx.barcode] ? String(row[colIdx.barcode]).trim() || null : null
        parsed.push({ name, price, stock, barcode })
      }
      if (parsed.length === 0) { showFailToast('沒有可匯入的資料'); return }
      importRows.value = parsed
      importCategoryId.value = categories.value[0]?.id ?? ''
      showImportDialog.value = true
    } catch { showFailToast('讀取 Excel 失敗') }
  }
  reader.readAsArrayBuffer(file)
}

async function handleConfirmImport() {
  if (!importCategoryId.value) return
  importLoading.value = true
  let created = 0
  try {
    for (const row of importRows.value) {
      await apiAddProduct({ ...row, categoryId: importCategoryId.value, isActive: true, sortOrder: products.value.length + created })
      created++
    }
    showImportDialog.value = false
    showSuccessToast(`已匯入 ${created} 筆`)
  } catch {
    showFailToast('匯入失敗')
  } finally {
    importLoading.value = false
  }
}
</script>

<template>
  <div class="admin-page d-flex flex-column bg-surface h-100">
    <!-- Header -->
    <div class="bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between flex-shrink-0">
      <div class="d-flex align-items-center gap-4">
        <h1 class="fs-5 fw-bold text-primary mb-0">後台管理</h1>
        <div class="tab-group d-flex gap-1 p-1 rounded">
          <button
            v-if="!isSuperAdmin"
            class="tab-btn"
            :class="activeTab === 'products' ? 'tab-btn--active' : ''"
            @click="activeTab = 'products'"
          >商品管理</button>
          <button
            v-if="!isSuperAdmin"
            class="tab-btn"
            :class="activeTab === 'categories' ? 'tab-btn--active' : ''"
            @click="activeTab = 'categories'"
          >分類管理</button>
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

      <!-- Company selector (super_admin only, for products/categories tabs) -->
      <div v-if="isSuperAdmin && (activeTab === 'products' || activeTab === 'categories')" class="d-flex align-items-center gap-3">
        <label class="small text-muted flex-shrink-0">選擇公司</label>
        <select
          v-model="selectedCompanyId"
          class="form-select form-select-sm select-custom"
        >
          <option value="">— 請選擇公司 —</option>
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Actions (products tab) -->
      <div v-if="activeTab === 'products' && (!isSuperAdmin || selectedCompanyId)" class="d-flex align-items-center gap-2">
        <button class="btn-outline d-flex align-items-center gap-1" @click="downloadTemplate">
          <van-icon name="down" size="14" />
          下載範本
        </button>
        <button class="btn-outline d-flex align-items-center gap-1" @click="triggerImport">
          <van-icon name="down" size="14" />
          匯入 Excel
        </button>
        <button class="btn-primary d-flex align-items-center gap-1" @click="handleAdd">
          <van-icon name="plus" size="14" />
          新增商品
        </button>
      </div>
    </div>

    <!-- Products Tab -->
    <div v-if="activeTab === 'products'" class="flex-grow-1 overflow-auto">
      <!-- No company selected (super_admin) -->
      <div v-if="isSuperAdmin && !selectedCompanyId" class="d-flex align-items-center justify-content-center h-100">
        <div class="text-center text-muted">
          <van-icon name="office-o" size="48" class="mb-3 opacity-25" />
          <p class="small">請先在右上角選擇公司</p>
        </div>
      </div>

      <template v-else>
        <!-- Filter bar -->
        <div class="px-4 py-3 d-flex gap-3 align-items-center bg-white border-bottom">
          <div class="position-relative">
            <van-icon name="search" size="15" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋商品名稱或條碼..."
              class="form-control form-control-sm search-input"
            />
          </div>
          <select
            v-model="filterCategoryId"
            class="form-select form-select-sm select-custom"
          >
            <option value="">所有分類</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <span class="small text-muted ms-auto">共 {{ filteredProducts.length }} 項</span>
        </div>

        <!-- Table -->
        <div class="px-4 py-3">
          <div class="bg-white rounded border overflow-hidden">
            <table class="table table-sm mb-0 admin-table">
              <thead>
                <tr>
                  <th class="text-start">商品名稱</th>
                  <th class="text-start">分類</th>
                  <th class="text-start">條碼</th>
                  <th class="text-end">價格</th>
                  <th class="text-center">庫存</th>
                  <th class="text-center">狀態</th>
                  <th class="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredProducts.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">尚無商品</td>
                </tr>
                <tr
                  v-for="product in filteredProducts"
                  :key="product.id"
                  :class="{ 'opacity-50': !product.isActive }"
                >
                  <td class="fw-medium text-primary">{{ product.name }}</td>
                  <td class="text-muted">{{ getCategoryName(product.categoryId) }}</td>
                  <td class="text-muted font-monospace extra-small">{{ product.barcode || '—' }}</td>
                  <td class="text-end fw-semibold text-primary num">{{ formatCurrency(product.price) }}</td>

                  <!-- Inline stock edit -->
                  <td class="text-center">
                    <div v-if="editingStockId === product.id" class="d-flex align-items-center justify-content-center gap-1">
                      <input
                        v-model="editingStockValue"
                        type="number"
                        class="form-control form-control-sm stock-input"
                        placeholder="不限"
                        autofocus
                        @keydown.enter="commitStock(product)"
                        @keydown.esc="editingStockId = null"
                        @blur="commitStock(product)"
                      />
                    </div>
                    <button
                      v-else
                      class="btn-stock-edit"
                      @click="startEditStock(product)"
                    >
                      {{ product.stock !== null ? product.stock : '不限' }}
                    </button>
                  </td>

                  <!-- Status toggle -->
                  <td class="text-center">
                    <span
                      class="status-badge"
                      :class="product.isActive ? 'status-active' : 'status-inactive'"
                      @click="apiToggleProduct(product.id)"
                    >
                      {{ product.isActive ? '上架中' : '已下架' }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                      <button class="btn-outline btn-sm" @click="handleEdit(product)">編輯</button>
                      <button class="btn-danger-outline btn-sm" @click="handleDeleteProduct(product.id)">刪除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Categories Tab -->
    <div v-else-if="activeTab === 'categories'" class="flex-grow-1 overflow-auto px-4 py-3">
      <!-- No company selected (super_admin) -->
      <div v-if="isSuperAdmin && !selectedCompanyId" class="d-flex align-items-center justify-content-center h-100">
        <div class="text-center text-muted">
          <van-icon name="office-o" size="48" class="mb-3 opacity-25" />
          <p class="small">請先在右上角選擇公司</p>
        </div>
      </div>

      <div v-else style="max-width: 480px;">
        <!-- Add category -->
        <div class="d-flex gap-2 mb-3">
          <input
            v-model="newCategoryName"
            type="text"
            placeholder="輸入分類名稱"
            class="form-control form-control-sm input-custom flex-grow-1"
            @keydown.enter="handleAddCategory"
          />
          <button
            class="btn-primary"
            :disabled="!newCategoryName.trim()"
            @click="handleAddCategory"
          >新增</button>
        </div>

        <!-- Category list -->
        <div class="bg-white rounded border overflow-hidden">
          <div v-if="categories.length === 0" class="text-center py-5 text-muted small">尚無分類</div>
          <div
            v-for="(cat, i) in categories"
            :key="cat.id"
            class="d-flex align-items-center px-3 py-3"
            :class="{ 'border-top': i > 0 }"
          >
            <span class="flex-grow-1 small fw-medium text-primary">{{ cat.name }}</span>
            <span class="extra-small text-muted me-3">
              {{ products.filter(p => p.categoryId === cat.id).length }} 項商品
            </span>
            <button class="btn-danger-outline btn-sm" @click="handleDeleteCategory(cat.id)">刪除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-else-if="activeTab === 'users'" class="flex-grow-1 overflow-auto px-4 py-3">
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

    <!-- Product Form -->
    <ProductForm
      v-model:show="showProductForm"
      :categories="categories"
      :product="editingProduct"
      @save="handleSaveProduct"
      @delete="handleDeleteFromForm"
    />

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls,.csv"
      class="d-none"
      @change="handleFileChange"
    />

    <!-- Import preview dialog -->
    <van-popup
      v-model:show="showImportDialog"
      round
      position="center"
      :duration="0"
      :style="{ width: '540px', maxHeight: '80vh' }"
    >
      <div class="dialog-content px-4 pt-4 pb-4 d-flex flex-column gap-3">
        <h2 class="fs-6 fw-bold text-primary">匯入商品（{{ importRows.length }} 筆）</h2>

        <div>
          <div class="small text-muted mb-2">匯入至分類</div>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="cat-chip"
              :class="importCategoryId === cat.id ? 'cat-chip--active' : ''"
              @click="importCategoryId = cat.id"
            >{{ cat.name }}</button>
          </div>
        </div>

        <div class="import-preview overflow-auto rounded border">
          <div v-for="(row, i) in importRows" :key="i" class="d-flex align-items-center gap-2 px-3 py-2" :class="{ 'border-top': i > 0 }">
            <span class="flex-grow-1 fw-medium text-primary text-truncate small">{{ row.name }}</span>
            <span v-if="row.barcode" class="extra-small text-muted font-monospace flex-shrink-0">{{ row.barcode }}</span>
            <span class="text-primary flex-shrink-0 small">NT${{ row.price }}</span>
            <span class="text-muted flex-shrink-0 small" style="width: 40px; text-align: right;">{{ row.stock === null ? '不限' : row.stock }}</span>
          </div>
        </div>

        <div class="d-flex gap-3">
          <button class="flex-grow-1 btn-outline-dialog" @click="showImportDialog = false">取消</button>
          <button
            class="flex-grow-1 btn-primary-dialog"
            :disabled="!importCategoryId || importLoading"
            @click="handleConfirmImport"
          >{{ importLoading ? '匯入中...' : '確認匯入' }}</button>
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
.opacity-50 { opacity: 0.5; }
.opacity-25 { opacity: 0.25; }
.num { font-variant-numeric: tabular-nums; }
.fw-medium { font-weight: 500; }

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

/* Selects & Inputs */
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

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-muted);
  z-index: 1;
}
.search-input {
  padding-left: 32px;
  padding-right: 12px;
  height: 36px;
  min-height: 44px;
  width: 240px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 0.875rem;
}
.search-input:focus {
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
.btn-primary:disabled {
  opacity: 0.4;
}

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
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #fecaca;
  background: transparent;
  font-size: 0.75rem;
  color: #dc3545;
  cursor: pointer;
}
.btn-danger-outline:active {
  background-color: #fff5f5;
}

.btn-sm {
  height: 28px;
  min-height: 44px;
  padding: 0 12px;
}

/* Table */
.admin-table {
  font-size: 0.875rem;
}
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

/* Stock edit */
.stock-input {
  width: 80px;
  height: 28px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-primary);
  text-align: center;
  font-size: 0.875rem;
}
.stock-input:focus {
  outline: none;
}
.btn-stock-edit {
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--c-text);
  cursor: pointer;
  min-width: 48px;
  min-height: 44px;
}
.btn-stock-edit:active {
  background-color: var(--c-surface);
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
.status-active {
  background-color: #dcfce7;
  color: #15803d;
}
.status-inactive {
  background-color: var(--c-surface);
  color: var(--c-text-muted);
}

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
.btn-outline-dialog:active {
  background-color: var(--c-surface);
}
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
.btn-primary-dialog:disabled {
  opacity: 0.4;
}

/* Import chips */
.cat-chip {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text);
  cursor: pointer;
  min-height: 44px;
}
.cat-chip--active {
  border-color: var(--c-primary);
  background-color: #fef2f2;
  color: var(--c-primary);
}

.import-preview {
  max-height: 256px;
}
</style>
