<script setup lang="ts">
import { ref } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'
import { LOCALE } from '@/constants/locale'
import { useCategories } from '@/composables/useCategories'
import { useProducts } from '@/composables/useProducts'
import type { ProductDoc } from '@/db/schemas/product'
import ProductList from '@/components/product/ProductList.vue'
import ProductForm from '@/components/product/ProductForm.vue'

const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
const { products, addProduct, updateProduct, deleteProduct, toggleProduct, importProducts } = useProducts()

// --- Excel Import ---
interface ImportRow {
  name: string
  price: number
  stock: number | null
  barcode: string | null
}

const showImportDialog = ref(false)
const importRows = ref<ImportRow[]>([])
const importCategoryId = ref('')
const importLoading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerImport() {
  fileInputRef.value?.click()
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

      if (rows.length < 2) {
        showFailToast('Excel 無資料')
        return
      }

      // Find column indexes by header names
      const header = rows[0].map((h: any) => String(h).trim())
      const colIdx = {
        name: header.findIndex((h: string) => h.includes('品名')),
        price: header.findIndex((h: string) => h.includes('價格')),
        stock: header.findIndex((h: string) => h.includes('庫存')),
        barcode: header.findIndex((h: string) => h.includes('條碼')),
      }

      if (colIdx.name < 0 || colIdx.price < 0) {
        showFailToast('找不到「品名」或「價格」欄位')
        return
      }

      const parsed: ImportRow[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const name = String(row[colIdx.name] ?? '').trim()
        if (!name) continue
        const price = Math.round(Number(row[colIdx.price]) || 0)
        const stockVal = colIdx.stock >= 0 ? row[colIdx.stock] : ''
        const stock = (stockVal === '' || stockVal === null || stockVal === undefined)
          ? null
          : Number(stockVal) || null
        const barcode = colIdx.barcode >= 0 && row[colIdx.barcode]
          ? String(row[colIdx.barcode]).trim() || null
          : null
        parsed.push({ name, price, stock, barcode })
      }

      if (parsed.length === 0) {
        showFailToast('沒有可匯入的資料')
        return
      }

      importRows.value = parsed
      // Auto-create "未分類" if no categories exist
      if (categories.value.length === 0) {
        await addCategory('未分類')
        // addCategory already reloads categories
      }
      importCategoryId.value = categories.value[0]?.id ?? ''
      showImportDialog.value = true
    } catch {
      showFailToast('讀取 Excel 失敗')
    }
  }
  reader.readAsArrayBuffer(file)
}

async function handleConfirmImport() {
  importLoading.value = true
  try {
    // Auto-create "未分類" if none exist
    if (!importCategoryId.value) {
      if (categories.value.length === 0) {
        await addCategory('未分類')
      }
      importCategoryId.value = categories.value[0]?.id ?? ''
      if (!importCategoryId.value) {
        showFailToast('請先新增分類')
        importLoading.value = false
        return
      }
    }
    const { created, updated } = await importProducts(
      importRows.value.map(r => ({ ...r, categoryId: importCategoryId.value }))
    )
    showImportDialog.value = false
    showSuccessToast(`新增 ${created} 筆，更新 ${updated} 筆`)
  } catch (err: any) {
    console.error('[Import Error]', err)
    showFailToast('匯入失敗: ' + (err?.message || String(err)))
  } finally {
    importLoading.value = false
  }
}

const showProductForm = ref(false)
const editingProduct = ref<ProductDoc | null>(null)
const showCategoryDialog = ref(false)
const newCategoryName = ref('')
const activeTab = ref(0)

function handleAddProduct() {
  editingProduct.value = null
  showProductForm.value = true
}

function handleEditProduct(product: ProductDoc) {
  editingProduct.value = product
  showProductForm.value = true
}

async function handleSaveProduct(data: {
  name: string; price: number; stock: number | null;
  barcode: string | null; categoryId: string; imageDataUrl: string | null;
  isActive: boolean; sortOrder: number;
}) {
  if (editingProduct.value) {
    await updateProduct(editingProduct.value.id, data)
  } else {
    await addProduct({
      ...data,
      sortOrder: products.value.length,
    })
  }
  showSuccessToast('已儲存')
}

async function handleDeleteProduct(id: string) {
  try {
    await showConfirmDialog({ title: LOCALE.deleteConfirm })
    await deleteProduct(id)
    showSuccessToast('已刪除')
  } catch { /* cancelled */ }
}

async function handleToggleProduct(id: string) {
  await toggleProduct(id)
}

async function handleAddCategory() {
  if (!newCategoryName.value.trim()) return
  await addCategory(newCategoryName.value.trim())
  newCategoryName.value = ''
  showSuccessToast('已新增')
}

async function handleDeleteCategory(id: string) {
  try {
    await showConfirmDialog({ title: '確定要刪除此分類嗎？' })
    await deleteCategory(id)
    showSuccessToast('已刪除')
  } catch { /* cancelled */ }
}
</script>

