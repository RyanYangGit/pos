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
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-6">
        <h1 class="text-lg font-bold text-gray-800">後台管理</h1>
        <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            v-if="!isSuperAdmin"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="activeTab === 'products' ? 'bg-white text-gray-800 ' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'products'"
          >商品管理</button>
          <button
            v-if="!isSuperAdmin"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="activeTab === 'categories' ? 'bg-white text-gray-800 ' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'categories'"
          >分類管理</button>
          <button
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="activeTab === 'users' ? 'bg-white text-gray-800 ' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'users'; loadUsers()"
          >帳號管理</button>
          <button
            v-if="isSuperAdmin"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="activeTab === 'companies' ? 'bg-white text-gray-800 ' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'companies'; loadCompanies()"
          >公司管理</button>
        </div>
      </div>

      <!-- Company selector (super_admin only, for products/categories tabs) -->
      <div v-if="isSuperAdmin && (activeTab === 'products' || activeTab === 'categories')" class="flex items-center gap-3">
        <label class="text-sm text-gray-500 shrink-0">選擇公司</label>
        <select
          v-model="selectedCompanyId"
          class="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary bg-white min-w-[160px]"
        >
          <option value="">— 請選擇公司 —</option>
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Actions (products tab) -->
      <div v-if="activeTab === 'products' && (!isSuperAdmin || selectedCompanyId)" class="flex items-center gap-2">
        <button
          class="h-9 px-4 rounded-lg border border-gray-300 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-1.5"
          @click="downloadTemplate"
        >
          <van-icon name="down" size="14" />
          下載範本
        </button>
        <button
          class="h-9 px-4 rounded-lg border border-gray-300 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-1.5"
          @click="triggerImport"
        >
          <van-icon name="down" size="14" />
          匯入 Excel
        </button>
        <button
          class="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
          @click="handleAdd"
        >
          <van-icon name="plus" size="14" />
          新增商品
        </button>
      </div>
    </div>

    <!-- Products Tab -->
    <div v-if="activeTab === 'products'" class="flex-1 overflow-auto">
      <!-- No company selected (super_admin) -->
      <div v-if="isSuperAdmin && !selectedCompanyId" class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <van-icon name="office-o" size="48" class="mb-3 opacity-30" />
          <p class="text-sm">請先在右上角選擇公司</p>
        </div>
      </div>

      <template v-else>
        <!-- Filter bar -->
        <div class="px-6 py-3 flex gap-3 items-center bg-white border-b border-gray-100">
          <div class="relative">
            <van-icon name="search" size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋商品名稱或條碼..."
              class="pl-8 pr-3 h-9 w-60 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            v-model="filterCategoryId"
            class="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">所有分類</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <span class="text-sm text-gray-400 ml-auto">共 {{ filteredProducts.length }} 項</span>
        </div>

        <!-- Table -->
        <div class="px-6 py-4">
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">商品名稱</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">分類</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">條碼</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">價格</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">庫存</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">狀態</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="filteredProducts.length === 0">
                  <td colspan="7" class="text-center py-16 text-gray-400">尚無商品</td>
                </tr>
                <tr
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="hover:bg-gray-50 transition-colors"
                  :class="{ 'opacity-50': !product.isActive }"
                >
                  <td class="px-4 py-3 font-medium text-gray-800">{{ product.name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ getCategoryName(product.categoryId) }}</td>
                  <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ product.barcode || '—' }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-800">{{ formatCurrency(product.price) }}</td>

                  <!-- Inline stock edit -->
                  <td class="px-4 py-3 text-center">
                    <div v-if="editingStockId === product.id" class="flex items-center justify-center gap-1">
                      <input
                        v-model="editingStockValue"
                        type="number"
                        class="w-20 h-7 px-2 rounded border border-primary text-center text-sm focus:outline-none"
                        placeholder="不限"
                        autofocus
                        @keydown.enter="commitStock(product)"
                        @keydown.esc="editingStockId = null"
                        @blur="commitStock(product)"
                      />
                    </div>
                    <button
                      v-else
                      class="px-2 py-1 rounded hover:bg-gray-100 text-gray-800 min-w-[3rem]"
                      @click="startEditStock(product)"
                    >
                      {{ product.stock !== null ? product.stock : '不限' }}
                    </button>
                  </td>

                  <!-- Status toggle -->
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer select-none"
                      :class="product.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                      @click="apiToggleProduct(product.id)"
                    >
                      {{ product.isActive ? '上架中' : '已下架' }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        class="h-7 px-3 rounded-lg border border-gray-200 text-xs text-gray-800 hover:bg-gray-50"
                        @click="handleEdit(product)"
                      >編輯</button>
                      <button
                        class="h-7 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50"
                        @click="handleDeleteProduct(product.id)"
                      >刪除</button>
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
    <div v-else-if="activeTab === 'categories'" class="flex-1 overflow-auto px-6 py-4">
      <!-- No company selected (super_admin) -->
      <div v-if="isSuperAdmin && !selectedCompanyId" class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <van-icon name="office-o" size="48" class="mb-3 opacity-30" />
          <p class="text-sm">請先在右上角選擇公司</p>
        </div>
      </div>

      <div v-else class="max-w-lg">
        <!-- Add category -->
        <div class="flex gap-2 mb-4">
          <input
            v-model="newCategoryName"
            type="text"
            placeholder="輸入分類名稱"
            class="flex-1 h-10 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
            @keydown.enter="handleAddCategory"
          />
          <button
            class="h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-40"
            :disabled="!newCategoryName.trim()"
            @click="handleAddCategory"
          >新增</button>
        </div>

        <!-- Category list -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div v-if="categories.length === 0" class="text-center py-12 text-gray-400 text-sm">尚無分類</div>
          <div
            v-for="(cat, i) in categories"
            :key="cat.id"
            class="flex items-center px-4 py-3 hover:bg-gray-50"
            :class="{ 'border-t border-gray-100': i > 0 }"
          >
            <span class="flex-1 text-sm font-medium text-gray-800">{{ cat.name }}</span>
            <span class="text-xs text-gray-400 mr-4">
              {{ products.filter(p => p.categoryId === cat.id).length }} 項商品
            </span>
            <button
              class="h-7 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50"
              @click="handleDeleteCategory(cat.id)"
            >刪除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-else-if="activeTab === 'users'" class="flex-1 overflow-auto px-6 py-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-sm font-semibold text-gray-500">帳號列表</h2>
        <button
          class="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
          @click="openAddUser"
        >
          <van-icon name="plus" size="14" />新增帳號
        </button>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">顯示名稱</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">帳號</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">角色</th>
              <th v-if="isSuperAdmin" class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">公司</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="users.length === 0">
              <td colspan="5" class="text-center py-12 text-gray-400">尚無帳號</td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-800">{{ user.displayName }}</td>
              <td class="px-4 py-3 text-gray-500">{{ user.username }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-purple-100 text-purple-700': user.role === 'super_admin',
                    'bg-blue-100 text-blue-700': user.role === 'admin',
                    'bg-gray-100 text-gray-600': user.role === 'cashier',
                  }">
                  {{ user.role === 'super_admin' ? '平台管理員' : user.role === 'admin' ? '管理員' : '收銀員' }}
                </span>
              </td>
              <td v-if="isSuperAdmin" class="px-4 py-3 text-gray-400 text-xs">
                {{ companies.find(c => c.id === user.companyId)?.name || (user.role === 'super_admin' ? '—' : user.companyId) }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button class="h-7 px-3 rounded-lg border border-gray-200 text-xs text-gray-800 hover:bg-gray-50" @click="openEditUser(user)">編輯</button>
                  <button class="h-7 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50" @click="handleDeleteUser(user.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Companies Tab (super_admin only) -->
    <div v-else-if="activeTab === 'companies' && isSuperAdmin" class="flex-1 overflow-auto px-6 py-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-sm font-semibold text-gray-500">公司列表</h2>
        <button
          class="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
          @click="openAddCompany"
        >
          <van-icon name="plus" size="14" />新增公司
        </button>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">公司名稱</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">狀態</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="companies.length === 0">
              <td colspan="4" class="text-center py-12 text-gray-400">尚無公司</td>
            </tr>
            <tr v-for="company in companies" :key="company.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-800">{{ company.name }}</td>
              <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ company.id }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="company.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ company.isActive ? '啟用' : '停用' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button class="h-7 px-3 rounded-lg border border-gray-200 text-xs text-gray-800 hover:bg-gray-50" @click="openEditCompany(company)">編輯</button>
                  <button class="h-7 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50" @click="handleDeleteCompany(company.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Form Dialog -->
    <van-popup v-model:show="showUserForm" round position="center" :duration="0" :style="{ width: '440px' }">
      <div class="px-6 pt-6 pb-5 flex flex-col gap-4">
        <h2 class="text-base font-bold text-gray-800">{{ editingUser ? '編輯帳號' : '新增帳號' }}</h2>
        <div class="space-y-3">
          <div v-if="!editingUser">
            <label class="block text-xs text-gray-500 mb-1">帳號</label>
            <input v-model="userForm.username" type="text" class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">顯示名稱</label>
            <input v-model="userForm.displayName" type="text" class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">密碼{{ editingUser ? '（留空則不更改）' : '' }}</label>
            <input v-model="userForm.password" type="password" class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">角色</label>
            <select v-model="userForm.role" class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary bg-white">
              <option value="cashier">收銀員</option>
              <option value="admin">管理員</option>
              <option v-if="isSuperAdmin" value="super_admin">平台管理員</option>
            </select>
          </div>
          <div v-if="isSuperAdmin">
            <label class="block text-xs text-gray-500 mb-1">所屬公司</label>
            <select v-model="userForm.companyId" class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary bg-white">
              <option value="">— 無（平台管理員）</option>
              <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 pt-1">
          <button class="flex-1 h-11 rounded-xl border border-gray-200 text-sm text-gray-800 hover:bg-gray-50" @click="showUserForm = false">取消</button>
          <button class="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90" @click="handleSaveUser">儲存</button>
        </div>
      </div>
    </van-popup>

    <!-- Company Form Dialog -->
    <van-popup v-model:show="showCompanyForm" round position="center" :duration="0" :style="{ width: '400px' }">
      <div class="px-6 pt-6 pb-5 flex flex-col gap-4">
        <h2 class="text-base font-bold text-gray-800">{{ editingCompany ? '編輯公司' : '新增公司' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">公司名稱</label>
            <input v-model="companyForm.name" type="text" class="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div v-if="editingCompany" class="flex items-center justify-between">
            <span class="text-sm text-gray-700">啟用狀態</span>
            <van-switch v-model="companyForm.isActive" size="22" />
          </div>
        </div>
        <div class="flex gap-3 pt-1">
          <button class="flex-1 h-11 rounded-xl border border-gray-200 text-sm text-gray-800 hover:bg-gray-50" @click="showCompanyForm = false">取消</button>
          <button class="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90" :disabled="!companyForm.name.trim()" @click="handleSaveCompany">儲存</button>
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
      class="hidden"
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
      <div class="px-6 pt-6 pb-5 flex flex-col gap-4">
        <h2 class="text-base font-bold text-gray-800">匯入商品（{{ importRows.length }} 筆）</h2>

        <div>
          <div class="text-sm text-gray-500 mb-2">匯入至分類</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
              :class="importCategoryId === cat.id ? 'border-primary bg-red-50 text-primary' : 'border-gray-200 text-gray-800 hover:border-gray-300'"
              @click="importCategoryId = cat.id"
            >{{ cat.name }}</button>
          </div>
        </div>

        <div class="max-h-64 overflow-auto rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
          <div v-for="(row, i) in importRows" :key="i" class="flex items-center gap-2 px-3 py-2">
            <span class="flex-1 font-medium text-gray-800 truncate">{{ row.name }}</span>
            <span v-if="row.barcode" class="text-xs text-gray-400 font-mono shrink-0">{{ row.barcode }}</span>
            <span class="text-gray-600 shrink-0">NT${{ row.price }}</span>
            <span class="text-gray-400 shrink-0 w-10 text-right">{{ row.stock === null ? '不限' : row.stock }}</span>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            class="flex-1 h-11 rounded-xl border border-gray-200 text-sm text-gray-800 hover:bg-gray-50"
            @click="showImportDialog = false"
          >取消</button>
          <button
            class="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-40"
            :disabled="!importCategoryId || importLoading"
            @click="handleConfirmImport"
          >{{ importLoading ? '匯入中...' : '確認匯入' }}</button>
        </div>
      </div>
    </van-popup>
  </div>
</template>
