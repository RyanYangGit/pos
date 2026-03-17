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
      importCategoryId.value = categories.value[0]?.id ?? ''
      showImportDialog.value = true
    } catch {
      showFailToast('讀取 Excel 失敗')
    }
  }
  reader.readAsArrayBuffer(file)
}

async function handleConfirmImport() {
  if (!importCategoryId.value) return
  importLoading.value = true
  try {
    const { created, updated } = await importProducts(
      importRows.value.map(r => ({ ...r, categoryId: importCategoryId.value }))
    )
    showImportDialog.value = false
    showSuccessToast(`新增 ${created} 筆，更新 ${updated} 筆`)
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
  <div class="h-full flex flex-col bg-surface">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab :title="LOCALE.tabProducts">
        <div class="p-3">
          <div class="flex gap-2 mb-3">
            <button
              class="flex-1 h-12 rounded-xl border-2 border-dashed border-gray-300 text-gray-800 text-sm font-medium active:bg-gray-50"
              @click="handleAddProduct"
            >
              + {{ LOCALE.addProduct }}
            </button>
            <button
              class="shrink-0 h-12 px-4 rounded-xl border-2 border-dashed border-green-400 text-green-600 text-sm font-medium active:bg-green-50 flex items-center gap-1"
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
        <div class="p-3 space-y-3">
          <div class="flex gap-2">
            <van-field
              v-model="newCategoryName"
              :placeholder="LOCALE.categoryName"
              class="flex-1 rounded-lg"
            />
            <button
              class="shrink-0 px-4 h-11 bg-accent text-white rounded-lg text-sm font-medium active:scale-95 disabled:bg-gray-300"
              :disabled="!newCategoryName.trim()"
              @click="handleAddCategory"
            >
              {{ LOCALE.addCategory }}
            </button>
          </div>

          <div v-for="cat in categories" :key="cat.id" class="flex items-center px-4 py-3 bg-white rounded-lg">
            <span class="flex-1 text-sm font-medium text-gray-800">{{ cat.name }}</span>
            <button
              class="text-red-400 hover:text-red-600 p-1"
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
      class="hidden"
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
      <div class="px-4 pt-5 pb-6 flex flex-col gap-4">
        <h2 class="text-base font-bold text-gray-800">匯入商品 ({{ importRows.length }} 筆)</h2>

        <!-- Category selector -->
        <div>
          <div class="text-sm text-gray-500 mb-1.5">新增商品的分類</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
              :class="importCategoryId === cat.id
                ? 'border-accent bg-red-50 text-accent'
                : 'border-gray-200 text-gray-800'"
              @click="importCategoryId = cat.id"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <!-- Preview list -->
        <div class="max-h-60 overflow-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div
            v-for="(row, i) in importRows"
            :key="i"
            class="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <span class="flex-1 font-medium text-gray-800 truncate">{{ row.name }}</span>
            <span v-if="row.barcode" class="text-xs text-gray-400 font-mono shrink-0">{{ row.barcode }}</span>
            <span class="text-gray-600 shrink-0">NT${{ row.price }}</span>
            <span class="text-gray-400 shrink-0 w-10 text-right">
              {{ row.stock === null ? '不限' : row.stock }}
            </span>
          </div>
        </div>

        <div class="text-xs text-gray-400">
          已有相同條碼的商品會自動更新；無條碼則依品名比對
        </div>

        <div class="flex gap-3">
          <button
            class="flex-1 h-12 rounded-xl border border-gray-300 text-sm text-gray-800 active:bg-gray-50"
            @click="showImportDialog = false"
          >
            取消
          </button>
          <button
            class="flex-1 h-12 rounded-xl bg-accent text-white text-sm font-bold active:scale-[0.98] disabled:bg-gray-300"
            :disabled="!importCategoryId || importLoading"
            @click="handleConfirmImport"
          >
            {{ importLoading ? '匯入中...' : '確認匯入' }}
          </button>
        </div>
      </div>
    </van-popup>
  </div>
</template>