<template>
  <div class="products-page d-flex flex-column bg-surface h-100">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab :title="LOCALE.tabProducts">
        <div class="p-3">
          <div class="d-flex gap-2 mb-3">
            <button
              class="flex-grow-1 btn-add-dashed"
              @click="handleAddProduct"
            >
              + {{ LOCALE.addProduct }}
            </button>
            <button
              class="flex-shrink-0 btn-import-dashed d-flex align-items-center gap-1"
              @click="triggerImport"
            >
              <van-icon name="down" size="16" />
              匯入 Excel
            </button>
          </div>
          <ProductList
            :products="products"
            :categories="categories"
            @edit="handleEditProduct"
            @toggle="handleToggleProduct"
            @delete="handleDeleteProduct"
          />
        </div>
      </van-tab>

      <van-tab :title="LOCALE.categoryManage">
        <div class="p-3 d-flex flex-column gap-3">
          <div class="d-flex gap-2">
            <van-field
              v-model="newCategoryName"
              :placeholder="LOCALE.categoryName"
              class="flex-grow-1 rounded"
            />
            <button
              class="flex-shrink-0 btn-accent"
              :disabled="!newCategoryName.trim()"
              @click="handleAddCategory"
            >
              {{ LOCALE.addCategory }}
            </button>
          </div>

          <div v-for="cat in categories" :key="cat.id" class="d-flex align-items-center px-3 py-3 bg-white rounded">
            <span class="flex-grow-1 small fw-medium text-primary">{{ cat.name }}</span>
            <button
              class="btn-icon-delete"
              @click="handleDeleteCategory(cat.id)"
            >
              <van-icon name="delete-o" size="18" />
            </button>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <ProductForm
      v-model:show="showProductForm"
      :categories="categories"
      :product="editingProduct"
      @save="handleSaveProduct"
      @delete="editingProduct && handleDeleteProduct(editingProduct.id).then(() => { showProductForm = false })"
    />

    <!-- Hidden file input for Excel import -->
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
      position="bottom"
      :duration="0"
      :style="{ maxHeight: '80%' }"
    >
      <div class="import-dialog px-3 pt-4 pb-4 d-flex flex-column gap-3">
        <h2 class="fs-6 fw-bold text-primary">匯入商品 ({{ importRows.length }} 筆)</h2>

        <!-- Category selector -->
        <div>
          <div class="small text-muted mb-2">新增商品的分類</div>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="cat-chip"
              :class="importCategoryId === cat.id ? 'cat-chip--active' : ''"
              @click="importCategoryId = cat.id"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <!-- Preview list -->
        <div class="import-preview overflow-auto border rounded">
          <div
            v-for="(row, i) in importRows"
            :key="i"
            class="d-flex align-items-center gap-2 px-3 py-2 small"
            :class="{ 'border-top': i > 0 }"
          >
            <span class="flex-grow-1 fw-medium text-primary text-truncate">{{ row.name }}</span>
            <span v-if="row.barcode" class="extra-small text-muted font-monospace flex-shrink-0">{{ row.barcode }}</span>
            <span class="text-primary flex-shrink-0">NT${{ row.price }}</span>
            <span class="text-muted flex-shrink-0" style="width: 40px; text-align: right;">
              {{ row.stock === null ? '不限' : row.stock }}
            </span>
          </div>
        </div>

        <div class="extra-small text-muted">
          已有相同條碼的商品會自動更新；無條碼則依品名比對
        </div>

        <div class="d-flex gap-3">
          <button
            class="flex-grow-1 btn-outline-cancel"
            @click="showImportDialog = false"
          >
            取消
          </button>
          <button
            class="flex-grow-1 btn-accent-import"
            :disabled="importLoading"
            @click="handleConfirmImport"
          >
            {{ importLoading ? '匯入中...' : '確認匯入' }}
          </button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.products-page {
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
.rounded { border-radius: var(--radius-sm) !important; }
.border { border: 1px solid var(--c-border) !important; }
.border-top { border-top: 1px solid var(--c-surface) !important; }
.extra-small { font-size: 0.75rem; }
.fw-medium { font-weight: 500; }

.btn-add-dashed {
  height: 48px;
  min-height: 44px;
  border-radius: var(--radius);
  border: 2px dashed var(--c-border);
  background: transparent;
  color: var(--c-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-add-dashed:active {
  background-color: var(--c-surface);
}

.btn-import-dashed {
  height: 48px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius);
  border: 2px dashed #4ade80;
  background: transparent;
  color: #16a34a;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-import-dashed:active {
  background-color: #f0fdf4;
}

.btn-accent {
  height: 44px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  border: none;
  background-color: var(--c-accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-accent:disabled {
  background-color: var(--c-border);
}

.btn-icon-delete {
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-dialog {
  --c-primary: #1a1a2e;
  --c-accent: #e94560;
  --c-surface: #f5f6f8;
  --c-border: #dee2e6;
  --c-text: #1a1a2e;
  --c-text-muted: #6c757d;
  --radius: 10px;
  --radius-sm: 6px;
}

.import-preview {
  max-height: 240px;
}

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
  border-color: var(--c-accent);
  background-color: #fef2f2;
  color: var(--c-accent);
}

.btn-outline-cancel {
  height: 48px;
  min-height: 44px;
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  background: transparent;
  font-size: 0.875rem;
  color: var(--c-text);
  cursor: pointer;
}
.btn-outline-cancel:active {
  background-color: var(--c-surface);
}

.btn-accent-import {
  height: 48px;
  min-height: 44px;
  border-radius: var(--radius);
  border: none;
  background-color: var(--c-accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-accent-import:disabled {
  background-color: var(--c-border);
}
</style>
